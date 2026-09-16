"""
Terrain Feature Engineering

Elevation, slope, drainage density, flow accumulation.
These are static features that modulate flash-flood vulnerability.
"""


def compute_terrain_features(
    elevation: float, slope: float, drainage: float, flow_accumulation: float
) -> dict:
    """
    Process terrain features for flash-flood risk assessment.
    
    Args:
        elevation: DEM elevation (m)
        slope: Terrain slope (degrees)
        drainage: Drainage density (0-1 normalized)
        flow_accumulation: Flow accumulation (0-1 normalized)
    
    Returns:
        dict with raw and normalized terrain features, plus terrain vulnerability
    """
    # Normalize elevation: 0-7000m → 0-1
    elev_norm = min(1.0, max(0.0, elevation / 7000.0))

    # Normalize slope: 0-60° → 0-1
    slope_norm = min(1.0, max(0.0, slope / 60.0))

    # Terrain vulnerability: high slope + high drainage + high flow accum = vulnerable
    # Weighted combination
    terrain_vulnerability = (
        0.30 * slope_norm
        + 0.35 * drainage
        + 0.35 * flow_accumulation
    )
    terrain_vulnerability = min(1.0, max(0.0, terrain_vulnerability))

    return {
        "elevation": elevation,
        "slope": slope,
        "drainage": drainage,
        "flow_accumulation": flow_accumulation,
        "elevation_normalized": elev_norm,
        "slope_normalized": slope_norm,
        "terrain_vulnerability": terrain_vulnerability,
    }
