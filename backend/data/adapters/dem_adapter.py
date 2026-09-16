"""
DEM (Digital Elevation Model) Data Adapter

In DEMO mode: serves terrain fields (elevation, slope, drainage,
flow accumulation) from the demo dataset.

In LIVE mode: would read CartoDEM/SRTM rasters. NOT implemented in prototype.
"""
from backend.data.adapters.base import BaseDataAdapter
from backend.data.adapters.demo_adapter import get_demo_data


class DEMAdapter(BaseDataAdapter):
    """Adapter for DEM terrain products."""

    VARIABLES = ["elevation", "slope", "drainage", "flow_accumulation"]

    def get_name(self) -> str:
        return "DEM (CartoDEM/SRTM)"

    def get_source_type(self) -> str:
        return "dem_cartodem"

    def get_data_mode(self) -> str:
        return "DEMO"

    def get_variables(self) -> list[str]:
        return self.VARIABLES

    def get_data(self, forecast_hour: int = 0) -> dict:
        demo = get_demo_data()
        terrain = demo["terrain"]
        return {
            "source": "dem_cartodem",
            "mode": "DEMO",
            "timestamp": demo["base_time"].isoformat(),
            "variables": self.VARIABLES,
            "lats": demo["lats"].tolist(),
            "lons": demo["lons"].tolist(),
            "data": {v: terrain[v].tolist() for v in self.VARIABLES},
        }

    def get_status(self) -> dict:
        return {
            "source": "dem_cartodem",
            "name": "DEM (CartoDEM/SRTM)",
            "status": "operational",
            "data_mode": "DEMO",
            "description": "DEMO mode — serving synthetic terrain data based on Uttarakhand topography",
        }

    def get_provenance(self) -> dict:
        return {
            "source": "dem_cartodem",
            "data_mode": "DEMO",
            "spatial_resolution_km": 25.0,
            "processing_status": "feature_ready",
            "quality_status": "not_assessed",
            "note": "Prototype demo terrain. Not actual CartoDEM/SRTM DEM.",
        }
