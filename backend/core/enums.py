"""
Atmosense Core Enumerations
Domain enums used throughout the backend.
"""
from enum import Enum


class HazardType(str, Enum):
    """Types of severe weather hazards tracked by Atmosense."""
    THUNDERSTORM = "thunderstorm"
    CLOUDBURST = "cloudburst"
    FLASH_FLOOD = "flash_flood"


class RiskLevel(str, Enum):
    """Operational risk levels."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"
    CRITICAL = "critical"


class AlertSeverity(str, Enum):
    """Alert severity classification."""
    WATCH = "watch"
    WARNING = "warning"
    SEVERE = "severe"
    EXTREME = "extreme"


class DataMode(str, Enum):
    """Data source operating mode."""
    LIVE = "LIVE"
    DEMO = "DEMO"
    BACKTEST = "BACKTEST"


class DataSourceType(str, Enum):
    """Types of data sources."""
    INSAT_3D = "insat_3d"
    INSAT_3DR = "insat_3dr"
    IMDAA = "imdaa"
    QPE_SATELLITE = "qpe_satellite"
    DEM_CARTODEM = "dem_cartodem"
    DEM_SRTM = "dem_srtm"
    HISTORICAL_EVENTS = "historical_events"


class QualityStatus(str, Enum):
    """Data quality assessment status."""
    GOOD = "good"
    DEGRADED = "degraded"
    SUSPECT = "suspect"
    MISSING = "missing"
    NOT_ASSESSED = "not_assessed"


class PipelineStatus(str, Enum):
    """Data pipeline processing status."""
    RAW = "raw"
    INGESTED = "ingested"
    VALIDATED = "validated"
    QC_PASSED = "qc_passed"
    ALIGNED = "aligned"
    REPROJECTED = "reprojected"
    NORMALIZED = "normalized"
    FEATURE_READY = "feature_ready"
    ERROR = "error"


class ForecastHorizon(int, Enum):
    """Supported forecast lead times in hours."""
    H2 = 2
    H3 = 3
    H4 = 4
    H5 = 5
    H6 = 6
