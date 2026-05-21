param(
    [switch]$WithTests = $true
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
Set-Location $ProjectRoot

Write-Host "== GiProy Launcher Validation ==" -ForegroundColor Cyan
Write-Host "ProjectRoot: $ProjectRoot"

if (!(Test-Path ".venv\Scripts\python.exe")) {
    throw "No existe .venv\Scripts\python.exe"
}

Write-Host "[1/4] Compilando launcher..." -ForegroundColor Yellow
& ".\.venv\Scripts\python.exe" -m compileall "tools\launcher"

Write-Host "[2/4] Verificando imports..." -ForegroundColor Yellow
& ".\.venv\Scripts\python.exe" -c "import sys; sys.path.insert(0, r'tools\launcher'); import launcher_app.ops; import launcher_app.ui.main_window; print('imports_ok')"

Write-Host "[3/4] Verificando archivos clave..." -ForegroundColor Yellow
$Required = @(
    "tools\launcher\main.py",
    "tools\launcher\launcher_app\config.py",
    "tools\launcher\launcher_app\ops.py",
    "tools\launcher\launcher_app\ui\main_window.py",
    "tools\launcher\scripts\run_launcher.bat"
)
foreach ($f in $Required) {
    if (!(Test-Path $f)) { throw "Falta archivo: $f" }
}
Write-Host "files_ok"

if ($WithTests) {
    Write-Host "[4/4] Ejecutando smoke tests..." -ForegroundColor Yellow
    & ".\.venv\Scripts\python.exe" -m unittest -v "tools.launcher.tests.test_ops_smoke"
} else {
    Write-Host "[4/4] Smoke tests omitidos por parametro."
}

Write-Host "Validation OK" -ForegroundColor Green
