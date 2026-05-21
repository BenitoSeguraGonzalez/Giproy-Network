en@echo off
echo ========================================
echo      GIPROY FULL STACK - SIMPLE START
echo ========================================

echo [1] Backend ^(port 8000^)...
cd backend
start "Backend 8000" cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0
