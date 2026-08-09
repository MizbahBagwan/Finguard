from pathlib import Path
from datetime import datetime
from app.services.gemini_service import analyze_transaction

from fastapi import FastAPI, Request, Depends, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from httpcore import request
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.report import ReportDB

from dotenv import load_dotenv
import google.generativeai as genai
from app.routers import settings
from datetime import datetime
from sqlalchemy import or_
from app.services.log_services import create_transaction_log
from app.database.graph import get_session
from app.services.graph_service import create_transaction_graph


from app.models.audit_log import AuditLog
from app.services.audit_service import create_audit_log
from app.models.transaction_history import TransactionHistory
from app.services.history_service import create_history


from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, Request, Depends, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.database.connection import (
    Base,
    engine,
    get_db,
    SessionLocal
)

from app.models.transaction import TransactionDB
from app.models.transaction_log import TransactionLog
from app.models.audit_log import AuditLog
from app.models.transaction_history import TransactionHistory

# Models
from app.models.user import User
from app.models.investigation_db import InvestigationDB


# Routers
from app.routers.dashboard import router as dashboard_router
from app.routers.chart import router as chart_router
from app.routers import ocr
from app.routers.reports import router as reports_router
from app.routers import chart


# Services
from app.services.security import (
    hash_password,
    verify_password
)

from app.services.ai_service import analyze_transaction
from app.services.ml_service import predict_transaction

from app.services.report_service import (
    generate_investigation_report
)

from app.services.graph_service import (
    analyze_transaction_graph
)

from pydantic import BaseModel
from app.services.ai_service import model


from app.fraud_engine import create_ai_report
from pydantic import BaseModel
from app.services.graph_service import analyze_transaction_graph

load_dotenv()






# ==========================
# Services
# ==========================
from app.services.security import (
    hash_password,
    verify_password
)

from app.services.ai_service import analyze_transaction

from app.services.ml_service import predict_transaction

from app.services.report_service import (
    generate_investigation_report
)

from app.services.graph_service import (
    analyze_transaction_graph
)

from app.fraud_engine import create_ai_report
from fastapi import Form
from fastapi.responses import RedirectResponse
from app.routers.dashboard import router as dashboard_router
from pydantic import BaseModel
import google.generativeai as genai
import os

from app.models.transaction import TransactionDB
from app.services.alert_service import create_alert





# ==========================
# Load Environment
# ==========================
load_dotenv()

# ==========================
# FastAPI App
# ==========================
app = FastAPI(title="FinGuard AI")


# ==========================
# Session Middleware
# ==========================


app.add_middleware(
    SessionMiddleware,
    secret_key="finguard_secret_key_123"
)


BASE_DIR = Path(__file__).resolve().parent


templates = Jinja2Templates(
    directory=str(BASE_DIR / "templates")
)


# STATIC MUST COME BEFORE ROUTERS
app.mount(
    "/static",
    StaticFiles(
        directory=str(BASE_DIR / "static")
    ),
    name="static"
)


# ROUTERS AFTER STATIC
app.include_router(dashboard_router)
app.include_router(chart_router)
app.include_router(ocr.router)
app.include_router(reports_router)
app.include_router(settings.router)


def calculate_risk(
    amount,
    failed_attempts,
    location_risk,
    device_trusted,
    is_international
):

    score = 0

    if amount > 50000:
        score += 40

    elif amount > 10000:
        score += 20


    if failed_attempts >= 3:
        score += 25


    if location_risk >= 70:
        score += 20


    if device_trusted == 0:
        score += 10


    if is_international == 1:
        score += 15


    score = min(score, 100)


    if score >= 80:

        prediction = "Fraud"

        risk_level = "High"

        recommendation = "Block transaction immediately."


    elif score >= 50:

        prediction = "Fraud"

        risk_level = "Medium"

        recommendation = "Verify customer before approval."


    else:

        prediction = "Safe"

        risk_level = "Low"

        recommendation = "No action required."


    return (
        score,
        risk_level,
        prediction,
        recommendation
    )



# ==========================
# Database Tables
# ==========================
Base.metadata.create_all(bind=engine)


# ==========================
# Request Models
# ==========================

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class PredictionRequest(BaseModel):
    amount: float
    transaction_type: str
    merchant_category: str
    hour: int
    location_risk: int
    device_trusted: int
    failed_attempts: int
    is_international: int


