"""
Atmosense Demo Data Generator

Generates a deterministic, scientifically plausible atmospheric dataset
for the Uttarakhand Himalayan region. This represents a developing severe
convective event with a clear hotspot.

DATA MODE: DEMO — This is NOT live or historical data.
"""
import numpy as np
from datetime import datetime, timezone, timedelta


# Fixed seed for deterministic output
_RNG = np.random.RandomState(42)

# Grid definition: Uttarakhand region at 0.25° resolution
LATS = np.arange(29.0, 31.5, 0.25)   # 10 points
LONS = np.arange(77.5, 81.0, 0.25)   # 14 points
NLAT, NLON = len(LATS), len(LONS)

# Hotspot: near Chamoli / upper Alaknanda valley — steep terrain, flash-flood prone
HOTSPOT_LAT, HOTSPOT_LON = 30.4, 79.3
HOTSPOT_RADIUS_DEG = 0.8

BASE_TIME = datetime(2024, 8, 15, 6, 0, 0, tzinfo=timezone.utc)
FORECAST_HOURS = [0, 2, 3, 4, 5, 6]


def _distance_from_hotspot(lat: float, lon: float) -> float:
    """Euclidean distance in degrees from the convective hotspot."""
    return np.sqrt((lat - HOTSPOT_LAT) ** 2 + (lon - HOTSPOT_LON) ** 2)


def _hotspot_weight(lat: float, lon: float, radius: float = HOTSPOT_RADIUS_DEG) -> float:
    """Gaussian-like weight: 1.0 at hotspot center, decaying outward."""
    d = _distance_from_hotspot(lat, lon)
    return float(np.exp(-0.5 * (d / radius) ** 2))


def _temporal_intensity(forecast_hour: int) -> float:
    """Event temporal profile: intensifies +2→+4H, peaks +4H, weakens +5→+6H."""
    profile = {0: 0.3, 2: 0.5, 3: 0.7, 4: 1.0, 5: 0.85, 6: 0.6}
    return profile.get(forecast_hour, 0.3)


def generate_grid_field(
    base_low: float,
    base_high: float,
    hotspot_boost: float,
    forecast_hour: int,
    noise_scale: float = 0.05,
    seed_offset: int = 0,
) -> np.ndarray:
    """Generate a 2D field with hotspot enhancement and temporal evolution."""
    rng = np.random.RandomState(42 + seed_offset + forecast_hour)
    intensity = _temporal_intensity(forecast_hour)
    field = np.zeros((NLAT, NLON))
    for i, lat in enumerate(LATS):
        for j, lon in enumerate(LONS):
            w = _hotspot_weight(lat, lon)
            base = base_low + (base_high - base_low) * rng.uniform(0.3, 0.7)
            boost = hotspot_boost * w * intensity
            noise = rng.normal(0, noise_scale * abs(base))
            field[i, j] = base + boost + noise
    return field


def generate_terrain() -> dict:
    """Generate static terrain fields (do not change with time).
    
    Uttarakhand topography: plains in south (~200-500m), steep mountains 
    in north (3000-7000m), major river valleys with high flow accumulation.
    """
    rng = np.random.RandomState(99)
    elevation = np.zeros((NLAT, NLON))
    slope = np.zeros((NLAT, NLON))
    drainage = np.zeros((NLAT, NLON))
    flow_acc = np.zeros((NLAT, NLON))

    for i, lat in enumerate(LATS):
        for j, lon in enumerate(LONS):
            # Elevation increases with latitude (south=plains, north=mountains)
            lat_frac = (lat - 29.0) / 2.5
            elev_base = 300 + 5000 * lat_frac ** 1.3
            elev_base += rng.normal(0, 300)
            elevation[i, j] = max(150, elev_base)

            # Slope correlates with elevation gradient
            slope[i, j] = min(60, max(1, 5 + 20 * lat_frac + rng.normal(0, 5)))

            # River valleys: higher drainage and flow accumulation in valleys
            valley = _hotspot_weight(lat, lon, radius=1.2)
            drainage[i, j] = min(1.0, max(0, 0.2 + 0.6 * valley + rng.uniform(-0.1, 0.1)))
            flow_acc[i, j] = min(1.0, max(0, 0.15 + 0.7 * valley + rng.uniform(-0.1, 0.1)))

    return {
        "elevation": elevation,
        "slope": slope,
        "drainage": drainage,
        "flow_accumulation": flow_acc,
    }


