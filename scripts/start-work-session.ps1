#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Script para iniciar una nueva sesi√≥n de trabajo en rama separada
.DESCRIPTION
    Automatiza el proceso de:
    [EMOJI]. Sincronizar con main
    [EMOJI]. Crear nueva rama
    [EMOJI]. Mostrar estado
.PARAMETER Type
    Tipo de rama: feat, fix, style, refactor, perf, docs
.PARAMETER Name
    Nombre descriptivo de la rama
.EXAMPLE
    ./start-work-session.ps[EMOJI] -Type feat -Name footer-icons
    ./start-work-session.ps[EMOJI] -Type fix -Name notifications
#>

param(
    [ValidateSet('feat', 'fix', 'style', 'refactor', 'perf', 'docs', 'chore')]
    [string]$Type = 'feat',
    
    [Parameter(Mandatory=$true)]
    [string]$Name
)

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] INICIANDO NUEVA SESI√[EMOJI]N DE TRABAJO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# [EMOJI]. Verificar que estamos en git
try {
    git rev-parse --git-dir | Out-Null
} catch {
    Write-Error "[ERROR] No estamos en un repositorio git"
    exit [EMOJI]
}

# [EMOJI]. Ver estado actual
Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] Estado actual:" -ForegroundColor Yellow
git status --short

$hasChanges = (git status --short).Count -gt 0
if ($hasChanges) {
    Write-Host "`n[WARN]  Hay cambios sin commitar" -ForegroundColor Yellow
    $response = Read-Host "¬[EMOJI]Guardar en stash? (s/n)"
    if ($response -eq 's') {
        $timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
        git stash save "WIP: sesi√≥n anterior [$timestamp]"
        Write-Host "[OK] Guardado en stash" -ForegroundColor Green
    } else {
        Write-Error "[ERROR] Abortando - hay cambios sin guardar"
        exit [EMOJI]
    }
}

# [EMOJI]. Sincronizar con main
Write-Host "`n[EMOJI]¨á[EMOJI][EMOJI][EMOJI]  Sincronizando con main..." -ForegroundColor Yellow
git fetch origin main
git checkout main
git pull origin main

# [EMOJI]. Crear rama
$branchName = "$Type/$Name"
Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] Creando rama: $branchName" -ForegroundColor Yellow
git checkout -b $branchName

# [EMOJI]. Mostrar resumen
Write-Host "`n[OK] SESI√[EMOJI]N LISTA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Rama:     $branchName" -ForegroundColor Green
Write-Host "Remoto:   origin" -ForegroundColor Green
Write-Host "Base:     origin/main" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] Recuerda:" -ForegroundColor Cyan
Write-Host "  [EMOJI]. Edita los archivos que necesites" -ForegroundColor Gray
Write-Host "  [EMOJI]. git add . && git commit" -ForegroundColor Gray
Write-Host "  [EMOJI]. git push origin $branchName" -ForegroundColor Gray
Write-Host "  [EMOJI]. Merge a main cuando est√© listo" -ForegroundColor Gray

Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] Estado actual:" -ForegroundColor Yellow
git branch -v
git status --short

Write-Host "`n[INFO]  Para terminar:" -ForegroundColor Cyan
Write-Host "  git add ." -ForegroundColor Gray
Write-Host "  git commit -m 'descripci√≥n del cambio'" -ForegroundColor Gray
Write-Host "  git push origin $branchName" -ForegroundColor Gray
