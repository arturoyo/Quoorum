# CLEAN-ALL-CACHE.ps[EMOJI] - Limpia TODO el caché del proyecto
# Ejecutar cuando tengas errores de encoding o caché corrupto

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] LIMPIEZA PROFUNDA DE CACHÉ" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

# [EMOJI]. Detener todos los procesos Node.js
Write-Host "[[EMOJI]] Deteniendo procesos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $count = ($nodeProcesses | Measure-Object).Count
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds [EMOJI]
    Write-Host "   [OK] $count proceso(s) detenido(s)" -ForegroundColor Green
} else {
    Write-Host "   [INFO]  No hay procesos Node.js corriendo" -ForegroundColor Cyan
}

# [EMOJI]. Limpiar cachés de Next.js
Write-Host "`n[[EMOJI]] Limpiando cachés de Next.js..." -ForegroundColor Yellow
$nextCachePaths = @(
    "apps/web/.next",
    "apps/web/out",
    "apps/web/.next/cache"
)

foreach ($path in $nextCachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Recurse -Force $path -ErrorAction Stop
            Write-Host "   [OK] $path eliminado" -ForegroundColor Green
        } catch {
            Write-Host "   [WARN]  No se pudo eliminar $path (puede estar bloqueado)" -ForegroundColor Yellow
        }
    }
}

# [EMOJI]. Limpiar cachés de node_modules
Write-Host "`n[[EMOJI]] Limpiando cachés de node_modules..." -ForegroundColor Yellow
$nodeModulesCaches = Get-ChildItem -Path . -Recurse -Directory -Filter ".cache" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like "*node_modules*" }
$count = ($nodeModulesCaches | Measure-Object).Count
if ($count -gt 0) {
    foreach ($cache in $nodeModulesCaches) {
        Remove-Item -Recurse -Force $cache.FullName -ErrorAction SilentlyContinue
    }
    Write-Host "   [OK] $count carpeta(s) .cache eliminada(s)" -ForegroundColor Green
} else {
    Write-Host "   [INFO]  No se encontraron cachés en node_modules" -ForegroundColor Cyan
}

# [EMOJI]. Limpiar Turbo cache
Write-Host "`n[[EMOJI]] Limpiando Turbo cache..." -ForegroundColor Yellow
if (Test-Path ".turbo") {
    Remove-Item -Recurse -Force ".turbo" -ErrorAction SilentlyContinue
    Write-Host "   [OK] .turbo eliminado" -ForegroundColor Green
}
if (Test-Path "node_modules/.cache/turbo") {
    Remove-Item -Recurse -Force "node_modules/.cache/turbo" -ErrorAction SilentlyContinue
    Write-Host "   [OK] Turbo cache en node_modules eliminado" -ForegroundColor Green
}

# [EMOJI]. Limpiar build artifacts
Write-Host "`n[[EMOJI]] Limpiando build artifacts..." -ForegroundColor Yellow
$buildPaths = @(
    "packages/api/dist",
    "packages/db/dist",
    "packages/ui/dist",
    "packages/ai/dist",
    "packages/core/dist",
    "packages/workers/dist",
    "packages/quoorum/dist"
)

foreach ($path in $buildPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "   [OK] $path eliminado" -ForegroundColor Green
    }
}

# 6. Limpiar TypeScript cache
Write-Host "`n6[EMOJI][EMOJI][EMOJI][EMOJI][EMOJI][EMOJI] Limpiando TypeScript cache..." -ForegroundColor Yellow
$tsBuildInfoFiles = Get-ChildItem -Path . -Recurse -Filter "*.tsbuildinfo" -ErrorAction SilentlyContinue
$count = ($tsBuildInfoFiles | Measure-Object).Count
if ($count -gt 0) {
    $tsBuildInfoFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] $count archivo(s) .tsbuildinfo eliminado(s)" -ForegroundColor Green
} else {
    Write-Host "   [INFO]  No se encontraron archivos .tsbuildinfo" -ForegroundColor Cyan
}

# 7. Limpiar temp files
Write-Host "`n7[EMOJI][EMOJI][EMOJI][EMOJI][EMOJI][EMOJI] Limpiando archivos temporales..." -ForegroundColor Yellow
$tempFiles = Get-ChildItem -Path . -Recurse -Filter "*.tmp" -ErrorAction SilentlyContinue
$count = ($tempFiles | Measure-Object).Count
if ($count -gt 0) {
    $tempFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] $count archivo(s) .tmp eliminado(s)" -ForegroundColor Green
} else {
    Write-Host "   [INFO]  No se encontraron archivos .tmp" -ForegroundColor Cyan
}

# Resumen
Write-Host "`n============================" -ForegroundColor Cyan
Write-Host "[OK] LIMPIEZA COMPLETA" -ForegroundColor Green
Write-Host "`nAhora ejecuta:" -ForegroundColor Yellow
Write-Host "   .\START-DEV.ps[EMOJI]" -ForegroundColor White
Write-Host "`nSi el problema persiste:" -ForegroundColor Yellow
Write-Host "   .\START-DEV-SAFE.ps[EMOJI]" -ForegroundColor White
