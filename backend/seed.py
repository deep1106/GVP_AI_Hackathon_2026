"""FleetFlow – Seed script to create default users."""

import asyncio
from database import async_session, engine, Base
from models.models import User, UserRole
from auth.auth import hash_password


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        users = [
            User(
                email="fleet@fleetflow.com",
                hashed_password=hash_password("fleet123"),
                full_name="Fleet Manager",
                role=UserRole.FLEET_MANAGER,
            ),
            User(
                email="dispatch@fleetflow.com",
                hashed_password=hash_password("dispatch123"),
                full_name="Dispatcher",
                role=UserRole.DISPATCHER,
            ),
            User(
                email="safety@fleetflow.com",
                hashed_password=hash_password("safety123"),
                full_name="Safety Officer",
                role=UserRole.SAFETY_OFFICER,
            ),
            User(
                email="finance@fleetflow.com",
                hashed_password=hash_password("finance123"),
                full_name="Financial Analyst",
                role=UserRole.FINANCIAL_ANALYST,
            ),
        ]
        for u in users:
            session.add(u)
        await session.commit()
        print("✅ Seeded 4 default users successfully!")
        for u in users:
            print(f"   {u.role.value}: {u.email}")


if __name__ == "__main__":
    asyncio.run(seed())
