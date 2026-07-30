from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from starlette.middleware.sessions import SessionMiddleware

from sqlalchemy.orm import Session
from pydantic import BaseModel

from dotenv import load_dotenv


# Database
from app.database.connection import Base, engine, get_db


# Models
from app.models.user import User
from app.models.transaction_db import TransactionDB
from app.models.investigation_db import InvestigationDB


# Services
from app.services.security import hash_password, verify_password
from app.services.ai_service import analyze_transaction, ask_ai
from app.services.report_service import generate_investigation_report
from app.services.ml_service import predict_transaction
from app.services.graph_service import analyze_transaction_graph


load_dotenv()


# Create database tables
Base.metadata.create_all(bind=engine)


# FastAPI app (ONLY ONE)
app = FastAPI()


# Session Middleware (ONLY ONE)
app.add_middleware(
    SessionMiddleware,
    secret_key="finguard_secret_key_123"
)


# Paths
BASE_DIR = Path(__file__).resolve().parent


# Templates
templates = Jinja2Templates(
    directory=str(BASE_DIR / "templates")
)


# Static files
app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR / "static")),
    name="static"
)
class ChatRequest(BaseModel):
    message: str


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



class RegisterRequest(BaseModel):

    username: str
    email: str
    password: str



class LoginRequest(BaseModel):

    email: str
    password: str

@app.get("/", response_class=HTMLResponse)
def home(request: Request):

    return templates.TemplateResponse(
        "login.html",
        {
            "request": request
        }
    )


@app.get("/login", response_class=HTMLResponse)
def login_page(request: Request):

    return templates.TemplateResponse(
        "login.html",
        {
            "request": request
        }
    )


@app.get("/register", response_class=HTMLResponse)
def register_page(request: Request):

    return templates.TemplateResponse(
        "register.html",
        {
            "request": request
        }
    )
@app.post("/api/register")
def register_user(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):

    existing = db.query(User).filter(
        User.email == data.email
    ).first()


    if existing:

        return {
            "success": False,
            "message": "Email already exists"
        }



    user = User(

        username=data.username,
        email=data.email,
        password=hash_password(data.password)

    )


    db.add(user)
    db.commit()
    db.refresh(user)


    return {

        "success": True,
        "message": "User created",
        "user_id": user.id

    }
@app.post("/api/login")
def login_user(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)

):

    user = db.query(User).filter(
        User.email == data.email
    ).first()



    if not user:

        return {

            "success": False,
            "message": "User not found"

        }



    if not verify_password(
        data.password,
        user.password
    ):

        return {

            "success": False,
            "message": "Incorrect password"

        }



    request.session["user"] = user.username



    return {

        "success": True,
        "message": "Login successful",
        "username": user.username

    }
@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):

    if "user" not in request.session:

        return templates.TemplateResponse(

            "login.html",

            {
                "request": request
            }

        )


    return templates.TemplateResponse(

        "dashboard.html",

        {

            "request": request,
            "username": request.session["user"]

        }

    )
@app.get("/test-session")
def test_session(request: Request):

    request.session["test"] = "ok"

    return {

        "message": "session working"

    }
from app.models.transaction import Transaction


@app.post("/analyze")
async def analyze(
    data: Transaction,
    db: Session = Depends(get_db)
):

    result = analyze_transaction(
        data.model_dump()
    )


    transaction = TransactionDB(

        amount=data.amount,
        merchant=data.merchant,
        location=data.location,
        time=data.time,
        card_type=data.card_type,

        risk_score=float(
            result["risk_score"].replace("%","")
        ),

        fraud_status=result["fraud_status"],

        reason=result["reason"],

        recommendation=result["recommendation"]

    )


    db.add(transaction)

    db.commit()

    db.refresh(transaction)



    return {

        "success": True,
        "analysis": result

    }
@app.post("/ai-report")
def ai_report():


    transaction = {

        "transaction_id": "TXN1001",
        "sender": "ACC1001",
        "receiver": "ACC2001",
        "amount": 50000

    }



    report = generate_investigation_report(

        transaction,

        fraud_score=92,

        ocr_result="PAN verified successfully",

        graph_summary="Connected with 5 suspicious accounts."

    )


    return report
@app.post("/predict")
def predict(
    data: PredictionRequest
):

    result = predict_transaction(
        data.model_dump()
    )


    return result
@app.post("/investigate")
def investigate(

    transaction: InvestigationRequest,

    db: Session = Depends(get_db)

):

    transaction_data = transaction.model_dump()


    try:


        ml_result = predict_transaction(
            transaction_data
        )


        if not ml_result.get("success"):

            return {

                "success": False,
                "ml_error": ml_result

            }



        graph_result = analyze_transaction_graph(

            transaction.account_id

        )



        ai_report = generate_investigation_report(

            transaction_data,

            fraud_score=ml_result["fraud_probability"],

            ocr_result="Not available",

            graph_summary=graph_result

        )



        investigation = InvestigationDB(

            transaction_id=transaction.transaction_id,

            prediction=ml_result["prediction"],

            fraud_probability=ml_result["fraud_probability"],

            risk_level=ai_report["risk_level"],

            summary=ai_report["summary"]

        )



        db.add(investigation)

        db.commit()



        return {


            "success": True,

            "investigation_time":
                datetime.now().isoformat(),

            "prediction":
                ml_result["prediction"],

            "fraud_probability":
                ml_result["fraud_probability"],

            "graph_analysis":
                graph_result,

            "ai_report":
                ai_report

        }



    except Exception as e:


        return {

            "success": False,

            "error": str(e)

        }
@app.get("/api/investigations")
def get_investigations(

    db: Session = Depends(get_db)

):

    reports = db.query(
        InvestigationDB
    ).all()


    return reports
@app.get("/api/dashboard")
def dashboard_stats(

    db: Session = Depends(get_db)

):

    investigations = db.query(
        InvestigationDB
    ).all()



    total = len(investigations)



    fraud_count = len([

        x for x in investigations

        if x.prediction == "Fraud"

    ])



    high_risk = len([

        x for x in investigations

        if x.risk_level == "High"

    ])



    average_score = 0



    if total > 0:

        average_score = sum(

            x.fraud_probability

            for x in investigations

        ) / total



    return {


        "total_investigations": total,

        "fraud_cases": fraud_count,

        "high_risk_cases": high_risk,

        "average_fraud_probability":
            round(average_score,2)

    }
@app.get("/api/transactions")
def get_transactions(

    db: Session = Depends(get_db)

):

    return db.query(
        TransactionDB
    ).all()



@app.get("/api/transaction-stats")
def transaction_stats(

    db: Session = Depends(get_db)

):

    transactions = db.query(
        TransactionDB
    ).all()



    total = len(transactions)


    fraud = len([

        t for t in transactions

        if t.fraud_status == "Fraud"

    ])



    return {


        "total_transactions": total,

        "fraud_transactions": fraud,

        "safe_transactions":
            total - fraud

    }