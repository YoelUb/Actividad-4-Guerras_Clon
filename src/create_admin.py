import asyncio
import os
from sqlalchemy.future import select
from passlib.context import CryptContext
from src.Guerras_Clon.bd.database import SessionLocal, engine, Base
from src.Guerras_Clon.bd.models import User
from src.Guerras_Clon.security.security import get_password_hash

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "administrador")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin123")



async def create_admin_user():
    print("Iniciando script para crear admin...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        try:
            result = await db.execute(select(User).filter(User.username == ADMIN_USERNAME))
            existing_user = result.scalars().first()

            if existing_user:
                print(f"El usuario admin '{ADMIN_USERNAME}' ya existe.")
                return

            print(f"Creando usuario admin '{ADMIN_USERNAME}'...")
            hashed_password = get_password_hash(ADMIN_PASSWORD)

            admin_user = User(
                username=ADMIN_USERNAME,
                hashed_password=hashed_password,
                role="admin"
            )

            db.add(admin_user)
            await db.commit()
            print(f"¡Usuario admin '{ADMIN_USERNAME}' creado exitosamente!")

        except Exception as e:
            await db.rollback()
            print(f"Error al crear el admin: {e}")
        finally:
            await db.close()


async def main():
    await create_admin_user()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())