from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from sqlalchemy.orm import Session
from fastapi.templating import Jinja2Templates

from backend.app.database.connection import get_db
from backend.app.models.reports import ReportDB
from backend.app.models.transaction import TransactionDB

from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from pathlib import Path
import tempfile
import html


# ============================================================
# ROUTER
# ============================================================

router = APIRouter()


# ============================================================
# TEMPLATES
# ============================================================

templates = Jinja2Templates(
    directory="backend/app/templates"
)


# ============================================================
# HELPER - REPORT TO DICT
# ============================================================

def report_to_dict(report: ReportDB):

    return {
        "id": report.report_id,

        "db_id": report.id,

        "name": report.name or "Financial Report",

        "title": (
            report.title
            or "FinGuard AI Financial Security Report"
        ),

        "type": (
            report.report_type
            or "comprehensive"
        ),

        "created_at": (
            report.created_at.strftime(
                "%d %b %Y, %I:%M %p"
            )
            if report.created_at
            else ""
        ),

        "status": (
            report.status
            or "Completed"
        ),

        "total_transactions": (
            report.total_transactions or 0
        ),

        "fraud_detected": (
            report.fraud_detected or 0
        ),

        "high_risk": (
            report.high_risk or 0
        ),

        "medium_risk": (
            report.medium_risk or 0
        ),

        "safe_transactions": (
            report.safe_transactions or 0
        ),

        "average_risk": (
            report.average_risk or 0
        ),

        "start_date": (
            report.start_date or ""
        ),

        "end_date": (
            report.end_date or ""
        ),

        "include_ai": bool(
            report.include_ai
        ),

        "include_charts": bool(
            report.include_charts
        ),

        "ai_summary": (
            report.ai_summary or ""
        )
    }


# ============================================================
# HELPER - FIND REPORT
#
# Supports:
# INV-1001
# INV-1002
# 1
# 2
# 5
# ============================================================

def find_report(
    report_id: str,
    db: Session
):

    report_id = str(report_id).strip()

    # --------------------------------------------
    # First search by public report ID
    # --------------------------------------------

    report = (
    db.query(ReportDB)
    .filter(
        ((ReportDB.report_id == report_id) | (ReportDB.id == int(report_id) if report_id.isdigit() else False)) |
        (ReportDB.id == int(report_id) if report_id.isdigit() else False)
    )
    .first()
)

    if report:
        return report

    # --------------------------------------------
    # If numeric, also search database primary key
    # --------------------------------------------

    if report_id.isdigit():

        report = (
            db.query(ReportDB)
            .filter(
                ReportDB.id == int(report_id)
            )
            .first()
        )

        if report:
            return report

    return None


# ============================================================
# CALCULATE STATISTICS
# ============================================================

def calculate_statistics(
    db: Session
):

    transactions = (
        db.query(TransactionDB)
        .all()
    )

    total_transactions = len(
        transactions
    )

    fraud_detected = 0
    high_risk = 0
    medium_risk = 0
    safe_transactions = 0

    risk_scores = []

    for transaction in transactions:

        prediction = str(
            getattr(
                transaction,
                "prediction",
                ""
            )
            or ""
        ).lower().strip()

        risk_level = str(
            getattr(
                transaction,
                "risk_level",
                ""
            )
            or ""
        ).lower().strip()

        # ----------------------------------------
        # Fraud
        # ----------------------------------------

        if prediction in [
            "fraud",
            "fraudulent",
            "true",
            "1",
            "yes"
        ]:

            fraud_detected += 1

        # ----------------------------------------
        # Risk
        # ----------------------------------------

        if risk_level in [
            "high",
            "critical"
        ]:

            high_risk += 1

        elif risk_level in [
            "medium",
            "suspicious"
        ]:

            medium_risk += 1

        # ----------------------------------------
        # Safe
        # ----------------------------------------

        elif (
            prediction in [
                "safe",
                "legitimate",
                "legit"
            ]
            or risk_level in [
                "low",
                "safe"
            ]
        ):

            safe_transactions += 1

        # ----------------------------------------
        # Risk Score
        # ----------------------------------------

        try:

            score = float(
                getattr(
                    transaction,
                    "risk_score",
                    0
                )
                or 0
            )

            score = max(
                0,
                min(
                    100,
                    score
                )
            )

            risk_scores.append(score)

        except (
            ValueError,
            TypeError
        ):

            pass

    average_risk = (
        round(
            sum(risk_scores)
            / len(risk_scores),
            2
        )
        if risk_scores
        else 0
    )

    return {
        "total_transactions":
            total_transactions,

        "fraud_detected":
            fraud_detected,

        "high_risk":
            high_risk,

        "medium_risk":
            medium_risk,

        "safe_transactions":
            safe_transactions,

        "average_risk":
            average_risk
    }


