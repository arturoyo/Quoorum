#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Asistente interactivo para no joder nada mientras trabajas en paralelo
.DESCRIPTION
    Te gu√≠a paso a paso para NO cometer errores tontos
.EXAMPLE
    ./no-jodas.ps[EMOJI]
#>

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI][EMOJI]" -ForegroundColor Cyan
Write-Host "[EMOJI][EMOJI][EMOJI]  [EMOJI][EMOJI][EMOJI][EMOJI] ASISTENTE: NO JODAS ESTO (v[EMOJI].0)          [EMOJI][EMOJI][EMOJI]" -ForegroundColor Cyan
Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI][EMOJI]" -ForegroundColor Cyan

# [EMOJI]. Qu√© es lo primero?
Write-Host "`n¬[EMOJI]Es la PRIMERA vez que entras a esta ventana?" -ForegroundColor Yellow
$firstTime = Read-Host "Responde: si/no"

if ($firstTime -eq 'si') {
    Write-Host "`n[OK] OK, vamos:" -ForegroundColor Green
    Write-Host "[[EMOJI]]  Sincronizando main..." -ForegroundColor Cyan
    git pull origin main
    
    Write-Host "`n[[EMOJI]]  ¬[EMOJI]Qu√© tipo de tarea?" -ForegroundColor Cyan
    Write-Host "  feat   = Nueva funcionalidad" -ForegroundColor Gray
    Write-Host "  fix    = Arreglar bug" -ForegroundColor Gray
    Write-Host "  style  = Cambios visuales" -ForegroundColor Gray
    Write-Host "  refactor = Reorganizar c√≥digo" -ForegroundColor Gray
    Write-Host "  perf   = Optimizaci√≥n" -ForegroundColor Gray
    
    $type = Read-Host "Tipo"
    
    Write-Host "`n[[EMOJI]]  ¬[EMOJI]Nombre de la tarea? (sin espacios, con guiones)" -ForegroundColor Cyan
    Write-Host "Ejemplo: footer-icons, admin-prompts, settings-panel" -ForegroundColor Gray
    $name = Read-Host "Nombre"
    
    $branch = "$type/$name"
    
    Write-Host "`n[EMOJI][EMOJI]≥ Creando rama: $branch" -ForegroundColor Yellow
    git checkout -b $branch
    
    Write-Host "`n[OK] LISTO. Tu rama: $branch" -ForegroundColor Green
    Write-Host "   Edita lo que necesites, sin miedo" -ForegroundColor Green
    Write-Host "   Cuando termines algo [EMOJI][EMOJI][EMOJI] git commit -m 'descripci√≥n'" -ForegroundColor Green
}
else {
    Write-Host "`n¬[EMOJI]Qu√© necesitas hacer?" -ForegroundColor Yellow
    Write-Host "  [EMOJI] = Ver d√≥nde estoy" -ForegroundColor Gray
    Write-Host "  [EMOJI] = Commitear cambios" -ForegroundColor Gray
    Write-Host "  [EMOJI] = Cambiar de ventana (guardar trabajo)" -ForegroundColor Gray
    Write-Host "  [EMOJI] = Volver de otra ventana" -ForegroundColor Gray
    Write-Host "  [EMOJI] = Ver √∫ltimos cambios" -ForegroundColor Gray
    
    $opcion = Read-Host "Opci√≥n ([EMOJI]-[EMOJI])"
    
    switch ($opcion) {
        "[EMOJI]" {
            Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] ESTADO ACTUAL:" -ForegroundColor Cyan
            git status
        }
        "[EMOJI]" {
            Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] OK, vamos a commitear:" -ForegroundColor Cyan
            Write-Host "Cambios actuales:" -ForegroundColor Yellow
            git status --short
            
            Write-Host "`n¬[EMOJI]Descripci√≥n del cambio?" -ForegroundColor Yellow
            $msg = Read-Host "Mensaje"
            
            Write-Host "`n[EMOJI][EMOJI]≥ Commiteando..." -ForegroundColor Yellow
            git add .
            git commit -m $msg
            
            Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] ¬[EMOJI]Pushear ahora?" -ForegroundColor Yellow
            $push = Read-Host "si/no"
            if ($push -eq 'si') {
                git push origin (git rev-parse --abbrev-ref HEAD)
                Write-Host "[OK] Pusheado" -ForegroundColor Green
            }
        }
        "[EMOJI]" {
            Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] GUARDAR TRABAJO SIN COMMITEAR" -ForegroundColor Yellow
            Write-Host "Cambios actuales:" -ForegroundColor Cyan
            git status --short
            
            Write-Host "`n¬[EMOJI]Descripci√≥n? (qu√© estabas haciendo)" -ForegroundColor Yellow
            $desc = Read-Host "Descripci√≥n"
            
            git stash save "WIP: $desc"
            Write-Host "`n[OK] Guardado en stash" -ForegroundColor Green
        }
        "[EMOJI]" {
            Write-Host "`n[EMOJI][EMOJI][EMOJI]Ç RECUPERANDO TRABAJO ANTERIOR" -ForegroundColor Yellow
            Write-Host "Stash guardados:" -ForegroundColor Cyan
            git stash list
            
            Write-Host "`n¬[EMOJI]Recuperar el √∫ltimo?" -ForegroundColor Yellow
            $recover = Read-Host "si/no"
            if ($recover -eq 'si') {
                git stash pop
                Write-Host "`n[OK] Recuperado. Contin√∫a editando" -ForegroundColor Green
            }
        }
        "[EMOJI]" {
            Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] √[EMOJI]LTIMOS CAMBIOS" -ForegroundColor Cyan
            git log --oneline -[EMOJI]0
        }
    }
}

Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI][EMOJI]" -ForegroundColor Cyan
Write-Host "[EMOJI][EMOJI][EMOJI]  [OK] LISTO. A trabajar sin miedo [EMOJI][EMOJI][EMOJI][EMOJI]           [EMOJI][EMOJI][EMOJI]" -ForegroundColor Cyan
Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI]ê[EMOJI][EMOJI][EMOJI]" -ForegroundColor Cyan
