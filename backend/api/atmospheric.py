from fastapi import APIRouter
from typing import Optional
from backend.core import get_settings

router = APIRouter()

@router.get("/features")
def get_features(feature: Optional[str] = None):
    return {"data_mode": get_settings().data_mode, "features": []}

@router.get("/profile")
def get_profile(lat: Optional[float] = None, lon: Optional[float] = None):
    return {"data_mode": get_settings().data_mode, "profile": {}}
