# Script to stop all Veritas services
Write-Host "Stopping Veritas services..."

# Kill backend if running
if (Test-Path "C:\projects\veritas\backend.pid") {
    $backendId = Get-Content "C:\projects\veritas\backend.pid"
    Stop-Job -Id $backendId
    Remove-Item "C:\projects\veritas\backend.pid"
}

# Kill insights service if running
if (Test-Path "C:\projects\veritas\insights.pid") {
    $insightsId = Get-Content "C:\projects\veritas\insights.pid"
    Stop-Job -Id $insightsId
    Remove-Item "C:\projects\veritas\insights.pid"
}

# Kill frontend if running
if (Test-Path "C:\projects\veritas\frontend.pid") {
    $frontendId = Get-Content "C:\projects\veritas\frontend.pid"
    Stop-Job -Id $frontendId
    Remove-Item "C:\projects\veritas\frontend.pid"
}

Write-Host "All Veritas services have been stopped."
