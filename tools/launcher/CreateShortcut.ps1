$WshShell = New-Object -ComObject WScript.Shell
$ProjectRoot = "e:\Repositorios\GiProy Network"
$ShortcutPath = Join-Path $ProjectRoot "GiProy Control Center.lnk"
$TargetScript = Join-Path $ProjectRoot "tools\launcher\launcher_shim.vbs"
$IconPath = Join-Path $ProjectRoot "assets\LogoSoft.png"

# Create the shortcut
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = """$TargetScript"""
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.IconLocation = $IconPath
$Shortcut.Description = "GiProy Control Center"
$Shortcut.Save()

Write-Host "Acceso directo creado correctamente en: $ShortcutPath"
