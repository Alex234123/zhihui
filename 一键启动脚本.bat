@echo off
title Zhihui Launcher
cd /d D:\zhihui

echo Starting server...
start "Zhihui Server" powershell -NoExit -Command "cd 'D:\zhihui'; npm run server"

timeout /t 2 /nobreak >nul

echo Starting dev...
start "Zhihui Dev" powershell -NoExit -Command "cd 'D:\zhihui'; npm run dev"

echo Done.
exit