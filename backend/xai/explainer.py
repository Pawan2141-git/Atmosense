"""
Atmosense Explainable AI (XAI) Engine

Generates structured explanations for why a location is at risk using
actual available feature values.
"""
from datetime import datetime
from typing import Dict, List, Any
from backend.core.enums import HazardType, DataMode
from backend.schemas.xai import FeatureEvidence, MeteorologicalDiagnosis
from backend.core.constants import (
    IWV_HIGH, DELTA_IWV_SIGNIFICANT, CAPE_HIGH, CIN_LOW,
    CONVERGENCE_SIGNIFICANT, SHEAR_STRONG, CTT_COLD, CTT_DROP_RATE_RAPID,
    RAINFALL_HEAVY, SLOPE_STEEP
)

FEATURE_META = {
    "iwv": {"display": "Integrated Water Vapor", "unit": "kg/m²", "group": "moisture", "threshold": IWV_HIGH},
    "delta_iwv": {"display": "IWV Change Rate", "unit": "kg/m²/hr", "group": "moisture", "threshold": DELTA_IWV_SIGNIFICANT},
    "cape": {"display": "CAPE", "unit": "J/kg", "group": "instability", "threshold": CAPE_HIGH},
    "cin": {"display": "CIN", "unit": "J/kg", "group": "instability", "threshold": CIN_LOW},
    "convergence": {"display": "Low-level Convergence", "unit": "s⁻¹", "group": "dynamical", "threshold": CONVERGENCE_SIGNIFICANT},
    "wind_shear": {"display": "Vertical Wind Shear", "unit": "m/s", "group": "dynamical", "threshold": SHEAR_STRONG},
    "ctt": {"display": "Cloud Top Temperature", "unit": "K", "group": "satellite", "threshold": CTT_COLD},
    "ctt_drop_rate": {"display": "CTT Drop Rate", "unit": "K/hr", "group": "satellite", "threshold": CTT_DROP_RATE_RAPID},
    "qpe": {"display": "Rainfall Intensity (QPE)", "unit": "mm/hr", "group": "precipitation", "threshold": RAINFALL_HEAVY},
    "slope": {"display": "Terrain Slope", "unit": "°", "group": "terrain", "threshold": SLOPE_STEEP},
    "drainage": {"display": "Drainage Density", "unit": "0-1", "group": "terrain", "threshold": 0.5},
    "flow_accumulation": {"display": "Flow Accumulation", "unit": "0-1", "group": "terrain", "threshold": 0.7}
}

