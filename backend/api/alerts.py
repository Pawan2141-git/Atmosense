from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Query
from typing import Optional

from backend.core import DataMode
from backend.core.enums import HazardType
from backend.schemas.alert import AlertResponse
from backend.data.provider import get_atmospheric_dataset
from backend.features.engine import get_feature_vector_from_dataset
from backend.ml.model import predict_hazards, MODEL_VERSION
from backend.risk.risk_engine import RiskEngine
from backend.risk.flash_flood import FlashFloodEngine
from backend.alerts.engine import AlertEngine

router = APIRouter()

def _generate_alerts(
    forecast_hour: int,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    grid_size: int = 7
):
    """Helper to generate alerts for a given forecast hour and dynamic dataset."""
    dataset = get_atmospheric_dataset(lat=lat, lon=lon, grid_size=grid_size)
    timestamp = dataset["base_time"]
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    alerts = []
    
    for i, lat_val in enumerate(dataset["lats"]):
        for j, lon_val in enumerate(dataset["lons"]):
            features = get_feature_vector_from_dataset(dataset, i, j, forecast_hour)
            preds = predict_hazards(features)
            
            # 1. Thunderstorm Alert
            ts_prob = preds["thunderstorm"]["probability"]
            ts_conf = preds["thunderstorm"]["confidence"]
            _, ts_risk = RiskEngine.calculate_risk(HazardType.THUNDERSTORM, ts_prob, ts_conf)
            ts_alert = AlertEngine.evaluate_alert(
                hazard_type=HazardType.THUNDERSTORM,
                risk_level=ts_risk,
                probability=ts_prob,
                confidence=ts_conf,
                lat=float(lat_val),
                lon=float(lon_val),
                forecast_hour=forecast_hour,
                triggering_factors=["cape", "convergence"],
                timestamp=timestamp,
                model_version=MODEL_VERSION
            )
            if ts_alert:
                alerts.append(ts_alert)

            # 2. Cloudburst Alert
            cb_prob = preds["cloudburst"]["probability"]
            cb_conf = preds["cloudburst"]["confidence"]
            _, cb_risk = RiskEngine.calculate_risk(HazardType.CLOUDBURST, cb_prob, cb_conf, rainfall_intensity=features.get("qpe", 0.0))
            cb_alert = AlertEngine.evaluate_alert(
                hazard_type=HazardType.CLOUDBURST,
                risk_level=cb_risk,
                probability=cb_prob,
                confidence=cb_conf,
                lat=float(lat_val),
                lon=float(lon_val),
                forecast_hour=forecast_hour,
                triggering_factors=["qpe", "iwv"],
                timestamp=timestamp,
                model_version=MODEL_VERSION
            )
            if cb_alert:
                alerts.append(cb_alert)

            # 3. Flash Flood Alert
            ff_risk_obj = FlashFloodEngine.calculate_flash_flood_risk(
                lat=float(lat_val),
                lon=float(lon_val),
                cloudburst_probability=cb_prob,
                rainfall_intensity=features.get("qpe", 0.0),
                rainfall_accumulation=features.get("rainfall_accumulation", 0.0),
                elevation=features.get("elevation", 0.0),
                slope=features.get("slope", 0.0),
                drainage=features.get("drainage", 0.0),
                flow_accumulation=features.get("flow_accumulation", 0.0),
                model_confidence=preds["flash_flood"]["confidence"]
            )
            ff_alert = AlertEngine.evaluate_alert(
                hazard_type=HazardType.FLASH_FLOOD,
                risk_level=ff_risk_obj.risk_level,
                probability=ff_risk_obj.combined_risk,
                confidence=preds["flash_flood"]["confidence"],
                lat=float(lat_val),
                lon=float(lon_val),
                forecast_hour=forecast_hour,
                triggering_factors=["slope", "qpe"],
                timestamp=timestamp,
                model_version=MODEL_VERSION
            )
            if ff_alert:
                alerts.append(ff_alert)
                
    return alerts, dataset.get("data_mode", DataMode.DEMO)

@router.get("", response_model=AlertResponse)
def get_alerts(
    forecast_hour: Optional[int] = Query(2),
    lat: Optional[float] = Query(None, description="Center latitude"),
    lon: Optional[float] = Query(None, description="Center longitude"),
    grid_size: int = Query(7, ge=1, le=7, description="Grid dimension (N x N, max 7)")
):
    alerts, data_mode = _generate_alerts(forecast_hour, lat=lat, lon=lon, grid_size=grid_size)
    return AlertResponse(
        status="ok",
        data_mode=data_mode,
        generated_at=datetime.now(timezone.utc),
        active_alerts=alerts,
        total_count=len(alerts)
    )

@router.post("/evaluate", response_model=AlertResponse)
def evaluate_alerts(
    forecast_hour: Optional[int] = Query(2),
    lat: Optional[float] = Query(None, description="Center latitude"),
    lon: Optional[float] = Query(None, description="Center longitude"),
    grid_size: int = Query(7, ge=1, le=7, description="Grid dimension (N x N, max 7)")
):
    alerts, data_mode = _generate_alerts(forecast_hour, lat=lat, lon=lon, grid_size=grid_size)
    return AlertResponse(
        status="evaluated",
        data_mode=data_mode,
        generated_at=datetime.now(timezone.utc),
        active_alerts=alerts,
        total_count=len(alerts)
    )
