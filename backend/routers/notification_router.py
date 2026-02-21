"""FleetFlow – Notification REST API router."""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from math import ceil

from database import get_db
from models.models import Notification, User, NotificationType
from auth.auth import get_current_user
from schemas.schemas import NotificationOut

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=dict)
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    type: str | None = None,
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List notifications with optional filters."""
    query = select(Notification)
    count_query = select(func.count(Notification.id))

    if type:
        query = query.where(Notification.type == type)
        count_query = count_query.where(Notification.type == type)
    if unread_only:
        query = query.where(Notification.is_read == False)
        count_query = count_query.where(Notification.is_read == False)

    total = (await db.execute(count_query)).scalar() or 0
    query = query.order_by(Notification.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    results = (await db.execute(query)).scalars().all()

    return {
        "items": [NotificationOut.model_validate(n) for n in results],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return count of unread notifications (used by the bell badge)."""
    count = (await db.execute(
        select(func.count(Notification.id)).where(Notification.is_read == False)
    )).scalar() or 0
    return {"unread_count": count}


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_as_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a single notification as read."""
    result = await db.execute(select(Notification).where(Notification.id == notification_id))
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif


@router.patch("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all unread notifications as read."""
    await db.execute(
        update(Notification).where(Notification.is_read == False).values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}


@router.get("/automation-logs", response_model=dict)
async def list_automation_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    job_name: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List automation job execution logs."""
    from models.models import AutomationLog
    from schemas.schemas import AutomationLogOut

    query = select(AutomationLog)
    count_query = select(func.count(AutomationLog.id))

    if job_name:
        query = query.where(AutomationLog.job_name == job_name)
        count_query = count_query.where(AutomationLog.job_name == job_name)

    total = (await db.execute(count_query)).scalar() or 0
    query = query.order_by(AutomationLog.ran_at.desc()).offset((page - 1) * page_size).limit(page_size)
    results = (await db.execute(query)).scalars().all()

    return {
        "items": [AutomationLogOut.model_validate(r) for r in results],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total else 0,
    }


@router.get("/analytics-summary", response_model=dict)
async def list_analytics_summary(
    year: int | None = None,
    month: int | None = None,
    vehicle_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return precomputed cost and prediction summaries."""
    from models.models import AnalyticsSummary
    from schemas.schemas import AnalyticsSummaryOut
    from datetime import datetime

    now = datetime.utcnow()
    query = select(AnalyticsSummary)
    if year:
        query = query.where(AnalyticsSummary.period_year == year)
    if month:
        query = query.where(AnalyticsSummary.period_month == month)
    if vehicle_id:
        query = query.where(AnalyticsSummary.vehicle_id == vehicle_id)

    query = query.order_by(AnalyticsSummary.period_year.desc(), AnalyticsSummary.period_month.desc())
    results = (await db.execute(query)).scalars().all()
    return {"items": [AnalyticsSummaryOut.model_validate(r) for r in results]}


@router.post("/debug/run-license-check")
async def debug_run_license_check(
    current_user: User = Depends(get_current_user),
):
    """Debug endpoint: manually trigger the license monitor job."""
    from automation.tasks.license_monitor import run_license_monitor
    await run_license_monitor()
    return {"message": "License monitor job triggered."}


@router.post("/debug/run-maintenance-check")
async def debug_run_maintenance_check(
    current_user: User = Depends(get_current_user),
):
    """Debug endpoint: manually trigger the maintenance monitor job."""
    from automation.tasks.maintenance_monitor import run_maintenance_monitor
    await run_maintenance_monitor()
    return {"message": "Maintenance monitor job triggered."}
