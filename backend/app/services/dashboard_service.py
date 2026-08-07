from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.transaction import TransactionDB



# ==========================================
# DASHBOARD SUMMARY
# ==========================================

def get_dashboard_summary(db: Session):
    """
    Main dashboard statistics
    """

    total_transactions = (
        db.query(
            func.count(TransactionDB.id)
        )
        .scalar()
        or 0
    )


    total_amount = (
        db.query(
            func.sum(TransactionDB.amount)
        )
        .scalar()
        or 0
    )


    fraud_transactions = (
        db.query(
            func.count(TransactionDB.id)
        )
        .filter(
            TransactionDB.prediction == "Fraud"
        )
        .scalar()
        or 0
    )


    high_risk_transactions = (
        db.query(
            func.count(TransactionDB.id)
        )
        .filter(
            TransactionDB.risk_level == "High"
        )
        .scalar()
        or 0
    )


    return {

        "total_transactions": total_transactions,

        "total_amount": float(total_amount),

        "fraud_transactions": fraud_transactions,

        "high_risk_transactions": high_risk_transactions

    }




# ==========================================
# RISK DISTRIBUTION
# ==========================================

def get_risk_distribution(db: Session):
    """
    Doughnut chart data
    """

    result = (

        db.query(

            TransactionDB.risk_level,

            func.count(TransactionDB.id)

        )

        .group_by(

            TransactionDB.risk_level

        )

        .all()

    )


    return [

        {
            "risk_level": level,
            "count": count
        }

        for level, count in result

    ]




# ==========================================
# PREDICTION DISTRIBUTION
# ==========================================

def get_prediction_distribution(db: Session):
    """
    Safe vs Fraud chart
    """

    result = (

        db.query(

            TransactionDB.prediction,

            func.count(TransactionDB.id)

        )

        .group_by(

            TransactionDB.prediction

        )

        .all()

    )


    return [

        {
            "prediction": prediction,
            "count": count
        }

        for prediction, count in result

    ]




# ==========================================
# TRANSACTION TREND
# ==========================================

def get_transaction_trend(db: Session):
    """
    Line chart transaction trend
    """

    transactions = (

        db.query(TransactionDB)

        .order_by(
            TransactionDB.created_at
        )

        .all()

    )


    trend = {}


    for transaction in transactions:


        if transaction.created_at:

            date = transaction.created_at.strftime(
                "%Y-%m-%d"
            )

        else:

            date = "Unknown"



        if date not in trend:

            trend[date] = 0



        trend[date] += 1



    return [

        {
            "date": date,

            "transactions": count
        }

        for date, count in trend.items()

    ]





# ==========================================
# TOP MERCHANTS
# ==========================================

def get_top_merchants(
    db: Session,
    limit: int = 5
):
    """
    Merchant performance chart
    """


    result = (

        db.query(

            TransactionDB.merchant,

            func.sum(
                TransactionDB.amount
            ).label("total_amount")

        )

        .group_by(

            TransactionDB.merchant

        )

        .order_by(

            desc("total_amount")

        )

        .limit(limit)

        .all()

    )


    return [

        {

            "merchant": merchant,

            "amount": float(amount)

        }

        for merchant, amount in result

    ]





# ==========================================
# AI INSIGHTS
# ==========================================

def get_ai_insights(db: Session):
    """
    AI dashboard metrics
    """


    average_risk = (

        db.query(

            func.avg(
                TransactionDB.risk_score
            )

        )

        .scalar()

        or 0

    )



    average_fraud_probability = (

        db.query(

            func.avg(
                TransactionDB.fraud_probability
            )

        )

        .scalar()

        or 0

    )



    total_transactions = (

        db.query(
            TransactionDB
        )

        .count()

    )



    suspicious_transactions = (

        db.query(
            TransactionDB
        )

        .filter(

            TransactionDB.risk_level != "Low"

        )

        .count()

    )



    return {


        "total_scanned": total_transactions,


        "suspicious_transactions": suspicious_transactions,


        "average_risk_score":
            round(
                float(average_risk),
                2
            ),


        "average_fraud_probability":
            round(
                float(average_fraud_probability),
                2
            ),


        "system_status":
            "Running"

    }