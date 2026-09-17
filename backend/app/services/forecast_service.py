from __future__ import annotations
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.stress_repo import StressRepository
from app.schemas.stress import BurnoutForecastResponse

class ForecastService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_burnout_forecast(
        self, user_id: int, is_guest: bool
    ) -> BurnoutForecastResponse:
        """
        Generate a 24-hour predictive forecast of focus reserves for a user.
        Uses simple linear regression over the last 48 hours of user's stress history.
        """
        if is_guest:
            return BurnoutForecastResponse(
                forecast_points=[100.0, 95.0, 90.0, 85.0],
                estimated_depletion_hours=18.0
            )

        now = datetime.now(timezone.utc)
        start_time = now - timedelta(hours=48)

        repo = StressRepository(self.db)
        history = await repo.get_history(user_id, limit=200, start_date=start_time)

        # Sort history ascending by recorded_at
        history = sorted(history, key=lambda x: x.recorded_at)

        if not history:
            return BurnoutForecastResponse(
                forecast_points=[100.0, 100.0, 100.0, 100.0],
                estimated_depletion_hours=None
            )

        t0 = history[0].recorded_at.timestamp()
        x_points = [r.recorded_at.timestamp() - t0 for r in history]
        y_points = [r.focus_reserves_pct for r in history]

        n = len(history)
        if n > 1:
            sum_x = sum(x_points)
            sum_y = sum(y_points)
            sum_xx = sum(x * x for x in x_points)
            sum_xy = sum(x * y for x, y in zip(x_points, y_points))

            denom = (n * sum_xx - sum_x * sum_x)
            if denom != 0:
                m = (n * sum_xy - sum_x * sum_y) / denom
                c = (sum_y - m * sum_x) / n
            else:
                m = 0.0
                c = y_points[-1]
        else:
            m = 0.0
            c = y_points[0]

        current_offset = now.timestamp() - t0
        forecast_points = []
        for h in [0, 8, 16, 24]:
            offset = current_offset + (h * 3600)
            predicted_focus = m * offset + c
            predicted_focus = max(0.0, min(100.0, predicted_focus))
            forecast_points.append(round(predicted_focus, 1))

        estimated_depletion_hours = None
        if m < 0:
            depletion_offset = -c / m
            depletion_time = t0 + depletion_offset
            depletion_seconds_from_now = depletion_time - now.timestamp()
            if depletion_seconds_from_now > 0:
                estimated_depletion_hours = round(depletion_seconds_from_now / 3600, 1)
                if estimated_depletion_hours > 48.0:
                    estimated_depletion_hours = None

        return BurnoutForecastResponse(
            forecast_points=forecast_points,
            estimated_depletion_hours=estimated_depletion_hours
        )
