"""
Atmosense Prediction Schemas
Typed contracts for hazard predictions.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from backend.core.enums import HazardType, RiskLevel, DataMode


class FeatureContribution(BaseModel):
    """A single feature's contribution to a prediction."""
    feature_name: str = Field(..., description="Name of the atmospheric feature")
    value: float = Field(..., description="Current value of the feature")
    unit: str = Field(..., description="Physical unit")
    contribution: float = Field(..., description="Contribution score (0-1)")
    direction: str = Field(..., description="'increasing_risk' or 'decreasing_risk'")
    description: str = Field(..., description="Human-readable description")


class HazardPrediction(BaseModel):
    """A single hazard prediction for a grid cell or region."""
    hazard_type: HazardType
    probability: float = Field(..., ge=0.0, le=1.0, description="Predicted probability")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence")
    uncertainty: float = Field(..., ge=0.0, le=1.0, description="Prediction uncertainty")
    risk_level: RiskLevel
    forecast_hour: int = Field(..., ge=2, le=6, description="Forecast lead time in hours")
    valid_time: datetime = Field(..., description="Time the prediction is valid for")
    data_timestamp: datetime = Field(..., description="Timestamp of source data used")
    latitude: float
    longitude: float
    model_version: str
    data_mode: DataMode
    contributing_factors: list[FeatureContribution] = Field(
        default_factory=list,
        description="Features contributing to this prediction"
    )


class PredictionGridCell(BaseModel):
    """A single cell in the prediction grid."""
    lat: float
    lon: float
    thunderstorm_prob: float = Field(0.0, ge=0.0, le=1.0)
    cloudburst_prob: float = Field(0.0, ge=0.0, le=1.0)
    flash_flood_risk: float = Field(0.0, ge=0.0, le=1.0)
    thunderstorm_risk: RiskLevel = RiskLevel.LOW
    cloudburst_risk: RiskLevel = RiskLevel.LOW
    flash_flood_risk_level: RiskLevel = RiskLevel.LOW


class PredictionGrid(BaseModel):
    """Gridded predictions for a forecast horizon."""
    forecast_hour: int = Field(..., ge=2, le=6)
    valid_time: datetime
    data_timestamp: datetime
    model_version: str
    data_mode: DataMode
    grid_resolution_deg: float = 0.25
    cells: list[PredictionGridCell]
    bounding_box: dict = Field(
        default_factory=dict,
        description="{'north': float, 'south': float, 'east': float, 'west': float}"
    )


class PredictionResponse(BaseModel):
    """API response for predictions."""
    status: str = "ok"
    data_mode: DataMode
    model_version: str
    generated_at: datetime
    forecast_hours: list[int] = [2, 3, 4, 5, 6]
    grids: list[PredictionGrid]
    hazard_summary: dict = Field(
        default_factory=dict,
        description="Summary statistics per hazard type"
    )
