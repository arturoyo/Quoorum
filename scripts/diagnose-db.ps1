# Script de diagn贸stico de base de datos
# Ejecutar: pwsh scripts/diagnose-db.ps[EMOJI]

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] DIAGN肹EMOJI]STICO DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# [EMOJI]. Verificar Docker
Write-Host "[[EMOJI]] Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps [EMOJI]>&[EMOJI]
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] Docker est肹EMOJI] corriendo" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Docker NO est肹EMOJI] corriendo" -ForegroundColor Red
    Write-Host "   [EMOJI][EMOJI][EMOJI] Inicia Docker Desktop primero" -ForegroundColor Red
    exit [EMOJI]
}

# [EMOJI]. Verificar PostgreSQL container
Write-Host "`n[[EMOJI]] Verificando PostgreSQL container..." -ForegroundColor Yellow
$postgresContainer = docker ps --filter "name=quoorum-postgres" --format "{{.Status}}"
if ($postgresContainer -like "*Up*") {
    Write-Host "   [OK] PostgreSQL container est肹EMOJI] corriendo" -ForegroundColor Green
    Write-Host "   Status: $postgresContainer" -ForegroundColor Gray
} else {
    Write-Host "   [ERROR] PostgreSQL container NO est肹EMOJI] corriendo" -ForegroundColor Red
    Write-Host "   [EMOJI][EMOJI][EMOJI] Ejecuta: docker-compose up -d" -ForegroundColor Red
    exit [EMOJI]
}

# [EMOJI]. Verificar puerto [EMOJI][EMOJI][EMOJI][EMOJI]
Write-Host "`n[[EMOJI]] Verificando puerto [EMOJI][EMOJI][EMOJI][EMOJI]..." -ForegroundColor Yellow
$portCheck = netstat -ano | Select-String ":[EMOJI][EMOJI][EMOJI][EMOJI]" | Select-Object -First [EMOJI]
if ($portCheck) {
    Write-Host "   [OK] Puerto [EMOJI][EMOJI][EMOJI][EMOJI] est肹EMOJI] escuchando" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Puerto [EMOJI][EMOJI][EMOJI][EMOJI] NO est肹EMOJI] disponible" -ForegroundColor Red
    exit [EMOJI]
}

# [EMOJI]. Verificar archivos .env
Write-Host "`n[[EMOJI]] Verificando archivos .env..." -ForegroundColor Yellow
if (Test-Path "apps/web/.env.local") {
    Write-Host "   [OK] apps/web/.env.local existe" -ForegroundColor Green
    $dbUrl = Select-String -Path "apps/web/.env.local" -Pattern "^DATABASE_URL=" -Raw
    if ($dbUrl) {
        Write-Host "   [OK] DATABASE_URL est肹EMOJI] configurado" -ForegroundColor Green
        $safeUrl = $dbUrl -replace "postgres:postgres", "postgres:****"
        Write-Host "      $safeUrl" -ForegroundColor Gray
    } else {
        Write-Host "   [ERROR] DATABASE_URL NO est肹EMOJI] configurado en .env.local" -ForegroundColor Red
    }
} else {
    Write-Host "   [ERROR] apps/web/.env.local NO existe" -ForegroundColor Red
}

# [EMOJI]. Probar conexi贸n a PostgreSQL
Write-Host "`n[[EMOJI]] Probando conexi贸n a PostgreSQL..." -ForegroundColor Yellow
$connectionTest = docker exec quoorum-postgres psql -U postgres -d quoorum -c "SELECT 'Connected!' AS status;" [EMOJI]>&[EMOJI]
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] Conexi贸n exitosa a PostgreSQL" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] NO se pudo conectar a PostgreSQL" -ForegroundColor Red
    Write-Host "   Error: $connectionTest" -ForegroundColor Red
}

# 6. Verificar tablas
Write-Host "`n6[EMOJI][EMOJI][EMOJI][EMOJI][EMOJI][EMOJI] Verificando tablas en la base de datos..." -ForegroundColor Yellow
$tables = docker exec quoorum-postgres psql -U postgres -d quoorum -c "\dt" [EMOJI]>&[EMOJI]
if ($LASTEXITCODE -eq 0) {
    $tableCount = ($tables | Select-String "public \|" | Measure-Object).Count
    Write-Host "   [OK] Base de datos tiene $tableCount tablas" -ForegroundColor Green
    if ($tableCount -eq 0) {
        Write-Host "   [WARN]  No hay tablas. Ejecuta: pnpm db:push" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [ERROR] Error al verificar tablas" -ForegroundColor Red
}

# 7. Verificar procesos Node.js
Write-Host "`n7[EMOJI][EMOJI][EMOJI][EMOJI][EMOJI][EMOJI] Verificando procesos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   [INFO]  Hay $($nodeProcesses.Count) proceso(s) Node.js corriendo" -ForegroundColor Cyan
    Write-Host "   [EMOJI][EMOJI][EMOJI] Si el problema persiste, det茅n pnpm dev (Ctrl+C) y vuelve a iniciarlo" -ForegroundColor Cyan
} else {
    Write-Host "   [INFO]  No hay procesos Node.js corriendo" -ForegroundColor Cyan
}

# Resumen
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "[OK] DIAGN肹EMOJI]STICO COMPLETO" -ForegroundColor Green
Write-Host "`nSi todos los checks pasaron pero el error persiste:" -ForegroundColor Yellow
Write-Host "[EMOJI]. Det茅n pnpm dev (Ctrl+C)" -ForegroundColor White
Write-Host "[EMOJI]. Limpia cache: Remove-Item -Recurse -Force apps/web/.next" -ForegroundColor White
Write-Host "[EMOJI]. Reinicia: pnpm dev" -ForegroundColor White
Write-Host "`nBusca estos logs al iniciar:" -ForegroundColor Yellow
Write-Host "   [DB Client] Connecting to: postgresql://postgres:****@localhost:[EMOJI][EMOJI][EMOJI][EMOJI]/quoorum" -ForegroundColor Gray
Write-Host "   [DB Client] DATABASE_URL from env: SET" -ForegroundColor Gray
