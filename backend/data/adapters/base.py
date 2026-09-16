"""
Atmosense Base Data Adapter

Abstract interface that all data source adapters must implement.
Downstream consumers depend on this interface, never on raw data formats.
"""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any


class BaseDataAdapter(ABC):
    """Abstract base for all Atmosense data adapters."""

    @abstractmethod
    def get_name(self) -> str:
        """Human-readable name of the data source."""

    @abstractmethod
    def get_source_type(self) -> str:
        """Data source type identifier."""

    @abstractmethod
    def get_data_mode(self) -> str:
        """Current data mode: LIVE, DEMO, or BACKTEST."""

    @abstractmethod
    def get_variables(self) -> list[str]:
        """List of variable names this adapter provides."""

    @abstractmethod
    def get_data(self, forecast_hour: int = 0) -> dict:
        """
        Fetch data for the given forecast hour.
        
        Returns dict with at minimum:
            - source: str
            - mode: str
            - timestamp: str (ISO format)
            - variables: list[str]
            - lats: list[float]
            - lons: list[float]
            - data: dict[str, 2D list]
        """

    @abstractmethod
    def get_status(self) -> dict:
        """Return operational status of this adapter."""

    @abstractmethod
    def get_provenance(self) -> dict:
        """Return data provenance metadata."""
