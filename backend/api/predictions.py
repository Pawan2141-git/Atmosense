from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Query
from typing import Optional

from backend.core import get_settings, DataMode
from backend.core.enums import HazardType
from backend.schemas.prediction import (
    PredictionResponse, 
    PredictionGrid, 
    PredictionGridCell,
    HazardPrediction
)
from backend.data.provider import get_atmospheric_dataset
from backend.features.engine import get_feature_vector_from_dataset
from backend.ml.model import predict_hazards, MODEL_VERSION
from backend.risk.risk_engine import RiskEngine
from backend.risk.flash_flood import FlashFloodEngine

router = APIRouter()

@router.get("", response_model=PredictionResponse)
def get_predictions(
    forecast_hour: Optional[int] = Query(None),
    lat: Optional[float] = Query(None, description="Center latitude for dynamic prediction grid"),
    lon: Optional[float] = Query(None, description="Center longitude for dynamic prediction grid"),
    grid_size: int = Query(7, ge=1, le=7, description="Grid dimension (N x N, max 7)")
):
    """Get grid-based predictions for severe weather hazards."""
    dataset = get_atmospheric_dataset(lat=lat, lon=lon, grid_size=grid_size)
    data_mode = dataset.get("data_mode", DataMode.DEMO)
    
    base_time = dataset["base_time"]
    if base_time.tzinfo is None:
        base_time = base_time.replace(tzinfo=timezone.utc)
    
    hours_to_process = [forecast_hour] if forecast_hour else [2, 3, 4, 5, 6]
    grids = []
    
    lats = dataset["lats"]
    lons = dataset["lons"]
    
    for fh in hours_to_process:
        valid_time = base_time + timedelta(hours=fh)
        cells = []
        
        # Iterate over grid cells
        for i, lat_val in enumerate(lats):
            for j, lon_val in enumerate(lons):
                # 1. Feature Engineering
                features = get_feature_vector_from_dataset(dataset, i, j, fh)
                
                # 2. ML Prediction
                preds = predict_hazards(features)
                
                # 3. Risk Assessment
                ts_prob = preds["thunderstorm"]["probability"]
                ts_conf = preds["thunderstorm"]["confidence"]
                ts_score, ts_risk = RiskEngine.calculate_risk(HazardType.THUNDERSTORM, ts_prob, ts_conf)
                
                cb_prob = preds["cloudburst"]["probability"]
                cb_conf = preds["cloudburst"]["confidence"]
                cb_score, cb_risk = RiskEngine.calculate_risk(HazardType.CLOUDBURST, cb_prob, cb_conf, rainfall_intensity=features.get("qpe", 0.0))
                
                # 4. Flash Flood Assessment
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
                
                cells.append(PredictionGridCell(
                    lat=float(lat_val),
                    lon=float(lon_val),
                    thunderstorm_prob=ts_prob,
                    cloudburst_prob=cb_prob,
                    flash_flood_risk=ff_risk_obj.risk_score,
                    thunderstorm_risk=ts_risk,
                    cloudburst_risk=cb_risk,
                    flash_flood_risk_level=ff_risk_obj.risk_level
                ))
                
        grids.append(PredictionGrid(
            forecast_hour=fh,
            valid_time=valid_time,
            data_timestamp=base_time,
            model_version=MODEL_VERSION,
            data_mode=data_mode,
            grid_resolution_deg=0.25,
            cells=cells,
            bounding_box={
                "north": float(max(lats)),
                "south": float(min(lats)),
                "east": float(max(lons)),
                "west": float(min(lons))
            }
        ))
        
    return PredictionResponse(
        status="ok",
        data_mode=data_mode,
        model_version=MODEL_VERSION,
        generated_at=datetime.now(timezone.utc),
        forecast_hours=hours_to_process,
        grids=grids
    )