class InvestigationRequest(BaseModel):
    transaction_id: str
    account_id: str

    amount: float
    merchant: str

    transaction_type: str
    merchant_category: str

    hour: int
    location_risk: int
    device_trusted: int
    failed_attempts: int
    is_international: int

    location: str
    card_type: str

class Transaction(BaseModel):
    amount: float
    merchant: str
    location: str
    time: str
    card_type: str
    # =====================================================
# HOME
# =====================================================



@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        "login.html",
        {
            "request": request
        }
    )


# =====================================================
# LOGIN PAGE
# =====================================================

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(
        "login.html",
        {
            "request": request
        }
    )


# =====================================================
# REGISTER PAGE
# =====================================================

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse(
        "register.html",
        {
            "request": request
        }
    )


# =====================================================
# REGISTER API
# =====================================================

from fastapi import Request, Form, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

@app.post("/api/register")
async def register_user(
    request: Request,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    db: Session = Depends(get_db)
):

    # Password Match
    if password != confirm_password:
        return {
            "success": False,
            "message": "Passwords do not match"
        }

    # Check if email already exists
    existing_email = db.query(User).filter(
        User.email == email
    ).first()

    if existing_email:
        return {
            "success": False,
            "message": "Email already exists"
        }

    # Check if username already exists
    existing_username = db.query(User).filter(
        User.username == username
    ).first()

    if existing_username:
        return {
            "success": False,
            "message": "Username already exists"
        }

    # Create User
    new_user = User(
        username=username,
        email=email,
        password=hash_password(password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create Session
    request.session["user"] = new_user.username
    request.session["email"] = new_user.email

    # Redirect to Dashboard
    return RedirectResponse(
        url="/dashboard",
        status_code=303
    )

# =====================================================
# LOGIN API
# =====================================================

from fastapi import Form

@app.post("/api/login")
async def login_user(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        return {
            "success": False,
            "message": "User not found"
        }

    if not verify_password(password, user.password):
        return {
            "success": False,
            "message": "Incorrect password"
        }

    request.session["user"] = user.username

    return RedirectResponse(
        url="/dashboard",
        status_code=303
    )

@app.get("/transactions", response_class=HTMLResponse)
async def transactions(
    request: Request,
    db: Session = Depends(get_db)
):

    # ==========================================
    # GET ALL TRANSACTIONS
    # ==========================================

    transactions = (
        db.query(TransactionDB)
        .order_by(TransactionDB.created_at.desc())
        .all()
    )


    # ==========================================
    # TOTAL
    # ==========================================

    total_transactions = len(transactions)


    # ==========================================
    # FRAUD
    # Handles:
    # Fraud
    # FRAUD
    # fraud
    # ==========================================

    fraud_transactions = sum(
        1
        for t in transactions
        if str(t.prediction or "").strip().lower() == "fraud"
    )


    # ==========================================
    # SAFE / LEGITIMATE
    # Handles:
    # Safe
    # SAFE
    # Legitimate
    # LEGITIMATE
    # Legit
    # ==========================================

    safe_transactions = sum(
        1
        for t in transactions
        if str(t.prediction or "").strip().lower()
        in ["safe", "legitimate", "legit"]
    )


    # ==========================================
    # AVERAGE RISK
    # ==========================================

    average_risk = round(
        sum(
            float(t.risk_score or 0)
            for t in transactions
        ) / total_transactions,
        2
    ) if total_transactions else 0


    # ==========================================
    # DEBUG
    # ==========================================

    print("========================================")
    print("TRANSACTION DASHBOARD")
    print("Total:", total_transactions)
    print("Safe:", safe_transactions)
    print("Fraud:", fraud_transactions)
    print("Average Risk:", average_risk)

    for t in transactions[:10]:
        print(
            "ID:",
            t.id,
            "| Prediction:",
            repr(t.prediction),
            "| Risk:",
            t.risk_score
        )

    print("========================================")


    # ==========================================
    # SEND DATA TO TEMPLATE
    # ==========================================

    return templates.TemplateResponse(
        "transactions.html",
        {
            "request": request,

            "transactions": transactions,

            "total_transactions": total_transactions,

            "safe_transactions": safe_transactions,

            "fraud_transactions": fraud_transactions,

            "average_risk": average_risk
        }
    )
# =====================================================
# DASHBOARD
# =====================================================

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):

    if "user" not in request.session:
        return RedirectResponse(
            "/login",
            status_code=302
        )

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "username": request.session["user"],
            "active_page": "dashboard"
        }
    )
