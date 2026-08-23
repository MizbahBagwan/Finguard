from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.financial import FinancialTransactionDB


def get_financial_summary(db: Session):

    total_income = (
        db.query(
            func.sum(FinancialTransactionDB.amount)
        )
        .filter(
            FinancialTransactionDB.transaction_type == "Income"
        )
        .scalar()
        or 0
    )

    total_expense = (
        db.query(
            func.sum(FinancialTransactionDB.amount)
        )
        .filter(
            FinancialTransactionDB.transaction_type == "Expense"
        )
        .scalar()
        or 0
    )

    balance = total_income - total_expense

    return {
        "total_income": round(float(total_income), 2),
        "total_expense": round(float(total_expense), 2),
        "balance": round(float(balance), 2)
    }


def get_category_summary(db: Session):

    result = (
        db.query(
            FinancialTransactionDB.category,
            func.sum(FinancialTransactionDB.amount)
        )
        .filter(
            FinancialTransactionDB.transaction_type == "Expense"
        )
        .group_by(
            FinancialTransactionDB.category
        )
        .all()
    )

    return [
        {
            "category": category,
            "amount": round(float(amount), 2)
        }
        for category, amount in result
    ]