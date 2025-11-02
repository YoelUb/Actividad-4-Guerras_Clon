from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from src.Guerras_Clon.bd import models
from src.Guerras_Clon.security import security
from src.Guerras_Clon.security.auditing import create_audit_log
from src.Guerras_Clon.bd.database import get_db

router = APIRouter()


@router.post("/register", response_model=security.Token)
async def register_user(
        user_in: security.UserCreate,
        db: AsyncSession = Depends(get_db)
):

    db_user = await security.get_user(db, username=user_in.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = security.get_password_hash(user_in.password)
    new_user = models.User(
        username=user_in.username,
        hashed_password=hashed_password,
        role="jugador"
    )
    db.add(new_user)

    await create_audit_log(db, new_user.username, "USER_REGISTER", "Success")

    await db.commit()

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": new_user.username, "role": new_user.role},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/token", response_model=security.Token)
async def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: AsyncSession = Depends(get_db)
):

    user = await security.get_user(db, username=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        await create_audit_log(db, form_data.username, "USER_LOGIN", "Failed: Incorrect username or password")
        await db.commit()
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_role = user.role
    user_username = user.username

    await create_audit_log(db, user.username, "USER_LOGIN", "Success")
    await db.commit()

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user_username, "role": user_role},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=security.UserResponse)
async def read_users_me(
        current_user: models.User = Depends(security.get_current_user)
):

    return current_user