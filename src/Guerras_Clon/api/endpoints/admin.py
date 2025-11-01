from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel
from datetime import datetime
from src.Guerras_Clon.bd import models
from src.Guerras_Clon.security import security
from src.Guerras_Clon.bd.database import get_db

router = APIRouter()


class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    username: str
    action: str
    details: str | None

    class Config:

        from_attributes = True


@router.get(
    "/logs",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(security.get_current_admin_user)]  # ¡PROTEGIDO!
)
async def get_audit_logs(
        skip: int = 0,
        limit: int = 100,
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.AuditLog)
        .order_by(models.AuditLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
    )
    logs = result.scalars().all()
    return logs


@router.get(
    "/stats",
    response_model=dict,
    dependencies=[Depends(security.get_current_admin_user)]  # ¡PROTEGIDO!
)
async def get_app_stats(db: AsyncSession = Depends(get_db)):
    user_count_result = await db.execute(select(func.count(models.User.id)))
    total_users = user_count_result.scalar()

    logs_count_result = await db.execute(select(func.count(models.AuditLog.id)))
    total_logs = logs_count_result.scalar()

    return {
        "total_users": total_users,
        "total_audit_logs": total_logs,
        "prometheus_metrics_available_at": "/metrics"
    }


@router.post(
    "/promote_user/{username}",
    response_model=security.UserResponse,
    dependencies=[Depends(security.get_current_admin_user)]
)
async def promote_user_to_admin(username: str, db: AsyncSession = Depends(get_db)):
    user = await security.get_user(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = "admin"
    db.add(user)
    await create_audit_log(db, "admin", "PROMOTE_USER", f"User {username} promoted to admin")
    await db.commit()
    await db.refresh(user)

    return user
