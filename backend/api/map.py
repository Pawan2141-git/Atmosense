from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import httpx

from backend.core import get_settings


router = APIRouter()

_CARTO_TILE_URL = "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"


@router.get("/basemap-style")
def get_basemap_style() -> dict:
    """Return a token-free CARTO configuration for the frontend map."""
    if not get_settings().carto_api_token:
        return {
            "enabled": False,
            "fallback": "existing",
            "tiles": None,
            "attribution": None,
        }

    return {
        "enabled": True,
        "fallback": "existing",
        "tiles": "/api/map/tiles/{z}/{x}/{y}.png",
        "attribution": "&copy; CARTO &copy; OpenStreetMap contributors",
        "max_zoom": 20,
    }


@router.get("/tiles/{z}/{x}/{y}.png")
async def get_carto_tile(z: int, x: int, y: int) -> Response:
    """Proxy CARTO tiles so the API token never reaches the browser."""
    token = get_settings().carto_api_token
    if not token:
        raise HTTPException(status_code=404, detail="CARTO basemap is not configured")

    url = _CARTO_TILE_URL.format(z=z, x=x, y=y, r="@2x")
    try:
        async with httpx.AsyncClient(timeout=5.0, trust_env=False) as client:
            response = await client.get(url, params={"api_key": token})
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="CARTO basemap unavailable") from exc

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="CARTO basemap unavailable")

    return Response(
        content=response.content,
        media_type=response.headers.get("content-type", "image/png"),
        headers={"Cache-Control": "public, max-age=3600"},
    )