@app.get("/add-transaction", response_class=HTMLResponse)
async def add_transaction_page(request: Request):
    return templates.TemplateResponse(
        "add_transaction.html",
        {
            "request": request,
            "active_page": "transactions"
        }
    )
@app.post("/add-transaction")
async def add_transaction(
    request: Request,

    transaction_id: str = Form(...),
    account_id: str = Form(...),

    amount: float = Form(...),
    merchant: str = Form(...),
    location: str = Form(...),
    time: str = Form(...),

    card_type: str = Form(...),
    transaction_type: str = Form(...),
    merchant_category: str = Form(...),

    hour: int = Form(...),
    location_risk: int = Form(...),

    device_trusted: str = Form(...),
    failed_attempts: int = Form(...),

    is_international: str = Form(...),

    notes: str = Form(""),

    db: Session = Depends(get_db)

):

    try:

        # ==============================
        # Convert Form Values For ML
        # ==============================

        if is_international.lower() == "yes":
            is_international = 1
        else:
            is_international = 0


        if device_trusted.lower() == "trusted":
            device_trusted = 1
        else:
            device_trusted = 0



        # ==============================
        # Duplicate Transaction Check
        # ==============================

        existing = (
            db.query(TransactionDB)
            .filter(
                TransactionDB.transaction_id == transaction_id
            )
            .first()
        )


        if existing:

            return templates.TemplateResponse(
                "add_transaction.html",
                {
                    "request": request,
                    "active_page": "transactions",
                    "error": "Transaction ID already exists."
                },
                status_code=400
            )



        # ==============================
        # ML FRAUD PREDICTION
        # ==============================

        ml_result = predict_transaction({

            "amount": amount,

            "merchant": merchant,

            "merchant_category": merchant_category,

            "description": notes,

            "transaction_type": transaction_type,

            "hour": hour,

            "location_risk": location_risk,

            "device_trusted": device_trusted,

            "failed_attempts": failed_attempts,

            "is_international": is_international

        })



        if not ml_result["success"]:

            raise Exception(
                ml_result["message"]
            )



        risk_score = ml_result["risk_score"]

        prediction = ml_result["prediction"]


# ==============================
# GEMINI AI ANALYSIS
# ==============================

        ai_result = analyze_transaction({

        "amount": amount,

        "merchant": merchant,

        "merchant_category": merchant_category,

        "location": location,

        "device_trusted": device_trusted,

        "failed_attempts": failed_attempts,

         "is_international": is_international,

         "prediction": prediction,

        "risk_score": risk_score

         

        })

        ai_reason = ai_result.get("reason", "")
        ai_recommendation = ai_result.get("recommendation", "")



        # ==============================
        # Risk Level
        # ==============================

        if risk_score >= 70:

            risk_level = "High"

        elif risk_score >= 40:

            risk_level = "Medium"

        else:

            risk_level = "Low"



        # ==============================
        # Recommendation
        # ==============================

        if prediction == "Fraud":

            recommendation = "Block Transaction"

        else:

            recommendation = "Approve Transaction"



        # ==============================
        # SAVE TRANSACTION
        # ==============================

        transaction = TransactionDB(

            transaction_id=transaction_id,

            account_id=account_id,

            amount=amount,

            merchant=merchant,

            location=location,

            time=time,

            card_type=card_type,

            transaction_type=transaction_type,

            merchant_category=merchant_category,

            hour=hour,

            location_risk=location_risk,

            device_trusted=device_trusted,

            failed_attempts=failed_attempts,

            is_international=is_international,

            risk_score=risk_score,

            risk_level=risk_level,

            prediction=prediction,

            recommendation=ai_recommendation,

            notes=ai_reason

        )


        db.add(transaction)

        db.commit()

        db.refresh(transaction)



        # ==============================
        # Transaction Log
        # ==============================

        create_transaction_log(

            db=db,

            transaction_id=transaction.transaction_id,

            action="CREATE",

            status="SUCCESS",

            message="Transaction created successfully."

        )



        # ==============================
        # Neo4j Graph
        # ==============================

        with get_session() as graph:

            create_transaction_graph(

                graph=graph,

                transaction=transaction

            )



        return RedirectResponse(

            url="/transactions",

            status_code=303

        )



    except Exception as e:


        db.rollback()


        print("========== ADD TRANSACTION ERROR ==========")

        print(str(e))


        import traceback

        traceback.print_exc()


        print("============================================")



        return templates.TemplateResponse(

            "add_transaction.html",

            {
                "request": request,
                "active_page": "transactions",
                "error": f"Transaction Failed: {str(e)}"
            },

            status_code=500

        )



    finally:

        db.close()
