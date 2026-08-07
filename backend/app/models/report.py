from sqlalchemy import Column, Integer, String, Float, Text
from app.database.connection import Base


class ReportDB(Base):

    __tablename__ = "reports"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    transaction_id = Column(
        String
    )


    prediction = Column(
        String
    )


    fraud_probability = Column(
        Float
    )


    risk_level = Column(
        String
    )


    risk_score = Column(
        Float
    )


    reason = Column(
        Text
    )


    recommendation = Column(
        Text
    )