from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text,
    Boolean,
    CheckConstraint
)
from datetime import datetime

from app.database.connection import Base


class TransactionDB(Base):

    __tablename__ = "transactions"

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_amount_positive"),
        CheckConstraint("risk_score >= 0 AND risk_score <= 100", name="ck_risk_score"),
    )

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

    merchant = Column(
        String(100),
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    location = Column(
        String(100),
        nullable=False
    )

    time = Column(
        String(20),
        nullable=False
    )

    card_type = Column(
        String(50),
        nullable=False
    )

    transaction_type = Column(
        String(50),
        nullable=False
    )

    merchant_category = Column(
        String(100),
        nullable=False
    )

    hour = Column(
        Integer,
        nullable=False
    )

    location_risk = Column(
        Integer,
        default=0
    )

    device_trusted = Column(
        Boolean,
        default=True
    )

    failed_attempts = Column(
        Integer,
        default=0
    )

    is_international = Column(
        Boolean,
        default=False
    )

    fraud_probability = Column(
        Float,
        default=0.0
    )

    risk_score = Column(
        Float,
        default=0.0
    )

    risk_level = Column(
        String(20),
        default="Low"
    )

    prediction = Column(
        String(20),
        default="Safe"
    )

    recommendation = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(20),
        default="Completed"
    )

    notes = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    

    