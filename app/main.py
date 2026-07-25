from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path


app = FastAPI(title="FinGuard AI API")


BASE_DIR = Path(__file__).resolve().parent


templates = Jinja2Templates(
    directory=str(BASE_DIR / "templates")
)


@app.get("/")
def home():
    return {
        "message": "FinGuard AI API Running"
    }


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "title": "FinGuard Dashboard"
        }
    )


@app.get("/login", response_class=HTMLResponse)
def login(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={}
    )

@app.get("/dashboard")
def dashboard(request: Request):

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "title": "FinGuard Dashboard",
            "users": 120,
            "alerts": 5
        }
    )