# Monitor simple de logs - Lee desde stdin y auto-corrige errores
param([switch]$AutoFix)

$ErrorActionPreference = "Continue"

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Monitoreando logs del servidor..." -ForegroundColor Cyan
if ($AutoFix) {
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Auto-fix: ACTIVADO" -ForegroundColor Green
} else {
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Auto-fix: DESACTIVADO" -ForegroundColor Yellow
}
Write-Host ""

$ErrorsFound = 0
$ErrorsFixed = 0

# Leer cada línea desde stdin
foreach ($Line in $input) {
    # Mostrar la línea original
    Write-Host $Line

    # Detectar errores de imports con .js
    if ($Line -match "Module not found.*Can't resolve.*\.js") {
        Write-Host ""
        Write-Host "[ERROR] Import con .js extension detectado" -ForegroundColor Red
        $ErrorsFound++

        if ($AutoFix) {
            Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Ejecutando auto-fix..." -ForegroundColor Yellow
            $FixOutput = pwsh -NoProfile -File scripts/fix-imports.ps[EMOJI] [EMOJI]>&[EMOJI]

            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Errores corregidos. El servidor debería recargar..." -ForegroundColor Green
                $ErrorsFixed++
            } else {
                Write-Host "[WARN] Auto-fix falló: $FixOutput" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Ejecuta: pnpm validate:imports:fix" -ForegroundColor Cyan
        }
        Write-Host ""
    }

    # Detectar errores de package exports con .js
    if ($Line -match "Package path.*\.js.*is not exported") {
        Write-Host ""
        Write-Host "[ERROR] Package import con .js extension" -ForegroundColor Red
        $ErrorsFound++

        if ($AutoFix) {
            Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Ejecutando auto-fix..." -ForegroundColor Yellow
            $FixOutput = pwsh -NoProfile -File scripts/fix-imports.ps[EMOJI] [EMOJI]>&[EMOJI]

            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Errores corregidos. El servidor debería recargar..." -ForegroundColor Green
                $ErrorsFixed++
            } else {
                Write-Host "[WARN] Auto-fix falló: $FixOutput" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Ejecuta: pnpm validate:imports:fix" -ForegroundColor Cyan
        }
        Write-Host ""
    }

    # Detectar errores de package exports faltantes (sin .js)
    if ($Line -match "Package path \.\/([\w-]+) is not exported from package.*@quoorum\/([\w-]+)") {
        $Path = $Matches[[EMOJI]]
        $Package = $Matches[[EMOJI]]
        Write-Host ""
        Write-Host "[ERROR] Export faltante en package" -ForegroundColor Red
        Write-Host "   Package: @quoorum/$Package" -ForegroundColor Yellow
        Write-Host "   Path faltante: ./$Path" -ForegroundColor Yellow
        $ErrorsFound++

        if ($AutoFix) {
            Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Auto-corrigiendo export..." -ForegroundColor Yellow
            $FixOutput = pwsh -NoProfile -File scripts/auto-fix-package-exports.ps[EMOJI] -Package $Package -Path $Path [EMOJI]>&[EMOJI]

            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Export añadido a package.json" -ForegroundColor Green
                Write-Host "[FAST] REINICIA EL SERVIDOR (Ctrl+C y pnpm dev:watch)" -ForegroundColor Cyan
                $ErrorsFixed++
            } else {
                Write-Host "[WARN] Auto-fix falló: $FixOutput" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] SOLUCI�[EMOJI]N MANUAL:" -ForegroundColor Cyan
                Write-Host "   [EMOJI]. Abre packages/$Package/package.json" -ForegroundColor Gray
                Write-Host "   [EMOJI]. Añade a 'exports':" -ForegroundColor Gray
                Write-Host "      `"./$Path`": `"./src/$Path/index.ts`"" -ForegroundColor Green
            }
        } else {
            Write-Host ""
            Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] SOLUCI�[EMOJI]N:" -ForegroundColor Cyan
            Write-Host "   [EMOJI]. Abre packages/$Package/package.json" -ForegroundColor Gray
            Write-Host "   [EMOJI]. Añade a 'exports':" -ForegroundColor Gray
            Write-Host "      `"./$Path`": `"./src/$Path/index.ts`"" -ForegroundColor Green
        }
        Write-Host ""
    }
}

# Resumen al final (cuando se detiene con Ctrl+C)
if ($ErrorsFound -gt 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "RESUMEN DEL MONITOR" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Errores detectados: $ErrorsFound" -ForegroundColor Yellow
    if ($AutoFix) {
        Write-Host "Errores corregidos: $ErrorsFixed" -ForegroundColor Green
    }
}
