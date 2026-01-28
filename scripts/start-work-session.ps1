#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Script para iniciar una nueva sesión de trabajo en rama separada
.DESCRIPTION
    Automatiza el proceso de:
    1. Sincronizar con main
    2. Crear nueva rama
    3. Mostrar estado
.PARAMETER Type
    Tipo de rama: feat, fix, style, refactor, perf, docs
.PARAMETER Name
    Nombre descriptivo de la rama
.EXAMPLE
    ./start-work-session.ps1 -Type feat -Name footer-icons
    ./start-work-session.ps1 -Type fix -Name notifications
#>

param(
    [ValidateSet('feat', 'fix', 'style', 'refactor', 'perf', 'docs', 'chore')]
    [string]$Type = 'feat',
    
    [Parameter(Mandatory=$true)]
    [string]$Name
)

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 INICIANDO NUEVA SESIÓN DE TRABAJO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# 1. Verificar que estamos en git
try {
    git rev-parse --git-dir | Out-Null
} catch {
    Write-Error "❌ No estamos en un repositorio git"
    exit 1
}

# 2. Ver estado actual
Write-Host "`n📊 Estado actual:" -ForegroundColor Yellow
git status --short

$hasChanges = (git status --short).Count -gt 0
if ($hasChanges) {
    Write-Host "`n⚠️  Hay cambios sin commitar" -ForegroundColor Yellow
    $response = Read-Host "¿Guardar en stash? (s/n)"
    if ($response -eq 's') {
        $timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
        git stash save "WIP: sesión anterior [$timestamp]"
        Write-Host "✅ Guardado en stash" -ForegroundColor Green
    } else {
        Write-Error "❌ Abortando - hay cambios sin guardar"
        exit 1
    }
}

# 3. Sincronizar con main
Write-Host "`n⬇️  Sincronizando con main..." -ForegroundColor Yellow
git fetch origin main
git checkout main
git pull origin main

# 4. Crear rama
$branchName = "$Type/$Name"
Write-Host "`n🌿 Creando rama: $branchName" -ForegroundColor Yellow
git checkout -b $branchName

# 5. Mostrar resumen
Write-Host "`n✅ SESIÓN LISTA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Rama:     $branchName" -ForegroundColor Green
Write-Host "Remoto:   origin" -ForegroundColor Green
Write-Host "Base:     origin/main" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n📝 Recuerda:" -ForegroundColor Cyan
Write-Host "  1. Edita los archivos que necesites" -ForegroundColor Gray
Write-Host "  2. git add . && git commit" -ForegroundColor Gray
Write-Host "  3. git push origin $branchName" -ForegroundColor Gray
Write-Host "  4. Merge a main cuando esté listo" -ForegroundColor Gray

Write-Host "`n🔄 Estado actual:" -ForegroundColor Yellow
git branch -v
git status --short

Write-Host "`nℹ️  Para terminar:" -ForegroundColor Cyan
Write-Host "  git add ." -ForegroundColor Gray
Write-Host "  git commit -m 'descripción del cambio'" -ForegroundColor Gray
Write-Host "  git push origin $branchName" -ForegroundColor Gray
