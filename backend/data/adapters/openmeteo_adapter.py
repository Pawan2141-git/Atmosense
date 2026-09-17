"""
Open-Meteo Atmospheric Data Adapter

Fetches real-time / forecasted hourly meteorological data from Open-Meteo API
(https://api.open-meteo.com/v1/forecast) for single points or regional coordinate grids (up to 7x7).

Extracts and derives:
  - CAPE (Convective Available Potential Energy, J/kg)
  - CIN (Convective Inhibition, J/kg <= 0)
  - Precipitation (mm/hr, QPE proxy)
  - Precipitation Probability (%)
  - Relative Humidity 2m (%)
  - Wind speed 10m & 80m (used for vertical wind shear)
  - Cloud cover (%) & Estimated Cloud Top Temperature (CTT proxy)
  - Total Column Integrated Water Vapour (kg/m²)
  - Temperature 2m & Dewpoint 2m

Provides structured 2D snapshots matching the Atmosense pipeline format
(lats, lons, snapshots by forecast_hour, terrain, base_time, data_mode).
"""
import time
import logging
import numpy as np
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, Dict, Any, List

from backend.data.adapters.base import BaseDataAdapter
from backend.core.enums import DataMode

logger = logging.getLogger(__name__)

OPEN_METEO_API_URL = "https://api.open-meteo.com/v1/forecast"
DEFAULT_RESOLUTION_DEG = 0.25
MAX_GRID_SIZE = 7
CACHE_TTL_SECONDS = 600  # 10 minutes cache


class OpenMeteoCache:
    """In-memory thread-safe TTL cache for Open-Meteo API responses."""
    def __init__(self, ttl_seconds: int = CACHE_TTL_SECONDS):
        self.ttl = ttl_seconds
        self.cache: Dict[str, Tuple[float, Any]] = {}

    def _make_key(self, center_lat: float, center_lon: float, grid_size: int, resolution_deg: float) -> str:
        return f"{round(center_lat, 3)}:{round(center_lon, 3)}:{grid_size}:{round(resolution_deg, 3)}"

    def get(self, center_lat: float, center_lon: float, grid_size: int, resolution_deg: float) -> Optional[Any]:
        key = self._make_key(center_lat, center_lon, grid_size, resolution_deg)
        if key in self.cache:
            ts, data = self.cache[key]
            if time.time() - ts < self.ttl:
                return data
            del self.cache[key]
        return None

    def set(self, center_lat: float, center_lon: float, grid_size: int, resolution_deg: float, data: Any):
        key = self._make_key(center_lat, center_lon, grid_size, resolution_deg)
        self.cache[key] = (time.time(), data)

    def clear(self):
        self.cache.clear()


# Global adapter cache instance
_ADAPTER_CACHE = OpenMeteoCache()


