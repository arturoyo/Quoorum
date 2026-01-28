#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Monitor Git Status en tiempo real
.DESCRIPTION
    Muestra status de git cada 30 segundos
    Útil para monitorear cambios cuando trabajas en múltiples ventanas
.EXAMPLE
    ./monitor-git-status.ps1
    ./monitor-git-status.ps1 -Interval 10  # Cada 10 segundos
#>

param(
    [int]$Interval = 30
)

$ErrorActionPreference = 'SilentlyContinue'

function Show-GitStatus {
    Clear-Host
    Write-Host "📊 GIT STATUS MONITOR" -ForegroundColor Cyan
    Write-Host "$(Get-Date -Format 'HH:mm:ss') - Actualización cada $Interval segundos" -ForegroundColor Gray
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Gray
    
    # Rama actual
    $branch = git rev-parse --abbrev-ref HEAD
    Write-Host "`n🌿 Rama: " -ForegroundColor Yellow -NoNewline
    Write-Host "$branch" -ForegroundColor Green
    
    # Status
    Write-Host "`n📝 Cambios:" -ForegroundColor Yellow
    $status = git status --short
    if ($status) {
        $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Cyan }
    } else {
        Write-Host "  ✅ Sin cambios" -ForegroundColor Green
    }
    
    # Ramas locales
    Write-Host "`n🌿 Ramas locales:" -ForegroundColor Yellow
    git branch -v | ForEach-Object {
        if ($_ -match "^\* ") {
            Write-Host "  $_" -ForegroundColor Green
        } else {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
    
    # Stash
    Write-Host "`n💾 Stash:" -ForegroundColor Yellow
    $stash = git stash list
    if ($stash) {
        $stash | ForEach-Object { Write-Host "  $_" -ForegroundColor Magenta }
    } else {
        Write-Host "  (vacío)" -ForegroundColor Gray
    }
    
    # Último commit
    Write-Host "`n📜 Último commit:" -ForegroundColor Yellow
    git log -1 --oneline | ForEach-Object { Write-Host "  $_" -ForegroundColor Cyan }
    
    Write-Host "`n═══════════════════════════════════════════" -ForegroundColor Gray
    Write-Host "Presiona Ctrl+C para salir" -ForegroundColor Gray
}

# Loop principal
while ($true) {
    Show-GitStatus
    Start-Sleep -Seconds $Interval
}
