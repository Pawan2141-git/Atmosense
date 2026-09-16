"""
Dynamical Feature Engineering

Low-level convergence and vertical wind shear.
"""


def compute_dynamical_features(convergence: float, wind_shear: float) -> dict:
    """
    Process dynamical/forcing features.
    
    Args:
        convergence: Low-level convergence (s⁻¹). Negative = convergence.
        wind_shear: Vertical wind shear (m/s). Higher = more organized convection.
    
    Returns:
        dict with convergence, wind_shear, and normalized versions
    """
    # Normalize convergence: -5e-5 (strong convergence) → 1.0, 0 → 0.0
    conv_norm = min(1.0, max(0.0, -convergence / 5e-5))

    # Normalize wind shear: 0-35 m/s → 0-1
    shear_norm = min(1.0, max(0.0, wind_shear / 35.0))

    return {
        "convergence": convergence,
        "wind_shear": wind_shear,
        "convergence_normalized": conv_norm,
        "shear_normalized": shear_norm,
    }
