from sqlalchemy.orm import Session
from backend.app.models.alert import Alert


def create_alert(
    db: Session,
    transaction_id: str,
    alert_type: str,
    message: str
):

    alert = Alert(
        transaction_id=transaction_id,
        alert_type=alert_type,
        message=message
    )

    db.add(alert)