# app/routers/settings.py

from datetime import datetime
from pathlib import Path
import json

from fastapi import (
    APIRouter,
    Request,
    Depends,
    Body,
    Form,
    HTTPException,
    UploadFile,
    File,
)
from fastapi.responses import (
    RedirectResponse,
    JSONResponse,
    StreamingResponse,
)
from fastapi.templating import Jinja2Templates

from sqlalchemy import Column, Integer, Text, DateTime
from sqlalchemy.orm import Session

from backend.app.database.connection import Base, engine, get_db
from backend.app.models.user import User
from backend.app.services.security import verify_password, hash_password


router = APIRouter()


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

templates = Jinja2Templates(
    directory=str(BASE_DIR / "templates")
)


# ============================================================
# DEFAULT SETTINGS
# ============================================================

DEFAULT_SETTINGS = {
    # Security
    "twoFactor": False,
    "loginAlerts": True,
    "sessionTimeout": "30",

    # AI Protection
    "aiProtectionLevel": "High",
    "autoFraudScan": True,
    "realTimeMonitoring": True,
    "aiLearning": True,
    "autoModelUpdate": True,
    "riskThreshold": 85,
    "smartDetection": True,

    # Notifications
    "emailNotifications": True,
    "smsNotifications": False,
    "pushNotifications": True,
    "highRiskAlerts": True,

    # Application
    "appTheme": "dark",
    "appLanguage": "en",
    "timeZone": "Asia/Kolkata",
    "dateFormat": "dd-mm-yyyy",

    # Privacy
    "activityLogs": True,
    "usageAnalytics": False,
    "dataSharing": True,
}


