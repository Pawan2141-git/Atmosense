"""
Atmosense Feature Engineering Engine

Orchestrates feature extraction from data adapters, producing
AtmosphericProfile objects for each grid cell.
"""
from datetime import datetime, timezone, timedelta
from backend.data.adapters.demo_adapter import get_demo_data, LATS, LONS, FORECAST_HOURS
from backend.features.moisture import compute_moisture_features
from backend.features.thermodynamic import compute_thermo_features
from backend.features.dynamical import compute_dynamical_features
from backend.features.satellite import compute_satellite_features
from backend.features.precipitation import compute_precip_features
from backend.features.terrain import compute_terrain_features


# Feature metadata registry
FEATURE_REGISTRY = {
    "iwv":          {"unit": "kg/m²",   "display": "Integrated Water Vapor", "group": "moisture"},
    "delta_iwv":    {"unit": "kg/m²/hr","display": "IWV Change Rate",        "group": "moisture"},
    "cape":         {"unit": "J/kg",    "display": "CAPE",                   "group": "instability"},
    "cin":          {"unit": "J/kg",    "display": "CIN",                    "group": "instability"},
    "convergence":  {"unit": "s⁻¹",    "display": "Low-level Convergence",  "group": "dynamical"},
    "wind_shear":   {"unit": "m/s",     "display": "Vertical Wind Shear",   "group": "dynamical"},
    "ctt":          {"unit": "K",       "display": "Cloud Top Temperature",  "group": "satellite"},
    "ctt_drop_rate":{"unit": "K/hr",    "display": "CTT Drop Rate",         "group": "satellite"},
    "qpe":          {"unit": "mm/hr",   "display": "QPE Rainfall Intensity", "group": "precipitation"},
    "rainfall_accumulation": {"unit": "mm", "display": "Rainfall Accumulation", "group": "precipitation"},
    "elevation":    {"unit": "m",       "display": "Elevation",              "group": "terrain"},
    "slope":        {"unit": "°",       "display": "Slope",                  "group": "terrain"},
    "drainage":     {"unit": "0-1",     "display": "Drainage Density",       "group": "terrain"},
    "flow_accumulation": {"unit": "0-1","display": "Flow Accumulation",      "group": "terrain"},
}


def get_feature_vector_from_dataset(dataset: dict, lat_idx: int, lon_idx: int, forecast_hour: int) -> dict:
    """
    Extract a complete feature vector for one grid cell from an arbitrary dataset dictionary.
    
    Returns dict: {feature_name: float_value, ...} with all 14 features.
    """
    snapshot = dataset["snapshots"].get(forecast_hour, dataset["snapshots"][0])
    terrain = dataset["terrain"]

    atmo = {}
    for key in ["iwv", "delta_iwv", "cape", "cin", "convergence",
                "wind_shear", "ctt", "ctt_drop_rate", "qpe", "rainfall_accumulation"]:
        atmo[key] = float(snapshot[key][lat_idx, lon_idx])

    terr = {}
    for key in ["elevation", "slope", "drainage", "flow_accumulation"]:
        terr[key] = float(terrain[key][lat_idx, lon_idx])

    # Apply lightweight feature transforms
    moisture = compute_moisture_features(atmo["iwv"], atmo["delta_iwv"])
    thermo = compute_thermo_features(atmo["cape"], atmo["cin"])
    dyn = compute_dynamical_features(atmo["convergence"], atmo["wind_shear"])
    sat = compute_satellite_features(atmo["ctt"], atmo["ctt_drop_rate"])
    precip = compute_precip_features(atmo["qpe"], atmo["rainfall_accumulation"])
    terr_feat = compute_terrain_features(
        terr["elevation"], terr["slope"], terr["drainage"], terr["flow_accumulation"]
    )

    # Merge all into a single feature dict
    features = {}
    features.update(moisture)
    features.update(thermo)
    features.update(dyn)
    features.update(sat)
    features.update(precip)
    features.update(terr_feat)
    return features


def get_feature_vector(lat_idx: int, lon_idx: int, forecast_hour: int) -> dict:
    """
    Extract a complete feature vector for one grid cell at one forecast hour.
    
    Returns dict: {feature_name: float_value, ...} with all 14 features.
    """
    demo = get_demo_data()
    return get_feature_vector_from_dataset(demo, lat_idx, lon_idx, forecast_hour)


def get_grid_features(forecast_hour: int) -> list[dict]:
    """
    Get feature vectors for every grid cell at the given forecast hour.
    
    Returns list of dicts, each with lat, lon, and all feature values.
    """
    demo = get_demo_data()
    lats = demo["lats"]
    lons = demo["lons"]
    results = []
    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):
            fv = get_feature_vector(i, j, forecast_hour)
            fv["lat"] = float(lat)
            fv["lon"] = float(lon)
            results.append(fv)
    return results


def get_feature_grid(feature_name: str, forecast_hour: int) -> dict:
    """
    Get a single feature as a 2D grid.
    
    Returns: {lats, lons, values (2D list), unit, display_name}
    """
    demo = get_demo_data()
    meta = FEATURE_REGISTRY.get(feature_name, {"unit": "?", "display": feature_name, "group": "unknown"})

    if feature_name in demo["terrain"]:
        values = demo["terrain"][feature_name].tolist()
    else:
        snapshot = demo["snapshots"].get(forecast_hour, demo["snapshots"][0])
        if feature_name in snapshot:
            values = snapshot[feature_name].tolist()
        else:
            return {"error": f"Unknown feature: {feature_name}"}

    return {
        "feature_name": feature_name,
        "display_name": meta["display"],
        "unit": meta["unit"],
        "group": meta["group"],
        "forecast_hour": forecast_hour,
        "lats": demo["lats"].tolist(),
        "lons": demo["lons"].tolist(),
        "values": values,
        "data_mode": "DEMO",
    }
