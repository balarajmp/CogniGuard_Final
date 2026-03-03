@echo off
REM ─── CognitoShield Backend Startup Script ─────────────────────────────────
REM Run this from the project root: .\start_backend.bat

cd /d "%~dp0backend"

REM Activate virtual environment if it exists
if exist "..\venv\Scripts\activate.bat" (
    call "..\venv\Scripts\activate.bat"
) else if exist "..\..\.venv\Scripts\activate.bat" (
    call "..\..\.venv\Scripts\activate.bat"
) else if exist ".venv\Scripts\activate.bat" (
    call ".venv\Scripts\activate.bat"
)

echo.
echo  CognitoShield Backend Starting...
echo  API:    http://127.0.0.1:8000
echo  Docs:   http://127.0.0.1:8000/docs
echo  Health: http://127.0.0.1:8000/health
echo.

REM Start uvicorn bound to all interfaces on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
