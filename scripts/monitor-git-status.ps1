#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Monitor Git Status en tiempo real
.DESCRIPTION
    Muestra status de git cada [EMOJI]0 segundos
    √[EMOJI]til para monitorear cambios cuando trabajas en m√∫ltiples ventanas
.EXAMPLE
    ./monitor-git-status.ps[EMOJI]
    ./monitor-git-status.ps[EMOJI] -Interval [EMOJI]0  # Cada [EMOJI]0 segundos
#>

param(
    [int]$Interval = [EMOJI]0
)

$ErrorActionPreference = 'SilentlyContinue'

function Show-GitStatus {
    Clear-Host
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] GIT STATUS MONITOR" -ForegroundColor Cyan
    Write-Host "$(Get-Date -Format 'HH:mm:ss') - Actualizaci√≥n cada $Interval segundos" -ForegroundColor Gray
    Write-Host "[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê" -ForegroundColor Gray
    
    # Rama actual
    $branch = git rev-parse --abbrev-ref HEAD
    Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] Rama: " -ForegroundColor Yellow -NoNewline
    Write-Host "$branch" -ForegroundColor Green
    
    # Status
    Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] Cambios:" -ForegroundColor Yellow
    $status = git status --short
    if ($status) {
        $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Cyan }
    } else {
        Write-Host "  [OK] Sin cambios" -ForegroundColor Green
    }
    
    # Ramas locales
    Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] Ramas locales:" -ForegroundColor Yellow
    git branch -v | ForEach-Object {
        if ($_ -match "^\* ") {
            Write-Host "  $_" -ForegroundColor Green
        } else {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
    
    # Stash
    Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] Stash:" -ForegroundColor Yellow
    $stash = git stash list
    if ($stash) {
        $stash | ForEach-Object { Write-Host "  $_" -ForegroundColor Magenta }
    } else {
        Write-Host "  (vac√≠o)" -ForegroundColor Gray
    }
    
    # √[EMOJI]ltimo commit
    Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] √[EMOJI]ltimo commit:" -ForegroundColor Yellow
    git log -[EMOJI] --oneline | ForEach-Object { Write-Host "  $_" -ForegroundColor Cyan }
    
    Write-Host "`n[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê" -ForegroundColor Gray
    Write-Host "Presiona Ctrl+C para salir" -ForegroundColor Gray
}

# Loop principal
while ($true) {
    Show-GitStatus
    Start-Sleep -Seconds $Interval
}
