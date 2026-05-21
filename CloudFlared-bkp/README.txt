CLOUDFLARE TUNNEL BACKUP / RESTORE

ARCHIVOS:
- backup_cloudflare_tunnels.bat
- restore_cloudflare_tunnels.bat

BACKUP:
1. Ejecutar backup_cloudflare_tunnels.bat como Administrador
2. Se creará:
   D:\CloudFlared-bkp
   D:\CloudFlared-bkp.zip

RESTORE:
1. Instalar cloudflared:
   winget install --id Cloudflare.cloudflared -e --source winget

2. Instalar NSSM:
   winget install NSSM.NSSM --source winget

3. Extraer backup en:
   D:\CloudFlared-bkp

4. Ejecutar:
   restore_cloudflare_tunnels.bat
   COMO ADMINISTRADOR

RESULTADO:
- Recuperación automática de:
  - cert.pem
  - tokens
  - túneles
  - servicios NSSM
  - configuración

