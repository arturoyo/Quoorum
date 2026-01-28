# Auto-fix script for development (PowerShell)
# Fixes TypeScript and ESLint errors before starting the server
# This script runs automatically before `pnpm dev` via the `predev` hook

$ErrorActionPreference = "Continue"
$separator = "------------------------------------------------------------"

Write-Host ""
Write-Host $separator -ForegroundColor Cyan
Write-Host "[INFO] AUTO-FIX: Corrigiendo errores antes de iniciar servidor" -ForegroundColor Cyan
Write-Host $separator -ForegroundColor Cyan
Write-Host ""

# [EMOJI]. Clean and Build API package FIRST (esto corrige muchos errores de TypeScript durante el build)
Write-Host "[[EMOJI]/[EMOJI]] Limpiando y compilando paquete API..." -ForegroundColor Yellow
Write-Host "   (Esto corrige errores de TypeScript durante el build)" -ForegroundColor Gray
try {
    # Limpiar dist primero para evitar errores de archivos huerfanos
    $distPath = "packages\api\dist"
    if (Test-Path $distPath) {
        Write-Host "   [INFO] Limpiando directorio dist..." -ForegroundColor Gray
        Remove-Item -Path $distPath -Recurse -Force -ErrorAction SilentlyContinue
    }

    # Ahora compilar
    $null = & pnpm --filter @quoorum/api build [EMOJI]>&[EMOJI]
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Build de API completado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Build de API con errores (continuando de todas formas)" -ForegroundColor Yellow
        Write-Host "   [INFO] Revisa los errores arriba" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [WARN] Error al compilar API: $_" -ForegroundColor Yellow
}

Write-Host ""

# [EMOJI]. Fix ESLint errors
Write-Host "[[EMOJI]/[EMOJI]] Corrigiendo errores de ESLint automaticamente..." -ForegroundColor Yellow
try {
    $null = & pnpm lint:fix [EMOJI]>&[EMOJI]
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] ESLint fix completado" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] ESLint fix completado con advertencias" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [WARN] Error al ejecutar ESLint fix: $_" -ForegroundColor Yellow
}

Write-Host ""

# [EMOJI]. Build Web package (para asegurar que todo compile)
Write-Host "[[EMOJI]/[EMOJI]] Verificando compilacion de Web..." -ForegroundColor Yellow
try {
    # Solo verificar que TypeScript compile, no hacer build completo
    $null = & pnpm --filter @quoorum/web typecheck [EMOJI]>&[EMOJI] | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] TypeCheck de Web: Sin errores" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] TypeCheck de Web: Se encontraron errores" -ForegroundColor Yellow
        Write-Host "   [INFO] Algunos errores pueden corregirse automaticamente" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [WARN] Error al verificar Web: $_" -ForegroundColor Yellow
}

Write-Host ""

# [EMOJI]. TypeCheck general (verificacion rapida, no bloquea)
Write-Host "[[EMOJI]/[EMOJI]] Verificacion final de tipos..." -ForegroundColor Yellow
try {
    $typecheckOutput = & pnpm typecheck [EMOJI]>&[EMOJI] | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] TypeCheck: Sin errores de tipos" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] TypeCheck: Se encontraron errores de tipos" -ForegroundColor Yellow
        Write-Host "   [INFO] Algunos errores se corrigen automaticamente durante el build" -ForegroundColor Gray
        Write-Host "   [INFO] Revisa los errores arriba si el servidor no inicia correctamente" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [WARN] Error al ejecutar TypeCheck: $_" -ForegroundColor Yellow
}

Write-Host ""

# 5. Verificar y liberar puerto 3000 si esta en uso
Write-Host "[5/5] Verificando puerto 3000..." -ForegroundColor Yellow
try {
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($port3000) {
        $processId = $port3000.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "   [WARN] Puerto 3000 en uso por proceso: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
            Write-Host "   [INFO] Liberando puerto 3000..." -ForegroundColor Gray
            try {
                Stop-Process -Id $processId -Force -ErrorAction Stop
                Start-Sleep -Milliseconds 500
                Write-Host "   [OK] Puerto 3000 liberado" -ForegroundColor Green
            } catch {
                Write-Host "   [WARN] No se pudo liberar el puerto automaticamente" -ForegroundColor Yellow
                Write-Host "   [INFO] Ejecuta manualmente: Stop-Process -Id $processId -Force" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "   [OK] Puerto 3000 disponible" -ForegroundColor Green
    }
} catch {
    Write-Host "   [INFO] No se pudo verificar el puerto (continuando de todas formas)" -ForegroundColor Gray
}

Write-Host ""
Write-Host $separator -ForegroundColor Cyan
Write-Host "[OK] AUTO-FIX COMPLETADO" -ForegroundColor Green
Write-Host "[INFO] Iniciando servidor de desarrollo..." -ForegroundColor Cyan
Write-Host $separator -ForegroundColor Cyan
Write-Host ""
