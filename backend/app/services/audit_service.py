from sqlalchemy.orm import Session
from backend.app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    transaction_id: str,
    field_name: str,
    old_value,
    new_value,
    updated_by="AI Engine"
):

    log = AuditLog(
        transaction_id=transaction_id,
        field_name=field_name,
        old_value=str(old_value),
        new_value=str(new_value),
        updated_by=updated_by
    )

    db.add(log)