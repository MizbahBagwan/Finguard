from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Body
from app.services.ai_service import (
    analyze_transaction,
    ask_ai
)
from dotenv import load_dotenv
from app.models.transaction import Transaction
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import Depends
from app.database.connection import Base, engine, get_db
from app.models.transaction import Transaction
from app.models.transaction_db import TransactionDB

class ChatRequest(BaseModel):
    message: str
load_dotenv()


app = FastAPI(title="FinGuard AI")

Base.metadata.create_all(bind=engine)

# ----------------------------
# Base Directory
# ----------------------------
BASE_DIR = Path(__file__).resolve().parent

# ----------------------------
# Templates
# ----------------------------
templates = Jinja2Templates(
    directory=str(BASE_DIR / "templates")
)

# ----------------------------
# Static Files
# ----------------------------
app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR / "static")),
    name="static"
)

# ============================
# HOME
# ============================

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "title": "FinGuard Dashboard",
            "users": 120,
            "alerts": 5
        }
    )

# ============================
# DASHBOARD
# ============================

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "title": "FinGuard Dashboard",
            "users": 120,
            "alerts": 5
        }
    )

# ============================
# LOGIN
# ============================

@app.get("/login", response_class=HTMLResponse)
async def login(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={}
    )

# ============================
# REGISTER
# ============================

@app.get("/register", response_class=HTMLResponse)
async def register(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="register.html",
        context={}
    )

# ============================
# TRANSACTIONS
# ============================

@app.get("/transactions", response_class=HTMLResponse)
async def transactions(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="transactions.html",
        context={}
    )

# ============================
# REPORTS
# ============================

@app.get("/reports", response_class=HTMLResponse)
async def reports(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="reports.html",
        context={}
    )

# ============================
# SETTINGS
# ============================

@app.get("/settings", response_class=HTMLResponse)
async def settings(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="settings.html",
        context={}
    )

# ============================
# TEST
# ============================

@app.get("/test", response_class=HTMLResponse)
async def test(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="test.html",
        context={}
    )


@app.post("/analyze")
async def analyze(data: Transaction, db: Session = Depends(get_db)):

    result = analyze_transaction(data.model_dump())

    transaction = TransactionDB(
    amount=data.amount,
    merchant=data.merchant,
    location=data.location,
    time=data.time,
    card_type=data.card_type,
    risk_score=float(result["risk_score"].replace("%", "")),
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
@app.post("/api/ai/chat")
async def ai_chat(data: ChatRequest):

    response = ask_ai(data.message)

    return {
        "success": True,
        "reply": response
    }
