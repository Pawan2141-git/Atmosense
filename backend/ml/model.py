"""
Atmosense Multi-Task Prototype Prediction Model

A deterministic, feature-based probabilistic model that computes
hazard probabilities from atmospheric feature vectors.

PROTOTYPE MODEL — NOT a production Transformer.
This uses weighted sigmoid scoring of normalized features.
The weights are hand-tuned prototypes, NOT trained on data.

Model version: 0.1.0-prototype
"""
import math

MODEL_VERSION = "0.1.0-prototype"

# ============================================================
# Feature weights for each hazard head
# These are PROTOTYPE weights, NOT learned from training data.
# They encode basic meteorological reasoning:
#   - Thunderstorm: CAPE + convergence + wind shear + CTT cooling
#   - Cloudburst: IWV + ΔIWV + QPE + CTT cooling + convergence
#   - Flash flood: QPE + accumulation + terrain vulnerability + cloudburst signal
# ============================================================

THUNDERSTORM_WEIGHTS = {
    "cape_normalized":        0.28,
    "cin_normalized":         0.10,
    "convergence_normalized": 0.20,
    "shear_normalized":       0.15,
    "ctt_cold_normalized":    0.12,
    "ctt_drop_normalized":    0.10,
    "iwv_rate_normalized":    0.05,
}

CLOUDBURST_WEIGHTS = {
    "iwv_rate_normalized":      0.15,
    "cape_normalized":          0.12,
    "cin_normalized":           0.08,
    "convergence_normalized":   0.18,
    "ctt_drop_normalized":      0.17,
    "ctt_cold_normalized":      0.10,
    "qpe_normalized":           0.12,
    "accumulation_normalized":  0.08,
}

FLASH_FLOOD_WEIGHTS = {
    "qpe_normalized":           0.18,
    "accumulation_normalized":  0.15,
    "terrain_vulnerability":    0.25,
    "convergence_normalized":   0.10,
    "ctt_drop_normalized":      0.08,
    "iwv_rate_normalized":      0.08,
    "cape_normalized":          0.08,
    "slope_normalized":         0.08,
}


def _sigmoid(x: float) -> float:
    """Standard sigmoid function."""
    return 1.0 / (1.0 + math.exp(-x))


def _weighted_score(features: dict, weights: dict) -> float:
    """Compute weighted sum of features using the given weight dict."""
    score = 0.0
    total_weight = 0.0
    for feat_name, weight in weights.items():
        if feat_name in features:
            score += weight * features[feat_name]
            total_weight += weight
    if total_weight > 0:
        score /= total_weight
    return score


def predict_hazards(features: dict) -> dict:
    """
    Predict thunderstorm, cloudburst, and flash-flood probabilities
    from a feature vector.
    
    Args:
        features: dict with normalized feature values from the feature engine
    
    Returns:
        dict with probability, confidence, uncertainty for each hazard
    """
    # Compute raw scores (0-1 range from normalized features)
    ts_raw = _weighted_score(features, THUNDERSTORM_WEIGHTS)
    cb_raw = _weighted_score(features, CLOUDBURST_WEIGHTS)
    ff_raw = _weighted_score(features, FLASH_FLOOD_WEIGHTS)

    # Apply sigmoid transform centered at 0.35 with steepness 8
    # This maps the 0-1 feature score to a calibrated probability
    # score < 0.35 → low probability, score > 0.35 → increasing probability
    ts_prob = _sigmoid((ts_raw - 0.35) * 8)
    cb_prob = _sigmoid((cb_raw - 0.35) * 8)
    ff_prob = _sigmoid((ff_raw - 0.35) * 8)

    # Confidence: higher when more features are available and agree
    # Simple heuristic: confidence proportional to feature coverage
    def _confidence(weights, features):
        available = sum(1 for k in weights if k in features)
        return min(1.0, available / len(weights))

    ts_conf = _confidence(THUNDERSTORM_WEIGHTS, features)
    cb_conf = _confidence(CLOUDBURST_WEIGHTS, features)
    ff_conf = _confidence(FLASH_FLOOD_WEIGHTS, features)

    # Uncertainty: inverse of confidence, bounded
    ts_unc = max(0.05, 1.0 - ts_conf * 0.8)
    cb_unc = max(0.05, 1.0 - cb_conf * 0.8)
    ff_unc = max(0.05, 1.0 - ff_conf * 0.8)

    return {
        "thunderstorm": {
            "probability": round(ts_prob, 4),
            "confidence": round(ts_conf, 4),
            "uncertainty": round(ts_unc, 4),
            "raw_score": round(ts_raw, 4),
        },
        "cloudburst": {
            "probability": round(cb_prob, 4),
            "confidence": round(cb_conf, 4),
            "uncertainty": round(cb_unc, 4),
            "raw_score": round(cb_raw, 4),
        },
        "flash_flood": {
            "probability": round(ff_prob, 4),
            "confidence": round(ff_conf, 4),
            "uncertainty": round(ff_unc, 4),
            "raw_score": round(ff_raw, 4),
        },
        "model_version": MODEL_VERSION,
    }


def get_feature_contributions(features: dict, hazard: str) -> list[dict]:
    """
    Get the contribution of each feature to a specific hazard prediction.
    
    Returns list of {feature, value, weight, contribution, direction}.
    """
    weight_map = {
        "thunderstorm": THUNDERSTORM_WEIGHTS,
        "cloudburst": CLOUDBURST_WEIGHTS,
        "flash_flood": FLASH_FLOOD_WEIGHTS,
    }
    weights = weight_map.get(hazard, {})
    contributions = []
    for feat_name, weight in sorted(weights.items(), key=lambda x: -x[1]):
        value = features.get(feat_name, 0.0)
        contrib = weight * value
        contributions.append({
            "feature": feat_name,
            "value": round(value, 4),
            "weight": round(weight, 4),
            "contribution": round(contrib, 4),
            "direction": "increasing_risk" if value > 0.3 else "decreasing_risk",
        })
    return contributions