@app.post("/analyze")
async def analyze(
    data: Transaction,
    db: Session = Depends(get_db)
):
    try:
        # ==========================
        # AI Transaction Analysis
        # ==========================
        result = analyze_transaction(data.model_dump())

        risk = result.get("risk_score", 0)

        if isinstance(risk, str):
            risk = risk.replace("%", "")

        # ==========================
        # Create Transaction Object
        # ==========================
        transaction = TransactionDB(
            transaction_id=f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}",
            account_id="ACC001",
            amount=data.amount,
            merchant=data.merchant,
            location=data.location,
            time=data.time,
            card_type=data.card_type,
            transaction_type="Purchase",
            merchant_category="General",

            risk_score=float(risk),
            risk_level=result.get("risk_level", "Low"),
            prediction=result.get("prediction", "Safe"),
            recommendation=result.get("recommendation", "")
        )

        # ==========================
        # DATABASE TRANSACTION START
        # ==========================

        db.add(transaction)

        create_history(
            db=db,
            transaction_id=transaction.transaction_id,
            stage="Transaction Created",
            description="New transaction analyzed and saved."
        )

        create_transaction_log(
            db=db,
            transaction_id=transaction.transaction_id
        )

        create_audit_log(
            db=db,
            transaction_id=transaction.transaction_id
        )

        # ==========================
        # CREATE ALERT FOR HIGH RISK
        # ==========================

        if (
            transaction.prediction == "Fraud"
            or transaction.risk_level == "High"
            or transaction.risk_score >= 80
        ):
            create_alert(
                db=db,
                transaction_id=transaction.transaction_id,
                alert_type="HIGH_RISK",
                message="High Risk Fraud Transaction Detected."
            )

        db.commit()
        db.refresh(transaction)

        # ==========================
        # DATABASE TRANSACTION END
        # ==========================

        return {
            "success": True,
            "analysis": result
        }

    except Exception as e:

        # ==========================
        # ROLLBACK TRANSACTION
        # ==========================

        db.rollback()

        return {
            "success": False,
            "error": str(e)
        }
from fastapi.responses import RedirectResponse


@app.get("/settings")
def settings(request: Request):
    return templates.TemplateResponse(
        "settings.html",
        {
            "request": request
        }
    )


@app.get("/copilot")
def copilot(request: Request):
    return templates.TemplateResponse(
        "copilot.html",
        {
            "request": request,
            "active_page": "copilot"
        }
    )
from pydantic import BaseModel

class CopilotRequest(BaseModel):
    message: str
    transaction_id: int | None = None


from pydantic import BaseModel
from app.services.ai_service import model

class ChatRequest(BaseModel):
    message: str

@app.post("/api/copilot/chat")
async def copilot_chat(request: ChatRequest):

    db = SessionLocal()

    try:

        message = request.message.lower()


        # ======================================
        # TRANSACTION SEARCH
        # ======================================

        if "txn" in message or "transaction" in message:


            transactions = (
                db.query(TransactionDB)
                .all()
            )


            # Specific Transaction ID check

            found_transaction = None


            for t in transactions:

                if t.transaction_id.lower() in message:

                    found_transaction = t
                    break



            if found_transaction:


                prompt = f"""

You are FinGuard AI Copilot.

Analyze this transaction professionally.

Transaction ID:
{found_transaction.transaction_id}

Merchant:
{found_transaction.merchant}

Amount:
₹{found_transaction.amount}

Location:
{found_transaction.location}

Card:
{found_transaction.card_type}

Risk Score:
{found_transaction.risk_score}

Risk Level:
{found_transaction.risk_level}

Prediction:
{found_transaction.prediction}

Recommendation:
{found_transaction.recommendation}




Give:
1. Fraud explanation
2. Risk indicators
3. Security recommendation

"""


                response = model.generate_content(prompt)


                return {
                    "response": response.text
                }



            # ======================================
            # TODAY TRANSACTION LIST
            # ======================================

            if "today" in message or "list" in message:


                data = []


                for t in transactions:


                    data.append(
                        f"""
| {t.transaction_id}
| {t.merchant}
| ₹{t.amount}
| {t.location}
| {t.risk_score}%
| {t.risk_level}
| {t.prediction}
"""
                    )


                table = "\n".join(data)


                return {
                    "response": f"""

## 📋 Today's Transaction Log


| ID | Merchant | Amount | Location | Risk | Level | Prediction |
|---|---|---|---|---|---|---|

{table}


Total Transactions:
{len(transactions)}

"""
                }



        # ======================================
        # NORMAL GEMINI CHAT
        # ======================================


        response = model.generate_content(
            request.message
        )


        return {
            "response": response.text
        }



    except Exception as e:


        error = str(e)


        if "429" in error:

            return {
                "response":
                "⚠️ Gemini quota exhausted."
            }


        return {
            "response":
            f"AI Error: {error}"
        }


    finally:

        db.close()
