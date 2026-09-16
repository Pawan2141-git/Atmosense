"""
IMDAA Reanalysis Data Adapter

In DEMO mode: serves reanalysis-derived fields (CAPE, CIN, convergence,
wind shear) from the demo dataset.

In LIVE mode: would connect to IMDAA data services. NOT implemented in prototype.
"""
from datetime import timezone
from backend.data.adapters.base import BaseDataAdapter
from backend.data.adapters.demo_adapter import get_demo_data


class IMDAAAdapter(BaseDataAdapter):
    """Adapter for IMDAA reanalysis products."""

    VARIABLES = ["cape", "cin", "convergence", "wind_shear"]

    def get_name(self) -> str:
        return "IMDAA Reanalysis"

    def get_source_type(self) -> str:
        return "imdaa"

    def get_data_mode(self) -> str:
        return "DEMO"

    def get_variables(self) -> list[str]:
        return self.VARIABLES

    def get_data(self, forecast_hour: int = 0) -> dict:
        demo = get_demo_data()
        snapshot = demo["snapshots"].get(forecast_hour, demo["snapshots"][0])
        valid_time = demo["base_time"].replace(tzinfo=timezone.utc)
        return {
            "source": "imdaa",
            "mode": "DEMO",
            "timestamp": valid_time.isoformat(),
            "variables": self.VARIABLES,
            "lats": demo["lats"].tolist(),
            "lons": demo["lons"].tolist(),
            "data": {v: snapshot[v].tolist() for v in self.VARIABLES if v in snapshot},
        }

    def get_status(self) -> dict:
        return {
            "source": "imdaa",
            "name": "IMDAA Reanalysis",
            "status": "operational",
            "data_mode": "DEMO",
            "description": "DEMO mode — serving synthetic reanalysis-derived fields",
        }

    def get_provenance(self) -> dict:
        return {
            "source": "imdaa",
            "data_mode": "DEMO",
            "spatial_resolution_km": 12.0,
            "temporal_resolution_min": 180,
            "processing_status": "feature_ready",
            "quality_status": "not_assessed",
            "note": "Prototype demo data. Not actual IMDAA reanalysis.",
        }
