from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi import Body

from backend.app.database.connection import get_db
from backend.app.models.user import User
from backend.app.schemas.user import UserRegister
from backend.app.utils.security import hash_password, verify_password
from backend.app.utils.jwt import create_access_token, get_current_user

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# Register API
@router.post("/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registration Successful"
    }


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    if not verify_password(form_data.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid Email or Password"
        )

    access_token = create_access_token(
        data={"sub": db_user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
# Protected API
@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email
    }

@router.put("/two-factor")
def update_two_factor(
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.two_factor_enabled = data["enabled"]

    db.commit()

    return {
        "message": "Two-Factor Authentication Updated",
        "enabled": current_user.two_factor_enabled
    }