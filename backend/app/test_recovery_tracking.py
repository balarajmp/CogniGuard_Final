import asyncio
import os
import sys
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.future import select
from sqlalchemy import delete

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import init_db, AsyncSessionLocal
from app.models.user import User
from app.models.recovery import RecoverySessionRecord
from app.services.auth_service import AuthService
from app.schemas.auth import UserCreate
from app.main import app


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="module", autouse=True)
async def setup_database():
    await init_db()


@pytest.fixture
async def test_users():
    async with AsyncSessionLocal() as db:
        auth_svc = AuthService(db)
        # Setup User A
        username_a = "recovery_user_a@cognitoshield.ai"
        token_a = None
        user_a = None
        from app.repositories.user_repo import UserRepository
        repo = UserRepository(db)
        existing_a = await repo.get_by_username(username_a)
        if existing_a:
            await db.execute(delete(RecoverySessionRecord).where(RecoverySessionRecord.user_id == existing_a.id))
            await db.delete(existing_a)
            await db.commit()

        user_a = await auth_svc.register(
            UserCreate(username=username_a, email=username_a, password="Password123!", role="user")
        )
        token_a = await auth_svc.authenticate(username_a, "Password123!")

        # Setup User B
        username_b = "recovery_user_b@cognitoshield.ai"
        existing_b = await repo.get_by_username(username_b)
        if existing_b:
            await db.execute(delete(RecoverySessionRecord).where(RecoverySessionRecord.user_id == existing_b.id))
            await db.delete(existing_b)
            await db.commit()

        user_b = await auth_svc.register(
            UserCreate(username=username_b, email=username_b, password="Password123!", role="user")
        )
        token_b = await auth_svc.authenticate(username_b, "Password123!")

        yield {
            "user_a": user_a,
            "token_a": token_a.access_token,
            "user_b": user_b,
            "token_b": token_b.access_token,
        }

        # Cleanup
        async with AsyncSessionLocal() as clean_db:
            await clean_db.execute(delete(RecoverySessionRecord).where(RecoverySessionRecord.user_id.in_([user_a.id, user_b.id])))
            await clean_db.execute(delete(User).where(User.username.in_([username_a, username_b])))
            await clean_db.commit()


@pytest.mark.asyncio
async def test_start_and_complete_session(test_users):
    """
    Test scenario: Start -> Complete
    Verify: Exactly one DB record created, status is completed, timestamps and durations valid.
    """
    token_a = test_users["token_a"]
    user_a = test_users["user_a"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": f"Bearer {token_a}"}

        # 1. Start recovery session
        start_payload = {
            "activity_id": "breathe",
            "activity_type": "breathing",
            "activity_title": "Guided Breathing",
            "guided_content_id": "gc-breathe-1",
            "video_id": "OXjlR4mXxSk",
            "planned_duration_seconds": 180,
        }
        res = await client.post("/api/recovery/sessions/start", json=start_payload, headers=headers)
        assert res.status_code == 201, res.text
        data = res.json()
        session_id = data["id"]
        assert data["status"] == "active"
        assert data["user_id"] == user_a.id
        assert data["activity_id"] == "breathe"
        assert data["guided_content_id"] == "gc-breathe-1"
        assert data["video_id"] == "OXjlR4mXxSk"
        assert data["planned_duration_seconds"] == 180
        assert data["elapsed_duration_seconds"] == 0
        assert data["session_start"] is not None
        assert data["session_end"] is None

        # 2. Complete session
        complete_payload = {
            "elapsed_duration_seconds": 180,
            "completion_reason": "natural_completion",
        }
        res_complete = await client.post(
            f"/api/recovery/sessions/{session_id}/complete",
            json=complete_payload,
            headers=headers,
        )
        assert res_complete.status_code == 200, res_complete.text
        comp_data = res_complete.json()
        assert comp_data["status"] == "completed"
        assert comp_data["elapsed_duration_seconds"] == 180
        assert comp_data["session_end"] is not None
        assert comp_data["completion_reason"] == "natural_completion"

        # Verify DB directly: exactly one record exists for this session
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(RecoverySessionRecord).filter(RecoverySessionRecord.id == session_id)
            )
            records = result.scalars().all()
            assert len(records) == 1
            rec = records[0]
            assert rec.status == "completed"
            assert rec.elapsed_duration_seconds == 180
            assert rec.user_id == user_a.id


