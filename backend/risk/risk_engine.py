"""
Atmosense Risk Engine

Calculates operational risk separately from raw model probability.
Risk incorporates model confidence and contextual vulnerability.
"""
from backend.core.enums import HazardType, RiskLevel
from backend.core.constants import (
    THUNDERSTORM_THRESHOLDS,
    CLOUDBURST_THRESHOLDS,
    FLASH_FLOOD_THRESHOLDS
)

# Prototype Configurable Thresholds for Risk Matrix
# NOT official meteorological thresholds.
RISK_CONFIDENCE_WEIGHT = 0.2
RISK_PROBABILITY_WEIGHT = 0.8

class RiskEngine:
    @staticmethod
    def get_thresholds(hazard_type: HazardType) -> dict:
        if hazard_type == HazardType.THUNDERSTORM:
            return THUNDERSTORM_THRESHOLDS
        elif hazard_type == HazardType.CLOUDBURST:
            return CLOUDBURST_THRESHOLDS
        elif hazard_type == HazardType.FLASH_FLOOD:
            return FLASH_FLOOD_THRESHOLDS
        return THUNDERSTORM_THRESHOLDS

    @staticmethod
    def calculate_risk(
        hazard_type: HazardType, 
        probability: float, 
        confidence: float, 
        terrain_vulnerability: float = 0.0,
        rainfall_intensity: float = 0.0
    ) -> tuple[float, RiskLevel]:
        """
        Calculate deterministic operational risk score and level.
        
        Args:
            hazard_type: Type of hazard
            probability: Raw model probability (0-1)
            confidence: Model confidence (0-1)
            terrain_vulnerability: Optional contextual terrain vulnerability (0-1)
            rainfall_intensity: Optional contextual rainfall intensity
            
        Returns:
            Tuple of (risk_score, RiskLevel)
        """
        # Base risk score combines probability and confidence
        # A high probability with low confidence reduces the operational risk score
        risk_score = (probability * RISK_PROBABILITY_WEIGHT) + (probability * confidence * RISK_CONFIDENCE_WEIGHT)
        
        # Contextual modifiers
        if hazard_type == HazardType.FLASH_FLOOD:
            # Flash flood risk is highly dependent on terrain
            risk_score = 0.6 * risk_score + 0.4 * terrain_vulnerability
            
        elif hazard_type == HazardType.CLOUDBURST:
            # Cloudburst risk can be modulated if rainfall is already high
            if rainfall_intensity > 50.0:
                risk_score = min(1.0, risk_score + 0.1)

        # Cap score between 0 and 1
        risk_score = max(0.0, min(1.0, risk_score))
        
        thresholds = RiskEngine.get_thresholds(hazard_type)
        
        # Map to RiskLevel
        # Note: mapping 'CRITICAL' from prompt requirements to EXTREME in existing schema
        if risk_score >= thresholds.get("extreme", 0.85):
            risk_level = RiskLevel.CRITICAL
        elif risk_score >= thresholds.get("very_high", 0.75):
            risk_level = RiskLevel.VERY_HIGH
        elif risk_score >= thresholds.get("high", 0.6):
            risk_level = RiskLevel.HIGH
        elif risk_score >= thresholds.get("moderate", 0.4):
            risk_level = RiskLevel.MODERATE
        else:
            risk_level = RiskLevel.LOW
            
        return risk_score, risk_level
