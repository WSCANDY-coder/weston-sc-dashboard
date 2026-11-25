@echo off
title Weston SC Dashboard - Live Data Update
color 0B
cd /d "%~dp0"

echo ============================================================
echo   WESTON-SUPER-MARE SC - SWIMMERS DASHBOARD UPDATE
echo ============================================================
echo.
echo Starting Swim England scrape and data synchronization...
echo.

python update.py

echo.
echo ============================================================
echo   Update finished!
echo ============================================================
echo.
pause
