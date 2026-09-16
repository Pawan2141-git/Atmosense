from fastapi import APIRouter
from backend.core import get_settings

router = APIRouter()

@router.get("")
def get_events():
    return {"data_mode": get_settings().data_mode, "events": []}
