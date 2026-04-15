# 添加防火墙规则允许3001端口
Write-Host "正在添加防火墙规则允许3001端口..." -ForegroundColor Green

try {
    # 检查规则是否已存在
    $existingRule = Get-NetFirewallRule -DisplayName "智慧工地Web服务" -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Host "防火墙规则已存在，正在删除旧规则..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "智慧工地Web服务" -Confirm:$false
    }
    
    # 添加新规则
    New-NetFirewallRule -DisplayName "智慧工地Web服务" `
        -Direction Inbound `
        -LocalPort 3001 `
        -Protocol TCP `
        -Action Allow `
        -Profile Any `
        -ErrorAction Stop
    
    Write-Host "防火墙规则添加成功！" -ForegroundColor Green
    Write-Host "现在可以访问 http://192.168.8.174:3001 了" -ForegroundColor Cyan
}
catch {
    Write-Host "添加防火墙规则失败：$_" -ForegroundColor Red
    Write-Host "尝试使用netsh命令..." -ForegroundColor Yellow
    
    # 备用方案：使用netsh
    netsh advfirewall firewall delete rule name="智慧工地Web服务" 2>$null
    $result = netsh advfirewall firewall add rule name="智慧工地Web服务" dir=in action=allow protocol=TCP localport=3001
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "netsh命令执行成功！" -ForegroundColor Green
    } else {
        Write-Host "netsh命令也失败了，请手动以管理员身份运行" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
