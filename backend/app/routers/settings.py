from fastapi import APIRouter, Request, Form, Depends
from fastapi.responses import RedirectResponse
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi import APIRouter, Request, Form, Depends, Body
from app.database.connection import get_db
from app.models.user import User
from app.services.security import verify_password, hash_password
from sqlalchemy.orm import Session
router = APIRouter()

templates = Jinja2Templates(
    directory="app/templates"
)


@router.post("/api/settings/save")
def save_settings(data: dict = Body(...)):

    return {
        "message": "Settings saved successfully"
    }



@router.get("/profile/edit")
def edit_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    username = request.session.get("user")

    if not username:
        return RedirectResponse(
            url="/login",
            status_code=303
        )

    user = db.query(User).filter(
        User.username == username
    ).first()

    success = request.session.pop("success", None)

    return templates.TemplateResponse(
        "edit_profile.html",
        {
            "request": request,
            "user": user,
            "success": success
        }
    )


@router.get("/change-password")
def change_password(request: Request):

    return templates.TemplateResponse(
        "change_password.html",
        {
            "request": request
        }
    )

from sqlalchemy.orm import Session

@router.post("/password/update")
def update_password(
    request: Request,
    current_password: str = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...),
    db: Session = Depends(get_db),
):
    username = request.session.get("user")

    if not username:
        return {"error": "Please login again"}

    user = db.query(User).filter(User.username == username).first()

    if user is None:
        return {"error": "User not found"}

    print("Session Username:", username)
    print("DB Username:", user.username)
    print("Current Password:", current_password)
    print("Stored Hash:", user.password)
    print("Password Match:", verify_password(current_password, user.password))

    if not verify_password(current_password, user.password):
        return {"error": "Current password is incorrect"}

    if new_password != confirm_password:
        return {"error": "Passwords do not match"}

    user.password = hash_password(new_password)
    db.commit()

    return RedirectResponse(
        url="/change-password",
        status_code=303
    )
from fastapi.responses import RedirectResponse

@router.post("/profile/update")
def update_profile(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    db: Session = Depends(get_db)
):
    username = request.session.get("user")

    if not username:
        return RedirectResponse(
            url="/login",
            status_code=303
        )

    user = db.query(User).filter(
        User.username == username
    ).first()

    if not user:
        return {"error": "User not found"}

    user.username = name
    user.email = email

    db.commit()

    request.session["user"] = user.username
    request.session["success"] = "Profile updated successfully!"

    return RedirectResponse(
        url="/profile/edit",
        status_code=303
    )

@router.get("/settings")
def settings(
    request: Request,
    db: Session = Depends(get_db)
):
    username = request.session.get("user")

    if not username:
        return RedirectResponse(
            url="/login",
            status_code=303
        )

    user = db.query(User).filter(
        User.username == username
    ).first()

    return templates.TemplateResponse(
        "settings.html",
        {
            "request": request,
            "user": user
        }
    )

@router.post("/api/settings/save")
def save_settings(
    request: Request,
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    username = request.session.get("user")

    if not username:
        return {"message": "Please login"}

    user = db.query(User).filter(
        User.username == username
    ).first()

    if not user:
        return {"message": "User not found"}

    user.two_factor_enabled = data.get("twoFactor", False)

    db.commit()

    return {
        "message": "Settings saved successfully"
    }