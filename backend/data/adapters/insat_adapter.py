"""
INSAT-3D / INSAT-3DR Data Adapter

In DEMO mode: serves satellite-derived fields (CTT, CTT drop rate, IWV)
from the demo dataset.

In LIVE mode: would connect to MOSDAC. NOT implemented in prototype.
"""
from datetime import timezone
from backend.data.adapters.base import BaseDataAdapter
from backend.data.adapters.demo_adapter import get_demo_data


class INSATAdapter(BaseDataAdapter):
    """Adapter for INSAT-3D/3DR satellite products."""

    VARIABLES = ["ctt", "ctt_drop_rate", "iwv"]

    def get_name(self) -> str:
        return "INSAT-3D/3DR"

    def get_source_type(self) -> str:
        return "insat_3d"

    def get_data_mode(self) -> str:
        return "DEMO"

    def get_variables(self) -> list[str]:
        return self.VARIABLES

    def get_data(self, forecast_hour: int = 0) -> dict:
        demo = get_demo_data()
        snapshot = demo["snapshots"].get(forecast_hour, demo["snapshots"][0])
        valid_time = demo["base_time"].replace(tzinfo=timezone.utc)
        return {
            "source": "insat_3d",
            "mode": "DEMO",
            "timestamp": valid_time.isoformat(),
            "variables": self.VARIABLES,
            "lats": demo["lats"].tolist(),
            "lons": demo["lons"].tolist(),
            "data": {v: snapshot[v].tolist() for v in self.VARIABLES if v in snapshot},
        }

    def get_status(self) -> dict:
        return {
            "source": "insat_3d",
            "name": "INSAT-3D/3DR",
            "status": "operational",
            "data_mode": "DEMO",
            "description": "DEMO mode — serving synthetic satellite-derived fields",
        }

    def get_provenance(self) -> dict:
        return {
            "source": "insat_3d",
            "data_mode": "DEMO",
            "spatial_resolution_km": 25.0,
            "temporal_resolution_min": 30,
            "processing_status": "feature_ready",
            "quality_status": "not_assessed",
            "note": "Prototype demo data. Not actual INSAT observations.",
        }
