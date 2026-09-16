"""
Atmosense Flash Flood Risk Engine

Calculates terrain-aware flash-flood risk by combining cloudburst probability,
QPE (rainfall intensity), rainfall accumulation, and terrain factors (elevation, slope,
drainage, flow accumulation).

PROTOTYPE DISCLAIMER: This is a deterministic risk scoring model based on 
meteorological and terrain heuristics. It does NOT perform hydrodynamic flood simulation.
"""
from backend.core.enums import HazardType
from backend.risk.risk_engine import RiskEngine
from backend.schemas.risk import FlashFloodRisk, FlashFloodRiskFactors

class FlashFloodEngine:
    @staticmethod
    def calculate_flash_flood_risk(
        lat: float,
        lon: float,
        cloudburst_probability: float,
        rainfall_intensity: float,
        rainfall_accumulation: float,
        elevation: float,
        slope: float,
        drainage: float,
        flow_accumulation: float,
        model_confidence: float = 0.8
    ) -> FlashFloodRisk:
        """
        Calculate deterministic terrain-aware flash-flood risk score and risk level.
        """
        # Terrain vulnerability (0-1)
        # Steep slope and high flow accumulation increase vulnerability
        slope_norm = min(1.0, max(0.0, slope / 60.0))
        terrain_vulnerability = (0.3 * slope_norm) + (0.3 * drainage) + (0.4 * flow_accumulation)
        terrain_vulnerability = min(1.0, max(0.0, terrain_vulnerability))

        # Precipitation threat (0-1)
        # High intensity or high accumulation increases threat
        intensity_norm = min(1.0, max(0.0, rainfall_intensity / 100.0))
        accum_norm = min(1.0, max(0.0, rainfall_accumulation / 200.0))
        
        precipitation_threat = (0.5 * cloudburst_probability) + (0.3 * intensity_norm) + (0.2 * accum_norm)
        precipitation_threat = min(1.0, max(0.0, precipitation_threat))

        # Combined risk score (0-1)
        # Both terrain and precipitation must be significant for high flash flood risk
        combined_risk = (0.6 * precipitation_threat) + (0.4 * terrain_vulnerability)
        combined_risk = min(1.0, max(0.0, combined_risk))

        # Use RiskEngine to map combined risk to operational RiskLevel
        risk_score, risk_level = RiskEngine.calculate_risk(
            hazard_type=HazardType.FLASH_FLOOD,
            probability=combined_risk,
            confidence=model_confidence,
            terrain_vulnerability=terrain_vulnerability,
            rainfall_intensity=rainfall_intensity
        )

        factors = FlashFloodRiskFactors(
            cloudburst_probability=cloudburst_probability,
            rainfall_intensity_mm_hr=rainfall_intensity,
            rainfall_accumulation_mm=rainfall_accumulation,
            elevation_m=elevation,
            slope_degrees=slope,
            drainage_density=drainage,
            flow_accumulation=flow_accumulation
        )

        return FlashFloodRisk(
            latitude=lat,
            longitude=lon,
            risk_score=risk_score,
            risk_level=risk_level,
            factors=factors,
            terrain_vulnerability=terrain_vulnerability,
            precipitation_threat=precipitation_threat,
            combined_risk=combined_risk
        )
