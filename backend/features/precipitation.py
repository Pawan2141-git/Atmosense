"""
Precipitation Feature Engineering

QPE intensity, rainfall accumulation, rainfall rate.
"""


def compute_precip_features(qpe: float, rainfall_accumulation: float) -> dict:
    """
    Process precipitation features.
    
    Args:
        qpe: Quantitative Precipitation Estimate / rainfall intensity (mm/hr)
        rainfall_accumulation: Accumulated rainfall (mm)
    
    Returns:
        dict with qpe, rainfall_accumulation, and normalized versions
    """
    # Normalize QPE: 0-120 mm/hr → 0-1
    qpe_norm = min(1.0, max(0.0, qpe / 120.0))

    # Normalize accumulation: 0-200 mm → 0-1
    accum_norm = min(1.0, max(0.0, rainfall_accumulation / 200.0))

    return {
        "qpe": qpe,
        "rainfall_accumulation": rainfall_accumulation,
        "qpe_normalized": qpe_norm,
        "accumulation_normalized": accum_norm,
    }
