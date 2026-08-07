from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from app.database.connection import Base

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")

reports = [
    {
        "id": "INV-1001",
        "title": "Credit Card Fraud",
        "risk": "Critical",
        "score": 95,
        "date": "05 Aug 2026",
        "status": "Completed"
    },
    {
        "id": "INV-1002",
        "title": "Money Laundering",
        "risk": "High",
        "score": 89,
        "date": "04 Aug 2026",
        "status": "Processing"
    },
    {
        "id": "INV-1003",
        "title": "Wire Transfer",
        "risk": "Medium",
        "score": 74,
        "date": "03 Aug 2026",
        "status": "Pending"
    }
]


@router.get("/reports")
async def reports_page(request: Request):

    return templates.TemplateResponse(
        "reports.html",
        {
            "request": request,
            "reports": reports
        }
    )


@router.get("/api/reports")
async def get_reports():
    return reports


@router.get("/api/report/{report_id}")
async def get_report(report_id: str):

    for report in reports:

        if report["id"] == report_id:

            return report

    return JSONResponse(
        status_code=404,
        content={"message": "Report not found"}
    )


@router.delete("/api/report/{report_id}")
async def delete_report(report_id: str):

    global reports

    reports = [r for r in reports if r["id"] != report_id]

    return {"message": "Deleted"}

    from fastapi.responses import JSONResponse

@router.post("/api/generate-report")
async def generate_report():

    new_report = {
        "id": f"INV-{1000 + len(reports) + 1}",
        "title": "New AI Investigation",
        "risk": "Medium",
        "score": 90,
        "date": "06 Aug 2026",
        "status": "Completed"
    }

    reports.insert(0, new_report)

    return JSONResponse(new_report)


@router.get("/api/export-report")
async def export_report():

    return JSONResponse(
        content={
            "reports": reports
        }
    )