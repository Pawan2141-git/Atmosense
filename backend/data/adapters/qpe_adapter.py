"""
Satellite QPE (Quantitative Precipitation Estimation) Data Adapter

In DEMO mode: serves QPE and rainfall accumulation from the demo dataset.
In LIVE mode: would connect to satellite QPE products. NOT implemented in prototype.
"""
from datetime import timezone
from backend.data.adapters.base import BaseDataAdapter
from backend.data.adapters.demo_adapter import get_demo_data


class QPEAdapter(BaseDataAdapter):
    """Adapter for satellite-derived precipitation estimates."""

    VARIABLES = ["qpe", "rainfall_accumulation"]

    def get_name(self) -> str:
        return "Satellite QPE"

    def get_source_type(self) -> str:
        return "qpe_satellite"

    def get_data_mode(self) -> str:
        return "DEMO"

    def get_variables(self) -> list[str]:
        return self.VARIABLES

    def get_data(self, forecast_hour: int = 0) -> dict:
        demo = get_demo_data()
        snapshot = demo["snapshots"].get(forecast_hour, demo["snapshots"][0])
        valid_time = demo["base_time"].replace(tzinfo=timezone.utc)
        return {
            "source": "qpe_satellite",
            "mode": "DEMO",
            "timestamp": valid_time.isoformat(),
            "variables": self.VARIABLES,
            "lats": demo["lats"].tolist(),
            "lons": demo["lons"].tolist(),
            "data": {v: snapshot[v].tolist() for v in self.VARIABLES if v in snapshot},
        }

    def get_status(self) -> dict:
        return {
            "source": "qpe_satellite",
            "name": "Satellite QPE",
            "status": "operational",
            "data_mode": "DEMO",
            "description": "DEMO mode — serving synthetic precipitation estimates",
        }

    def get_provenance(self) -> dict:
        return {
            "source": "qpe_satellite",
            "data_mode": "DEMO",
            "spatial_resolution_km": 25.0,
            "temporal_resolution_min": 30,
            "processing_status": "feature_ready",
            "quality_status": "not_assessed",
            "note": "Prototype demo data. Not actual satellite QPE.",
        }
