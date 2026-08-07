from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services import dashboard_service
from fastapi import Depends
from app.models.report import ReportDB
from app.database.connection import Base
from app.models.transaction import TransactionDB


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ==========================================
# DASHBOARD SUMMARY
# ==========================================

@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db)
):

    return dashboard_service.get_dashboard_summary(db)



# ==========================================
# RISK DISTRIBUTION
# ==========================================

@router.get("/risk")
def risk_distribution(
    db: Session = Depends(get_db)
):

    return dashboard_service.get_risk_distribution(db)



# ==========================================
# SAFE VS FRAUD
# ==========================================

@router.get("/prediction")
def prediction_distribution(
    db: Session = Depends(get_db)
):

    return dashboard_service.get_prediction_distribution(db)



# ==========================================
# TRANSACTION TREND
# ==========================================

@router.get("/trend")
def transaction_trend(
    db: Session = Depends(get_db)
):

    try:

        print("TREND API START")

        data = dashboard_service.get_transaction_trend(db)

        print("TREND RESULT:", data)

        return data


    except Exception as e:

        print("TREND ERROR:", str(e))

        return {
            "error": str(e)
        }



# ==========================================
# TOP MERCHANTS
# ==========================================

@router.get("/merchants")
def top_merchants(
    db: Session = Depends(get_db)
):

    return dashboard_service.get_top_merchants(db)



# ==========================================
# AI INSIGHTS
# ==========================================

@router.get("/ai")
def ai_insights(
    db: Session = Depends(get_db)
):

    return dashboard_service.get_ai_insights(db)

@router.get("/ai-insight")
def dashboard_ai_insight(
    db: Session = Depends(get_db)
):

    latest_transaction = (
        db.query(TransactionDB)
        .filter(
            TransactionDB.prediction != "Safe"
        )
        .order_by(
            TransactionDB.updated_at.desc()
        )
        .first()
    )


    if not latest_transaction:
        return {
            "message": "No AI analysis available"
        }


    return {
        "transaction_id": latest_transaction.transaction_id,
        "prediction": latest_transaction.prediction,
        "risk_level": latest_transaction.risk_level,
        "risk_score": latest_transaction.risk_score,
        "fraud_probability": latest_transaction.fraud_probability,
        "recommendation": latest_transaction.recommendation,
        "status": latest_transaction.status
    }