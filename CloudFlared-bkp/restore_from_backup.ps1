param(
    [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

$backupDir = $PSScriptRoot
$nssm = Join-Path $ProjectRoot "scripts\tools\nssm\nssm.exe"
$cloudflared = (Get-Command cloudflared.exe -ErrorAction Stop).Source

if (-not (Test-Path $nssm)) {
    throw "No se encontro NSSM local en $nssm"
}

function Get-BackupAppParameters {
    param([string]$ServiceName)

    $backupFile = Join-Path $backupDir "$ServiceName-nssm.txt"
    if (-not (Test-Path $backupFile)) {
        throw "No existe backup NSSM para $ServiceName en $backupFile"
    }

    $content = Get-Content $backupFile -Raw
    $match = [regex]::Match($content, 'AppParameters\s+"([^"]+)"')
    if (-not $match.Success) {
        throw "No se pudo leer AppParameters de $backupFile"
    }

    return $match.Groups[1].Value.Trim()
}

function Restore-CloudflaredService {
    param([string]$ServiceName)

    $parameters = Get-BackupAppParameters -ServiceName $ServiceName
    & $nssm stop $ServiceName | Out-Null
    & $nssm remove $ServiceName confirm | Out-Null
    & $nssm install $ServiceName $cloudflared | Out-Null
    & $nssm set $ServiceName AppDirectory $env:USERPROFILE | Out-Null
    & $nssm set $ServiceName AppParameters $parameters | Out-Null
    & $nssm set $ServiceName AppExit Default Restart | Out-Null
    & $nssm set $ServiceName DisplayName $ServiceName | Out-Null
    & $nssm set $ServiceName ObjectName LocalSystem | Out-Null
    & $nssm set $ServiceName Start SERVICE_AUTO_START | Out-Null
    Start-Service $ServiceName
}

if (Get-Service cloudflared -ErrorAction SilentlyContinue) {
    Stop-Service cloudflared -ErrorAction SilentlyContinue
    & $nssm remove cloudflared confirm | Out-Null
}

Restore-CloudflaredService -ServiceName "cloudflared-eXcom"
Restore-CloudflaredService -ServiceName "cloudflared-SaaS"

Get-Service cloudflared-* | Select-Object Name, Status, StartType
