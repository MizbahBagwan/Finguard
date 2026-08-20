from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services import dashboard_service
from fastapi import Depends
from app.models.reports import ReportDB
from app.database.connection import Base
from app.models.transaction import TransactionDB
from app.database.graph import get_session
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
def knowledge_graph_api():

    try:
        print("KNOWLEDGE GRAPH: Connecting to Neo4j...")

        with get_session() as graph:

            result = graph.run("""
                MATCH (n)
                OPTIONAL MATCH (n)-[r]->(m)

                RETURN
                    collect(DISTINCT {
                        id: elementId(n),
                        label: coalesce(
                            n.name,
                            n.id,
                            n.transaction_id,
                            elementId(n)
                        ),
                        type: CASE
                            WHEN labels(n)[0] IS NOT NULL
                            THEN labels(n)[0]
                            ELSE "Unknown"
                        END,
                        properties: properties(n)
                    }) AS nodes,

                    collect(DISTINCT {
                        source: elementId(n),
                        target: CASE
                            WHEN m IS NOT NULL
                            THEN elementId(m)
                            ELSE NULL
                        END,
                        type: CASE
                            WHEN r IS NOT NULL
                            THEN type(r)
                            ELSE NULL
                        END
                    }) AS relationships
            """)

            record = result.single()

            if not record:
                return {
                    "nodes": [],
                    "relationships": []
                }

            nodes = record["nodes"] or []
            relationships = record["relationships"] or []

            relationships = [
                rel
                for rel in relationships
                if rel.get("source")
                and rel.get("target")
            ]

            print(
                f"KNOWLEDGE GRAPH: "
                f"{len(nodes)} nodes, "
                f"{len(relationships)} relationships"
            )

            return {
                "nodes": nodes,
                "relationships": relationships
            }

    except Exception as e:

        print("KNOWLEDGE GRAPH ERROR:", repr(e))

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