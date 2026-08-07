from sqlalchemy import Column, Integer, Float, String
from app.database.connection import Base


class TransactionDB(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    amount = Column(Float, nullable=False)
    merchant = Column(String, nullable=False)
    location = Column(String, nullable=False)
    time = Column(String, nullable=False)
    card_type = Column(String, nullable=False)

    risk_score = Column(Float, nullable=False)
    fraud_status = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    recommendation = Column(String, nullable=False)