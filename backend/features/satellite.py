"""
Satellite Convective Feature Engineering

Cloud Top Temperature and CTT drop rate.
"""


def compute_satellite_features(ctt: float, ctt_drop_rate: float) -> dict:
    """
    Process satellite convective indicators.
    
    Args:
        ctt: Cloud Top Temperature (K). Colder = deeper convection.
        ctt_drop_rate: CTT change rate (K/hr). Negative = rapid cooling.
    
    Returns:
        dict with ctt, ctt_drop_rate, and normalized versions
    """
    # Normalize CTT: 210K (very cold, deep convection) → 1.0, 280K → 0.0
    ctt_norm = min(1.0, max(0.0, (280.0 - ctt) / 70.0))

    # Normalize CTT drop rate: -15 K/hr → 1.0, 0 → 0.0
    drop_norm = min(1.0, max(0.0, -ctt_drop_rate / 15.0))

    return {
        "ctt": ctt,
        "ctt_drop_rate": ctt_drop_rate,
        "ctt_cold_normalized": ctt_norm,
        "ctt_drop_normalized": drop_norm,
    }