@app.get("/analytics")
def analytics(request: Request):
    return templates.TemplateResponse(
        "analytics.html",
        {
            "request": request,
            "active_page": "analytics"
        }
    )


@app.get("/investigations")
def investigations(request: Request):
    return templates.TemplateResponse(
        "investigations.html",
        {
            "request": request,
            "active_page": "investigations"
        }
    )


@app.get("/ocr")
def ocr(request: Request):
    return templates.TemplateResponse(
        "ocr.html",
        {
            "request": request,
            "active_page": "ocr"
        }
    )


@app.get("/knowledge-graph")
def knowledge_graph(request: Request):
    return templates.TemplateResponse(
        "knowledge_graph.html",
        {
            "request": request,
            "active_page": "knowledge"
        }
    )



# =====================================================
# ANALYZE NEW TRANSACTION
# =====================================================




# =====================================================
# TRANSACTIONS PAGE
# =====================================================

from sqlalchemy.orm import Session


# =====================================================
# TRANSACTION DETAIL PAGE
# =====================================================

@app.get("/transaction/{transaction_id}", response_class=HTMLResponse)
async def transaction_detail(
    request: Request,
    transaction_id: int,
    db: Session = Depends(get_db)
):

    transaction = (
        db.query(TransactionDB)
        .filter(TransactionDB.id == transaction_id)
        .first()
    )


    if transaction is None:
        return HTMLResponse(
            "Transaction not found",
            status_code=404
        )


    print("========== PAGE DATA ==========")
    print("TRANSACTION ID:", transaction.id)
    print("DB NOTES:", transaction.notes)
    print("DB RECOMMENDATION:", transaction.recommendation)
    print("================================")


    return templates.TemplateResponse(
        "transaction_detail.html",
        {
            "request": request,
            "transaction": transaction
        }
    )



# =====================================================
# RUN AI ANALYSIS
# =====================================================

