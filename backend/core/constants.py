"""
Atmosense Scientific Constants and Configurable Thresholds

IMPORTANT: These thresholds are PROTOTYPE values for demonstration.
They are NOT official meteorological thresholds from IMD or any
operational forecasting agency. They must be clearly documented
as configurable prototype defaults.
"""

# ============================================================
# Physical Constants
# ============================================================
GRAVITY = 9.80665  # m/s^2
R_DRY = 287.058  # J/(kg·K) - specific gas constant for dry air
R_VAPOR = 461.5  # J/(kg·K) - specific gas constant for water vapor
CP_DRY = 1004.0  # J/(kg·K) - specific heat of dry air at constant pressure
LAPSE_RATE_DRY = 0.0098  # K/m - dry adiabatic lapse rate
EARTH_RADIUS_KM = 6371.0

# ============================================================
# Prototype Risk Thresholds
# ============================================================
# These are configurable prototype defaults.
# NOT official meteorological thresholds.

# --- Thunderstorm probability thresholds ---
THUNDERSTORM_THRESHOLDS = {
    "low": 0.2,
    "moderate": 0.4,
    "high": 0.6,
    "very_high": 0.8,
    "extreme": 0.9,
}

# --- Cloudburst probability thresholds ---
CLOUDBURST_THRESHOLDS = {
    "low": 0.15,
    "moderate": 0.35,
    "high": 0.55,
    "very_high": 0.75,
    "extreme": 0.85,
}

# --- Flash flood risk thresholds ---
FLASH_FLOOD_THRESHOLDS = {
    "low": 0.2,
    "moderate": 0.4,
    "high": 0.6,
    "very_high": 0.75,
    "extreme": 0.85,
}

# ============================================================
# Atmospheric Feature Thresholds (Prototype)
# ============================================================

# IWV thresholds (kg/m²)
IWV_ELEVATED = 45.0  # Elevated moisture
IWV_HIGH = 55.0  # High moisture loading
IWV_EXTREME = 65.0  # Extreme moisture loading

# ΔIWV threshold (kg/m² per hour) - rapid moisture increase
DELTA_IWV_SIGNIFICANT = 5.0  # Significant increase rate

# CAPE thresholds (J/kg)
CAPE_MODERATE = 1000.0
CAPE_HIGH = 2500.0
CAPE_EXTREME = 4000.0

# CIN threshold (J/kg) - low CIN means less inhibition
CIN_LOW = -50.0  # Weak cap
CIN_VERY_LOW = -25.0  # Very weak cap, convection likely

# CTT thresholds (K)
CTT_COLD = 230.0  # Cold cloud tops
CTT_VERY_COLD = 215.0  # Very cold, deep convection

# CTT drop rate threshold (K/hour)
CTT_DROP_RATE_RAPID = -10.0  # Rapid cooling

# Convergence threshold (s⁻¹)
CONVERGENCE_SIGNIFICANT = -2e-5  # Significant low-level convergence

# Wind shear threshold (m/s per km)
SHEAR_MODERATE = 15.0
SHEAR_STRONG = 25.0

# Rainfall intensity thresholds (mm/hr)
RAINFALL_MODERATE = 15.0
RAINFALL_HEAVY = 35.0
RAINFALL_VERY_HEAVY = 65.0
RAINFALL_EXTREMELY_HEAVY = 125.0  # IMD classification
RAINFALL_CLOUDBURST = 100.0  # 100mm/hr threshold for cloudburst

# Slope thresholds (degrees)
SLOPE_MODERATE = 10.0
SLOPE_STEEP = 25.0
SLOPE_VERY_STEEP = 40.0

# Flow accumulation thresholds (relative)
FLOW_ACCUMULATION_HIGH = 0.7
FLOW_ACCUMULATION_VERY_HIGH = 0.9

# ============================================================
# Spatial Configuration
# ============================================================

# India bounding box
INDIA_BOUNDS = {
    "north": 37.1,
    "south": 6.5,
    "east": 97.4,
    "west": 68.1,
}

# Default map center (India centroid)
DEFAULT_MAP_CENTER = {"lat": 22.0, "lon": 78.0}
DEFAULT_MAP_ZOOM = 5

# Demo region: Uttarakhand (Himalayan foothills - ideal for flash flood demo)
DEMO_REGION = {
    "name": "Uttarakhand",
    "center": {"lat": 30.3165, "lon": 78.0322},
    "bounds": {
        "north": 31.5,
        "south": 29.0,
        "east": 81.0,
        "west": 77.5,
    },
    "zoom": 8,
}

# Grid resolution for predictions (degrees)
PREDICTION_GRID_RESOLUTION = 0.25  # ~25km

# ============================================================
# Model Configuration
# ============================================================
MODEL_INPUT_FEATURES = 16  # Number of input features
MODEL_FORECAST_HOURS = [2, 3, 4, 5, 6]
MODEL_VERSION = "0.1.0-prototype"
