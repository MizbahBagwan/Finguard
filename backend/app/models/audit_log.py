from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from backend.app.database.connection import Base


class AuditLog(Base):

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    transaction_id = Column(String(50), nullable=False)

    field_name = Column(String(100), nullable=False)

    old_value = Column(String(255))

    new_value = Column(String(255))

    updated_by = Column(String(100), default="AI Engine")

    created_at = Column(DateTime, default=datetime.utcnow)