param(
    [string]$InstallDir = "$env:LOCALAPPDATA\GiProyProjectBridge",
    [int]$Port = 45731
)

$ErrorActionPreference = "Stop"

function Resolve-PowerShellExecutable {
    $pwsh = "C:\Program Files\PowerShell\7\pwsh.exe"
    if (Test-Path $pwsh) {
        return $pwsh
    }
    $found = (Get-Command pwsh.exe -ErrorAction SilentlyContinue)?.Source
    if ($found) {
        return $found
    }
    return "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
}

$sourceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

Copy-Item (Join-Path $sourceRoot "bridge_server.ps1") (Join-Path $InstallDir "bridge_server.ps1") -Force
if (Test-Path (Join-Path $sourceRoot "README.md")) {
    Copy-Item (Join-Path $sourceRoot "README.md") (Join-Path $InstallDir "README.md") -Force
}

$psExe = Resolve-PowerShellExecutable
$scriptPath = Join-Path $InstallDir "bridge_server.ps1"
$taskName = "GiProy Project Bridge"
$arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -STA -File `"$scriptPath`" -Port $Port"

$action = New-ScheduledTaskAction -Execute $psExe -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn
$userId = if ($env:USERDOMAIN) { "$($env:USERDOMAIN)\$($env:USERNAME)" } else { $env:USERNAME }
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -StartWhenAvailable -DontStopIfGoingOnBatteries

try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
} catch {}

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Autoarranca el GiProy Project Bridge para Microsoft Project." | Out-Null
Start-ScheduledTask -TaskName $taskName

Write-Host "GiProy Project Bridge instalado en: $InstallDir"
Write-Host "Scheduled Task registrada: $taskName"
