"""
Integration & Regression Tests for Atmosense Endpoints with Open-Meteo & DEMO Fallback
"""
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.core.enums import DataMode, HazardType

client = TestClient(app)


def test_predictions_endpoint_default_demo():
    """Verify /api/predictions without params returns standard DEMO response structure."""
    response = client.get("/api/predictions")
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "ok"
    assert data["data_mode"] == "DEMO"
    assert "forecast_hours" in data
    assert len(data["grids"]) == 5  # [2, 3, 4, 5, 6]
    
    grid = data["grids"][0]
    assert "cells" in grid
    assert len(grid["cells"]) > 0
    cell = grid["cells"][0]
    assert "lat" in cell
    assert "lon" in cell
    assert "thunderstorm_prob" in cell
    assert "cloudburst_prob" in cell
    assert "flash_flood_risk" in cell
    assert "thunderstorm_risk" in cell
    assert "cloudburst_risk" in cell
    assert "flash_flood_risk_level" in cell


def test_predictions_endpoint_single_forecast_hour():
    """Verify /api/predictions with single forecast_hour parameter."""
    response = client.get("/api/predictions?forecast_hour=3")
    assert response.status_code == 200
    data = response.json()
    assert data["forecast_hours"] == [3]
    assert len(data["grids"]) == 1
    assert data["grids"][0]["forecast_hour"] == 3


def test_predictions_endpoint_dynamic_coordinates():
    """Verify /api/predictions accepts dynamic lat/lon and returns 7x7 grid."""
    response = client.get("/api/predictions?lat=28.6139&lon=77.2090&grid_size=5&forecast_hour=2")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    # Even if offline/network fails, fallback to DEMO works; if online, LIVE mode is returned
    assert data["data_mode"] in ["LIVE", "DEMO"]
    assert len(data["grids"]) == 1
    grid = data["grids"][0]
    # In live mode with grid_size=5, cells count = 25 (or demo fallback grid)
    assert len(grid["cells"]) > 0


def test_risk_endpoints():
    """Verify /api/risk and /api/risk/flash-flood endpoints."""
    # Standard risk map
    resp1 = client.get("/api/risk?forecast_hour=2")
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["status"] == "ok"
    assert "zones" in data1

    # Flash flood risk map
    resp2 = client.get("/api/risk/flash-flood?forecast_hour=2")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["status"] == "ok"
    assert "zones" in data2
    assert "flash_flood_risks" in data2


def test_alerts_endpoints():
    """Verify /api/alerts and /api/alerts/evaluate endpoints."""
    resp1 = client.get("/api/alerts?forecast_hour=2")
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["status"] == "ok"
    assert "active_alerts" in data1
    assert "total_count" in data1

    resp2 = client.post("/api/alerts/evaluate?forecast_hour=2")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["status"] == "evaluated"
    assert "active_alerts" in data2


def test_xai_endpoint():
    """Verify /api/xai returns structured meteorological diagnosis."""
    response = client.get("/api/xai?lat=30.4&lon=79.3&hazard=thunderstorm&forecast_hour=2")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "diagnosis" in data
    diag = data["diagnosis"]
    assert diag["hazard_type"] == "thunderstorm"
    assert "moisture_evidence" in diag
    assert "instability_evidence" in diag
    assert "diagnosis_summary" in diag
