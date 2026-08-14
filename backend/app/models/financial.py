from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

from app.database.connection import Base


class FinancialTransactionDB(Base):

    __tablename__ = "financial_transactions"

    id = Column(Integer, primary_key=True, index=True)

    transaction_id = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    account_id = Column(
        String(50),
        nullable=False,
        index=True
    )

    transaction_type = Column(
        String(20),
        nullable=False
    )
    # Income / Expense

    category = Column(
        String(50),
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    description = Column(
        String(255),
        nullable=True
    )

    date = Column(
        DateTime,
        default=datetime.utcnow
    )