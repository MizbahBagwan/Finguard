from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

import os
import shutil
import uuid

from app.services.ocr_service import (
    extract_text,
    analyze_text
)

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png"
}


@router.post("/api/ocr")
async def run_ocr(file: UploadFile = File(...)):

    print("\n========== OCR API HIT ==========")

    if not file.filename:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "No file selected."
            }
        )

    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:

        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "Only JPG, JPEG and PNG images are supported."
            }
        )

    filename = f"{uuid.uuid4().hex}{extension}"

    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    try:

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print("========== FILE SAVED ==========")
        print(filepath)

        print("========== START OCR ==========")

        text = extract_text(filepath)

        if not text.strip():

            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "No readable text found in image."
                }
            )

        print("========== OCR TEXT ==========")
        print(text)

        result = analyze_text(text)

        result["success"] = True

        print("========== OCR COMPLETE ==========")

        result = analyze_text(text)

        print("========== OCR RESULT ==========")
        print(result)

        result["success"] = True

        print("========== OCR COMPLETE ==========")

        return JSONResponse(content=result)

    except Exception as e:

        print("========== OCR ERROR ==========")
        print(str(e))

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )

    finally:

        try:

            if os.path.exists(filepath):
                os.remove(filepath)

        except Exception as cleanup_error:

            print("Cleanup Error:", cleanup_error)
