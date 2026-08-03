# ============================================================
# Cross-repo (MarketI + NurIA-Odonto + Giproy Network) — setup-ssh-keys.ps1
# ============================================================
# Genera par ed25519 + copia pública al server excomsvr via ssh-copy-id.
# Reemplaza el uso de passwords en update.py / restart_backend.py / backup DB.
# EJECUTAR UNA SOLA VEZ desde PowerShell con derechos de admin o sin elevados.
#
# Uso por proyecto:
#   .\infra\scripts\setup-ssh-keys.ps1 -ServerHost "192.168.18.106" -ServerUser "benito" -KeyName "giproy_deploy"
#   .\infra\scripts\setup-ssh-keys.ps1 -ServerHost "192.168.18.106" -ServerUser "benito" -KeyName "nuria_deploy"
#   .\infra\scripts\setup-ssh-keys.ps1 -ServerHost "192.168.18.106" -ServerUser "benito" -KeyName "marketi_deploy"   # default si se omite KeyName es excom_deploy
#
# Output:
#   %USERPROFILE%\.ssh\<KeyName>       (private key, NUNCA commitear)
#   %USERPROFILE%\.ssh\<KeyName>.pub   (public key)
# Authorised en server: ~/.ssh/authorized_keys
# ============================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ServerHost,

    [Parameter(Mandatory = $false)]
    [string]$ServerUser = "benito",

    [Parameter(Mandatory = $false)]
    [string]$KeyName = "excom_deploy",

    [Parameter(Mandatory = $false)]
    [string]$KeyPath = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($KeyPath)) {
    $KeyPath = "$env:USERPROFILE\.ssh\$KeyName"
}

# ─── 1. Verificar OpenSSH está instalado ───
if (-not (Get-Command ssh-keygen -ErrorAction SilentlyContinue)) {
    Write-Error "ssh-keygen no está disponible. Instala OpenSSH Client (Windows Settings → Apps → Optional Features)."
    exit 1
}

# ─── 2. Generar par ed25519 (idempotente) ───
if (-not (Test-Path $KeyPath)) {
    Write-Host "[1/4] Generando par ed25519 en $KeyPath..."
    New-Item -ItemType Directory -Path (Split-Path $KeyPath) -Force | Out-Null
    & ssh-keygen -t ed25519 -N '""' -f $KeyPath -C "$KeyName-deploy@$(hostname)"
} else {
    Write-Host "[1/4] Par ed25519 ya existe en $KeyPath. Reutilizando."
}

# ─── 3. ssh-copy-id al server (transfiere pública) ───
Write-Host "[2/4] Copiando pública al server $ServerUser@$ServerHost..."
Write-Host "      (te pedirá la password UNA ÚLTIMA VEZ — luego será sólo la key)"
& ssh-copy-id -i "$KeyPath.pub" "$ServerUser@$ServerHost"

if ($LASTEXITCODE -ne 0) {
    Write-Error "ssh-copy-id falló. Verifica conectividad y que PasswordAuthentication=yes aún está permitido en el server (lo desactivaremos al final)."
    exit 1
}

# ─── 4. Test: SSH al server SIN password ───
Write-Host "[3/4] Verificando acceso por clave (sin password)..."
$result = & ssh -i $KeyPath -o BatchMode=yes -o ConnectTimeout=10 "$ServerUser@$ServerHost" "whoami && uname -a" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "      [OK] Acceso por clave confirmado." -ForegroundColor Green
    Write-Host "            $($result[0])"
} else {
    Write-Error "      [FAIL] No pude entrar por clave. Output: $result"
    exit 1
}

# ─── 5. Configurar ssh ConfigManager-API-equivalente en Windows SSH config ───
Write-Host "[4/4] Registrando alias SSH en ~/.ssh/config..."
$configPath = "$env:USERPROFILE\.ssh\config"
$aliasBlock = @"

# $KeyName-deploy
Host $KeyName-devs
    HostName $ServerHost
    User $ServerUser
    IdentityFile $KeyPath
    IdentitiesOnly yes
    StrictHostKeyChecking accept-new
    ServerAliveInterval 30
    ServerAliveCountMax 3

# Para conectar a excomsvr usar alias (no IP directa):
#   ssh $KeyName-devs
# Si usás varias keys (una por proyecto) cada alias usa su propia IdentityFile.
# Esto evita el bug 'first match wins' del Host <IP> block.
"@

if (Test-Path $configPath) {
    $existing = Get-Content $configPath -Raw
    if ($existing -match "$KeyName-deploy") {
        Write-Host "      Ya existe block '$KeyName-deploy' en config — no modifico."
    } else {
        Add-Content -Path $configPath -Value $aliasBlock
        Write-Host "      Block agregado a $configPath"
    }
} else {
    New-Item -ItemType Directory -Path (Split-Path $configPath) -Force | Out-Null
    Set-Content -Path $configPath -Value $aliasBlock
}

Write-Host ""
Write-Host "✅ Setup SSH key ($KeyName) completo." -ForegroundColor Green
Write-Host ""
Write-Host "RECOMENDADO (manual, en una ventana separada):"
$cmd = "sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && sudo systemctl reload sshd"
Write-Host ("  ssh {0}@{1} {2}" -f $ServerUser, $ServerHost, $cmd)
Read-Host -Prompt "Press Enter después de ejecutar esa línea en el server"
Write-Host "  Esto desactiva password authentication en el server."
Write-Host ""
Write-Host "⚠️  Hasta que hagas eso, AMBOS métodos (password + key) funcionan — vulnerable."
