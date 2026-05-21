param(
    [string]$InstallDir = "$env:LOCALAPPDATA\GiProyProjectBridge"
)

$ErrorActionPreference = "Stop"
$taskName = "GiProy Project Bridge"

try {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue | Out-Null
} catch {}

try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
} catch {}

if (Test-Path $InstallDir) {
    Remove-Item -LiteralPath $InstallDir -Recurse -Force
}

Write-Host "GiProy Project Bridge desinstalado."
