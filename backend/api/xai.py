from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from backend.core import DataMode
from backend.core.enums import HazardType
from backend.schemas.xai import XAIResponse
from backend.data.provider import get_atmospheric_dataset
from backend.features.engine import get_feature_vector_from_dataset
from backend.ml.model import get_feature_contributions
from backend.xai.explainer import XAIExplainer

router = APIRouter()

@router.get("", response_model=XAIResponse)
def get_explanation(
    lat: float, 
    lon: float, 
    hazard: HazardType,
    forecast_hour: int = 2
):
    """Get XAI diagnosis for a specific location and hazard."""
    dataset = get_atmospheric_dataset(lat=lat, lon=lon, grid_size=3)
    data_mode = dataset.get("data_mode", DataMode.DEMO)
    
    # Find nearest grid point in the returned dataset
    lats = list(dataset["lats"])
    lons = list(dataset["lons"])
    
    try:
        lat_idx = min(range(len(lats)), key=lambda i: abs(lats[i] - lat))
        lon_idx = min(range(len(lons)), key=lambda i: abs(lons[i] - lon))
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Unable to map coordinates to grid")
        
    features = get_feature_vector_from_dataset(dataset, lat_idx, lon_idx, forecast_hour)
    contributions = get_feature_contributions(features, hazard.value)
    
    base_time = dataset.get("base_time", datetime.now(timezone.utc))
    if base_time.tzinfo is None:
        base_time = base_time.replace(tzinfo=timezone.utc)
    
    diagnosis = XAIExplainer.explain(
        lat=lat,
        lon=lon,
        timestamp=base_time,
        hazard_type=hazard,
        features=features,
        contributions=contributions,
        data_mode=data_mode
    )
    
    return XAIResponse(
        status="ok",
        data_mode=data_mode,
        generated_at=datetime.now(timezone.utc),
        diagnosis=diagnosis
    )
