from sqlalchemy.orm import Session
from app.models.transaction_log import TransactionLog


def create_transaction_log(
    db: Session,
    transaction_id: str,
    action: str,
    status: str,
    message: str,
    performed_by: str = "System"
):
    log = TransactionLog(
        transaction_id=transaction_id,
        action=action,
        status=status,
        message=message,
        performed_by=performed_by
    )

    db.add(log)

    return log