from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from backend.app.database.connection import Base


class Alert(Base):

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    transaction_id = Column(String(50), nullable=False)

    alert_type = Column(String(50), nullable=False)

    message = Column(String(255), nullable=False)

    status = Column(String(20), default="Unread")

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )