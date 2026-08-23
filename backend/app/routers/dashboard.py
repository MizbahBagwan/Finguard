from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.graph import get_session

from backend.app.database.connection import get_db
from backend.app.services import dashboard_service
from fastapi import Depends
from backend.app.models.reports import ReportDB
from backend.app.database.connection import Base
from backend.app.models.transaction import TransactionDB
##from backend.app.database.graph import get_session
from fastapi import APIRouter, Depends, HTTPException
from neo4j.exceptions import ServiceUnavailable



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

@router.get("/knowledge-graph")
def knowledge_graph_data(
    db: Session = Depends(get_db)
):
    """
    Build Knowledge Graph from latest 5 SQL transactions.
    Neo4j is NOT used here.
    """

    print("KNOWLEDGE GRAPH: Loading latest 5 transactions...")

    try:

        transactions = (
            db.query(TransactionDB)
            .order_by(
                TransactionDB.created_at.desc()
            )
            .limit(5)
            .all()
        )

        nodes = []
        relationships = []

        # ==========================================
        # PROCESS TRANSACTIONS
        # ==========================================

        for t in transactions:

            transaction_id = str(t.transaction_id)

            transaction_node_id = f"tx-{transaction_id}"

            # --------------------------------------
            # TRANSACTION NODE
            # --------------------------------------

            nodes.append({
                "id": transaction_node_id,
                "type": "Transaction",
                "label": transaction_id,
                "properties": {
                    "transaction_id": transaction_id,
                    "amount": float(t.amount or 0),
                    "risk_level": t.risk_level,
                    "risk_score": float(t.risk_score or 0),
                    "prediction": t.prediction,
                    "time": t.time,
                    "transaction_type": t.transaction_type,
                    "merchant_category": t.merchant_category,
                    "created_at": (
                        t.created_at.isoformat()
                        if t.created_at
                        else None
                    )
                }
            })

            # --------------------------------------
            # ACCOUNT NODE
            # --------------------------------------

            account_id = str(t.account_id)

            account_node_id = f"account-{account_id}"

            nodes.append({
                "id": account_node_id,
                "type": "Account",
                "label": account_id,
                "properties": {
                    "id": account_id
                }
            })

            relationships.append({
                "source": account_node_id,
                "target": transaction_node_id,
                "type": "MADE"
            })

            # --------------------------------------
            # MERCHANT NODE
            # --------------------------------------

            merchant_name = (
                str(t.merchant)
                if t.merchant
                else "Unknown Merchant"
            )

            merchant_node_id = (
                f"merchant-{merchant_name.lower()}"
                .replace(" ", "-")
            )

            nodes.append({
                "id": merchant_node_id,
                "type": "Merchant",
                "label": merchant_name,
                "properties": {
                    "name": merchant_name
                }
            })

            relationships.append({
                "source": transaction_node_id,
                "target": merchant_node_id,
                "type": "PAID_TO"
            })

            # --------------------------------------
            # LOCATION NODE
            # --------------------------------------

            location_name = (
                str(t.location)
                if t.location
                else "Unknown Location"
            )

            location_node_id = (
                f"location-{location_name.lower()}"
                .replace(" ", "-")
            )

            nodes.append({
                "id": location_node_id,
                "type": "Location",
                "label": location_name,
                "properties": {
                    "name": location_name,
                    "location_risk": t.location_risk
                }
            })

            relationships.append({
                "source": transaction_node_id,
                "target": location_node_id,
                "type": "AT"
            })

            # --------------------------------------
            # CARD NODE
            # --------------------------------------

            card_type = (
                str(t.card_type)
                if t.card_type
                else "Unknown Card"
            )

            card_node_id = (
                f"card-{card_type.lower()}"
                .replace(" ", "-")
            )

            nodes.append({
                "id": card_node_id,
                "type": "Card",
                "label": card_type,
                "properties": {
                    "card_type": card_type
                }
            })

            relationships.append({
                "source": transaction_node_id,
                "target": card_node_id,
                "type": "USED"
            })

            # --------------------------------------
            # FRAUD ALERT NODE
            # --------------------------------------

            risk_level = str(
                t.risk_level or ""
            ).lower()

            prediction = str(
                t.prediction or ""
            ).lower()

            if (
                risk_level in ["high", "medium"]
                or prediction == "fraud"
            ):

                alert_node_id = (
                    f"alert-{transaction_id}"
                )

                nodes.append({
                    "id": alert_node_id,
                    "type": "FraudAlert",
                    "label": "Fraud Alert",
                    "properties": {
                        "risk_level": t.risk_level,
                        "risk_score": float(
                            t.risk_score or 0
                        ),
                        "prediction": t.prediction,
                        "recommendation": t.recommendation
                    }
                })

                relationships.append({
                    "source": transaction_node_id,
                    "target": alert_node_id,
                    "type": "FLAGGED_AS"
                })

        # ==========================================
        # REMOVE DUPLICATE NODES
        # ==========================================

        unique_nodes = {}

        for node in nodes:
            unique_nodes[node["id"]] = node

        nodes = list(unique_nodes.values())

        # ==========================================
        # REMOVE DUPLICATE RELATIONSHIPS
        # ==========================================

        unique_relationships = {}

        for relationship in relationships:

            key = (
                relationship["source"],
                relationship["target"],
                relationship["type"]
            )

            unique_relationships[key] = relationship

        relationships = list(
            unique_relationships.values()
        )

        # ==========================================
        # DEBUG
        # ==========================================

        print(
            f"KNOWLEDGE GRAPH: "
            f"{len(transactions)} transactions, "
            f"{len(nodes)} nodes, "
            f"{len(relationships)} relationships"
        )

        return {
            "nodes": nodes,
            "relationships": relationships
        }

    except Exception as e:

        print(
            "KNOWLEDGE GRAPH ERROR:",
            str(e)
        )

        return {
            "nodes": [],
            "relationships": [],
            "error": str(e)
        }

# ==========================================
# POTENTIAL FRAUD DETECTION
# ==========================================

@router.get("/fraud-detection")
def potential_fraud_detection(
    db: Session = Depends(get_db)
):

    return dashboard_service.get_potential_fraud_detection(db)