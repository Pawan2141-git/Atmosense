"""
Atmosense Data Provider Selection Layer

Provides a safe atmospheric dataset coordinator:
- If a target location (lat, lon) is supplied or LIVE mode is active, attempts Open-Meteo.
- If Open-Meteo fails, times out, rate limits, or is disabled, gracefully falls back to the DEMO adapter.
- If no coordinates are supplied, returns DEMO dataset maintaining 100% backward compatibility.
"""
import logging
from typing import Optional, Dict, Any

from backend.core import get_settings, DataMode
from backend.data.adapters.demo_adapter import get_demo_data
from backend.data.adapters.openmeteo_adapter import OpenMeteoAdapter

logger = logging.getLogger(__name__)

# Singleton Open-Meteo adapter instance
_OPENMETEO_ADAPTER: Optional[OpenMeteoAdapter] = None


def get_openmeteo_adapter() -> OpenMeteoAdapter:
    global _OPENMETEO_ADAPTER
    if _OPENMETEO_ADAPTER is None:
        settings = get_settings()
        timeout = getattr(settings, "openmeteo_timeout_sec", 10.0)
        _OPENMETEO_ADAPTER = OpenMeteoAdapter(timeout_sec=timeout)
    return _OPENMETEO_ADAPTER


def get_atmospheric_dataset(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    grid_size: int = 7,
    resolution_deg: float = 0.25,
    force_demo: bool = False
) -> Dict[str, Any]:
    """
    Retrieve atmospheric dataset for prediction pipelines.
    
    Args:
        lat: Optional center latitude.
        lon: Optional center longitude.
        grid_size: Dimension N of the NxN grid (clamped 1-7).
        resolution_deg: Spatial resolution in degrees.
        force_demo: If True, forces return of the DEMO dataset.
        
    Returns:
        dict: Standard Atmosense dataset dictionary with keys:
              ['lats', 'lons', 'terrain', 'snapshots', 'base_time', 'data_mode']
    """
    settings = get_settings()
    
    # If explicitly forcing demo or no dynamic coordinates provided, return demo data
    if force_demo or (lat is None and lon is None and settings.data_mode == DataMode.DEMO):
        return get_demo_data()

    # Determine coordinates to query
    target_lat = lat if lat is not None else 28.6139  # Default centroid if not given in LIVE mode
    target_lon = lon if lon is not None else 77.2090

    # Try Open-Meteo with graceful DEMO fallback
    try:
        adapter = get_openmeteo_adapter()
        dataset = adapter.build_dataset(
            center_lat=target_lat,
            center_lon=target_lon,
            grid_size=grid_size,
            resolution_deg=resolution_deg
        )
        return dataset
    except Exception as exc:
        logger.warning(
            f"Open-Meteo query failed for ({target_lat}, {target_lon}): {exc}. "
            "Gracefully falling back to DEMO data adapter."
        )
        # Fall back to DEMO dataset
        return get_demo_data()