def generate_atmospheric_snapshot(forecast_hour: int) -> dict:
    """Generate a complete atmospheric snapshot for one forecast hour.
    
    Returns dict of 2D numpy arrays keyed by feature name.
    """
    t = _temporal_intensity(forecast_hour)

    # --- Moisture ---
    # IWV: background 30-45 kg/m², hotspot up to 65 kg/m²
    iwv = generate_grid_field(32, 45, 25, forecast_hour, noise_scale=0.04, seed_offset=0)

    # ΔIWV: positive near hotspot (rapid moisture increase), near-zero elsewhere
    delta_iwv = generate_grid_field(-1, 1, 8, forecast_hour, noise_scale=0.1, seed_offset=100)

    # --- Thermodynamic instability ---
    # CAPE: background 500-1200 J/kg, hotspot up to 3500 J/kg
    cape = generate_grid_field(500, 1200, 2500, forecast_hour, noise_scale=0.06, seed_offset=200)
    cape = np.maximum(cape, 0)

    # CIN: background -150 to -60 J/kg, weakening (less negative) at hotspot
    cin = generate_grid_field(-150, -60, 80, forecast_hour, noise_scale=0.08, seed_offset=300)
    cin = np.minimum(cin, 0)

    # --- Dynamical ---
    # Convergence: background near 0, strong negative at hotspot (convergence = negative divergence)
    convergence = generate_grid_field(-5e-6, 5e-6, -4e-5, forecast_hour, noise_scale=0.15, seed_offset=400)

    # Wind shear: background 8-15 m/s, elevated at hotspot up to 30 m/s
    wind_shear = generate_grid_field(8, 15, 18, forecast_hour, noise_scale=0.06, seed_offset=500)
    wind_shear = np.maximum(wind_shear, 0)

    # --- Satellite convective ---
    # CTT: background 250-275 K, very cold at hotspot (deep convection) down to 210 K
    ctt = generate_grid_field(250, 275, -55, forecast_hour, noise_scale=0.02, seed_offset=600)
    ctt = np.maximum(ctt, 195)

    # CTT drop rate: near 0 background, rapid cooling at hotspot (-12 K/hr)
    ctt_drop_rate = generate_grid_field(-1, 0, -12, forecast_hour, noise_scale=0.1, seed_offset=700)

    # --- Precipitation ---
    # QPE: background 0-10 mm/hr, hotspot up to 90 mm/hr
    qpe = generate_grid_field(0, 10, 85, forecast_hour, noise_scale=0.08, seed_offset=800)
    qpe = np.maximum(qpe, 0)

    # Rainfall accumulation: grows with time, higher at hotspot
    accum_base = forecast_hour * 8
    rainfall_accum = generate_grid_field(0, accum_base, accum_base * 3, forecast_hour, noise_scale=0.06, seed_offset=900)
    rainfall_accum = np.maximum(rainfall_accum, 0)

    return {
        "iwv": iwv,
        "delta_iwv": delta_iwv,
        "cape": cape,
        "cin": cin,
        "convergence": convergence,
        "wind_shear": wind_shear,
        "ctt": ctt,
        "ctt_drop_rate": ctt_drop_rate,
        "qpe": qpe,
        "rainfall_accumulation": rainfall_accum,
    }


def generate_full_demo_dataset() -> dict:
    """Generate the complete DEMO dataset across all forecast hours.
    
    Returns:
        {
            "lats": 1D array,
            "lons": 1D array,
            "terrain": {field_name: 2D array, ...},
            "snapshots": {forecast_hour: {field_name: 2D array, ...}, ...},
            "base_time": datetime,
            "data_mode": "DEMO",
            "hotspot": {"lat": float, "lon": float},
        }
    """
    terrain = generate_terrain()
    snapshots = {}
    for fh in FORECAST_HOURS:
        snapshots[fh] = generate_atmospheric_snapshot(fh)

    return {
        "lats": LATS,
        "lons": LONS,
        "terrain": terrain,
        "snapshots": snapshots,
        "base_time": BASE_TIME,
        "data_mode": "DEMO",
        "hotspot": {"lat": HOTSPOT_LAT, "lon": HOTSPOT_LON},
    }


# Module-level singleton
_DEMO_DATA = None


def get_demo_data() -> dict:
    """Get or create the singleton demo dataset."""
    global _DEMO_DATA
    if _DEMO_DATA is None:
        _DEMO_DATA = generate_full_demo_dataset()
    return _DEMO_DATA
