"""
Atmosense Atmospheric Feature Schemas
Typed contracts for atmospheric observations and derived features.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from backend.core.enums import DataSourceType, QualityStatus, DataMode, PipelineStatus


class DataProvenance(BaseModel):
    """Tracks the origin and processing status of data."""
    source: DataSourceType
    variable: str
    timestamp: datetime
    spatial_resolution_km: Optional[float] = None
    temporal_resolution_min: Optional[int] = None
    processing_status: PipelineStatus = PipelineStatus.RAW
    quality_status: QualityStatus = QualityStatus.NOT_ASSESSED
    data_mode: DataMode = DataMode.DEMO


class AtmosphericFeature(BaseModel):
    """A single atmospheric feature observation or derived value."""
    name: str = Field(..., description="Feature name (e.g. 'iwv', 'cape', 'ctt')")
    value: float
    unit: str
    latitude: float
    longitude: float
    timestamp: datetime
    provenance: DataProvenance
    is_derived: bool = Field(False, description="True if calculated from raw observations")
    derivation_method: Optional[str] = Field(
        None, description="Method used to derive this feature"
    )


class AtmosphericProfile(BaseModel):
    """Complete atmospheric profile for a location at a given time."""
    latitude: float
    longitude: float
    timestamp: datetime
    data_mode: DataMode

    # Moisture
    iwv: Optional[float] = Field(None, description="Integrated Water Vapor (kg/m²)")
    delta_iwv: Optional[float] = Field(None, description="IWV change rate (kg/m²/hr)")
    iwv_rate: Optional[float] = Field(None, description="IWV accumulation rate")

    # Thermodynamic instability
    cape: Optional[float] = Field(None, description="CAPE (J/kg)")
    cin: Optional[float] = Field(None, description="CIN (J/kg)")

    # Dynamical
    convergence: Optional[float] = Field(None, description="Low-level convergence (s⁻¹)")
    wind_shear: Optional[float] = Field(None, description="Vertical wind shear (m/s)")

    # Satellite convective
    ctt: Optional[float] = Field(None, description="Cloud Top Temperature (K)")
    ctt_drop_rate: Optional[float] = Field(None, description="CTT change rate (K/hr)")

    # Precipitation
    qpe: Optional[float] = Field(None, description="Quantitative Precipitation Estimate (mm/hr)")
    rainfall_accumulation: Optional[float] = Field(
        None, description="Accumulated rainfall (mm)"
    )
    rainfall_rate: Optional[float] = Field(None, description="Rainfall rate (mm/hr)")

    # Terrain
    elevation: Optional[float] = Field(None, description="DEM elevation (m)")
    slope: Optional[float] = Field(None, description="Terrain slope (degrees)")
    drainage_density: Optional[float] = Field(
        None, description="Drainage density (normalized 0-1)"
    )
    flow_accumulation: Optional[float] = Field(
        None, description="Flow accumulation (normalized 0-1)"
    )


class AtmosphericGridResponse(BaseModel):
    """API response for atmospheric feature grids."""
    status: str = "ok"
    data_mode: DataMode
    timestamp: datetime
    feature_name: str
    unit: str
    grid: list[dict] = Field(
        default_factory=list,
        description="List of {lat, lon, value} dicts"
    )
    provenance: DataProvenance


class DataSourceStatus(BaseModel):
    """Status of a data source."""
    source: DataSourceType
    name: str
    status: str = "operational"
    data_mode: DataMode
    last_update: Optional[datetime] = None
    record_count: int = 0
    quality: QualityStatus = QualityStatus.NOT_ASSESSED
    description: str = ""
