from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.database.connection import Base


class TransactionHistory(Base):

    __tablename__ = "transaction_history"

    id = Column(Integer, primary_key=True, index=True)

    transaction_id = Column(String(50), nullable=False)

    stage = Column(String(100), nullable=False)

    description = Column(String(255))

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )