@echo off
title Launching Resume Screening System
echo =======================================================
echo Launching Resume Screening System (Full Stack)
echo =======================================================
echo.
echo Starting Flask Backend on port 5000...
start "Backend (Flask)" "%~dp0run_backend.bat"

timeout /t 2 /nobreak >nul

echo Starting React Frontend on port 5173...
start "Frontend (React)" "%~dp0run_frontend.bat"

echo.
echo Both servers have been launched!
echo Access the frontend at: http://localhost:5173
echo.
timeout /t 5
