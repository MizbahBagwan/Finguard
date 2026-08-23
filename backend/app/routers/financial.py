from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel

from backend.app.database.connection import get_db
from backend.app.models.financial import FinancialTransactionDB


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/financial",
    tags=["Financial Management"]
)


# ============================================================
# REQUEST MODEL
# ============================================================

class FinancialTransactionRequest(BaseModel):

    transaction_id: str

    account_id: str

    transaction_type: str

    category: str

    amount: float

    description: str = ""


# ============================================================
# ADD FINANCIAL TRANSACTION
# ============================================================

@router.post("/transactions")
def add_financial_transaction(
    data: FinancialTransactionRequest,
    db: Session = Depends(get_db)
):

    transaction = FinancialTransactionDB(

        transaction_id=data.transaction_id,

        account_id=data.account_id,

        transaction_type=data.transaction_type,

        category=data.category,

        amount=data.amount,

        description=data.description

    )

    db.add(transaction)

    db.commit()

    db.refresh(transaction)

    return {

        "success": True,

        "transaction_id":
            transaction.transaction_id

    }


# ============================================================
# FINANCIAL SUMMARY
# ============================================================

@router.get("/summary")
def financial_summary(
    db: Session = Depends(get_db)
):

    # ------------------------------------------
    # TOTAL INCOME
    # ------------------------------------------

    total_income = (

        db.query(

            func.sum(
                FinancialTransactionDB.amount
            )

        )

        .filter(

            FinancialTransactionDB.transaction_type
            == "Income"

        )

        .scalar()

        or 0

    )


    # ------------------------------------------
    # TOTAL EXPENSES
    # ------------------------------------------

    total_expenses = (

        db.query(

            func.sum(
                FinancialTransactionDB.amount
            )

        )

        .filter(

            FinancialTransactionDB.transaction_type
            == "Expense"

        )

        .scalar()

        or 0

    )


    # ------------------------------------------
    # BALANCE
    # ------------------------------------------

    balance = (
        total_income -
        total_expenses
    )


    return {

        "total_income":
            float(total_income),

        "total_expenses":
            float(total_expenses),

        "balance":
            float(balance)

    }


# ============================================================
# FINANCIAL CATEGORIES
# ============================================================

@router.get("/categories")
def financial_categories(
    db: Session = Depends(get_db)
):

    result = (

        db.query(

            FinancialTransactionDB.category,

            func.sum(
                FinancialTransactionDB.amount
            ).label("total")

        )

        .filter(

            FinancialTransactionDB.transaction_type
            == "Expense"

        )

        .group_by(

            FinancialTransactionDB.category

        )

        .order_by(

            func.sum(
                FinancialTransactionDB.amount
            ).desc()

        )

        .all()

    )


    return [

        {

            "category":
                category,

            "amount":
                float(total)

        }

        for category, total in result

    ]


# ============================================================
# ALL FINANCIAL TRANSACTIONS
# ============================================================

@router.get("/transactions")
def get_financial_transactions(
    db: Session = Depends(get_db)
):

    transactions = (

        db.query(
            FinancialTransactionDB
        )

        .order_by(

            desc(
                FinancialTransactionDB.id
            )

        )

        .all()

    )


    return [

        {

            "transaction_id":
                transaction.transaction_id,

            "account_id":
                transaction.account_id,

            "transaction_type":
                transaction.transaction_type,

            "category":
                transaction.category,

            "amount":
                float(transaction.amount),

            "description":
                transaction.description or "",

            "date":

                (
                    transaction.date.isoformat()

                    if transaction.date

                    else None
                )

        }

        for transaction in transactions

    ]


# ============================================================
# RECENT FINANCIAL TRANSACTIONS
# ============================================================
#
# Dashboard ke liye latest 10 transactions.
#
# Is endpoint ko financial_management.js use karega:
#
# /financial/recent-transactions
#
# ============================================================

@router.get("/recent-transactions")
def get_recent_financial_transactions(
    db: Session = Depends(get_db)
):

    transactions = (

        db.query(
            FinancialTransactionDB
        )

        .order_by(

            desc(
                FinancialTransactionDB.id
            )

        )

        .limit(10)

        .all()

    )


    return [

        {

            "transaction_id":
                transaction.transaction_id,

            "account_id":
                transaction.account_id,

            "transaction_type":
                transaction.transaction_type,

            "category":
                transaction.category,

            "amount":
                float(transaction.amount),

            "description":
                transaction.description or "",

            "date":

                (
                    transaction.date.isoformat()

                    if transaction.date

                    else None
                )

        }

        for transaction in transactions

    ]