# ============================================================
# REPORT PAGE
# ============================================================

@router.get("/reports")
async def reports_page(
    request: Request,
    db: Session = Depends(get_db)
):

    try:

        reports = (
            db.query(ReportDB)
            .order_by(
                ReportDB.created_at.desc()
            )
            .all()
        )

        stats = calculate_statistics(
            db
        )

        return templates.TemplateResponse(
            "reports.html",
            {
                "request": request,

                "reports": reports,

                "total_transactions":
                    stats[
                        "total_transactions"
                    ],

                "fraud_detected":
                    stats[
                        "fraud_detected"
                    ],

                "high_risk":
                    stats[
                        "high_risk"
                    ],

                "medium_risk":
                    stats[
                        "medium_risk"
                    ],

                "safe_transactions":
                    stats[
                        "safe_transactions"
                    ],

                "average_risk":
                    stats[
                        "average_risk"
                    ],

                "detection_accuracy":
                    0
            }
        )

    except Exception as e:

        print(
            "REPORT PAGE ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to load reports: {str(e)}"
            )
        )


# ============================================================
# GET ALL REPORTS
# ============================================================

@router.get("/api/reports")
async def get_reports(
    db: Session = Depends(get_db)
):

    try:

        reports_db = (
            db.query(ReportDB)
            .order_by(
                ReportDB.created_at.desc()
            )
            .all()
        )

        result = [
            report_to_dict(report)
            for report in reports_db
        ]

        return {
            "success": True,
            "reports": result,
            "count": len(result)
        }

    except Exception as e:

        print(
            "GET REPORTS ERROR:",
            e
        )

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "reports": [],
                "count": 0,
                "error": str(e)
            }
        )


# ============================================================
# GENERATE REPORT
# ============================================================

@router.post("/api/reports/generate")
async def generate_report(
    db: Session = Depends(get_db)
):

    try:

        stats = calculate_statistics(
            db
        )

        # --------------------------------------------
        # Find latest report
        # --------------------------------------------

        last_report = (
            db.query(ReportDB)
            .order_by(
                ReportDB.id.desc()
            )
            .first()
        )

        # --------------------------------------------
        # Generate next INV number
        # --------------------------------------------

        next_number = 1001

        if (
            last_report
            and last_report.report_id
        ):

            try:

                last_number = int(
                    str(
                        last_report.report_id
                    )
                    .replace(
                        "INV-",
                        ""
                    )
                )

                next_number = (
                    last_number + 1
                )

            except (
                ValueError,
                TypeError
            ):

                next_number = 1001

        report_id = (
            f"INV-{next_number}"
        )

        # --------------------------------------------
        # Create AI summary
        # --------------------------------------------

        ai_summary = (
            "FinGuard AI analyzed "
            f"{stats['total_transactions']} "
            "transactions. "
            f"{stats['fraud_detected']} potential "
            "fraudulent transactions were detected."
        )

        # --------------------------------------------
        # Create report
        # --------------------------------------------

        new_report = ReportDB(

            report_id=report_id,

            name="Financial Report",

            title=(
                "FinGuard AI "
                "Financial Security Report"
            ),

            report_type="comprehensive",

            status="Completed",

            total_transactions=
                stats[
                    "total_transactions"
                ],

            fraud_detected=
                stats[
                    "fraud_detected"
                ],

            high_risk=
                stats[
                    "high_risk"
                ],

            medium_risk=
                stats[
                    "medium_risk"
                ],

            safe_transactions=
                stats[
                    "safe_transactions"
                ],

            average_risk=
                stats[
                    "average_risk"
                ],

            start_date="",

            end_date="",

            include_ai=True,

            include_charts=True,

            ai_summary=ai_summary
        )

        db.add(
            new_report
        )

        db.commit()

        db.refresh(
            new_report
        )

        return {
            "success": True,

            "message":
                "Report generated successfully.",

            "report":
                report_to_dict(
                    new_report
                ),

            "download_url":
                f"/api/report/{new_report.report_id}/download"
        }

    except Exception as e:

        db.rollback()

        print(
            "REPORT GENERATION ERROR:",
            e
        )

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message":
                    "Report generation failed.",
                "error":
                    str(e)
            }
        )


