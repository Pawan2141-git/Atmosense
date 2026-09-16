"""
Thermodynamic Feature Engineering

CAPE and CIN processing.
In prototype, demo data provides pre-computed values.
In production, these would be derived from vertical temperature/moisture profiles.
"""


def compute_thermo_features(cape: float, cin: float) -> dict:
    """
    Process thermodynamic instability features.
    
    Args:
        cape: Convective Available Potential Energy (J/kg), ≥ 0
        cin: Convective Inhibition (J/kg), ≤ 0
    
    Returns:
        dict with cape, cin, cape_normalized, cin_normalized
    """
    # Normalize CAPE: 0-4000 J/kg → 0-1
    cape_norm = min(1.0, max(0.0, cape / 4000.0))

    # Normalize CIN: 0 = no inhibition (dangerous), -200 = strong cap
    # Flip sign so higher value = less inhibition = more dangerous
    cin_norm = min(1.0, max(0.0, 1.0 + cin / 200.0))

    return {
        "cape": cape,
        "cin": cin,
        "cape_normalized": cape_norm,
        "cin_normalized": cin_norm,
    }
