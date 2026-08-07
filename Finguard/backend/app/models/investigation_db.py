from sqlalchemy import Column, Integer, String, Float, Text
from app.database.connection import Base


class InvestigationDB(Base):

    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)

    transaction_id = Column(String)
    prediction = Column(String)
    fraud_probability = Column(Float)

    risk_level = Column(String)
    summary = Column(Text)