@app.post("/analyze/{transaction_id}")
async def run_ai_analysis(
    transaction_id: int,
    db: Session = Depends(get_db)
):

    try:

        print(f"🔥 ANALYSIS START : {transaction_id}")


        # ==========================
        # FETCH TRANSACTION
        # ==========================

        transaction = (
            db.query(TransactionDB)
            .filter(TransactionDB.id == transaction_id)
            .first()
        )


        if transaction is None:

            return HTMLResponse(
                "Transaction not found",
                status_code=404
            )


        # ==========================
        # GEMINI AI ANALYSIS
        # ==========================

        result = analyze_transaction({

            "amount": transaction.amount,

            "merchant": transaction.merchant,

            "merchant_category": transaction.merchant_category,

            "location": transaction.location,

            "time": transaction.time,

            "card_type": transaction.card_type,

            "device_trusted": transaction.device_trusted,

            "failed_attempts": transaction.failed_attempts,

            "location_risk": transaction.location_risk,

            "is_international": transaction.is_international

        })


        print("========== AI RESULT ==========")
        print(result)



        # ==========================
        # UPDATE TRANSACTION
        # ==========================

        transaction.risk_score = float(
            str(result.get("risk_score",0))
            .replace("%","")
        )


        transaction.fraud_probability = float(
            result.get(
                "fraud_probability",
                transaction.risk_score
            )
        )


        transaction.prediction = result.get(
            "prediction",
            "Safe"
        )


        transaction.risk_level = result.get(
            "risk_level",
            "Low"
        )


        transaction.recommendation = result.get(
            "recommendation",
            ""
        )


        transaction.notes = result.get(
            "reason",
            ""
        )


        print("========== NOTES DEBUG ==========")
        print("AI REASON:", result.get("reason"))
        print("TRANSACTION NOTES:", transaction.notes)



        # ==========================
        # SAVE REPORT
        # ==========================

        ai_report = ReportDB(

            transaction_id=str(transaction_id),

            prediction=result.get("prediction"),

            fraud_probability=result.get(
                "fraud_probability"
            ),

            risk_level=result.get(
                "risk_level"
            ),

            risk_score=result.get(
                "risk_score"
            ),

            reason=result.get(
                "reason"
            ),

            recommendation=result.get(
                "recommendation"
            )
        )


        db.add(ai_report)

        db.flush()

        db.commit()

        db.refresh(transaction)

        print("========== AFTER COMMIT ==========")
        print("SAVED NOTES:", transaction.notes)



        # ==========================
        # LOG
        # ==========================

        create_transaction_log(

            db=db,

            transaction_id=transaction.transaction_id,

            action="AI_ANALYSIS",

            status="SUCCESS",

            message="AI fraud analysis completed successfully."

        )



        # ==========================
        # HISTORY
        # ==========================

        create_history(

            db=db,

            transaction_id=transaction.transaction_id,

            stage="AI Analysis",

            description="AI completed fraud analysis."

        )



        # ==========================
        # ALERT
        # ==========================

        if (

            transaction.prediction == "Fraud"

            or transaction.risk_level == "High"

            or transaction.risk_score >= 80

        ):

            create_alert(

                db=db,

                transaction_id=transaction.transaction_id,

                alert_type="AI_ALERT",

                message="AI marked transaction as Fraud."

            )



        db.commit()

        db.refresh(transaction)

        print("========== AFTER COMMIT CHECK ==========")
        print("NOTES:", transaction.notes)
        print("RECOMMENDATION:", transaction.recommendation)


        print("========== FINAL DATABASE CHECK ==========")
        print("NOTES:", transaction.notes)
        print("RECOMMENDATION:", transaction.recommendation)


        print("✅ Transaction Updated Successfully")


        return RedirectResponse(

            url=f"/transaction/{transaction_id}",

            status_code=303

        )



    except Exception as e:


        db.rollback()


        print("❌ Transaction Failed")
        print(str(e))


        return HTMLResponse(

            content=f"AI Analysis Failed : {str(e)}",

            status_code=500

        )
# =====================================================
# PREDICTION API
# =====================================================

@app.post("/predict")
async def predict(
    data: PredictionRequest
):

    result = predict_transaction(
        data.model_dump()
    )

    return result



# =====================================================
# INVESTIGATION API
# =====================================================

# =====================================================
# INVESTIGATION API
# =====================================================

@app.post("/investigate")
async def investigate(
    transaction: InvestigationRequest,
    db: Session = Depends(get_db)
):
    try:

        # =====================================================
        # Convert Request
        # =====================================================
        transaction_data = transaction.model_dump()

        # =====================================================
        # ML Prediction
        # =====================================================
        ml_result = predict_transaction(transaction_data)

        if not ml_result.get("success", True):
            return {
                "success": False,
                "message": "Prediction failed",
                "details": ml_result
            }

        # =====================================================
        # Graph Analysis
        # =====================================================
        graph_result = analyze_transaction_graph(
            transaction.account_id
        )

        # =====================================================
        # AI Report Generation
        # =====================================================
        ai_report = generate_investigation_report(
            transaction_data,
            fraud_score=ml_result.get(
                "fraud_probability",
                0
            ),
            ocr_result="Not available",
            graph_summary=graph_result
        )

        # =====================================================
        # Save Investigation
        # =====================================================
        investigation = InvestigationDB(

            transaction_id=transaction.transaction_id,

            prediction=ml_result.get(
                "prediction",
                "Unknown"
            ),

            fraud_probability=ml_result.get(
                "fraud_probability",
                0
            ),

            risk_level=ai_report.get(
                "risk_level",
                "Unknown"
            ),

            summary=ai_report.get(
                "summary",
                ""
            )
        )

        db.add(investigation)

        # =====================================================
        # Transaction Log
        # =====================================================
        create_transaction_log(
            db=db,
            transaction_id=transaction.transaction_id,
            action="INVESTIGATION",
            status="SUCCESS",
            message="Fraud investigation completed successfully."
        )
        create_history(
     db=db,
     transaction_id=transaction.transaction_id,
     stage="Investigation",
     description="Fraud investigation completed."
)
        db.commit()
        db.refresh(investigation)

        return {

            "success": True,

            "investigation_id": investigation.id,

            "prediction": ml_result.get("prediction"),

            "fraud_probability": ml_result.get(
                "fraud_probability"
            ),

            "graph_analysis": graph_result,

            "ai_report": ai_report

        }

    except Exception as e:

        db.rollback()

        print("❌ Investigation Failed")
        print(str(e))

        try:
            create_transaction_log(
                db=db,
                transaction_id=transaction.transaction_id,
                action="INVESTIGATION",
                status="FAILED",
                message=str(e)
            )
            db.commit()

        except:
            db.rollback()

        return {
            "success": False,
            "error": str(e)
        }
