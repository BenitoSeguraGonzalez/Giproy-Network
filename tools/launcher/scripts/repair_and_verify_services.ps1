param(
    [switch]$SkipReinstall,
    [switch]$SkipKillPorts
)

$ErrorActionPreference = "Continue"

function Write-Section {
    param([string]$Text)
    Write-Host ""
    Write-Host ("=" * 12 + " " + $Text + " " + ("=" * 12)) -ForegroundColor Cyan
}

function Get-ListeningPidsByPort {
    param([int]$Port)
    $result = @()
    $raw = netstat -ano | findstr ":$Port"
    foreach ($ln in $raw) {
        $parts = ($ln -split '\s+') | Where-Object { $_ -ne "" }
        if ($parts.Count -lt 5) { continue }
        $state = $parts[3]
        $pidVal = $parts[4]
        if ($state -ne "LISTENING") { continue }
        if ($pidVal -match '^\d+$') { $result += [int]$pidVal }
    }
    return ($result | Select-Object -Unique)
}

function Stop-ResidualGiProyProcesses {
    Write-Section "Limpiar procesos residuales GiProy (python/node/npm)"
    $targets = Get-CimInstance Win32_Process | Where-Object {
        ($_.Name -match '^(python|node|npm|cmd)\.exe$') -and
        (
            $_.CommandLine -match 'uvicorn\s+app\.main:app' -or
            $_.CommandLine -match 'vite(\s|$)' -or
            $_.CommandLine -match 'npm(\.cmd)?\s+run\s+dev'
        )
    }
    if (-not $targets) {
        Write-Host "Sin procesos residuales detectados por comando."
        return
    }
    foreach ($proc in $targets) {
        $pidVal = $proc.ProcessId
        Write-Host "Deteniendo residual PID $pidVal ($($proc.Name))"
        try {
            Stop-Process -Id $pidVal -Force -ErrorAction Stop
        }
        catch {
            Write-Host "No se pudo detener residual PID ${pidVal}: $_" -ForegroundColor Yellow
        }
    }
}

function Wait-PortFree {
    param([int]$Port, [int]$TimeoutSec = 15)
    $start = Get-Date
    while ($true) {
        $listeners = Get-ListeningPidsByPort -Port $Port
        if (-not $listeners -or $listeners.Count -eq 0) { return $true }
        if (((Get-Date) - $start).TotalSeconds -ge $TimeoutSec) { return $false }
        Start-Sleep -Milliseconds 400
    }
}

$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
Set-Location $root

$python = Join-Path $root ".venv\Scripts\python.exe"
$nssm = Join-Path $root "scripts\tools\nssm\nssm.exe"
$launcherLog = Join-Path $root ".runtime\logs\launcher.log"
$backendLog = Join-Path $root ".runtime\logs\backend-nssm.log"
$frontendLog = Join-Path $root ".runtime\logs\frontend-nssm.log"

Write-Section "Precheck"
if (-not (Test-Path $python)) {
    Write-Error "No existe: $python"
    exit 1
}

if (-not (Test-Path $nssm)) {
    Write-Host "NSSM no existe localmente. Se intentara durante la accion elevada..." -ForegroundColor Yellow
}

if (-not $SkipReinstall) {
    if (-not $SkipKillPorts) {
        Write-Section "Limpiar procesos huerfanos en puertos 3001/3010"
        $ports = @(3001, 3010)
        foreach ($port in $ports) {
            $pids = Get-ListeningPidsByPort -Port $port
            if (-not $pids -or $pids.Count -eq 0) {
                Write-Host "Sin listeners en puerto $port"
                continue
            }
            Write-Host "Listeners en puerto ${port}: $($pids -join ', ')"
            foreach ($procId in $pids) {
                if ($procId -gt 0) {
                    Write-Host "Deteniendo PID $procId en puerto $port"
                    try { Stop-Process -Id $procId -Force -ErrorAction Stop } catch { Write-Host "No se pudo detener PID ${procId}: $_" -ForegroundColor Yellow }
                }
            }
        }
        Stop-ResidualGiProyProcesses
        Write-Host "Esperando liberacion de puertos 3001/3010..."
        $ok3001 = Wait-PortFree -Port 3001 -TimeoutSec 20
        $ok3010 = Wait-PortFree -Port 3010 -TimeoutSec 20
        if (-not $ok3001) { Write-Host "AVISO: puerto 3001 sigue ocupado tras limpieza." -ForegroundColor Yellow }
        if (-not $ok3010) { Write-Host "AVISO: puerto 3010 sigue ocupado tras limpieza." -ForegroundColor Yellow }
    }

    Write-Section "Reinstalar servicios (elevated action)"
    & $python "tools\launcher\main.py" "--elevated-action" "reinstall_services"
    Write-Host "Codigo salida reinstall: $LASTEXITCODE"
}

Write-Section "Estado de servicios"
sc.exe query GiProy-Backend
sc.exe query GiProy-Frontend

Write-Section "Configuracion NSSM"
if (Test-Path $nssm) {
    & $nssm get GiProy-Backend Application
    & $nssm get GiProy-Backend AppParameters
    & $nssm get GiProy-Backend AppDirectory
    $backendStdout = (& $nssm get GiProy-Backend AppStdout)
    Write-Host $backendStdout
    & $nssm get GiProy-Frontend Application
    & $nssm get GiProy-Frontend AppParameters
    & $nssm get GiProy-Frontend AppDirectory
    $frontendStdout = (& $nssm get GiProy-Frontend AppStdout)
    Write-Host $frontendStdout

    if ($backendStdout -notlike "*backend-nssm.log*" -or $frontendStdout -notlike "*frontend-nssm.log*") {
        Write-Host "AVISO: Los servicios aun no tienen los nuevos logs backend-nssm/frontend-nssm. Ejecuta reinstall sin -SkipReinstall." -ForegroundColor Yellow
    }
}
else {
    Write-Host "NSSM no encontrado en: $nssm" -ForegroundColor Yellow
}

Write-Section "Puertos"
netstat -ano | findstr :3001
netstat -ano | findstr :3010

Write-Section "Logs (tail)"
if (Test-Path $launcherLog) {
    Write-Host "--- launcher.log ---"
    Get-Content $launcherLog -Tail 120
}
else {
    Write-Host "No existe $launcherLog"
}

if (Test-Path $backendLog) {
    Write-Host "--- backend-nssm.log ---"
    Get-Content $backendLog -Tail 120
}
else {
    Write-Host "No existe $backendLog"
}

if (Test-Path $frontendLog) {
    Write-Host "--- frontend-nssm.log ---"
    Get-Content $frontendLog -Tail 120
}
else {
    Write-Host "No existe $frontendLog"
}

Write-Section "Fin"
Write-Host "Si los servicios siguen en STOPPED con puertos abiertos, revisar Event Viewer (provider: nssm)."
