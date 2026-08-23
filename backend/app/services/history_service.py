from sqlalchemy.orm import Session
from backend.app.models.transaction_history import TransactionHistory


def create_history(
    db: Session,
    transaction_id: str,
    stage: str,
    description: str
):

    history = TransactionHistory(
        transaction_id=transaction_id,
        stage=stage,
        description=description
    )

    db.add(history)