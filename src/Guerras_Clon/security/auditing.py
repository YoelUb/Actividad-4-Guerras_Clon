import inspect
from functools import wraps
from sqlalchemy.ext.asyncio import AsyncSession
from ..bd import models


async def create_audit_log(db: AsyncSession, username: str, action: str, details: str = ""):

    log_entry = models.AuditLog(
        username=username,
        action=action,
        details=details
    )
    db.add(log_entry)
    await db.flush()


def audit(action: str):

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):

            db: AsyncSession = None
            current_user: models.User = None
            username = "anonymous"

            try:
                db = kwargs.get("db")
                current_user = kwargs.get("current_user")

                if not db or not current_user:
                    arg_names = inspect.getfullargspec(func).args
                    if not db and "db" in arg_names:
                        db_index = arg_names.index("db")
                        if len(args) > db_index:
                            db = args[db_index]
                    if not current_user and "current_user" in arg_names:
                        user_index = arg_names.index("current_user")
                        if len(args) > user_index:
                            current_user = args[user_index]

                if current_user:
                    username = current_user.username

            except Exception as e:
                print(f"Error al extraer datos para auditoría: {e}")

            try:
                response = await func(*args, **kwargs)

                if db:
                    await create_audit_log(db, username, action, "SUCCESS")
                return response

            except Exception as e:
                error_details = f"FAILED: {getattr(e, 'detail', str(e))}"
                if db:
                    await create_audit_log(db, username, action, error_details)

                raise e

        return wrapper

    return decorator