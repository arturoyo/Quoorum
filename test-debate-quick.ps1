# Script rápido para abrir el navegador y probar los fixes

Write-Host ""
Write-Host "🧪 TEST DE DEBATE - Verificando Fixes" -ForegroundColor Cyan
Write-Host "━" * 60 -ForegroundColor DarkGray
Write-Host ""

# Verificar que el servidor esté corriendo
Write-Host "🔍 Verificando servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Servidor corriendo en http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor no responde en http://localhost:3000" -ForegroundColor Red
    Write-Host ""
    Write-Host "Inicia el servidor con:" -ForegroundColor Yellow
    Write-Host "  pnpm dev --filter @quoorum/web" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "📋 Fixes implementados:" -ForegroundColor Cyan
Write-Host "  1. ✅ Mensajes visibles con expand/collapse" -ForegroundColor Green
Write-Host "  2. ✅ Ranking relevante a la pregunta" -ForegroundColor Green
Write-Host "  3. ✅ Mensajes legibles (no emojis)" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 Pregunta de prueba:" -ForegroundColor Yellow
Write-Host '  "¿Qué es mejor ChatGPT o Perplexity para programar?"' -ForegroundColor White
Write-Host ""

Write-Host "━" * 60 -ForegroundColor DarkGray
Write-Host ""

# Preguntar si quiere abrir el navegador
$open = Read-Host "¿Abrir navegador en /debates/new? (S/n)"
if ($open -ne "n" -and $open -ne "N") {
    Write-Host ""
    Write-Host "🌐 Abriendo navegador..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000/debates/new"
    Write-Host ""
    Write-Host "✨ Observa la interfaz mientras el debate se ejecuta" -ForegroundColor Green
    Write-Host ""
    Write-Host "📖 Checklist de verificación:" -ForegroundColor Yellow
    Write-Host "   ✓ Fase 'deliberando' expandida automáticamente" -ForegroundColor White
    Write-Host "   ✓ Múltiples agentes participan (no solo crítico)" -ForegroundColor White
    Write-Host "   ✓ Mensajes legibles (1-3 oraciones claras)" -ForegroundColor White
    Write-Host "   ✓ Barra de progreso: 'X de ~Y agentes'" -ForegroundColor White
    Write-Host "   ✓ Ranking muestra: 'ChatGPT', 'Perplexity', etc." -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "📝 Para probar manualmente:" -ForegroundColor Yellow
    Write-Host "   1. Abre: http://localhost:3000/debates/new" -ForegroundColor White
    Write-Host "   2. Inicia sesión si es necesario" -ForegroundColor White
    Write-Host "   3. Crea debate con la pregunta de prueba" -ForegroundColor White
    Write-Host ""
}

Write-Host "━" * 60 -ForegroundColor DarkGray
Write-Host ""
Write-Host "📄 Lee TEST-INSTRUCCIONES.md para detalles completos" -ForegroundColor Cyan
Write-Host ""