# ============================================================
# DATABASE MODEL
# ============================================================

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False,
        unique=True,
        index=True
    )

    settings_json = Column(
        Text,
        nullable=False,
        default="{}"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


# Create missing table if required
Base.metadata.create_all(bind=engine)


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(
    request: Request,
    db: Session
):
    username = request.session.get("user")

    if not username:
        return None

    user = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    return user


# ============================================================
# GET OR CREATE SETTINGS
# ============================================================

def get_or_create_settings(
    user: User,
    db: Session
):
    settings = (
        db.query(UserSettings)
        .filter(
            UserSettings.user_id == user.id
        )
        .first()
    )

    if not settings:

        settings = UserSettings(
            user_id=user.id,
            settings_json=json.dumps(
                DEFAULT_SETTINGS
            )
        )

        db.add(settings)
        db.commit()
        db.refresh(settings)

        return settings

    try:
        saved_settings = json.loads(
            settings.settings_json or "{}"
        )

    except Exception:
        saved_settings = {}

    changed = False

    for key, value in DEFAULT_SETTINGS.items():

        if key not in saved_settings:

            saved_settings[key] = value
            changed = True

    if changed:

        settings.settings_json = json.dumps(
            saved_settings
        )

        settings.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(settings)

    return settings


# ============================================================
# LOAD SETTINGS
# ============================================================

def load_settings(
    user: User,
    db: Session
):

    settings = get_or_create_settings(
        user,
        db
    )

    try:

        data = json.loads(
            settings.settings_json or "{}"
        )

    except Exception:

        data = {}

    result = DEFAULT_SETTINGS.copy()

    result.update(data)

    return result


# ============================================================
# SAVE SETTINGS
# ============================================================

def save_settings_to_db(
    user: User,
    data: dict,
    db: Session
):

    current = load_settings(
        user,
        db
    )

    for key in DEFAULT_SETTINGS:

        if key in data:

            current[key] = data[key]

    settings = get_or_create_settings(
        user,
        db
    )

    settings.settings_json = json.dumps(
        current
    )

    settings.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(settings)

    return current


# ============================================================
# SETTINGS PAGE
# ============================================================

@router.get(
    "/settings",
    response_class=JSONResponse
)
def settings_page(
    request: Request,
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        return RedirectResponse(
            url="/login",
            status_code=303
        )

    settings = load_settings(
        user,
        db
    )

    return templates.TemplateResponse(
        "settings.html",
        {
            "request": request,
            "user": user,
            "settings": settings,
            "active_page": "settings",
        }
    )


# ============================================================
# GET SETTINGS
# ============================================================

@router.get("/api/settings")
def get_settings(
    request: Request,
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    settings = load_settings(
        user,
        db
    )

    return {
        "success": True,
        "settings": settings,
        "last_saved": datetime.utcnow().isoformat()
    }


# ============================================================
# SAVE ALL SETTINGS
# ============================================================

@router.post("/api/settings/save")
def save_settings(
    request: Request,
    data: dict = Body(...),
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    # --------------------------------------------------------
    # AI PROTECTION LEVEL
    # --------------------------------------------------------

    allowed_ai_levels = {
        "Maximum",
        "High",
        "Balanced",
        "Low"
    }

    if "aiProtectionLevel" in data:

        if (
            data["aiProtectionLevel"]
            not in allowed_ai_levels
        ):

            raise HTTPException(
                status_code=400,
                detail="Invalid AI protection level"
            )

    # --------------------------------------------------------
    # RISK THRESHOLD
    # --------------------------------------------------------

    if "riskThreshold" in data:

        try:

            risk = int(
                data["riskThreshold"]
            )

        except Exception:

            raise HTTPException(
                status_code=400,
                detail="Invalid risk threshold"
            )

        if risk < 50 or risk > 100:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Risk threshold must be "
                    "between 50 and 100"
                )
            )

        data["riskThreshold"] = risk

    # --------------------------------------------------------
    # SESSION TIMEOUT
    # --------------------------------------------------------

    if "sessionTimeout" in data:

        allowed_timeout = {
            "10",
            "15",
            "30",
            "60"
        }

        timeout = str(
            data["sessionTimeout"]
        )

        if timeout not in allowed_timeout:

            raise HTTPException(
                status_code=400,
                detail="Invalid session timeout"
            )

        data["sessionTimeout"] = timeout

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    saved = save_settings_to_db(
        user,
        data,
        db
    )

    # --------------------------------------------------------
    # TWO FACTOR SYNC
    # --------------------------------------------------------

    if "twoFactor" in data:

        if hasattr(
            user,
            "two_factor_enabled"
        ):

            user.two_factor_enabled = bool(
                data["twoFactor"]
            )

            db.commit()

    return {
        "success": True,
        "message": "Settings saved successfully",
        "settings": saved,
        "saved_at": datetime.utcnow().isoformat()
    }


# ============================================================
# RESET SETTINGS
# ============================================================

@router.post("/api/settings/reset")
def reset_settings(
    request: Request,
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    settings = get_or_create_settings(
        user,
        db
    )

    settings.settings_json = json.dumps(
        DEFAULT_SETTINGS
    )

    settings.updated_at = datetime.utcnow()

    if hasattr(
        user,
        "two_factor_enabled"
    ):

        user.two_factor_enabled = False

    db.commit()

    return {
        "success": True,
        "message": "All settings restored to default",
        "settings": DEFAULT_SETTINGS
    }


# ============================================================
# PROFILE GET
# ============================================================

@router.get("/api/profile")
def get_profile(
    request: Request,
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    return {
        "success": True,
        "profile": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "two_factor_enabled": getattr(
                user,
                "two_factor_enabled",
                False
            )
        }
    }


# ============================================================
# PROFILE UPDATE API
# ============================================================

@router.put("/api/profile")
def update_profile_api(
    request: Request,
    data: dict = Body(...),
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    name = str(
        data.get("name", "")
    ).strip()

    email = str(
        data.get("email", "")
    ).strip()

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Name is required"
        )

    if not email:

        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )

    existing_user = (
        db.query(User)
        .filter(
            User.username == name,
            User.id != user.id
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    existing_email = (
        db.query(User)
        .filter(
            User.email == email,
            User.id != user.id
        )
        .first()
    )

    if existing_email:

        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    user.username = name
    user.email = email

    db.commit()
    db.refresh(user)

    request.session["user"] = user.username
    request.session["email"] = user.email

    return {
        "success": True,
        "message": "Profile updated successfully",
        "profile": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }


# ============================================================
# OLD PROFILE FORM
# ============================================================

@router.post("/profile/update")
def update_profile_form(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    db: Session = Depends(get_db)
):

    try:

        update_profile_api(
            request,
            {
                "name": name,
                "email": email
            },
            db
        )

        request.session["success"] = (
            "Profile updated successfully!"
        )

        return RedirectResponse(
            url="/settings",
            status_code=303
        )

    except HTTPException as e:

        return JSONResponse(
            status_code=e.status_code,
            content={
                "error": e.detail
            }
        )


# ============================================================
# CHANGE PASSWORD API
# ============================================================

@router.post("/api/change-password")
def change_password_api(
    request: Request,
    data: dict = Body(...),
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    current_password = data.get(
        "currentPassword",
        ""
    )

    new_password = data.get(
        "newPassword",
        ""
    )

    confirm_password = data.get(
        "confirmPassword",
        ""
    )

    if not verify_password(
        current_password,
        user.password
    ):

        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    if len(new_password) < 8:

        raise HTTPException(
            status_code=400,
            detail=(
                "New password must be "
                "at least 8 characters"
            )
        )

    if new_password != confirm_password:

        raise HTTPException(
            status_code=400,
            detail="Passwords do not match"
        )

    user.password = hash_password(
        new_password
    )

    db.commit()

    return {
        "success": True,
        "message": "Password updated successfully"
    }


# ============================================================
# CHANGE PASSWORD PAGE
# ============================================================

@router.get("/change-password")
def change_password_page(
    request: Request
):

    return templates.TemplateResponse(
        "change_password.html",
        {
            "request": request
        }
    )


# ============================================================
# OLD PASSWORD FORM
# ============================================================

@router.post("/password/update")
def update_password_form(
    request: Request,
    current_password: str = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...),
    db: Session = Depends(get_db)
):

    return change_password_api(
        request,
        {
            "currentPassword": current_password,
            "newPassword": new_password,
            "confirmPassword": confirm_password
        },
        db
    )


# ============================================================
# ACTIVE DEVICES
# ============================================================

@router.get("/api/devices")
def get_devices(
    request: Request
):

    if not request.session.get("user"):

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    return {
        "success": True,
        "devices": [
            {
                "id": "current",
                "device": "Current Browser",
                "status": "Active",
                "current": True,
                "last_active":
                    datetime.utcnow().isoformat()
            }
        ]
    }


# ============================================================
# LOGOUT ALL DEVICES
# ============================================================

@router.post("/api/logout-all")
def logout_all_devices(
    request: Request
):

    if not request.session.get("user"):

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    return {
        "success": True,
        "message":
            "Other sessions have been requested to logout"
    }


# ============================================================
# EXPORT SETTINGS
# ============================================================

@router.get("/api/settings/export")
def export_settings(
    request: Request,
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    settings = load_settings(
        user,
        db
    )

    export_data = {
        "application": "FinGuard AI",
        "version": "1.0",
        "exported_at":
            datetime.utcnow().isoformat(),
        "username": user.username,
        "settings": settings
    }

    content = json.dumps(
        export_data,
        indent=4
    ).encode("utf-8")

    return StreamingResponse(
        iter([content]),
        media_type="application/json",
        headers={
            "Content-Disposition":
                'attachment; filename="finguard-settings.json"'
        }
    )


# ============================================================
# BACKUP
# ============================================================

@router.get("/api/settings/backup")
def backup_settings(
    request: Request,
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    settings = load_settings(
        user,
        db
    )

    backup = {
        "backup_type": "settings",
        "created_at":
            datetime.utcnow().isoformat(),
        "user": user.username,
        "settings": settings
    }

    content = json.dumps(
        backup,
        indent=4
    ).encode("utf-8")

    return StreamingResponse(
        iter([content]),
        media_type="application/json",
        headers={
            "Content-Disposition":
                'attachment; filename="finguard-settings-backup.json"'
        }
    )


# ============================================================
# RESTORE SETTINGS
# ============================================================

@router.post("/api/settings/restore")
async def restore_settings(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    filename = (
        file.filename or ""
    ).lower()

    if not filename.endswith(".json"):

        raise HTTPException(
            status_code=400,
            detail=(
                "Only JSON backup files "
                "are supported"
            )
        )

    content = await file.read()

    try:

        backup = json.loads(
            content.decode("utf-8")
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid backup file"
        )

    restored = backup.get(
        "settings",
        backup
    )

    if not isinstance(
        restored,
        dict
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid settings format"
        )

    saved = save_settings_to_db(
        user,
        restored,
        db
    )

    if "twoFactor" in saved:

        if hasattr(
            user,
            "two_factor_enabled"
        ):

            user.two_factor_enabled = bool(
                saved["twoFactor"]
            )

            db.commit()

    return {
        "success": True,
        "message":
            "Settings restored successfully",
        "settings": saved
    }


# ============================================================
# CLEAR CACHE
# ============================================================

@router.post("/api/cache/clear")
def clear_cache(
    request: Request
):

    if not request.session.get("user"):

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    return {
        "success": True,
        "message":
            "Application cache cleared successfully"
    }


# ============================================================
# DELETE ACCOUNT
# ============================================================

@router.delete("/api/account/delete")
def delete_account(
    request: Request,
    data: dict = Body(default={}),
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    password = data.get("password")

    if password:

        if not verify_password(
            password,
            user.password
        ):

            raise HTTPException(
                status_code=400,
                detail="Incorrect password"
            )

    db.query(UserSettings).filter(
        UserSettings.user_id == user.id
    ).delete(
        synchronize_session=False
    )

    db.delete(user)
    db.commit()

    request.session.clear()

    return {
        "success": True,
        "message":
            "Account deleted successfully"
    }


# ============================================================
# 2FA QUICK TOGGLE
# ============================================================

@router.post("/api/2fa")
def update_2fa(
    request: Request,
    data: dict = Body(...),
    db: Session = Depends(get_db)
):

    user = get_current_user(
        request,
        db
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Please login"
        )

    enabled = bool(
        data.get(
            "enabled",
            False
        )
    )

    if hasattr(
        user,
        "two_factor_enabled"
    ):

        user.two_factor_enabled = enabled

    save_settings_to_db(
        user,
        {
            "twoFactor": enabled
        },
        db
    )

    db.commit()

    return {
        "success": True,
        "twoFactor": enabled,
        "message": (
            "Two-factor authentication enabled"
            if enabled
            else
            "Two-factor authentication disabled"
        )
    }