@pytest.mark.asyncio
async def test_start_and_abort_session(test_users):
    """
    Test scenario: Start -> Abort
    Verify: Exactly one DB record created, status is aborted, actual elapsed duration recorded.
    """
    token_a = test_users["token_a"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": f"Bearer {token_a}"}

        # Start session
        start_payload = {
            "activity_id": "eye-rest",
            "activity_type": "eye-rest",
            "activity_title": "Eye Rest",
            "planned_duration_seconds": 120,
        }
        res = await client.post("/api/recovery/sessions/start", json=start_payload, headers=headers)
        assert res.status_code == 201
        session_id = res.json()["id"]

        # Abort session after 42 seconds
        abort_payload = {
            "elapsed_duration_seconds": 42,
            "completion_reason": "user_exit_early",
        }
        res_abort = await client.post(
            f"/api/recovery/sessions/{session_id}/abort",
            json=abort_payload,
            headers=headers,
        )
        assert res_abort.status_code == 200
        abort_data = res_abort.json()
        assert abort_data["status"] == "aborted"
        assert abort_data["elapsed_duration_seconds"] == 42
        assert abort_data["completion_reason"] == "user_exit_early"

        # Verify DB
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(RecoverySessionRecord).filter(RecoverySessionRecord.id == session_id)
            )
            records = result.scalars().all()
            assert len(records) == 1
            assert records[0].status == "aborted"
            assert records[0].elapsed_duration_seconds == 42


@pytest.mark.asyncio
async def test_pause_resume_no_duplicate_sessions(test_users):
    """
    Test scenario: Pause / Resume must NOT create additional sessions.
    The single active session continues to be the authority until completed or aborted.
    """
    token_a = test_users["token_a"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": f"Bearer {token_a}"}

        # 1. Start session
        start_payload = {
            "activity_id": "focus-reset",
            "activity_type": "focus-reset",
            "activity_title": "Focus Reset",
            "planned_duration_seconds": 300,
        }
        res = await client.post("/api/recovery/sessions/start", json=start_payload, headers=headers)
        assert res.status_code == 201
        session_id = res.json()["id"]

        # 2. Simulate pause and resume: frontend retains session_id without calling start again
        # Complete session after resuming
        complete_payload = {
            "elapsed_duration_seconds": 300,
            "completion_reason": "completed_after_pause",
        }
        res_comp = await client.post(
            f"/api/recovery/sessions/{session_id}/complete",
            json=complete_payload,
            headers=headers,
        )
        assert res_comp.status_code == 200

        # Verify exactly one record exists with focus-reset
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(RecoverySessionRecord).filter(
                    RecoverySessionRecord.user_id == test_users["user_a"].id,
                    RecoverySessionRecord.activity_id == "focus-reset",
                )
            )
            records = result.scalars().all()
            assert len(records) == 1


@pytest.mark.asyncio
async def test_reset_no_duplicate_sessions(test_users):
    """
    Test scenario: Reset handling.
    If a session was active, reset aborts the active session with reason 'reset'.
    Subsequent reset while idle creates NO duplicate records.
    """
    token_a = test_users["token_a"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": f"Bearer {token_a}"}

        # Start session
        res = await client.post(
            "/api/recovery/sessions/start",
            json={
                "activity_id": "morning",
                "activity_type": "guided-session",
                "activity_title": "Morning Clarity",
                "planned_duration_seconds": 480,
            },
            headers=headers,
        )
        assert res.status_code == 201
        session_id = res.json()["id"]

        # Reset aborts active session
        res_abort = await client.post(
            f"/api/recovery/sessions/{session_id}/abort",
            json={"elapsed_duration_seconds": 15, "completion_reason": "reset"},
            headers=headers,
        )
        assert res_abort.status_code == 200
        assert res_abort.json()["completion_reason"] == "reset"

        # Calling abort again (idempotent) doesn't duplicate
        res_abort2 = await client.post(
            f"/api/recovery/sessions/{session_id}/abort",
            json={"elapsed_duration_seconds": 15, "completion_reason": "reset"},
            headers=headers,
        )
        assert res_abort2.status_code == 200

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(RecoverySessionRecord).filter(
                    RecoverySessionRecord.id == session_id,
                )
            )
            records = result.scalars().all()
            assert len(records) == 1
            assert records[0].status == "aborted"
            assert records[0].completion_reason == "reset"


