# Script para habilitar modo test en desarrollo
# Esto permite acceder a rutas protegidas usando la cuenta test@quoorum.pro

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Habilitando modo test para desarrollo..." -ForegroundColor Cyan
Write-Host ""
Write-Host "El sistema ya tiene configurado el modo test con:" -ForegroundColor Green
Write-Host "  [EMOJI][EMOJI]¢ Email: test@quoorum.pro" -ForegroundColor White
Write-Host "  [EMOJI][EMOJI]¢ Cookie: test-auth-bypass=test@quoorum.pro" -ForegroundColor White
Write-Host ""
Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] PASOS PARA HABILITAR:" -ForegroundColor Yellow
Write-Host ""
Write-Host "[EMOJI]. Verificar/Crear perfil (opcional):" -ForegroundColor Cyan
Write-Host "   .\scripts\setup-test-user.ps[EMOJI]" -ForegroundColor White
Write-Host ""
Write-Host "[EMOJI]. Abre el navegador en http://localhost:[EMOJI]000" -ForegroundColor Cyan
Write-Host ""
Write-Host "[EMOJI]. Abre la consola del navegador (F[EMOJI][EMOJI])" -ForegroundColor Cyan
Write-Host ""
Write-Host "[EMOJI]. Ejecuta este comando:" -ForegroundColor Cyan
Write-Host '   document.cookie = "test-auth-bypass=test@quoorum.pro; path=/"' -ForegroundColor Green
Write-Host ""
Write-Host "[EMOJI]. Recarga la p√[EMOJI]gina (F[EMOJI])" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Ahora podr√[EMOJI]s acceder a /debates sin autenticaci√≥n" -ForegroundColor Green
Write-Host ""
Write-Host "[WARN]  IMPORTANTE: Esto solo funciona en desarrollo (NODE_ENV !== 'production')" -ForegroundColor Red
Write-Host ""
