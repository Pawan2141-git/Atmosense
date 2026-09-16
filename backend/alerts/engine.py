"""
Atmosense Alert Engine

Generates deterministic prototype alerts based on risk levels.
Maps operational RiskLevel (MODERATE, HIGH, CRITICAL) to AlertSeverity.
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, List

from backend.core.enums import HazardType, RiskLevel, AlertSeverity, DataMode
from backend.schemas.alert import Alert, AlertTarget

class AlertEngine:
    
    @staticmethod
    def _map_risk_to_severity(risk_level: RiskLevel) -> Optional[AlertSeverity]:
        """Map RiskLevel to AlertSeverity. LOW risk generates no alert."""
        mapping = {
            RiskLevel.LOW: None,
            RiskLevel.MODERATE: AlertSeverity.WATCH,
            RiskLevel.HIGH: AlertSeverity.WARNING,
            RiskLevel.CRITICAL: AlertSeverity.EXTREME
        }
        return mapping.get(risk_level)

    @staticmethod
    def _get_recommended_action(hazard_type: HazardType, severity: AlertSeverity) -> str:
        """Deterministic prototype recommendation based on hazard and severity."""
        if severity == AlertSeverity.WATCH:
            return "Monitor local weather updates and remain vigilant."
            
        actions = {
            HazardType.THUNDERSTORM: {
                AlertSeverity.WARNING: "Seek indoor shelter. Avoid open areas.",
                AlertSeverity.SEVERE: "Take immediate shelter. Secure loose outdoor objects.",
                AlertSeverity.EXTREME: "Take immediate shelter. Stay away from windows. Expect power outages."
            },
            HazardType.CLOUDBURST: {
                AlertSeverity.WARNING: "Prepare for heavy rainfall. Clear drainage paths.",
                AlertSeverity.SEVERE: "Move to higher ground if in low-lying areas.",
                AlertSeverity.EXTREME: "Immediate evacuation of vulnerable low-lying areas required."
            },
            HazardType.FLASH_FLOOD: {
                AlertSeverity.WARNING: "Stay away from river banks and streams.",
                AlertSeverity.SEVERE: "Move immediately to higher ground. Do not drive through flooded roads.",
                AlertSeverity.EXTREME: "Immediate evacuation required. Catastrophic flooding expected."
            }
        }
        return actions.get(hazard_type, {}).get(severity, "Follow instructions from local authorities.")

    @staticmethod
    def evaluate_alert(
        hazard_type: HazardType,
        risk_level: RiskLevel,
        probability: float,
        confidence: float,
        lat: float,
        lon: float,
        forecast_hour: int,
        triggering_factors: List[str],
        timestamp: datetime,
        region_name: str = "Demo Region",
        model_version: str = "0.1.0-prototype"
    ) -> Optional[Alert]:
        """
        Evaluate conditions and generate a simulated alert if warranted.
        Returns None if risk is LOW.
        """
        severity = AlertEngine._map_risk_to_severity(risk_level)
        if not severity:
            return None
            
        target = AlertTarget(
            region_name=region_name,
            region_type="custom",
            latitude=lat,
            longitude=lon
        )
        
        valid_from = timestamp + timedelta(hours=forecast_hour - 1)
        valid_until = timestamp + timedelta(hours=forecast_hour + 2)
        window = f"+{forecast_hour}H to +{forecast_hour+2}H"
        
        return Alert(
            alert_id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
            hazard_type=hazard_type,
            severity=severity,
            affected_region=target,
            probability=round(probability, 4),
            confidence=round(confidence, 4),
            lead_time_hours=float(forecast_hour),
            forecast_window=window,
            triggering_factors=triggering_factors,
            recommended_action=AlertEngine._get_recommended_action(hazard_type, severity),
            timestamp=timestamp,
            valid_from=valid_from,
            valid_until=valid_until,
            model_version=model_version,
            data_mode=DataMode.DEMO,
            is_simulated=True
        )