@pytest.mark.asyncio
async def test_authenticated_user_isolation(test_users):
    """
    Test scenario: User isolation.
    User A can only see User A's recovery sessions. User B cannot see User A's sessions.
    """
    token_a = test_users["token_a"]
    token_b = test_users["token_b"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers_a = {"Authorization": f"Bearer {token_a}"}
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # User B starts a session
        res_b = await client.post(
            "/api/recovery/sessions/start",
            json={
                "activity_id": "hydration",
                "activity_type": "hydration",
                "activity_title": "Hydration Reset",
                "planned_duration_seconds": 60,
            },
            headers=headers_b,
        )
        assert res_b.status_code == 201
        session_b_id = res_b.json()["id"]

        # User A requests recent sessions
        res_list_a = await client.get("/api/recovery/sessions", headers=headers_a)
        assert res_list_a.status_code == 200
        sessions_a = res_list_a.json()
        ids_a = [s["id"] for s in sessions_a]
        assert session_b_id not in ids_a, "User A must NOT see User B's recovery sessions"

        # User B requests recent sessions
        res_list_b = await client.get("/api/recovery/sessions", headers=headers_b)
        assert res_list_b.status_code == 200
        sessions_b = res_list_b.json()
        ids_b = [s["id"] for s in sessions_b]
        assert session_b_id in ids_b, "User B must see their own recovery session"

        # User A cannot complete or abort User B's session
        res_hack = await client.post(
            f"/api/recovery/sessions/{session_b_id}/complete",
            json={"elapsed_duration_seconds": 60},
            headers=headers_a,
        )
        assert res_hack.status_code == 404, "User A must get 404 when trying to touch User B's session"


@pytest.mark.asyncio
async def test_metadata_persistence_and_unstarted_activity(test_users):
    """
    Verify:
    1. Rich activity and YouTube/guided content metadata (activity_id, activity_type,
       guided_content_id, video_id, planned duration) are faithfully stored and returned.
    2. Unstarted activity produces NO session record in the database.
    """
    token_a = test_users["token_a"]
    user_a = test_users["user_a"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {"Authorization": f"Bearer {token_a}"}

        # Check existing count before
        async with AsyncSessionLocal() as db:
            result_before = await db.execute(
                select(RecoverySessionRecord).filter(
                    RecoverySessionRecord.user_id == user_a.id,
                    RecoverySessionRecord.activity_id == "mind-meditation",
                )
            )
            assert len(result_before.scalars().all()) == 0, "Unstarted activity must have 0 records"

        # Start with full metadata
        payload = {
            "activity_id": "mind-meditation",
            "activity_type": "guided-session",
            "activity_title": "Mind Meditation",
            "guided_content_id": "gc-meditation-1",
            "video_id": "DaHH--jJBtg",
            "planned_duration_seconds": 600,
        }
        res = await client.post("/api/recovery/sessions/start", json=payload, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert data["activity_id"] == "mind-meditation"
        assert data["activity_type"] == "guided-session"
        assert data["activity_title"] == "Mind Meditation"
        assert data["guided_content_id"] == "gc-meditation-1"
        assert data["video_id"] == "DaHH--jJBtg"
        assert data["planned_duration_seconds"] == 600
