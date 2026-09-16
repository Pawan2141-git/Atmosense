from fastapi import APIRouter
from backend.core import get_settings

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "healthy"}

@router.get("/system/status")
def system_status():
    settings = get_settings()
    return {
        "status": "online",
        "data_mode": settings.data_mode,
        "model_version": "v1.0.0-prototype",
        "uptime": "N/A",
        "pipeline_status": "operational"
    }
