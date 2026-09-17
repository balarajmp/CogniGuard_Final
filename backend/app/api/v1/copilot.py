from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.deps import require_registered_user
from app.db.session import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.memory import AIMemoryNode
from pydantic import BaseModel

router = APIRouter()

class MessageCreate(BaseModel):
    content: str

@router.get("/sessions")
async def get_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user)
):
    result = await db.execute(
        select(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
    )
    sessions = result.scalars().all()

    if not sessions:
        # Create a default session
        default_session = ChatSession(
            user_id=current_user.id,
            title="General Wellness Consultation"
        )
        db.add(default_session)
        await db.commit()
        await db.refresh(default_session)
        sessions = [default_session]

    return [{"id": s.id, "title": s.title, "created_at": s.created_at} for s in sessions]

@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user)
):
    # Verify session ownership
    sess_result = await db.execute(
        select(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    result = await db.execute(
        select(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "sender": m.sender,
            "content": m.content,
            "created_at": m.created_at
        } for m in messages
    ]

@router.post("/sessions/{session_id}/messages")
async def create_message(
    session_id: int,
    payload: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user)
):
    # Verify session ownership
    sess_result = await db.execute(
        select(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        sender="user",
        content=payload.content
    )
    db.add(user_msg)

    # Simple AI cognitive rule engine mapping for assistant responses
    prompt = payload.content.lower()
    if "stress" in prompt or "burnout" in prompt or "exhausted" in prompt:
        ai_response = "I noticed your physiological data reports slight heart rate variability decay. I recommend scheduling a 10-minute focus break or drinking some water. Would you like to set a deep work timer for later?"
    elif "focus" in prompt or "productive" in prompt:
        ai_response = "Your focus index has been consistently high today. Best productivity window is from 9:30 AM to 12:00 PM. Let's block that time on your scheduler!"
    else:
        ai_response = "I am monitoring your biometric signals. All telemetry channels are healthy. Is there any specific cognitive task you are struggling with?"

    assistant_msg = ChatMessage(
        session_id=session_id,
        sender="assistant",
        content=ai_response
    )
    db.add(assistant_msg)
    await db.commit()

    return {
        "user_message": {"id": user_msg.id, "sender": "user", "content": user_msg.content, "created_at": user_msg.created_at},
        "assistant_message": {"id": assistant_msg.id, "sender": "assistant", "content": assistant_msg.content, "created_at": assistant_msg.created_at}
    }

@router.get("/memory")
async def get_ai_memory(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_registered_user)
):
    result = await db.execute(
        select(AIMemoryNode)
        .filter(AIMemoryNode.user_id == current_user.id)
        .order_by(AIMemoryNode.last_updated.desc())
    )
    nodes = result.scalars().all()

    if not nodes:
        defaults = [
            AIMemoryNode(user_id=current_user.id, key_category="preferred_focus_start", value_text="9:30 AM", weight=0.9),
            AIMemoryNode(user_id=current_user.id, key_category="effective_soundscape", value_text="Binaural Beats (40Hz Alpha waves)", weight=0.85),
            AIMemoryNode(user_id=current_user.id, key_category="break_frequency", value_text="Every 75 minutes of deep work", weight=0.75),
            AIMemoryNode(user_id=current_user.id, key_category="burnout_vulnerability", value_text="Late Thursday afternoons", weight=0.70)
        ]
        for item in defaults:
            db.add(item)
        await db.commit()

        result = await db.execute(
            select(AIMemoryNode)
            .filter(AIMemoryNode.user_id == current_user.id)
            .order_by(AIMemoryNode.last_updated.desc())
        )
        nodes = result.scalars().all()

    return [
        {
            "id": n.id,
            "key_category": n.key_category,
            "value_text": n.value_text,
            "weight": n.weight,
            "last_updated": n.last_updated
        } for n in nodes
    ]
