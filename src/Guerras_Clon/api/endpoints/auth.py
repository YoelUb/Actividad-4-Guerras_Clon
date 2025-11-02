from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from datetime import timedelta, datetime, timezone
from src.Guerras_Clon.bd import models
from src.Guerras_Clon.security import security
from src.Guerras_Clon.security.auditing import create_audit_log
from src.Guerras_Clon.bd.database import get_db
from pydantic import BaseModel, EmailStr
import random
import string
import logging
from pydantic import SecretStr
import asyncio
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from src.Guerras_Clon.core.config import settings
import re


router = APIRouter()
logger = logging.getLogger("Guerras_Clon.auth")


USERNAME_REGEX = r"^(?=.*[a-zA-Z])[a-zA-Z0-9]{4,20}$"
PASSWORD_REGEX = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+-=\[\]{};':\"\\|,.<>\/?]).{8,}$"

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS
)


class VerifyRequest(BaseModel):
    email: str
    code: str


class UpdateCredentialsRequest(BaseModel):
    username: str
    password: str


async def send_verification_email(to_email: str, code: str):
    logger.info(f"Iniciando envío de correo de verificación a: {to_email}")

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #0a0a0a; border: 1px solid #ffe81f; border-radius: 10px; padding: 20px; color: #ffffff;">
            <h2 style="color: #ffe81f; text-align: center;">¡Bienvenido a Guerras Clon!</h2>
            <p style="font-size: 16px; color: #ffffff;">Gracias por registrarte. Tu código de verificación es:</p>
            <h1 style="color: #0a0a0a; background: #ffe81f; padding: 15px 25px; border-radius: 5px; text-align: center; font-size: 32px; letter-spacing: 3px;">
                {code}
            </h1>
            <p style="font-size: 14px; color: #dddddd;">Este código caducará en 20 minutos.</p>
            <p style="font-size: 12px; color: #888888; text-align: center; margin-top: 20px;">
                Si no te has registrado tú, por favor ignora este correo.
            </p>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="Tu Código de Verificación de Guerras Clon",
        recipients=[to_email],
        body=html_content,
        subtype=MessageType.html
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"Correo de verificación enviado exitosamente a: {to_email}")
    except Exception as e:
        logger.error(f"Error al enviar correo a {to_email}: {e}")


def generate_verification_code(length=6):
    return ''.join(random.choices(string.digits, k=length))


@router.post("/register/request", status_code=202)
async def request_registration(
        user_in: security.UserCreate,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db)
):
    db_user = await security.get_user(db, username=user_in.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Ese nombre de usuario ya está registrado.")

    db_email = await security.get_user_by_email(db, email=user_in.email)
    if db_email:
        raise HTTPException(status_code=400, detail="Ese email ya está registrado.")

    if not re.match(USERNAME_REGEX, user_in.username):
        raise HTTPException(status_code=400,
                            detail="Usuario inválido. Debe tener 4-20 caracteres, contener al menos una letra y solo puede usar letras y números.")

    if not re.match(PASSWORD_REGEX, user_in.password):
        raise HTTPException(status_code=400,
                            detail="Contraseña insegura. Debe tener mín 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.")

    existing_code_stmt = delete(models.VerificationCode).where(models.VerificationCode.email == user_in.email)
    await db.execute(existing_code_stmt)

    hashed_password = security.get_password_hash(user_in.password)
    code = generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=20)

    new_code = models.VerificationCode(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hashed_password,
        code=code,
        expires_at=expires_at
    )
    db.add(new_code)
    await db.commit()

    background_tasks.add_task(send_verification_email, user_in.email, code)

    return {"message": "Se ha enviado un código de verificación a tu correo."}


@router.post("/register/verify", response_model=security.Token)
async def verify_registration(
        verify_data: VerifyRequest,
        db: AsyncSession = Depends(get_db)
):
    stmt = select(models.VerificationCode).where(
        models.VerificationCode.email == verify_data.email,
        models.VerificationCode.code == verify_data.code
    )
    result = await db.execute(stmt)
    pending_user = result.scalars().first()

    if not pending_user:
        raise HTTPException(status_code=400, detail="Código o email incorrecto.")

    if datetime.now(timezone.utc) > pending_user.expires_at:
        await db.delete(pending_user)
        await db.commit()
        raise HTTPException(status_code=400, detail="El código de verificación ha expirado.")

    new_user = models.User(
        username=pending_user.username,
        email=pending_user.email,
        hashed_password=pending_user.hashed_password,
        role="jugador"
    )
    db.add(new_user)

    await db.delete(pending_user)

    await create_audit_log(db, new_user.username, "USER_REGISTER", "Success")
    await db.commit()
    await db.refresh(new_user)

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


@router.post("/update-me", response_model=security.Token)
async def update_own_credentials(
        creds: UpdateCredentialsRequest,
        db: AsyncSession = Depends(get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    if not creds.username or not creds.password:
        raise HTTPException(status_code=400, detail="Username and password are required")

    if current_user.must_change_password and creds.username == current_user.username:
        raise HTTPException(status_code=400,
                            detail="Debe elegir un nombre de usuario nuevo, no puede usar el de por defecto.")

    if creds.username != current_user.username:
        existing_user = await security.get_user(db, username=creds.username)
        if existing_user:
            raise HTTPException(status_code=400, detail="Ese nombre de usuario ya está registrado.")

    if not re.match(USERNAME_REGEX, creds.username):
        raise HTTPException(status_code=400,
                            detail="Usuario inválido. Debe tener 4-20 caracteres, contener al menos una letra y solo puede usar letras y números.")

    if not re.match(PASSWORD_REGEX, creds.password):
        raise HTTPException(status_code=400,
                            detail="Contraseña insegura. Debe tener mín 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.")

    current_user.username = creds.username
    hashed_password = security.get_password_hash(creds.password)
    current_user.hashed_password = hashed_password
    current_user.must_change_password = False

    db.add(current_user)
    await create_audit_log(db, current_user.username, "UPDATE_CREDENTIALS", "Success")
    await db.commit()

    await db.refresh(current_user)

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": current_user.username, "role": current_user.role},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}