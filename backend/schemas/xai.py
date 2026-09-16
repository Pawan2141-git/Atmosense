"""
Atmosense XAI (Explainable AI) Schemas
Typed contracts for meteorological diagnosis and model explanations.
"""
from datetime import datetime
from pydantic import BaseModel, Field
from backend.core.enums import HazardType, DataMode


class FeatureEvidence(BaseModel):
    """Evidence from a single atmospheric feature."""
    feature_name: str
    display_name: str
    value: float
    unit: str
    threshold: float = Field(..., description="Reference threshold for significance")
    is_significant: bool
    contribution_score: float = Field(..., ge=0.0, le=1.0)
    direction: str = Field(..., description="'increasing_risk' or 'decreasing_risk'")
    narrative: str = Field(
        ...,
        description="Human-readable sentence explaining this feature's role"
    )


class MeteorologicalDiagnosis(BaseModel):
    """Complete meteorological diagnosis for a region/prediction."""
    latitude: float
    longitude: float
    timestamp: datetime
    hazard_type: HazardType
    data_mode: DataMode

    # Evidence from each feature group
    moisture_evidence: list[FeatureEvidence] = []
    instability_evidence: list[FeatureEvidence] = []
    dynamical_evidence: list[FeatureEvidence] = []
    satellite_evidence: list[FeatureEvidence] = []
    precipitation_evidence: list[FeatureEvidence] = []
    terrain_evidence: list[FeatureEvidence] = []

    # Overall
    all_evidence: list[FeatureEvidence] = []
    significant_factors: list[str] = Field(
        default_factory=list,
        description="Names of features that significantly contribute to risk"
    )
    diagnosis_summary: str = Field(
        ...,
        description="Multi-sentence meteorological explanation"
    )
    confidence_narrative: str = Field(
        "",
        description="Explanation of confidence/uncertainty"
    )



class XAIResponse(BaseModel):
    """API response for explainability queries."""
    status: str = "ok"
    data_mode: DataMode
    generated_at: datetime
    diagnosis: MeteorologicalDiagnosis
    disclaimer: str = Field(
        default="PROTOTYPE: Explanations are generated from prototype model features. "
        "They do not constitute official meteorological analysis.",
    )
