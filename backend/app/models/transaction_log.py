from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

from app.database.connection import Base


class TransactionLog(Base):

    __tablename__ = "transaction_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    transaction_id = Column(
        String(50),
        ForeignKey("transactions.transaction_id"),
        nullable=False
    )

    action = Column(
        String(50),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False
    )

    message = Column(
        String(255)
    )

    performed_by = Column(
        String(100),
        default="System"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )