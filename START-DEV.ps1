#!/usr/bin/env pwsh
# START-DEV.ps1 - Inicia el servidor de desarrollo con configuración correcta
# USO: .\START-DEV.ps1

# Configurar encoding UTF-8 para evitar errores en Windows
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$env:LANG = "en_US.UTF-8"
$env:LC_ALL = "en_US.UTF-8"
chcp 65001 | Out-Null

Write-Host "🚀 Iniciando Quoorum Dev Server..." -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Verificar PostgreSQL
Write-Host "📊 Verificando PostgreSQL..." -ForegroundColor Yellow
$postgresStatus = docker ps --filter "name=quoorum-postgres" --format "{{.Status}}" 2>$null
if ($postgresStatus -like "*Up*") {
    Write-Host "✅ PostgreSQL está corriendo`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL no está corriendo. Iniciando..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 3
    Write-Host "✅ PostgreSQL iniciado`n" -ForegroundColor Green
}

# Iniciar servidor
Write-Host "⚡ Iniciando servidor de desarrollo...`n" -ForegroundColor Green
& pnpm dev
