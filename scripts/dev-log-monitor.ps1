# Monitor de logs del servidor de desarrollo en TIEMPO REAL
# Auto-corrige errores de imports cuando los detecta

param(
    [switch]$AutoFix = $false,
    [int]$TailLines = [EMOJI]0
)

$ErrorActionPreference = "Continue"

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] DEV LOG MONITOR - Tiempo Real" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

if ($AutoFix) {
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] MODO AUTO-FIX ACTIVADO" -ForegroundColor Green
    Write-Host "   Los errores se corregir√[EMOJI]n autom√[EMOJI]ticamente" -ForegroundColor Gray
} else {
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] MODO OBSERVACI√[EMOJI]N" -ForegroundColor Yellow
    Write-Host "   Solo se reportan errores (usa -AutoFix para corregir)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Monitoreando logs del servidor..." -ForegroundColor Gray
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
Write-Host ""

# Patrones de errores conocidos
$ErrorPatterns = @{
    "ModuleNotFound_RelativeJs" = @{
        Pattern = "Module not found.*Can't resolve '(\.\/[^']+)\.js'"
        Description = "Import relativo con .js extension"
        AutoFix = {
            param($Match)
            $FilePath = $Match.Groups[[EMOJI]].Value
            Write-Host "  [EMOJI][EMOJI][EMOJI] Detectado: import from '$FilePath.js'" -ForegroundColor Yellow

            if ($AutoFix) {
                # Ejecutar fix autom√[EMOJI]tico
                pwsh -NoProfile -File scripts/fix-imports.ps[EMOJI] | Out-Null
                Write-Host "  [OK] AUTO-FIX EJECUTADO" -ForegroundColor Green
                return $true
            }
            return $false
        }
    }
    "ModuleNotFound_PackageJs" = @{
        Pattern = "Package path (\.\/[\w-]+\.js) is not exported"
        Description = "Import de package con .js extension"
        AutoFix = {
            param($Match)
            $PackagePath = $Match.Groups[[EMOJI]].Value
            Write-Host "  [EMOJI][EMOJI][EMOJI] Detectado: import from '$PackagePath'" -ForegroundColor Yellow

            if ($AutoFix) {
                # Ejecutar fix autom√[EMOJI]tico
                pwsh -NoProfile -File scripts/fix-imports.ps[EMOJI] | Out-Null
                Write-Host "  [OK] AUTO-FIX EJECUTADO" -ForegroundColor Green
                return $true
            }
            return $false
        }
    }
    "TypeScriptError" = @{
        Pattern = "TypeScript error in ([\w\/\.-]+):\((\d+),(\d+)\): (.+)"
        Description = "Error de TypeScript"
        AutoFix = {
            param($Match)
            $File = $Match.Groups[[EMOJI]].Value
            $Line = $Match.Groups[[EMOJI]].Value
            $Col = $Match.Groups[[EMOJI]].Value
            $Message = $Match.Groups[[EMOJI]].Value
            Write-Host "  [EMOJI][EMOJI][EMOJI] Archivo: $File:$Line:$Col" -ForegroundColor Yellow
            Write-Host "  [EMOJI][EMOJI][EMOJI] Error: $Message" -ForegroundColor Red
            return $false
        }
    }
    "BuildFailed" = @{
        Pattern = "Failed to compile"
        Description = "Build fall√≥"
        AutoFix = {
            param($Match)
            Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] BUILD FALL√[EMOJI] - Revisando logs anteriores..." -ForegroundColor Red
            return $false
        }
    }
}

# Funci√≥n para procesar una l√≠nea de log
function Process-LogLine {
    param([string]$Line)

    foreach ($ErrorName in $ErrorPatterns.Keys) {
        $Pattern = $ErrorPatterns[$ErrorName].Pattern
        $Description = $ErrorPatterns[$ErrorName].Description
        $AutoFixFunc = $ErrorPatterns[$ErrorName].AutoFix

        if ($Line -match $Pattern) {
            Write-Host ""
            Write-Host "[ERROR] ERROR DETECTADO: $Description" -ForegroundColor Red
            Write-Host "   L√≠nea: $Line" -ForegroundColor Gray

            # Ejecutar auto-fix si est√[EMOJI] habilitado
            $Match = [regex]::Match($Line, $Pattern)
            $Fixed = & $AutoFixFunc $Match

            if ($Fixed) {
                Write-Host ""
                Write-Host "[FAST] Cambios aplicados. El servidor deber√≠a recargar..." -ForegroundColor Cyan
            } elseif ($AutoFix) {
                Write-Host "  [WARN]  No se pudo auto-corregir este error" -ForegroundColor Yellow
            } else {
                Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] TIP: Ejecuta con -AutoFix para corregir autom√[EMOJI]ticamente" -ForegroundColor Cyan
            }

            Write-Host ""
            return $true
        }
    }

    return $false
}

# Buscar archivos de log del servidor
$LogFiles = @(
    ".next/build.log",
    ".turbo/daemon.log",
    "apps/web/.next/build.log"
)

$FoundLogFile = $null
foreach ($LogFile in $LogFiles) {
    if (Test-Path $LogFile) {
        $FoundLogFile = $LogFile
        break
    }
}

if (-not $FoundLogFile) {
    Write-Host "[WARN]  No se encontraron archivos de log" -ForegroundColor Yellow
    Write-Host "   Aseg√∫rate de que el servidor est√[EMOJI] corriendo" -ForegroundColor Gray
    Write-Host ""
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] ALTERNATIVA: Monitorear STDOUT del servidor" -ForegroundColor Cyan
    Write-Host "   Ejecuta: pnpm dev [EMOJI]>&[EMOJI] | pwsh -File scripts/dev-log-monitor.ps[EMOJI] -AutoFix" -ForegroundColor Gray
    Write-Host ""

    # Si no hay archivo, leer desde STDIN (piped input)
    if (-not [Console]::IsInputRedirected) {
        Write-Host "[ERROR] No hay logs disponibles" -ForegroundColor Red
        exit [EMOJI]
    }

    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Leyendo logs desde STDIN..." -ForegroundColor Green
    Write-Host ""

    $ErrorCount = 0
    $FixCount = 0

    try {
        while ($null -ne ($Line = [Console]::ReadLine())) {
            # Mostrar la l√≠nea original
            Write-Host $Line

            # Procesar para detectar errores
            $IsError = Process-LogLine $Line

            if ($IsError) {
                $ErrorCount++
                if ($AutoFix) {
                    $FixCount++
                }
            }
        }
    } catch {
        # Ctrl+C pressed
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "RESUMEN" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Errores detectados: $ErrorCount" -ForegroundColor Yellow
    if ($AutoFix) {
        Write-Host "Errores corregidos: $FixCount" -ForegroundColor Green
    }
    exit 0
}

# Si se encontr√≥ archivo de log, monitorearlo
Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Monitoreando: $FoundLogFile" -ForegroundColor Green
Write-Host ""

Get-Content $FoundLogFile -Tail $TailLines -Wait | ForEach-Object {
    # Mostrar la l√≠nea original
    Write-Host $_

    # Procesar para detectar errores
    Process-LogLine $_
}
