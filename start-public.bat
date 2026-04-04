@echo off
chcp 65001 >nul 2>&1
title 智慧工地管理系统 - 公网服务

echo ╔══════════════════════════════════════════╗
echo ║   智慧工地管理系统 - 公网启动脚本       ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [步骤 1/3] 检查后端服务器 (端口 3001)...
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo     ✓ 服务器已在运行
) else (
    echo     正在启动后端服务器...
    start "ZhiHui-Server" /min cmd /c "node server.js"
    timeout /t 3 /nobreak >nul
    echo     ✓ 后端服务器已启动
)

echo.
echo [步骤 2/3] 启动公网隧道 (localtunnel)...
echo     (使用 --local-host 127.0.0.1 修复IPv6兼容性)

echo.
echo [步骤 3/3] 公网访问就绪!
echo ╔══════════════════════════════════════════╗
echo ║  内网:   http://localhost:3001            ║
echo ║  局域网: http://192.168.8.174:3001       ║
echo ║  公网:   https://zhihui.loca.lt           ║
echo ╚══════════════════════════════════════════╝
echo.
echo   首次访问需点击 "Click to Continue"
echo   按 Ctrl+C 停止隧道
echo ---------------------------------------------

lt --port 3001 --local-host 127.0.0.1 --subdomain zhihui

pause