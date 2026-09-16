"""
Historical Event Data Adapter

Provides a small catalogue of notable severe weather events in India
for demonstration, replay, and contextual reference.

DATA MODE: DEMO — event records are from public reporting; they are not
being loaded from a verified operational database.
"""
from backend.data.adapters.base import BaseDataAdapter


HISTORICAL_EVENTS = [
    {
        "event_id": "kedarnath_2013",
        "name": "Kedarnath Cloudburst & Flash Floods",
        "date": "2013-06-16",
        "region": "Kedarnath, Uttarakhand",
        "lat": 30.7352,
        "lon": 79.0669,
        "hazard_types": ["cloudburst", "flash_flood"],
        "max_rainfall_mm": 325,
        "description": (
            "Extremely heavy rainfall triggered catastrophic flash floods "
            "and landslides in the Mandakini valley. One of India's worst "
            "natural disasters."
        ),
        "data_mode": "DEMO",
    },
    {
        "event_id": "mumbai_2005",
        "name": "Mumbai Deluge",
        "date": "2005-07-26",
        "region": "Mumbai, Maharashtra",
        "lat": 19.0760,
        "lon": 72.8777,
        "hazard_types": ["cloudburst", "flash_flood"],
        "max_rainfall_mm": 944,
        "description": (
            "944 mm rainfall recorded in 24 hours at Santa Cruz, "
            "causing widespread urban flooding across Mumbai."
        ),
        "data_mode": "DEMO",
    },
    {
        "event_id": "chennai_2015",
        "name": "Chennai Floods",
        "date": "2015-12-01",
        "region": "Chennai, Tamil Nadu",
        "lat": 13.0827,
        "lon": 80.2707,
        "hazard_types": ["flash_flood"],
        "max_rainfall_mm": 494,
        "description": (
            "Extreme rainfall over several days caused severe flooding "
            "in Chennai and surrounding districts."
        ),
        "data_mode": "DEMO",
    },
    {
        "event_id": "uttarakhand_2023",
        "name": "Uttarakhand Flash Floods 2023",
        "date": "2023-10-04",
        "region": "Sikkim-Uttarakhand",
        "lat": 30.35,
        "lon": 78.50,
        "hazard_types": ["cloudburst", "flash_flood"],
        "max_rainfall_mm": 200,
        "description": (
            "Glacial lake outburst and heavy rainfall triggered flash floods "
            "in multiple Himalayan valleys."
        ),
        "data_mode": "DEMO",
    },
]


class HistoricalEventAdapter(BaseDataAdapter):
    """Adapter for historical severe weather event records."""

    def get_name(self) -> str:
        return "Historical Events"

    def get_source_type(self) -> str:
        return "historical_events"

    def get_data_mode(self) -> str:
        return "DEMO"

    def get_variables(self) -> list[str]:
        return ["event_records"]

    def get_data(self, forecast_hour: int = 0) -> dict:
        return {
            "source": "historical_events",
            "mode": "DEMO",
            "timestamp": "static",
            "variables": ["event_records"],
            "events": HISTORICAL_EVENTS,
        }

    def get_status(self) -> dict:
        return {
            "source": "historical_events",
            "name": "Historical Events",
            "status": "operational",
            "data_mode": "DEMO",
            "record_count": len(HISTORICAL_EVENTS),
            "description": "Historical event catalogue for demonstration",
        }

    def get_provenance(self) -> dict:
        return {
            "source": "historical_events",
            "data_mode": "DEMO",
            "note": "Event records compiled from public reporting. Not a verified operational database.",
        }
