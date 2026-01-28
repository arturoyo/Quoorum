#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Asistente interactivo para no joder nada mientras trabajas en paralelo
.DESCRIPTION
    Te guía paso a paso para NO cometer errores tontos
.EXAMPLE
    ./no-jodas.ps1
#>

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🎯 ASISTENTE: NO JODAS ESTO (v1.0)          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan

# 1. Qué es lo primero?
Write-Host "`n¿Es la PRIMERA vez que entras a esta ventana?" -ForegroundColor Yellow
$firstTime = Read-Host "Responde: si/no"

if ($firstTime -eq 'si') {
    Write-Host "`n✅ OK, vamos:" -ForegroundColor Green
    Write-Host "1️⃣  Sincronizando main..." -ForegroundColor Cyan
    git pull origin main
    
    Write-Host "`n2️⃣  ¿Qué tipo de tarea?" -ForegroundColor Cyan
    Write-Host "  feat   = Nueva funcionalidad" -ForegroundColor Gray
    Write-Host "  fix    = Arreglar bug" -ForegroundColor Gray
    Write-Host "  style  = Cambios visuales" -ForegroundColor Gray
    Write-Host "  refactor = Reorganizar código" -ForegroundColor Gray
    Write-Host "  perf   = Optimización" -ForegroundColor Gray
    
    $type = Read-Host "Tipo"
    
    Write-Host "`n3️⃣  ¿Nombre de la tarea? (sin espacios, con guiones)" -ForegroundColor Cyan
    Write-Host "Ejemplo: footer-icons, admin-prompts, settings-panel" -ForegroundColor Gray
    $name = Read-Host "Nombre"
    
    $branch = "$type/$name"
    
    Write-Host "`n⏳ Creando rama: $branch" -ForegroundColor Yellow
    git checkout -b $branch
    
    Write-Host "`n✅ LISTO. Tu rama: $branch" -ForegroundColor Green
    Write-Host "   Edita lo que necesites, sin miedo" -ForegroundColor Green
    Write-Host "   Cuando termines algo → git commit -m 'descripción'" -ForegroundColor Green
}
else {
    Write-Host "`n¿Qué necesitas hacer?" -ForegroundColor Yellow
    Write-Host "  1 = Ver dónde estoy" -ForegroundColor Gray
    Write-Host "  2 = Commitear cambios" -ForegroundColor Gray
    Write-Host "  3 = Cambiar de ventana (guardar trabajo)" -ForegroundColor Gray
    Write-Host "  4 = Volver de otra ventana" -ForegroundColor Gray
    Write-Host "  5 = Ver últimos cambios" -ForegroundColor Gray
    
    $opcion = Read-Host "Opción (1-5)"
    
    switch ($opcion) {
        "1" {
            Write-Host "`n📍 ESTADO ACTUAL:" -ForegroundColor Cyan
            git status
        }
        "2" {
            Write-Host "`n📝 OK, vamos a commitear:" -ForegroundColor Cyan
            Write-Host "Cambios actuales:" -ForegroundColor Yellow
            git status --short
            
            Write-Host "`n¿Descripción del cambio?" -ForegroundColor Yellow
            $msg = Read-Host "Mensaje"
            
            Write-Host "`n⏳ Commiteando..." -ForegroundColor Yellow
            git add .
            git commit -m $msg
            
            Write-Host "`n📤 ¿Pushear ahora?" -ForegroundColor Yellow
            $push = Read-Host "si/no"
            if ($push -eq 'si') {
                git push origin (git rev-parse --abbrev-ref HEAD)
                Write-Host "✅ Pusheado" -ForegroundColor Green
            }
        }
        "3" {
            Write-Host "`n💾 GUARDAR TRABAJO SIN COMMITEAR" -ForegroundColor Yellow
            Write-Host "Cambios actuales:" -ForegroundColor Cyan
            git status --short
            
            Write-Host "`n¿Descripción? (qué estabas haciendo)" -ForegroundColor Yellow
            $desc = Read-Host "Descripción"
            
            git stash save "WIP: $desc"
            Write-Host "`n✅ Guardado en stash" -ForegroundColor Green
        }
        "4" {
            Write-Host "`n📂 RECUPERANDO TRABAJO ANTERIOR" -ForegroundColor Yellow
            Write-Host "Stash guardados:" -ForegroundColor Cyan
            git stash list
            
            Write-Host "`n¿Recuperar el último?" -ForegroundColor Yellow
            $recover = Read-Host "si/no"
            if ($recover -eq 'si') {
                git stash pop
                Write-Host "`n✅ Recuperado. Continúa editando" -ForegroundColor Green
            }
        }
        "5" {
            Write-Host "`n📜 ÚLTIMOS CAMBIOS" -ForegroundColor Cyan
            git log --oneline -10
        }
    }
}

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ LISTO. A trabajar sin miedo 🚀           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
