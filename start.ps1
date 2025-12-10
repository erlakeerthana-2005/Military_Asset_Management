# Military Asset Management System - Start Script

Write-Host "Starting Military Asset Management System..." -ForegroundColor Cyan

# Start Backend
Write-Host "Starting Backend (Flask)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\activate; python app.py"

# Start Frontend
Write-Host "Starting Frontend (React)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "System starting in separate windows." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:5173"
