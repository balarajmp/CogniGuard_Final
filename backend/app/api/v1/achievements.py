from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.deps import require_registered_user
from app.db.session import get_db
from app.models.user import User
from app.models.gamification import GamificationProfile, Achievement, UserAchievement

router = APIRouter()

@router.get("/profile")
async def get_gamification_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user)
):
    result = await db.execute(
        select(GamificationProfile)
        .filter(GamificationProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = GamificationProfile(
            user_id=current_user.id,
            level=3,
            current_xp=450,
            xp_to_next_level=1000,
            active_streak=5,
            longest_streak=14
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return {
        "level": profile.level,
        "current_xp": profile.current_xp,
        "xp_to_next_level": profile.xp_to_next_level,
        "active_streak": profile.active_streak,
        "longest_streak": profile.longest_streak
    }

@router.get("/badges")
async def get_achievements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user)
):
    # Ensure system achievements are pre-seeded in the database
    seed_result = await db.execute(select(Achievement))
    system_achievements = seed_result.scalars().all()
    
    if not system_achievements:
        seeds = [
            Achievement(badge_key="zen_master", title="Zen Master", description="Completed 10 focus rest buffers", xp_reward=250),
            Achievement(badge_key="deep_diver", title="Deep Diver", description="Maintained continuous Focus State for 120 minutes", xp_reward=500),
            Achievement(badge_key="calm_operator", title="Calm Operator", description="Maintained biometric Calm status under heavy multitasking", xp_reward=300),
            Achievement(badge_key="privacy_zealot", title="Privacy Sentinel", description="Enabled full local differential noise limits", xp_reward=150)
        ]
        for a in seeds:
            db.add(a)
        await db.commit()
        
        seed_result = await db.execute(select(Achievement))
        system_achievements = seed_result.scalars().all()

    # Get user unlocked mapping
    unlocked_result = await db.execute(
        select(UserAchievement)
        .filter(UserAchievement.user_id == current_user.id)
    )
    unlocked_maps = unlocked_result.scalars().all()
    unlocked_ids = {u.achievement_id for u in unlocked_maps}

    # If user has no unlocked, auto unlock "Privacy Sentinel" as a starting badge
    if not unlocked_ids:
        sentinel = next((a for a in system_achievements if a.badge_key == "privacy_zealot"), None)
        if sentinel:
            new_unlock = UserAchievement(user_id=current_user.id, achievement_id=sentinel.id)
            db.add(new_unlock)
            await db.commit()
            unlocked_ids.add(sentinel.id)

    return [
        {
            "id": a.id,
            "badge_key": a.badge_key,
            "title": a.title,
            "description": a.description,
            "xp_reward": a.xp_reward,
            "unlocked": a.id in unlocked_ids
        } for a in system_achievements
    ]
