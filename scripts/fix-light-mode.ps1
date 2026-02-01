# fix-light-mode.ps[EMOJI] - Refactor masivo para modo claro premium
# Fecha: [EMOJI]8 Ene [EMOJI]0[EMOJI]6

Write-Host "[INFO] Iniciando refactor de modo claro..." -ForegroundColor Cyan

$basePath = Join-Path $PSScriptRoot "..\apps\web\src"
Set-Location $basePath

$count = 0
$filesProcessed = @()

function Fix-LightMode {
    param([string]$filePath)

    $content = Get-Content $filePath -Raw -Encoding UTF8
    $originalContent = $content

    # Textos - text-white
    $content = $content -replace 'className="([^"]*?)text-white([^"]*?)"', 'className="$[EMOJI]text-[var(--theme-text-primary)]$[EMOJI]"'
    $content = $content -replace "className='([^']*?)text-white([^']*?)'", "className='`$[EMOJI]text-[var(--theme-text-primary)]`$[EMOJI]'"

    # Fondos oscuros
    $content = $content -replace 'bg-slate-900/60', 'bg-[var(--theme-bg-secondary)]'
    $content = $content -replace 'bg-slate-900/80', 'bg-[var(--theme-bg-secondary)]'
    $content = $content -replace 'bg-slate-900/9[EMOJI]', 'bg-[var(--theme-bg-secondary)]'
    $content = $content -replace 'bg-slate-900([^/a-z-])', 'bg-[var(--theme-bg-primary)]$[EMOJI]'
    $content = $content -replace 'bg-slate-800/[EMOJI]0', 'bg-[var(--theme-bg-tertiary)]'
    $content = $content -replace 'bg-slate-800/[EMOJI]0', 'bg-[var(--theme-bg-tertiary)]'
    $content = $content -replace 'bg-slate-800([^/a-z-])', 'bg-[var(--theme-bg-tertiary)]$[EMOJI]'
    $content = $content -replace 'bg-slate-700', 'bg-[var(--theme-bg-input)]'

    # Bordes
    $content = $content -replace 'border-white/[EMOJI]0', 'border-[var(--theme-border)]'
    $content = $content -replace 'border-white/[EMOJI]', 'border-[var(--theme-border)]'
    $content = $content -replace 'border-white/[EMOJI]0', 'border-[var(--theme-border)]'

    # Hover states
    $content = $content -replace 'hover:bg-white/[EMOJI]', 'hover:bg-[var(--theme-bg-tertiary)]'
    $content = $content -replace 'hover:bg-slate-800', 'hover:bg-[var(--theme-bg-tertiary)]'

    # Solo escribir si hubo cambios
    if ($content -ne $originalContent) {
        $content | Set-Content $filePath -Encoding UTF8 -NoNewline
        return $true
    }

    return $false
}

# Procesar componentes Quoorum
Write-Host "[INFO] Procesando componentes Quoorum..." -ForegroundColor Yellow
Get-ChildItem -Path "components\quoorum\*.tsx" -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'text-white|bg-slate-|border-white/') {
        Write-Host "  - Fixing: $($_.Name)" -ForegroundColor Gray
        if (Fix-LightMode $_.FullName) {
            $count++
            $filesProcessed += $_.FullName
        }
    }
}

# Procesar componentes Settings
Write-Host "[INFO] Procesando componentes Settings..." -ForegroundColor Yellow
Get-ChildItem -Path "components\settings\**\*.tsx" -File -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'text-white|bg-slate-|border-white/') {
        Write-Host "  - Fixing: $($_.Name)" -ForegroundColor Gray
        if (Fix-LightMode $_.FullName) {
            $count++
            $filesProcessed += $_.FullName
        }
    }
}

# Procesar componentes Admin
Write-Host "[INFO] Procesando componentes Admin..." -ForegroundColor Yellow
Get-ChildItem -Path "components\admin\**\*.tsx" -File -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'text-white|bg-slate-|border-white/') {
        Write-Host "  - Fixing: $($_.Name)" -ForegroundColor Gray
        if (Fix-LightMode $_.FullName) {
            $count++
            $filesProcessed += $_.FullName
        }
    }
}

# Procesar componentes UI
Write-Host "[INFO] Procesando componentes UI..." -ForegroundColor Yellow
Get-ChildItem -Path "components\ui\*.tsx" -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'text-white|bg-slate-|border-white/') {
        Write-Host "  - Fixing: $($_.Name)" -ForegroundColor Gray
        if (Fix-LightMode $_.FullName) {
            $count++
            $filesProcessed += $_.FullName
        }
    }
}

# Procesar Layout
Write-Host "[INFO] Procesando Layout..." -ForegroundColor Yellow
Get-ChildItem -Path "components\layout\*.tsx" -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'text-white|bg-slate-|border-white/') {
        Write-Host "  - Fixing: $($_.Name)" -ForegroundColor Gray
        if (Fix-LightMode $_.FullName) {
            $count++
            $filesProcessed += $_.FullName
        }
    }
}

Write-Host "`n[OK] Refactor completado" -ForegroundColor Green
Write-Host "[INFO] Archivos modificados: $count" -ForegroundColor Cyan

if ($count -gt 0) {
    Write-Host "`n[INFO] Archivos procesados:" -ForegroundColor Cyan
    $filesProcessed | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor Gray
    }

    Write-Host "`n[INFO] Verifica los cambios con: git diff" -ForegroundColor Yellow
    Write-Host "[INFO] Si todo se ve bien, haz commit con:" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor Gray
    Write-Host '  git commit -m "fix(ui): replace all hardcoded colors with CSS variables for premium light mode"' -ForegroundColor Gray
}
