"""
Moisture Feature Engineering

IWV, ΔIWV, IWV rate.
In the prototype, demo data already provides IWV and ΔIWV directly.
This module normalizes and passes through values, preserving the interface
for future live-data derivation (e.g., integrating specific humidity profiles).
"""


def compute_moisture_features(iwv: float, delta_iwv: float) -> dict:
    """
    Process moisture features from raw/demo values.
    
    Args:
        iwv: Integrated Water Vapor (kg/m²)
        delta_iwv: IWV change rate (kg/m²/hr)
    
    Returns:
        dict with iwv, delta_iwv, iwv_rate_normalized
    """
    # Normalize IWV rate to a 0-1 scale for model input
    # Using 10 kg/m²/hr as a reasonable normalization ceiling
    iwv_rate_norm = min(1.0, max(0.0, abs(delta_iwv) / 10.0))

    return {
        "iwv": iwv,
        "delta_iwv": delta_iwv,
        "iwv_rate_normalized": iwv_rate_norm,
    }
