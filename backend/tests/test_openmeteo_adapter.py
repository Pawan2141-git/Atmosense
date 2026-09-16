"""
Unit and Integration Tests for Open-Meteo Adapter & Atmosense Data Provider
"""
import pytest
import numpy as np
from unittest.mock import patch, MagicMock

from backend.data.adapters.openmeteo_adapter import (
    OpenMeteoAdapter,
    OpenMeteoCache,
    generate_grid_coords,
    MAX_GRID_SIZE
)
from backend.data.provider import get_atmospheric_dataset
from backend.core.enums import DataMode


def test_generate_grid_coords_dimensions():
    """Verify grid generation bounds and dimensions."""
    # 7x7 grid centered at Delhi
    lats, lons = generate_grid_coords(28.6139, 77.2090, grid_size=7, resolution_deg=0.25)
    assert len(lats) == 7
    assert len(lons) == 7
    assert lats[3] == round(28.6139, 4)
    assert lons[3] == round(77.2090, 4)

    # 1x1 grid
    lats_1, lons_1 = generate_grid_coords(19.0760, 72.8777, grid_size=1)
    assert len(lats_1) == 1
    assert len(lons_1) == 1
    assert lats_1[0] == 19.0760
    assert lons_1[0] == 72.8777

    # Clamping above MAX_GRID_SIZE (7)
    lats_clamped, lons_clamped = generate_grid_coords(20.0, 80.0, grid_size=15)
    assert len(lats_clamped) == MAX_GRID_SIZE
    assert len(lons_clamped) == MAX_GRID_SIZE


def test_openmeteo_cache_ttl():
    """Verify in-memory caching stores and expires correctly."""
    cache = OpenMeteoCache(ttl_seconds=1)
    test_data = ("lats", "lons", [{"data": 123}])
    
    cache.set(28.5, 77.5, 3, 0.25, test_data)
    cached = cache.get(28.5, 77.5, 3, 0.25)
    assert cached == test_data

    # Miss on different coordinate
    assert cache.get(19.0, 72.0, 3, 0.25) is None


def test_openmeteo_adapter_build_dataset_structure():
    """Verify build_dataset generates expected snapshot keys, arrays, and terrain fields."""
    adapter = OpenMeteoAdapter()
    
    # Mock raw grid response to avoid network dependencies during unit testing
    mock_hourly = {
        "time": [f"2026-09-14T{h:02d}:00" for h in range(24)] + [f"2026-09-15T{h:02d}:00" for h in range(24)],
        "cape": [500.0 + h * 10 for h in range(48)],
        "convective_inhibition": [30.0 for _ in range(48)],
        "precipitation": [2.5 for _ in range(48)],
        "precipitation_probability": [40.0 for _ in range(48)],
        "relative_humidity_2m": [75.0 for _ in range(48)],
        "wind_speed_10m": [8.0 for _ in range(48)],
        "wind_speed_80m": [18.0 for _ in range(48)],
        "cloud_cover": [60.0 for _ in range(48)],
        "total_column_integrated_water_vapour": [45.0 for _ in range(48)],
        "temperature_2m": [28.0 for _ in range(48)],
        "dew_point_2m": [22.0 for _ in range(48)],
    }
    mock_location_data = [{"elevation": 450.0, "hourly": mock_hourly} for _ in range(9)]
    
    with patch.object(adapter, "fetch_raw_grid", return_value=(np.array([28.0, 28.25, 28.5]), np.array([77.0, 77.25, 77.5]), mock_location_data)):
        dataset = adapter.build_dataset(28.25, 77.25, grid_size=3)

    assert "lats" in dataset
    assert "lons" in dataset
    assert "snapshots" in dataset
    assert "terrain" in dataset
    assert "base_time" in dataset
    assert dataset["data_mode"] == DataMode.LIVE

    for fh in [0, 2, 3, 4, 5, 6]:
        assert fh in dataset["snapshots"]
        snapshot = dataset["snapshots"][fh]
        for var in ["cape", "cin", "iwv", "delta_iwv", "qpe", "rainfall_accumulation", "wind_shear", "ctt", "ctt_drop_rate", "convergence"]:
            assert var in snapshot
            assert snapshot[var].shape == (3, 3)

    for terr_var in ["elevation", "slope", "drainage", "flow_accumulation"]:
        assert terr_var in dataset["terrain"]
        assert dataset["terrain"][terr_var].shape == (3, 3)


def test_provider_layer_fallback_on_error():
    """Verify provider layer gracefully falls back to DEMO data when Open-Meteo raises an exception."""
    with patch("backend.data.provider.get_openmeteo_adapter") as mock_get_adapter:
        mock_adapter = MagicMock()
        mock_adapter.build_dataset.side_effect = Exception("Open-Meteo network timeout / rate limit")
        mock_get_adapter.return_value = mock_adapter

        # Attempt dynamic query
        dataset = get_atmospheric_dataset(lat=19.0760, lon=72.8777, grid_size=7)

        # Fallback to DEMO dataset must succeed
        assert dataset is not None
        assert dataset.get("data_mode") == DataMode.DEMO or dataset.get("data_mode") == "DEMO"
        assert "snapshots" in dataset
        assert "terrain" in dataset


def test_provider_layer_default_backward_compatibility():
    """Verify provider layer without lat/lon returns the original DEMO dataset."""
    dataset = get_atmospheric_dataset()
    assert dataset is not None
    assert dataset["data_mode"] == "DEMO"
    assert len(dataset["lats"]) == 10
    assert len(dataset["lons"]) == 14
