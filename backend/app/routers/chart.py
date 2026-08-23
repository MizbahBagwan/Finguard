from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.services.chart_service import get_chart_data

router = APIRouter()


@router.get("/api/dashboard/charts")
def dashboard_charts(db: Session = Depends(get_db)):
    return get_chart_data(db)