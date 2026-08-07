from sqlalchemy.orm import Session

from app.models.transaction import TransactionDB


def get_chart_data(db: Session):

    high = db.query(TransactionDB).filter(
        TransactionDB.risk_level == "High"
    ).count()

    medium = db.query(TransactionDB).filter(
        TransactionDB.risk_level == "Medium"
    ).count()

    low = db.query(TransactionDB).filter(
        TransactionDB.risk_level == "Low"
    ).count()

    merchants = (
        db.query(TransactionDB.merchant)
        .distinct()
        .limit(5)
        .all()
    )

    merchant_labels = []
    merchant_values = []

    for merchant in merchants:

        merchant_name = merchant[0]

        merchant_labels.append(merchant_name)

        merchant_values.append(

            db.query(TransactionDB)
            .filter(TransactionDB.merchant == merchant_name)
            .count()

        )

    return {

        "riskDistribution": {

            "labels": [
                "High",
                "Medium",
                "Low"
            ],

            "values": [
                high,
                medium,
                low
            ]

        },

        "merchantAnalysis": {

            "labels": merchant_labels,

            "values": merchant_values

        }

    }