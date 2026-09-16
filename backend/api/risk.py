from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Query
from typing import Optional

from backend.core import get_settings, DataMode
from backend.core.enums import HazardType, RiskLevel
from backend.schemas.risk import RiskMapResponse, RiskZone, FlashFloodRisk
from backend.data.provider import get_atmospheric_dataset
from backend.features.engine import get_feature_vector_from_dataset
from backend.ml.model import predict_hazards
from backend.risk.risk_engine import RiskEngine
from backend.risk.flash_flood import FlashFloodEngine

router = APIRouter()

@router.get("", response_model=RiskMapResponse)
def get_risk_map(
    forecast_hour: int = Query(2),
    lat: Optional[float] = Query(None, description="Center latitude"),
    lon: Optional[float] = Query(None, description="Center longitude"),
    grid_size: int = Query(7, ge=1, le=7, description="Grid dimension (N x N, max 7)")
):
    """Get spatial risk map for all hazards."""
    dataset = get_atmospheric_dataset(lat=lat, lon=lon, grid_size=grid_size)
    data_mode = dataset.get("data_mode", DataMode.DEMO)
    
    base_time = dataset["base_time"]
    if base_time.tzinfo is None:
        base_time = base_time.replace(tzinfo=timezone.utc)
    valid_time = base_time + timedelta(hours=forecast_hour)
    
    zones = []
    zone_idx = 1
    
    for i, lat_val in enumerate(dataset["lats"]):
        for j, lon_val in enumerate(dataset["lons"]):
            features = get_feature_vector_from_dataset(dataset, i, j, forecast_hour)
            preds = predict_hazards(features)
            
            for hazard in [HazardType.THUNDERSTORM, HazardType.CLOUDBURST]:
                prob = preds[hazard.value]["probability"]
                conf = preds[hazard.value]["confidence"]
                
                rainfall = features.get("qpe", 0.0) if hazard == HazardType.CLOUDBURST else 0.0
                score, level = RiskEngine.calculate_risk(hazard, prob, conf, rainfall_intensity=rainfall)
                
                # Only return zones with elevated risk to keep response minimal
                if level != RiskLevel.LOW:
                    zones.append(RiskZone(
                        zone_id=f"Z-{hazard.value.upper()}-{zone_idx}",
                        hazard_type=hazard,
                        risk_level=level,
                        risk_score=score,
                        probability=prob,
                        confidence=conf,
                        center_lat=float(lat_val),
                        center_lon=float(lon_val),
                        forecast_hour=forecast_hour,
                        valid_time=valid_time,
                        data_mode=data_mode
                    ))
                    zone_idx += 1
                    
    return RiskMapResponse(
        status="ok",
        data_mode=data_mode,
        generated_at=datetime.now(timezone.utc),
        forecast_hour=forecast_hour,
        zones=zones
    )

@router.get("/flash-flood", response_model=RiskMapResponse)
def get_flash_flood_risk(
    forecast_hour: int = Query(2),
    lat: Optional[float] = Query(None, description="Center latitude"),
    lon: Optional[float] = Query(None, description="Center longitude"),
    grid_size: int = Query(7, ge=1, le=7, description="Grid dimension (N x N, max 7)")
):
    """Get detailed flash flood risk assessment."""
    dataset = get_atmospheric_dataset(lat=lat, lon=lon, grid_size=grid_size)
    data_mode = dataset.get("data_mode", DataMode.DEMO)
    
    base_time = dataset["base_time"]
    if base_time.tzinfo is None:
        base_time = base_time.replace(tzinfo=timezone.utc)
    valid_time = base_time + timedelta(hours=forecast_hour)
    
    ff_risks = []
    zones = []
    zone_idx = 1
    
    for i, lat_val in enumerate(dataset["lats"]):
        for j, lon_val in enumerate(dataset["lons"]):
            features = get_feature_vector_from_dataset(dataset, i, j, forecast_hour)
            preds = predict_hazards(features)
            
            ff_risk_obj = FlashFloodEngine.calculate_flash_flood_risk(
                lat=float(lat_val),
                lon=float(lon_val),
                cloudburst_probability=preds["cloudburst"]["probability"],
                rainfall_intensity=features.get("qpe", 0.0),
                rainfall_accumulation=features.get("rainfall_accumulation", 0.0),
                elevation=features.get("elevation", 0.0),
                slope=features.get("slope", 0.0),
                drainage=features.get("drainage", 0.0),
                flow_accumulation=features.get("flow_accumulation", 0.0),
                model_confidence=preds["flash_flood"]["confidence"]
            )
            
            if ff_risk_obj.risk_level != RiskLevel.LOW:
                ff_risks.append(ff_risk_obj)
                zones.append(RiskZone(
                    zone_id=f"Z-FF-{zone_idx}",
                    hazard_type=HazardType.FLASH_FLOOD,
                    risk_level=ff_risk_obj.risk_level,
                    risk_score=ff_risk_obj.risk_score,
                    probability=ff_risk_obj.combined_risk,
                    confidence=preds["flash_flood"]["confidence"],
                    center_lat=float(lat_val),
                    center_lon=float(lon_val),
                    forecast_hour=forecast_hour,
                    valid_time=valid_time,
                    data_mode=data_mode
                ))
                zone_idx += 1
                
    return RiskMapResponse(
        status="ok",
        data_mode=data_mode,
        generated_at=datetime.now(timezone.utc),
        forecast_hour=forecast_hour,
        zones=zones,
        flash_flood_risks=ff_risks
    )
