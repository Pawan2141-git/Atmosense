"""
Atmosense Alert Notification Handlers

Handles delivery of alerts to configured channels.
Currently restricted to DEMO/SIMULATED mode. Real SMS/Email delivery is disabled.
"""
from backend.schemas.alert import Alert

class DashboardNotifier:
    """Delivers alerts to the real-time dashboard via WebSockets or polling (mocked for demo)."""
    @staticmethod
    def send(alert: Alert) -> bool:
        # In a real system, this would push to a Redis pub/sub channel or similar
        return True

class SMSNotifier:
    """Mock SMS notification delivery."""
    @staticmethod
    def send(alert: Alert, phone_numbers: list[str]) -> bool:
        if not alert.is_simulated:
            raise NotImplementedError("Real SMS delivery is not implemented in prototype.")
        # Log delivery for demo purposes
        return True

class EmailNotifier:
    """Mock Email notification delivery."""
    @staticmethod
    def send(alert: Alert, email_addresses: list[str]) -> bool:
        if not alert.is_simulated:
            raise NotImplementedError("Real Email delivery is not implemented in prototype.")
        # Log delivery for demo purposes
        return True