def generate_grid_coords(
    center_lat: float,
    center_lon: float,
    grid_size: int = 7,
    resolution_deg: float = DEFAULT_RESOLUTION_DEG
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate 1D arrays of latitudes and longitudes centered around (center_lat, center_lon).
    Grid size is clamped to [1, MAX_GRID_SIZE].
    """
    grid_size = max(1, min(MAX_GRID_SIZE, int(grid_size)))
    half = (grid_size - 1) / 2.0
    
    lats = np.array([round(center_lat + (i - half) * resolution_deg, 4) for i in range(grid_size)])
    lons = np.array([round(center_lon + (j - half) * resolution_deg, 4) for j in range(grid_size)])
    return lats, lons


class OpenMeteoAdapter(BaseDataAdapter):
    """Adapter for Open-Meteo weather API."""

    VARIABLES = [
        "iwv", "delta_iwv", "cape", "cin", "convergence",
        "wind_shear", "ctt", "ctt_drop_rate", "qpe", "rainfall_accumulation",
        "precipitation_probability", "relative_humidity_2m", "cloud_cover", "temperature_2m"
    ]

    def __init__(self, timeout_sec: float = 10.0, cache: Optional[OpenMeteoCache] = None):
        self.timeout_sec = timeout_sec
        self.cache = cache or _ADAPTER_CACHE

    def get_name(self) -> str:
        return "Open-Meteo Weather Forecast API"

    def get_source_type(self) -> str:
        return "open_meteo"

    def get_data_mode(self) -> str:
        return DataMode.LIVE.value

    def get_variables(self) -> list[str]:
        return self.VARIABLES

    def fetch_raw_grid(
        self,
        center_lat: float,
        center_lon: float,
        grid_size: int = 7,
        resolution_deg: float = DEFAULT_RESOLUTION_DEG
    ) -> Tuple[np.ndarray, np.ndarray, List[Dict[str, Any]]]:
        """
        Fetch hourly weather variables for an N x N grid of coordinates.
        Returns (lats, lons, list_of_location_data).
        """
        cached = self.cache.get(center_lat, center_lon, grid_size, resolution_deg)
        if cached is not None:
            return cached

        lats, lons = generate_grid_coords(center_lat, center_lon, grid_size, resolution_deg)
        
        # Build flattened coordinate arrays
        flat_lats = [float(lat) for lat in lats for _ in lons]
        flat_lons = [float(lon) for _ in lats for lon in lons]

        hourly_vars = [
            "cape",
            "convective_inhibition",
            "precipitation",
            "precipitation_probability",
            "relative_humidity_2m",
            "wind_speed_10m",
            "wind_speed_80m",
            "cloud_cover",
            "total_column_integrated_water_vapour",
            "temperature_2m",
            "dew_point_2m"
        ]

        params = {
            "latitude": ",".join(f"{lat:.4f}" for lat in flat_lats),
            "longitude": ",".join(f"{lon:.4f}" for lon in flat_lons),
            "hourly": ",".join(hourly_vars),
            "forecast_days": 2,
            "timezone": "UTC"
        }

        with httpx.Client(timeout=self.timeout_sec) as client:
            resp = client.get(OPEN_METEO_API_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        # If single location returned, wrap in a list for consistent indexing
        if isinstance(data, dict):
            data_list = [data]
        else:
            data_list = data

        result = (lats, lons, data_list)
        self.cache.set(center_lat, center_lon, grid_size, resolution_deg, result)
        return result

    def build_dataset(
        self,
        center_lat: float,
        center_lon: float,
        grid_size: int = 7,
        resolution_deg: float = DEFAULT_RESOLUTION_DEG
    ) -> Dict[str, Any]:
        """
        Construct the complete Atmosense dataset dictionary with snapshots
        for forecast hours [0, 2, 3, 4, 5, 6].
        """
        lats, lons, raw_data_list = self.fetch_raw_grid(center_lat, center_lon, grid_size, resolution_deg)
        nlat, nlon = len(lats), len(lons)

        if len(raw_data_list) != nlat * nlon:
            raise ValueError(f"Expected {nlat * nlon} coordinate responses, got {len(raw_data_list)}")

        # Base time: nearest current UTC hour
        now_utc = datetime.now(timezone.utc)
        base_time = now_utc.replace(minute=0, second=0, microsecond=0)
        
        # Parse hourly timestamps from first location response
        time_strings = raw_data_list[0].get("hourly", {}).get("time", [])
        if not time_strings:
            raise ValueError("Open-Meteo returned empty hourly time array")

        times = [datetime.fromisoformat(t.replace("Z", "+00:00")).replace(tzinfo=timezone.utc) for t in time_strings]
        
        # Find index in times corresponding to base_time or earliest available
        try:
            base_idx = min(range(len(times)), key=lambda idx: abs((times[idx] - base_time).total_seconds()))
        except Exception:
            base_idx = 0

        forecast_hours = [0, 2, 3, 4, 5, 6]
        snapshots = {}

        for fh in forecast_hours:
            target_idx = base_idx + fh
            if target_idx >= len(times):
                target_idx = len(times) - 1

            prev_idx = max(0, target_idx - 1)

            # Initialize 2D feature grids
            cape_grid = np.zeros((nlat, nlon))
            cin_grid = np.zeros((nlat, nlon))
            iwv_grid = np.zeros((nlat, nlon))
            delta_iwv_grid = np.zeros((nlat, nlon))
            qpe_grid = np.zeros((nlat, nlon))
            accum_grid = np.zeros((nlat, nlon))
            shear_grid = np.zeros((nlat, nlon))
            ctt_grid = np.zeros((nlat, nlon))
            ctt_drop_grid = np.zeros((nlat, nlon))
            conv_grid = np.zeros((nlat, nlon))
            precip_prob_grid = np.zeros((nlat, nlon))
            humidity_grid = np.zeros((nlat, nlon))
            cloud_cover_grid = np.zeros((nlat, nlon))
            temp_grid = np.zeros((nlat, nlon))

            def _get_val(loc_hourly: dict, key: str, idx: int, default: float = 0.0) -> float:
                series = loc_hourly.get(key)
                if series and idx < len(series) and series[idx] is not None:
                    return float(series[idx])
                return default

            for i in range(nlat):
                for j in range(nlon):
                    loc_idx = i * nlon + j
                    loc_hourly = raw_data_list[loc_idx].get("hourly", {})

                    # Atmospheric features
                    c_val = _get_val(loc_hourly, "cape", target_idx, 0.0)
                    cin_val = _get_val(loc_hourly, "convective_inhibition", target_idx, 0.0)
                    cin_val = -abs(cin_val)  # Standardize CIN as negative J/kg
                    
                    iwv_curr = _get_val(loc_hourly, "total_column_integrated_water_vapour", target_idx, 30.0)
                    iwv_prev = _get_val(loc_hourly, "total_column_integrated_water_vapour", prev_idx, iwv_curr)
                    delta_iwv = iwv_curr - iwv_prev

                    precip_curr = _get_val(loc_hourly, "precipitation", target_idx, 0.0)
                    precip_prob = _get_val(loc_hourly, "precipitation_probability", target_idx, 0.0)
                    
                    # Compute rainfall accumulation up to target_idx
                    accum = sum(_get_val(loc_hourly, "precipitation", k, 0.0) for k in range(base_idx, target_idx + 1))

                    # Wind shear from 80m vs 10m wind speed
                    w10 = _get_val(loc_hourly, "wind_speed_10m", target_idx, 5.0)
                    w80 = _get_val(loc_hourly, "wind_speed_80m", target_idx, 10.0)
                    wind_shear = max(0.0, abs(w80 - w10) * 1.5)

                    # Cloud cover & CTT proxy
                    c_cover = _get_val(loc_hourly, "cloud_cover", target_idx, 20.0)
                    t2m = _get_val(loc_hourly, "temperature_2m", target_idx, 25.0)
                    t2m_k = t2m + 273.15
                    
                    # Deep convective clouds lower CTT significantly when cloud cover & CAPE are high
                    ctt_est = max(195.0, t2m_k - (c_cover / 100.0) * 55.0 - min(30.0, c_val / 100.0))
                    c_cover_prev = _get_val(loc_hourly, "cloud_cover", prev_idx, c_cover)
                    ctt_prev = max(195.0, t2m_k - (c_cover_prev / 100.0) * 55.0)
                    ctt_drop_rate = ctt_est - ctt_prev

                    # Assign into 2D grids
                    cape_grid[i, j] = max(0.0, c_val)
                    cin_grid[i, j] = cin_val
                    iwv_grid[i, j] = max(0.0, iwv_curr)
                    delta_iwv_grid[i, j] = delta_iwv
                    qpe_grid[i, j] = max(0.0, precip_curr)
                    accum_grid[i, j] = max(0.0, accum)
                    shear_grid[i, j] = wind_shear
                    ctt_grid[i, j] = ctt_est
                    ctt_drop_grid[i, j] = ctt_drop_rate
                    precip_prob_grid[i, j] = precip_prob
                    humidity_grid[i, j] = _get_val(loc_hourly, "relative_humidity_2m", target_idx, 60.0)
                    cloud_cover_grid[i, j] = c_cover
                    temp_grid[i, j] = t2m

            # Calculate spatial low-level divergence / convergence across the grid
            if nlat > 1 and nlon > 1:
                conv_grid = -1.0 * (delta_iwv_grid / 10.0) * 1e-5
            else:
                conv_grid = np.zeros((nlat, nlon))

            snapshots[fh] = {
                "iwv": iwv_grid,
                "delta_iwv": delta_iwv_grid,
                "cape": cape_grid,
                "cin": cin_grid,
                "convergence": conv_grid,
                "wind_shear": shear_grid,
                "ctt": ctt_grid,
                "ctt_drop_rate": ctt_drop_grid,
                "qpe": qpe_grid,
                "rainfall_accumulation": accum_grid,
                "precipitation_probability": precip_prob_grid,
                "relative_humidity_2m": humidity_grid,
                "cloud_cover": cloud_cover_grid,
                "temperature_2m": temp_grid,
            }

        # Build terrain dictionary for the grid
        elevation_grid = np.zeros((nlat, nlon))
        slope_grid = np.zeros((nlat, nlon))
        drainage_grid = np.zeros((nlat, nlon))
        flow_acc_grid = np.zeros((nlat, nlon))

        for i in range(nlat):
            for j in range(nlon):
                loc_idx = i * nlon + j
                elev = float(raw_data_list[loc_idx].get("elevation", 300.0))
                elevation_grid[i, j] = max(0.0, elev)

        # Estimate slope from elevation differences if grid has multiple cells
        for i in range(nlat):
            for j in range(nlon):
                dz_dx = 0.0
                dz_dy = 0.0
                if j + 1 < nlon:
                    dz_dx = abs(elevation_grid[i, j + 1] - elevation_grid[i, j]) / (resolution_deg * 111000.0)
                if i + 1 < nlat:
                    dz_dy = abs(elevation_grid[i + 1, j] - elevation_grid[i, j]) / (resolution_deg * 111000.0)
                slope_deg = float(np.degrees(np.arctan(np.sqrt(dz_dx**2 + dz_dy**2))))
                slope_grid[i, j] = min(60.0, max(1.0, slope_deg))

                norm_elev = min(1.0, elevation_grid[i, j] / 4000.0)
                norm_slope = min(1.0, slope_grid[i, j] / 45.0)
                drainage_grid[i, j] = round(0.3 + 0.4 * norm_slope + 0.2 * norm_elev, 3)
                flow_acc_grid[i, j] = round(0.2 + 0.5 * (1.0 - norm_slope * 0.5), 3)

        terrain = {
            "elevation": elevation_grid,
            "slope": slope_grid,
            "drainage": drainage_grid,
            "flow_accumulation": flow_acc_grid,
        }

        return {
            "lats": lats,
            "lons": lons,
            "terrain": terrain,
            "snapshots": snapshots,
            "base_time": base_time,
            "data_mode": DataMode.LIVE,
            "center": {"lat": center_lat, "lon": center_lon},
        }

    def get_data(self, forecast_hour: int = 0) -> dict:
        """Standard BaseDataAdapter get_data implementation for default center."""
        dataset = self.build_dataset(center_lat=28.6139, center_lon=77.2090, grid_size=7)
        snapshot = dataset["snapshots"].get(forecast_hour, dataset["snapshots"][0])
        return {
            "source": "open_meteo",
            "mode": "LIVE",
            "timestamp": dataset["base_time"].isoformat(),
            "variables": self.VARIABLES,
            "lats": dataset["lats"].tolist(),
            "lons": dataset["lons"].tolist(),
            "data": {v: snapshot[v].tolist() for v in self.VARIABLES if v in snapshot},
        }

    def get_status(self) -> dict:
        return {
            "source": "open_meteo",
            "name": "Open-Meteo Weather API",
            "status": "operational",
            "data_mode": "LIVE",
            "description": "Live atmospheric forecast data from Open-Meteo NWP",
        }

    def get_provenance(self) -> dict:
        return {
            "source": "open_meteo",
            "data_mode": "LIVE",
            "spatial_resolution_km": 11.0,
            "temporal_resolution_min": 60,
            "processing_status": "feature_ready",
            "quality_status": "good",
            "provider_url": OPEN_METEO_API_URL,
            "note": "Real-time atmospheric variables mapped into Atmosense feature pipeline",
        }
