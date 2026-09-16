"""
Atmosense Risk Schemas
Typed contracts for risk assessment and flash-flood intelligence.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from backend.core.enums import HazardType, RiskLevel, DataMode


class FlashFloodRiskFactors(BaseModel):
    """Factors contributing to flash-flood risk at a location."""
    cloudburst_probability: float = Field(0.0, ge=0.0, le=1.0)
    rainfall_intensity_mm_hr: float = 0.0
    rainfall_accumulation_mm: float = 0.0
    elevation_m: float = 0.0
    slope_degrees: float = 0.0
    drainage_density: float = Field(0.0, ge=0.0, le=1.0)
    flow_accumulation: float = Field(0.0, ge=0.0, le=1.0)


class FlashFloodRisk(BaseModel):
    """Flash-flood risk assessment for a location."""
    latitude: float
    longitude: float
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: RiskLevel
    factors: FlashFloodRiskFactors
    terrain_vulnerability: float = Field(
        ..., ge=0.0, le=1.0,
        description="Terrain-only vulnerability score"
    )
    precipitation_threat: float = Field(
        ..., ge=0.0, le=1.0,
        description="Precipitation-only threat score"
    )
    combined_risk: float = Field(
        ..., ge=0.0, le=1.0,
        description="Combined terrain + precipitation risk"
    )


class RiskZone(BaseModel):
    """A geographic zone with assessed risk."""
    zone_id: str
    hazard_type: HazardType
    risk_level: RiskLevel
    risk_score: float = Field(..., ge=0.0, le=1.0)
    probability: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    center_lat: float
    center_lon: float
    affected_area_km2: Optional[float] = None
    geometry_geojson: Optional[dict] = Field(
        None, description="GeoJSON geometry of the risk zone"
    )
    forecast_hour: int
    valid_time: datetime
    data_mode: DataMode


class RiskMapResponse(BaseModel):
    """API response for risk maps."""
    status: str = "ok"
    data_mode: DataMode
    generated_at: datetime
    forecast_hour: int
    zones: list[RiskZone]
    flash_flood_risks: list[FlashFloodRisk] = []
    summary: dict = Field(
        default_factory=dict,
        description="Risk summary statistics"
    )
