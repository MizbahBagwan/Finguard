from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from datetime import datetime

from backend.app.database.connection import Base


class Report(Base):

    __tablename__ = "reports"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    transaction_id = Column(
        String(100),
        nullable=False
    )


    prediction = Column(
        String(20),
        nullable=True
    )


    fraud_probability = Column(
        Float,
        nullable=True
    )


    risk_level = Column(
        String(50),
        nullable=True
    )


    summary = Column(
        Text,
        nullable=True
    )


    risk_indicators = Column(
        Text,
        nullable=True
    )


    recommendations = Column(
        Text,
        nullable=True
    )


    explanation = Column(
        Text,
        nullable=True
    )


    evidence = Column(
        Text,
        nullable=True
    )


    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


    def __repr__(self):

        return f"<Report {self.transaction_id}>"