# ============================================================
# GET SINGLE REPORT
#
# Supports:
# /api/report/INV-1001
# /api/report/5
# ============================================================

@router.get("/api/report/{report_id}")
async def get_report(
    report_id: str,
    db: Session = Depends(get_db)
):

    report = find_report(
        report_id,
        db
    )

    if not report:

        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    return {
        "success": True,
        "report":
            report_to_dict(
                report
            )
    }


# ============================================================
# VIEW REPORT PAGE
#
# Supports:
# /reports/INV-1001
# /reports/5
# ============================================================

@router.get("/reports/{report_id}")
async def view_report_page(
    report_id: str,
    request: Request,
    db: Session = Depends(get_db)
):

    report = find_report(
        report_id,
        db
    )

    if not report:

        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    data = report_to_dict(
        report
    )

    # --------------------------------------------
    # Return beautiful report HTML page
    # --------------------------------------------

    page = f"""
    <!DOCTYPE html>

    <html lang="en">

    <head>

        <meta charset="UTF-8">

        <meta name="viewport"
              content="width=device-width,
                       initial-scale=1.0">

        <title>
            {html.escape(data["title"])}
        </title>

        <style>

            * {{
                box-sizing: border-box;
            }}

            body {{
                margin: 0;
                padding: 40px;
                background: #070b14;
                color: #e5e7eb;
                font-family:
                    Arial,
                    sans-serif;
            }}

            .report {{
                max-width: 1100px;
                margin: auto;
                background: #111827;
                border: 1px solid #263247;
                border-radius: 20px;
                padding: 40px;
            }}

            .header {{
                display: flex;
                justify-content:
                    space-between;
                align-items: flex-start;
                gap: 30px;
                border-bottom:
                    1px solid #263247;
                padding-bottom: 25px;
            }}

            .brand {{
                color: #22d3ee;
                font-size: 14px;
                font-weight: bold;
                letter-spacing: 2px;
            }}

            h1 {{
                margin: 10px 0;
                color: white;
            }}

            .report-id {{
                color: #94a3b8;
            }}

            .status {{
                background: #063b2c;
                color: #34d399;
                padding: 8px 14px;
                border-radius: 20px;
                font-weight: bold;
            }}

            .grid {{
                display: grid;
                grid-template-columns:
                    repeat(3, 1fr);
                gap: 18px;
                margin-top: 30px;
            }}

            .card {{
                background: #182234;
                border: 1px solid #263247;
                border-radius: 14px;
                padding: 22px;
            }}

            .card span {{
                display: block;
                color: #94a3b8;
                font-size: 13px;
                margin-bottom: 10px;
            }}

            .card strong {{
                font-size: 28px;
                color: white;
            }}

            .summary {{
                margin-top: 30px;
                padding: 24px;
                background: #0d1727;
                border-radius: 14px;
                border: 1px solid #263247;
            }}

            .summary h2 {{
                margin-top: 0;
                color: #22d3ee;
            }}

            .actions {{
                margin-top: 30px;
                display: flex;
                gap: 12px;
            }}

            button,
            a {{
                border: none;
                text-decoration: none;
                padding: 12px 18px;
                border-radius: 10px;
                cursor: pointer;
                font-weight: bold;
            }}

            .back {{
                background: #263247;
                color: white;
            }}

            .download {{
                background: #2563eb;
                color: white;
            }}

            @media(max-width:700px) {{
                body {{
                    padding: 15px;
                }}

                .header {{
                    flex-direction: column;
                }}

                .grid {{
                    grid-template-columns: 1fr;
                }}
            }}

            @media print {{
                body {{
                    background: white;
                    color: black;
                    padding: 0;
                }}

                .report {{
                    border: none;
                    background: white;
                }}

                .actions {{
                    display: none;
                }}
            }}

        </style>

    </head>

    <body>

        <div class="report">

            <div class="header">

                <div>

                    <div class="brand">
                        FINGUARD AI
                    </div>

                    <h1>
                        {html.escape(data["title"])}
                    </h1>

                    <div class="report-id">
                        Report ID:
                        {html.escape(str(data["id"]))}
                    </div>

                    <div class="report-id">
                        Generated:
                        {html.escape(data["created_at"])}
                    </div>

                </div>

                <div class="status">
                    {html.escape(data["status"])}
                </div>

            </div>


            <div class="grid">

                <div class="card">
                    <span>
                        Total Transactions
                    </span>
                    <strong>
                        {data["total_transactions"]}
                    </strong>
                </div>

                <div class="card">
                    <span>
                        Fraud Detected
                    </span>
                    <strong>
                        {data["fraud_detected"]}
                    </strong>
                </div>

                <div class="card">
                    <span>
                        High Risk
                    </span>
                    <strong>
                        {data["high_risk"]}
                    </strong>
                </div>

                <div class="card">
                    <span>
                        Medium Risk
                    </span>
                    <strong>
                        {data["medium_risk"]}
                    </strong>
                </div>

                <div class="card">
                    <span>
                        Safe Transactions
                    </span>
                    <strong>
                        {data["safe_transactions"]}
                    </strong>
                </div>

                <div class="card">
                    <span>
                        Average Risk
                    </span>
                    <strong>
                        {data["average_risk"]}%
                    </strong>
                </div>

            </div>


            <div class="summary">

                <h2>
                    AI Security Summary
                </h2>

                <p>
                    {html.escape(
                        data["ai_summary"]
                        or "No AI summary available."
                    )}
                </p>

            </div>


            <div class="actions">

                <a
                    class="back"
                    href="/reports"
                >
                    ← Back to Reports
                </a>

                <a
                    class="download"
                    href="/api/report/{html.escape(str(data["id"]))}/download"
                >
                    ↓ Download Report
                </a>

            </div>

        </div>

    </body>

    </html>
    """

    return HTMLResponse(
        content=page
    )


