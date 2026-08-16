from pathlib import Path
import json

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates


router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "ml"

templates = Jinja2Templates(
    directory=str(BASE_DIR / "app" / "templates")
)


@router.get(
    "/model-performance",
    response_class=HTMLResponse
)
async def model_performance(request: Request):

    metadata_path = MODEL_DIR / "model_metadata.json"

    metadata = {}

    if metadata_path.exists():
        with open(
            metadata_path,
            "r",
            encoding="utf-8"
        ) as file:
            metadata = json.load(file)

    return templates.TemplateResponse(
        "model_performance.html",
        {
            "request": request,
            "metadata": metadata
        }
    )