# =====================================================
# GET ALL INVESTIGATIONS
@app.get("/api/investigations")
async def get_investigations(
    db: Session = Depends(get_db)
):

    reports = (
        db.query(InvestigationDB)
        .all()
    )

    return reports



# =====================================================
# DASHBOARD STATISTICS
# =====================================================

@app.get("/api/dashboard")
async def dashboard_stats(
    db: Session = Depends(get_db)
):

    investigations = (
        db.query(InvestigationDB)
        .all()
    )


    total = len(investigations)


    fraud_cases = len([
        x for x in investigations
        if x.prediction == "Fraud"
    ])


    high_risk = len([
        x for x in investigations
        if "High" in str(x.risk_level)
    ])


    average = 0


    if total > 0:

        average = sum(
            x.fraud_probability
            for x in investigations
        ) / total


    return {

        "total_investigations": total,

        "fraud_cases": fraud_cases,

        "high_risk_cases": high_risk,

        "average_fraud_probability":
            round(average,2)

    }



# =====================================================
# TRANSACTIONS API
# =====================================================

@app.get("/api/transactions")
async def get_transactions(
    db: Session = Depends(get_db)
):

    return (
        db.query(TransactionDB)
        .all()
    )
    



# =====================================================
# TRANSACTION STATS
# =====================================================

@app.get("/api/transaction-stats")
async def transaction_stats(
    db: Session = Depends(get_db)
):

    transactions = (
        db.query(TransactionDB)
        .all()
    )


    total = len(transactions)


    fraud = len([
    t for t in transactions
    if t.prediction == "Fraud"
])


    return {

        "total_transactions": total,

        "fraud_transactions": fraud,

        "safe_transactions":
            total - fraud

    }



# =====================================================
# ROUTE DEBUG
# =====================================================

@app.on_event("startup")
async def show_routes():

    print("\n====== REGISTERED ROUTES ======")

    for route in app.routes:

        if hasattr(route, "path") and hasattr(route, "methods"):

            print(f"{route.path} {route.methods}")

    print("==============================\n")

@app.get("/copilot", response_class=HTMLResponse)
async def copilot(request: Request):
    return templates.TemplateResponse(
        "copilot.html",
        {
            "request": request,
            "active_page": "copilot"
        }
    )





@app.get("/shap", response_class=HTMLResponse)
async def shap(request: Request):
    return templates.TemplateResponse(
        "shap.html",
        {"request": request}
    )

@app.get("/ocr", response_class=HTMLResponse)
async def ocr_page(request: Request):
    return templates.TemplateResponse(
        "ocr.html",
        {"request": request}
    )


@app.get("/knowledge-graph", response_class=HTMLResponse)
async def knowledge_graph(request: Request):
    return templates.TemplateResponse(
        "knowledge_graph.html",
        {"request": request}
    )
print("========== ROUTES ==========")
for r in app.routes:
    if hasattr(r, "path"):
        print(r.path)
print("============================")

@app.on_event("startup")
async def debug_routes():

    print("\n====== REGISTERED ROUTES ======")

    for route in app.routes:

        if hasattr(route, "path"):

            name = getattr(route, "name", "NO_NAME")

            print(
                name,
                route.path
            )

    print("==============================")