# ============================================================
# DOWNLOAD REPORT
#
# /api/report/INV-1001/download
# /api/report/5/download
# ============================================================

@router.get("/api/report/{report_id}/download")
async def download_report(
    report_id: str,
    db: Session = Depends(get_db)
):

    try:

        report = (
            db.query(ReportDB)
            .filter(
                (ReportDB.report_id == report_id) | (ReportDB.id == int(report_id) if report_id.isdigit() else False)
            )
            .first()
        )

        if not report:
            raise HTTPException(
                status_code=404,
                detail="Report not found"
            )

        # Temporary PDF location
        pdf_path = (
            Path(tempfile.gettempdir())
            / f"{report.report_id}_FinGuard_Report.pdf"
        )

        # Create PDF
        pdf = canvas.Canvas(
            str(pdf_path),
            pagesize=A4
        )

        width, height = A4

        # -------------------------------
        # HEADER
        # -------------------------------

        pdf.setFillColor(
            colors.HexColor("#0B1220")
        )

        pdf.rect(
            0,
            height - 100,
            width,
            100,
            fill=1,
            stroke=0
        )

        pdf.setFillColor(colors.white)

        pdf.setFont(
            "Helvetica-Bold",
            22
        )

        pdf.drawString(
            40,
            height - 45,
            "FINGUARD AI"
        )

        pdf.setFont(
            "Helvetica",
            11
        )

        pdf.drawString(
            40,
            height - 68,
            "Financial Security Report"
        )

        # -------------------------------
        # REPORT INFORMATION
        # -------------------------------

        y = height - 140

        pdf.setFillColor(
            colors.HexColor("#111827")
        )

        pdf.setFont(
            "Helvetica-Bold",
            18
        )

        pdf.drawString(
            40,
            y,
            report.title or "Financial Security Report"
        )

        y -= 30

        pdf.setFillColor(
            colors.HexColor("#475569")
        )

        pdf.setFont(
            "Helvetica",
            10
        )

        pdf.drawString(
            40,
            y,
            f"Report ID: {report.report_id}"
        )

        y -= 18

        created = (
            report.created_at.strftime(
                "%d %b %Y, %I:%M %p"
            )
            if report.created_at
            else "Recently"
        )

        pdf.drawString(
            40,
            y,
            f"Generated: {created}"
        )

        y -= 18

        pdf.drawString(
            40,
            y,
            f"Status: {report.status or 'Completed'}"
        )

        # -------------------------------
        # STATISTICS
        # -------------------------------

        y -= 45

        pdf.setFillColor(
            colors.HexColor("#111827")
        )

        pdf.setFont(
            "Helvetica-Bold",
            14
        )

        pdf.drawString(
            40,
            y,
            "Transaction Statistics"
        )

        y -= 30

        statistics = [

            (
                "Total Transactions",
                report.total_transactions or 0
            ),

            (
                "Fraud Detected",
                report.fraud_detected or 0
            ),

            (
                "High Risk",
                report.high_risk or 0
            ),

            (
                "Medium Risk",
                report.medium_risk or 0
            ),

            (
                "Safe Transactions",
                report.safe_transactions or 0
            ),

            (
                "Average Risk",
                f"{report.average_risk or 0}%"
            )

        ]

        for label, value in statistics:

            pdf.setFillColor(
                colors.HexColor("#F1F5F9")
            )

            pdf.roundRect(
                40,
                y - 40,
                width - 80,
                50,
                6,
                fill=1,
                stroke=0
            )

            pdf.setFillColor(
                colors.HexColor("#2563EB")
            )

            pdf.setFont(
                "Helvetica-Bold",
                11
            )

            pdf.drawString(
                55,
                y - 20,
                label
            )

            pdf.setFillColor(
                colors.HexColor("#111827")
            )

            pdf.drawRightString(
                width - 55,
                y - 20,
                str(value)
            )

            y -= 62

        # -------------------------------
        # AI SUMMARY
        # -------------------------------

        y -= 10

        pdf.setFillColor(
            colors.HexColor("#111827")
        )

        pdf.setFont(
            "Helvetica-Bold",
            14
        )

        pdf.drawString(
            40,
            y,
            "AI Security Summary"
        )

        y -= 25

        pdf.setFillColor(
            colors.HexColor("#475569")
        )

        pdf.setFont(
            "Helvetica",
            10
        )

        summary = (
            report.ai_summary
            or
            "No AI security summary available."
        )

        # Wrap summary
        words = summary.split()
        line = ""

        for word in words:

            test = (
                line + " " + word
            ).strip()

            if pdf.stringWidth(
                test,
                "Helvetica",
                10
            ) < width - 80:

                line = test

            else:

                pdf.drawString(
                    40,
                    y,
                    line
                )

                y -= 16

                line = word

        if line:

            pdf.drawString(
                40,
                y,
                line
            )

        # -------------------------------
        # FOOTER
        # -------------------------------

        pdf.setFont(
            "Helvetica",
            8
        )

        pdf.setFillColor(
            colors.HexColor("#64748B")
        )

        pdf.drawString(
            40,
            30,
            "Generated by FinGuard AI"
        )

        pdf.drawRightString(
            width - 40,
            30,
            "Financial Security System"
        )

        # -------------------------------
        # VERY IMPORTANT
        # -------------------------------

        pdf.save()

        # Check file
        if not pdf_path.exists():
            raise HTTPException(
                status_code=500,
                detail="PDF was not created"
            )

        if pdf_path.stat().st_size < 1000:
            raise HTTPException(
                status_code=500,
                detail="Generated PDF is invalid"
            )

        # -------------------------------
        # RETURN REAL PDF
        # -------------------------------

        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=(
                f"{report.report_id}"
                "_FinGuard_Report.pdf"
            )
        )

    except HTTPException:
        raise

    except Exception as e:

        print(
            "PDF ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ============================================================
# DELETE REPORT
#
# Supports:
# /api/report/INV-1001
# /api/report/5
# ============================================================

@router.delete("/api/report/{report_id}")
async def delete_report(
    report_id: str,
    db: Session = Depends(get_db)
):

    report = (
        db.query(ReportDB)
        .filter(
            (ReportDB.report_id == report_id) | (ReportDB.id == int(report_id) if report_id.isdigit() else False)
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail=f"Report {report_id} not found"
        )

    try:

        db.delete(report)
        db.commit()

        return {
            "success": True,
            "message": "Report deleted successfully",
            "report_id": report_id
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ============================================================
# EXPORT ALL REPORTS
# ============================================================

@router.get(
    "/api/export-report"
)
async def export_report(
    db: Session = Depends(get_db)
):

    reports = (
        db.query(ReportDB)
        .order_by(
            ReportDB.created_at.desc()
        )
        .all()
    )

    return {
        "success": True,

        "message":
            "Report export endpoint is ready.",

        "count":
            len(reports),

        "reports": [
            report_to_dict(report)
            for report in reports
        ]
    }

# ============================================================
# DOWNLOAD SINGLE REPORT AS PDF
# ============================================================

@router.get("/api/report/{report_id}/download")
async def download_report(
    report_id: str,
    db: Session = Depends(get_db)
):

    try:

        # ----------------------------------------------------
        # FIND REPORT
        # ----------------------------------------------------

        report = (
            db.query(ReportDB)
            .filter(
                (ReportDB.report_id == report_id) | (ReportDB.id == int(report_id) if report_id.isdigit() else False)
            )
            .first()
        )

        if not report:

            raise HTTPException(
                status_code=404,
                detail="Report not found"
            )

        # ----------------------------------------------------
        # CREATE PDF IN MEMORY
        # ----------------------------------------------------

        pdf_buffer = BytesIO()

        document = SimpleDocTemplate(
            pdf_buffer,
            pagesize=A4,
            rightMargin=45,
            leftMargin=45,
            topMargin=45,
            bottomMargin=45
        )

        styles = getSampleStyleSheet()

        title_style = styles["Title"]
        title_style.alignment = TA_CENTER

        heading_style = styles["Heading2"]

        normal_style = styles["BodyText"]

        elements = []

        # ----------------------------------------------------
        # HEADER
        # ----------------------------------------------------

        elements.append(
            Paragraph(
                "FINGUARD AI",
                title_style
            )
        )

        elements.append(
            Spacer(1, 15)
        )

        elements.append(
            Paragraph(
                "FinGuard AI Financial Security Report",
                heading_style
            )
        )

        elements.append(
            Spacer(1, 15)
        )

        # ----------------------------------------------------
        # REPORT INFORMATION
        # ----------------------------------------------------

        elements.append(
            Paragraph(
                f"<b>Report ID:</b> {report.report_id}",
                normal_style
            )
        )

        elements.append(
            Spacer(1, 8)
        )

        created_at = (
            report.created_at.strftime(
                "%d %b %Y, %I:%M %p"
            )
            if report.created_at
            else "Recently"
        )

        elements.append(
            Paragraph(
                f"<b>Generated:</b> {created_at}",
                normal_style
            )
        )

        elements.append(
            Spacer(1, 8)
        )

        elements.append(
            Paragraph(
                f"<b>Status:</b> {report.status or 'Completed'}",
                normal_style
            )
        )

        elements.append(
            Spacer(1, 20)
        )

        # ----------------------------------------------------
        # TRANSACTION STATISTICS
        # ----------------------------------------------------

        elements.append(
            Paragraph(
                "Security Statistics",
                heading_style
            )
        )

        elements.append(
            Spacer(1, 10)
        )

        statistics = [

            (
                "Total Transactions",
                report.total_transactions or 0
            ),

            (
                "Fraud Detected",
                report.fraud_detected or 0
            ),

            (
                "High Risk",
                report.high_risk or 0
            ),

            (
                "Medium Risk",
                report.medium_risk or 0
            ),

            (
                "Safe Transactions",
                report.safe_transactions or 0
            ),

            (
                "Average Risk",
                f"{report.average_risk or 0}%"
            )

        ]

        for label, value in statistics:

            elements.append(
                Paragraph(
                    f"<b>{label}:</b> {value}",
                    normal_style
                )
            )

            elements.append(
                Spacer(1, 7)
            )

        # ----------------------------------------------------
        # AI SUMMARY
        # ----------------------------------------------------

        elements.append(
            Spacer(1, 15)
        )

        elements.append(
            Paragraph(
                "AI Security Summary",
                heading_style
            )
        )

        elements.append(
            Spacer(1, 10)
        )

        summary = (
            report.ai_summary
            or "No AI security summary available."
        )

        elements.append(
            Paragraph(
                summary,
                normal_style
            )
        )

        # ----------------------------------------------------
        # BUILD PDF
        # ----------------------------------------------------

        document.build(elements)

        pdf_buffer.seek(0)

        # ----------------------------------------------------
        # RETURN REAL PDF
        # ----------------------------------------------------

        filename = (
            f"{report.report_id}_FinGuard_Report.pdf"
        )

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                    f'attachment; filename="{filename}"'
            }
        )

    except HTTPException:
        raise

    except Exception as e:

        print(
            "PDF DOWNLOAD ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate PDF: {str(e)}"
        )

    # ============================================================
# DOWNLOAD SINGLE REPORT AS PDF
# ============================================================

@router.get("/api/report/{report_id}/download")
async def download_report(
    report_id: str,
    db: Session = Depends(get_db)
):

    try:

        # ----------------------------------------------------
        # FIND REPORT
        # ----------------------------------------------------

        report = (
            db.query(ReportDB)
            .filter(
                (ReportDB.report_id == report_id) | (ReportDB.id == int(report_id) if report_id.isdigit() else False)
            )
            .first()
        )

        if not report:

            raise HTTPException(
                status_code=404,
                detail=f"Report {report_id} not found"
            )

        # ----------------------------------------------------
        # TEMP PDF FILE
        # ----------------------------------------------------

        temp_dir = Path(tempfile.gettempdir())

        pdf_path = (
            temp_dir /
            f"{report.report_id}_FinGuard_Report.pdf"
        )

        # ----------------------------------------------------
        # CREATE PDF
        # ----------------------------------------------------

        pdf = canvas.Canvas(
            str(pdf_path),
            pagesize=A4
        )

        width, height = A4

        # ----------------------------------------------------
        # COLORS
        # ----------------------------------------------------

        navy = colors.HexColor("#0B1220")
        blue = colors.HexColor("#2563EB")
        cyan = colors.HexColor("#06B6D4")
        green = colors.HexColor("#10B981")
        red = colors.HexColor("#EF4444")
        gray = colors.HexColor("#64748B")
        light = colors.HexColor("#F1F5F9")

        # ----------------------------------------------------
        # HEADER
        # ----------------------------------------------------

        pdf.setFillColor(navy)

        pdf.rect(
            0,
            height - 100,
            width,
            100,
            fill=1,
            stroke=0
        )

        pdf.setFillColor(colors.white)

        pdf.setFont(
            "Helvetica-Bold",
            22
        )

        pdf.drawString(
            40,
            height - 45,
            "FINGUARD AI"
        )

        pdf.setFont(
            "Helvetica",
            10
        )

        pdf.drawString(
            40,
            height - 65,
            "Financial Security & Fraud Detection"
        )

        # ----------------------------------------------------
        # TITLE
        # ----------------------------------------------------

        y = height - 135

        pdf.setFillColor(navy)

        pdf.setFont(
            "Helvetica-Bold",
            18
        )

        pdf.drawString(
            40,
            y,
            report.title or "Financial Security Report"
        )

        y -= 30

        pdf.setFont(
            "Helvetica",
            10
        )

        pdf.setFillColor(gray)

        pdf.drawString(
            40,
            y,
            f"Report ID: {report.report_id}"
        )

        y -= 18

        created_at = (
            report.created_at.strftime(
                "%d %b %Y, %I:%M %p"
            )
            if report.created_at
            else "Recently"
        )

        pdf.drawString(
            40,
            y,
            f"Generated: {created_at}"
        )

        y -= 18

        pdf.drawString(
            40,
            y,
            f"Status: {report.status or 'Completed'}"
        )

        # ----------------------------------------------------
        # SUMMARY LINE
        # ----------------------------------------------------

        y -= 35

        pdf.setFillColor(light)

        pdf.roundRect(
            40,
            y - 45,
            width - 80,
            55,
            8,
            fill=1,
            stroke=0
        )

        pdf.setFillColor(blue)

        pdf.setFont(
            "Helvetica-Bold",
            12
        )

        pdf.drawString(
            55,
            y - 12,
            "Security Analysis Summary"
        )

        pdf.setFillColor(gray)

        pdf.setFont(
            "Helvetica",
            9
        )

        pdf.drawString(
            55,
            y - 30,
            "FinGuard AI financial transaction security analysis report"
        )

        # ----------------------------------------------------
        # STATISTICS
        # ----------------------------------------------------

        y -= 85

        pdf.setFillColor(navy)

        pdf.setFont(
            "Helvetica-Bold",
            14
        )

        pdf.drawString(
            40,
            y,
            "Transaction Statistics"
        )

        y -= 30

        box_width = (width - 100) / 2
        box_height = 55

        statistics = [

            (
                "Total Transactions",
                report.total_transactions or 0,
                blue
            ),

            (
                "Fraud Detected",
                report.fraud_detected or 0,
                red
            ),

            (
                "High Risk",
                report.high_risk or 0,
                red
            ),

            (
                "Medium Risk",
                report.medium_risk or 0,
                colors.HexColor("#F59E0B")
            ),

            (
                "Safe Transactions",
                report.safe_transactions or 0,
                green
            ),

            (
                "Average Risk",
                f"{report.average_risk or 0}%",
                cyan
            )

        ]

        positions = [

            (40, y),
            (50 + box_width, y),

            (40, y - 70),
            (50 + box_width, y - 70),

            (40, y - 140),
            (50 + box_width, y - 140)

        ]

        for (
            label,
            value,
            color
        ), (
            x,
            box_y
        ) in zip(
            statistics,
            positions
        ):

            pdf.setFillColor(
                colors.white
            )

            pdf.roundRect(
                x,
                box_y - box_height,
                box_width,
                box_height,
                8,
                fill=1,
                stroke=1
            )

            pdf.setFillColor(
                color
            )

            pdf.setFont(
                "Helvetica-Bold",
                16
            )

            pdf.drawString(
                x + 15,
                box_y - 25,
                str(value)
            )

            pdf.setFillColor(
                gray
            )

            pdf.setFont(
                "Helvetica",
                9
            )

            pdf.drawString(
                x + 15,
                box_y - 42,
                label
            )

        # ----------------------------------------------------
        # AI SUMMARY
        # ----------------------------------------------------

        y -= 225

        pdf.setFillColor(navy)

        pdf.setFont(
            "Helvetica-Bold",
            14
        )

        pdf.drawString(
            40,
            y,
            "AI Security Summary"
        )

        y -= 25

        pdf.setFillColor(gray)

        pdf.setFont(
            "Helvetica",
            10
        )

        summary = (
            report.ai_summary
            or
            "No AI security summary available."
        )

        # Simple text wrapping
        words = summary.split()

        line = ""

        for word in words:

            test_line = (
                line + " " + word
            ).strip()

            if pdf.stringWidth(
                test_line,
                "Helvetica",
                10
            ) < width - 80:

                line = test_line

            else:

                pdf.drawString(
                    40,
                    y,
                    line
                )

                y -= 16

                line = word

        if line:

            pdf.drawString(
                40,
                y,
                line
            )

        # ----------------------------------------------------
        # FOOTER
        # ----------------------------------------------------

        pdf.setFillColor(gray)

        pdf.setFont(
            "Helvetica",
            8
        )

        pdf.drawString(
            40,
            30,
            "Generated by FinGuard AI"
        )

        pdf.drawRightString(
            width - 40,
            30,
            "Financial Security Report"
        )

        # ----------------------------------------------------
        # SAVE PDF
        # ----------------------------------------------------

        pdf.save()

        # ----------------------------------------------------
        # VERIFY PDF
        # ----------------------------------------------------

        if not pdf_path.exists():

            raise HTTPException(
                status_code=500,
                detail="PDF file was not created"
            )

        if pdf_path.stat().st_size < 500:

            raise HTTPException(
                status_code=500,
                detail="Generated PDF is invalid"
            )

        # ----------------------------------------------------
        # RETURN PDF
        # ----------------------------------------------------

        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=(
                f"{report.report_id}"
                "_FinGuard_Report.pdf"
            ),
            headers={
                "Content-Disposition":
                    (
                        "attachment; "
                        f'filename="{report.report_id}'
                        '_FinGuard_Report.pdf"'
                    )
            }
        )

    except HTTPException:
        raise

    except Exception as e:

        print(
            "PDF DOWNLOAD ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=f"Unable to generate PDF: {str(e)}"
        )