class XAIExplainer:
    
    @staticmethod
    def _is_significant(feature: str, value: float, threshold: float) -> bool:
        if feature in ["cin", "convergence", "ctt", "ctt_drop_rate"]:
            return value <= threshold
        return value >= threshold

    @staticmethod
    def _get_direction(feature: str, value: float) -> str:
        if feature in ["cin", "convergence", "ctt", "ctt_drop_rate"]:
            return "increasing_risk" if value < 0 else "decreasing_risk"
        return "increasing_risk" if value > 0 else "decreasing_risk"

    @staticmethod
    def _generate_narrative(feature: str, value: float, is_significant: bool) -> str:
        if not is_significant:
            return f"The {FEATURE_META[feature]['display']} is within normal limits."
            
        narratives = {
            "iwv": "High moisture content providing ample fuel for precipitation.",
            "delta_iwv": "Rapid moisture convergence indicating developing weather systems.",
            "cape": "Strong thermodynamic instability supporting intense updrafts.",
            "cin": "Weak convective inhibition allowing storms to initiate easily.",
            "convergence": "Strong low-level convergence forcing air upwards.",
            "wind_shear": "Significant wind shear organizing and sustaining convection.",
            "ctt": "Very cold cloud tops indicating deep, towering convective clouds.",
            "ctt_drop_rate": "Rapid cooling of cloud tops showing explosive storm development.",
            "qpe": "Heavy ongoing rainfall contributing to immediate threat.",
            "slope": "Steep terrain rapidly channeling runoff.",
            "drainage": "High drainage density accelerating water accumulation.",
            "flow_accumulation": "High flow accumulation area, prone to rapid flooding."
        }
        return narratives.get(feature, f"Significant values of {feature} detected.")

    @staticmethod
    def explain(
        lat: float,
        lon: float,
        timestamp: datetime,
        hazard_type: HazardType,
        features: Dict[str, float],
        contributions: List[Dict[str, Any]] = None,
        data_mode: DataMode = DataMode.DEMO
    ) -> MeteorologicalDiagnosis:
        """
        Generate a structured meteorological diagnosis based on actual feature values.
        """
        evidence_by_group = {
            "moisture": [],
            "instability": [],
            "dynamical": [],
            "satellite": [],
            "precipitation": [],
            "terrain": []
        }
        
        all_evidence = []
        significant_factors = []
        
        # We can map the contribution scores if provided
        contrib_map = {}
        if contributions:
            for c in contributions:
                # normalize feature names if they have '_normalized'
                base_feat = c["feature"].replace("_normalized", "").replace("ctt_cold", "ctt").replace("ctt_drop", "ctt_drop_rate").replace("shear", "wind_shear").replace("iwv_rate", "delta_iwv").replace("accumulation", "qpe")
                contrib_map[base_feat] = c.get("contribution", 0.0)

        for feat_name, meta in FEATURE_META.items():
            if feat_name in features:
                val = features[feat_name]
                is_sig = XAIExplainer._is_significant(feat_name, val, meta["threshold"])
                direction = XAIExplainer._get_direction(feat_name, val)
                
                # Prototype contribution logic if not strictly provided
                score = contrib_map.get(feat_name, 0.5 if is_sig else 0.1)
                
                evidence = FeatureEvidence(
                    feature_name=feat_name,
                    display_name=meta["display"],
                    value=round(val, 4),
                    unit=meta["unit"],
                    threshold=meta["threshold"],
                    is_significant=is_sig,
                    contribution_score=score,
                    direction=direction,
                    narrative=XAIExplainer._generate_narrative(feat_name, val, is_sig)
                )
                
                evidence_by_group[meta["group"]].append(evidence)
                all_evidence.append(evidence)
                if is_sig:
                    significant_factors.append(feat_name)
                    
        # Sort evidence by contribution score
        all_evidence.sort(key=lambda x: x.contribution_score, reverse=True)
        
        # Generate summary based on hazard type and top factors
        top_factors_names = [e.display_name for e in all_evidence[:3] if e.is_significant]
        if top_factors_names:
            factors_str = ", ".join(top_factors_names)
            summary = f"The primary drivers for this {hazard_type.value} risk are {factors_str}. "
        else:
            summary = f"No highly significant individual drivers were identified for this {hazard_type.value} risk. "
            
        summary += "The combination of atmospheric and terrain variables has been evaluated by the prototype deterministic model."

        confidence_narrative = (
            "High confidence derived from strong agreement across multiple "
            "independent meteorological variables." if len(significant_factors) >= 3 
            else "Moderate confidence due to limited presence of extreme atmospheric signatures."
        )

        return MeteorologicalDiagnosis(
            latitude=lat,
            longitude=lon,
            timestamp=timestamp,
            hazard_type=hazard_type,
            data_mode=data_mode,
            moisture_evidence=evidence_by_group["moisture"],
            instability_evidence=evidence_by_group["instability"],
            dynamical_evidence=evidence_by_group["dynamical"],
            satellite_evidence=evidence_by_group["satellite"],
            precipitation_evidence=evidence_by_group["precipitation"],
            terrain_evidence=evidence_by_group["terrain"],
            all_evidence=all_evidence,
            significant_factors=significant_factors,
            diagnosis_summary=summary,
            confidence_narrative=confidence_narrative
        )
