from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.deps import require_registered_user
from app.db.session import get_db
from app.models.user import User
from app.models.calendar import ScheduledFocusBlock, CalendarIntegration
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter()

class FocusBlockCreate(BaseModel):
    start_time: datetime
    end_time: datetime
    block_type: str

@router.get("/blocks")
async def get_focus_blocks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user)
):
    result = await db.execute(
        select(ScheduledFocusBlock)
        .filter(ScheduledFocusBlock.user_id == current_user.id)
        .order_by(ScheduledFocusBlock.start_time.asc())
    )
    blocks = result.scalars().all()

    if not blocks:
        # Create some default blocks for today
        now = datetime.now()
        defaults = [
            ScheduledFocusBlock(
                user_id=current_user.id,
                start_time=now + timedelta(hours=1),
                end_time=now + timedelta(hours=3),
                block_type="deep_work"
            ),
            ScheduledFocusBlock(
                user_id=current_user.id,
                start_time=now + timedelta(hours=3.5),
                end_time=now + timedelta(hours=4.5),
                block_type="rest_buffer"
            )
        ]
        for item in defaults:
            db.add(item)
        await db.commit()

        result = await db.execute(
            select(ScheduledFocusBlock)
            .filter(ScheduledFocusBlock.user_id == current_user.id)
            .order_by(ScheduledFocusBlock.start_time.asc())
        )
        blocks = result.scalars().all()

    return [
        {
            "id": b.id,
            "start_time": b.start_time,
            "end_time": b.end_time,
            "block_type": b.block_type
        } for b in blocks
    ]

@router.post("/blocks")
async def create_focus_block(
    payload: FocusBlockCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user)
):
    block = ScheduledFocusBlock(
        user_id=current_user.id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        block_type=payload.block_type
    )
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return {"status": "success", "id": block.id}

@router.get("/calendar")
async def get_calendar_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user)
):
    result = await db.execute(
        select(CalendarIntegration)
        .filter(CalendarIntegration.user_id == current_user.id)
    )
    integration = result.scalar_one_or_none()
    return {
        "sync_active": integration.sync_active if integration else False,
        "provider": integration.provider if integration else None
    }
