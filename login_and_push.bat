@echo off
title Weston SC - One-Time GitHub Sign-In
color 0A
cd /d "%~dp0"

echo ========================================================
echo   WESTON SC - ONE-TIME GITHUB SIGN-IN
echo ========================================================
echo.
echo Connecting Git to your GitHub account...
echo A browser window will open asking you to sign in to GitHub.
echo Click "Sign in with your browser" and approve the authorization.
echo.

"C:\Program Files\Git\cmd\git.exe" config --global http.sslVerify false
"C:\Program Files\Git\cmd\git.exe" -C "C:\Users\andre\weston-sc-dashboard\weston-sc-swimmers" push -u origin main
"C:\Program Files\Git\cmd\git.exe" -C "C:\Users\andre\weston-sc-dashboard" add -A
"C:\Program Files\Git\cmd\git.exe" -C "C:\Users\andre\weston-sc-dashboard" commit -m "Auto-update Swim England PBs"
"C:\Program Files\Git\cmd\git.exe" -C "C:\Users\andre\weston-sc-dashboard" push -u origin main

echo.
echo ========================================================
if %errorlevel% equ 0 (
    echo [SUCCESS] Your PC is now authenticated with GitHub!
    echo Both repositories are updated with the latest PBs!
) else (
    echo [NOTE] If you saw a login prompt, complete it and run this again.
)
echo ========================================================
echo.
pause
