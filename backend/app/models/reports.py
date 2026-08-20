from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text
)

from datetime import datetime

from app.database.connection import Base


class ReportDB(Base):

    __tablename__ = "reports"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    report_id = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    name = Column(
        String(150),
        nullable=False,
        default="Financial Report"
    )

    title = Column(
        String(250),
        nullable=False
    )

    report_type = Column(
        String(50),
        default="comprehensive"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    status = Column(
        String(30),
        default="Completed"
    )

    total_transactions = Column(
        Integer,
        default=0
    )

    fraud_detected = Column(
        Integer,
        default=0
    )

    high_risk = Column(
        Integer,
        default=0
    )

    medium_risk = Column(
        Integer,
        default=0
    )

    safe_transactions = Column(
        Integer,
        default=0
    )

    average_risk = Column(
        Float,
        default=0
    )

    start_date = Column(
        String(30),
        nullable=True
    )

    end_date = Column(
        String(30),
        nullable=True
    )

    include_ai = Column(
        Boolean,
        default=True
    )

    include_charts = Column(
        Boolean,
        default=True
    )

    ai_summary = Column(
        Text,
        nullable=True
    )