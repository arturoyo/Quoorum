#!/usr/bin/env pwsh
# START-DEV-SAFE.ps1 - Inicia con máxima compatibilidad Windows
# USO: .\START-DEV-SAFE.ps1

Write-Host "🚀 Iniciando Quoorum (Modo Seguro Windows)..." -ForegroundColor Cyan
Write-Host "=============================================`n" -ForegroundColor Cyan

# 1. Detener procesos Node.js
Write-Host "🛑 Deteniendo procesos Node.js anteriores..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Procesos detenidos`n" -ForegroundColor Green

# 2. Configurar encoding UTF-8
Write-Host "📝 Configurando encoding UTF-8..." -ForegroundColor Yellow
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$env:LANG = "en_US.UTF-8"
$env:LC_ALL = "en_US.UTF-8"
$env:NODE_OPTIONS = "--max-old-space-size=4096 --no-warnings"
chcp 65001 | Out-Null
Write-Host "✅ Encoding configurado`n" -ForegroundColor Green

# 3. Limpiar cachés
Write-Host "🧹 Limpiando cachés..." -ForegroundColor Yellow
$cachePaths = @(
    "apps/web/.next",
    "apps/web/node_modules/.cache",
    "node_modules/.cache",
    ".turbo"
)

foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "   ✅ $path eliminado" -ForegroundColor Green
    }
}
Write-Host ""

# 4. Verificar PostgreSQL
Write-Host "📊 Verificando PostgreSQL..." -ForegroundColor Yellow
try {
    $postgresStatus = docker ps --filter "name=quoorum-postgres" --format "{{.Status}}" 2>$null
    if ($postgresStatus -like "*Up*") {
        Write-Host "✅ PostgreSQL está corriendo`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Iniciando PostgreSQL..." -ForegroundColor Yellow
        docker-compose up -d 2>$null
        Start-Sleep -Seconds 3
        Write-Host "✅ PostgreSQL iniciado`n" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  No se pudo verificar PostgreSQL (Docker puede no estar corriendo)" -ForegroundColor Yellow
    Write-Host "   Continuando de todas formas...`n" -ForegroundColor Gray
}

# 5. Iniciar servidor con configuración especial para Windows
Write-Host "⚡ Iniciando servidor de desarrollo..." -ForegroundColor Green
Write-Host "   (Presiona Ctrl+C para detener)`n" -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Configurar variables adicionales para evitar errores de encoding
$env:FORCE_COLOR = "0"  # Desactivar colores que pueden causar problemas
$env:CI = "false"
$env:NO_COLOR = "1"     # Forzar sin colores

# Iniciar con redirección de errores a archivo para evitar problemas de terminal
try {
    & pnpm dev 2>&1 | Out-Host
} catch {
    Write-Host "`n❌ Error al iniciar servidor:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nIntenta:" -ForegroundColor Yellow
    Write-Host "1. Cerrar Docker Desktop completamente" -ForegroundColor White
    Write-Host "2. Reiniciar Docker Desktop" -ForegroundColor White
    Write-Host "3. Ejecutar este script nuevamente" -ForegroundColor White
}