from app.models.transaction import TransactionDB
from app.database.connection import SessionLocal
from fastapi import Depends
from sqlalchemy.orm import Session


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



from sqlalchemy import or_


@app.get("/api/recent-transactions")
def recent_transactions(
    db: Session = Depends(get_db)
):

    transactions = (
        db.query(TransactionDB)
        .order_by(
            TransactionDB.created_at.desc()
        )
        .limit(5)
        .all()
    )


    return [

        {
            "transaction_id": t.transaction_id,
            "merchant": t.merchant,
            "amount": t.amount,
            "risk_level": t.risk_level,
            "prediction": t.prediction,
            "date": t.created_at.strftime("%d %b %Y")

        }

        for t in transactions

    ]



@app.get("/api/dashboard-live")
def dashboard_live(
    db: Session = Depends(get_db)
):

    transactions = (
        db.query(TransactionDB)
        .all()
    )


    total = len(transactions)


    high = (
        db.query(TransactionDB)
        .filter(
            TransactionDB.risk_level == "High"
        )
        .count()
    )


    medium = (
        db.query(TransactionDB)
        .filter(
            TransactionDB.risk_level == "Medium"
        )
        .count()
    )


    safe = (
        db.query(TransactionDB)
        .filter(
            TransactionDB.prediction == "Safe"
        )
        .count()
    )


    frauds = (
        db.query(TransactionDB)
        .filter(
            TransactionDB.prediction == "Fraud"
        )
        .count()
    )


    avg_score = 0


    if total:

        avg_score = round(
            sum(
                t.risk_score or 0
                for t in transactions
            ) / total,
            2
        )


    recent_threats = (
        db.query(TransactionDB)
        .filter(
            or_(
                TransactionDB.risk_level == "High",
                TransactionDB.risk_level == "Medium"
            )
        )
        .order_by(
            TransactionDB.created_at.desc()
        )
        .limit(5)
        .all()
    )


    return {


        "performance": {

            "total_transactions": total,

            "frauds_detected": frauds,

            "average_risk_score": avg_score,

            "avg_detection": 2.3,

            "detection_rate":
                round((frauds / total) * 100, 2)
                if total else 0

        },


        "ai_engine": {

            "status": "Online",

            "accuracy":
                round((safe / total) * 100, 2)
                if total else 0,

            "last_scan":
                datetime.utcnow().strftime("%H:%M:%S")

        },


        "threats": [

            {

                "merchant": t.merchant,
                "amount": t.amount,

                "risk": t.risk_level,

                "time":
                    t.created_at.strftime("%H:%M")

            }

            for t in recent_threats

        ]

    }

from sqlalchemy import func
from datetime import datetime


@app.get("/dashboard/trend")
def fraud_trend(
    db: Session = Depends(get_db)
):

    data = (
        db.query(
            func.date(TransactionDB.created_at).label("date"),
            func.count(TransactionDB.id).label("transactions")
        )
        .group_by(
            func.date(TransactionDB.created_at)
        )
        .order_by(
            func.date(TransactionDB.created_at)
        )
        .all()
    )


    return [

        {
            "date": row.date,
            "transactions": row.transactions
        }

        for row in data

    ]



@app.get("/api/transaction-chart-data")
async def transaction_chart_data(
    db: Session = Depends(get_db)
):

    transactions = (
        db.query(TransactionDB)
        .all()
    )

    safe = 0
    medium = 0
    high = 0

    for t in transactions:

        risk = str(t.risk_level or "").strip().lower()

        print(
            "Transaction:",
            t.transaction_id,
            "| Risk Level:",
            repr(t.risk_level)
        )

        if "high" in risk:
            high += 1

        elif "medium" in risk:
            medium += 1

        elif (
            "low" in risk
            or "safe" in risk
            or "legitimate" in risk
        ):
            safe += 1

    fraud_data = []

    for t in transactions:

        fraud_data.append({
            "id": t.transaction_id,
            "score": float(t.fraud_probability or 0)
        })

    print(
        "RISK DISTRIBUTION:",
        {
            "safe": safe,
            "medium": medium,
            "high": high
        }
    )

    return {
        "risk_distribution": {
            "safe": safe,
            "medium": medium,
            "high": high
        },
        "fraud_probability": fraud_data
    }