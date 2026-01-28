# Fix encoding issues and start dev server
# Ejecutar: pwsh scripts/fix-encoding-and-start.ps[EMOJI]

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] ARREGLANDO ENCODING Y LIMPIANDO CACHE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# [EMOJI]. Configurar terminal para UTF-8
Write-Host "[[EMOJI]] Configurando terminal para UTF-8..." -ForegroundColor Yellow
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$env:NODE_OPTIONS = "--max-old-space-size=[EMOJI]096"
$env:LANG = "en_US.UTF-8"
$env:LC_ALL = "en_US.UTF-8"
chcp 6[EMOJI]00[EMOJI] | Out-Null
Write-Host "   [OK] Encoding configurado a UTF-8" -ForegroundColor Green

# [EMOJI]. Detener procesos Node.js existentes
Write-Host "`n[[EMOJI]] Deteniendo procesos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds [EMOJI]
    Write-Host "   [OK] Procesos Node.js detenidos" -ForegroundColor Green
} else {
    Write-Host "   [INFO]  No hay procesos Node.js corriendo" -ForegroundColor Cyan
}

# [EMOJI]. Limpiar todos los cach√©s
Write-Host "`n[[EMOJI]] Limpiando cach√©s..." -ForegroundColor Yellow

# Cache de Next.js
if (Test-Path "apps/web/.next") {
    Remove-Item -Recurse -Force "apps/web/.next" -ErrorAction SilentlyContinue
    Write-Host "   [OK] apps/web/.next eliminado" -ForegroundColor Green
}

# Cache de node_modules
if (Test-Path "apps/web/node_modules/.cache") {
    Remove-Item -Recurse -Force "apps/web/node_modules/.cache" -ErrorAction SilentlyContinue
    Write-Host "   [OK] apps/web/node_modules/.cache eliminado" -ForegroundColor Green
}

# Cache de Turbo
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
    Write-Host "   [OK] node_modules/.cache eliminado" -ForegroundColor Green
}

# Cache de Turbo global
if (Test-Path ".turbo") {
    Remove-Item -Recurse -Force ".turbo" -ErrorAction SilentlyContinue
    Write-Host "   [OK] .turbo eliminado" -ForegroundColor Green
}

# [EMOJI]. Verificar PostgreSQL
Write-Host "`n[[EMOJI]] Verificando PostgreSQL..." -ForegroundColor Yellow
$postgresRunning = docker ps --filter "name=quoorum-postgres" --format "{{.Status}}" [EMOJI]>$null
if ($postgresRunning -like "*Up*") {
    Write-Host "   [OK] PostgreSQL est√[EMOJI] corriendo" -ForegroundColor Green
} else {
    Write-Host "   [WARN]  PostgreSQL NO est√[EMOJI] corriendo. Iniciando..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds [EMOJI]
    Write-Host "   [OK] PostgreSQL iniciado" -ForegroundColor Green
}

# [EMOJI]. Iniciar servidor con encoding correcto
Write-Host "`n[[EMOJI]] Iniciando servidor de desarrollo..." -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "[FAST] Iniciando pnpm dev con UTF-8 encoding...`n" -ForegroundColor Green

# Configurar variables de entorno para el proceso hijo
$env:FORCE_COLOR = "[EMOJI]"
$env:CI = "false"

# Iniciar pnpm dev
& pnpm dev
