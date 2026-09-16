from fastapi import APIRouter
from backend.core import get_settings

router = APIRouter()

@router.get("/status")
def get_data_status():
    return {"data_mode": get_settings().data_mode, "sources": []}
