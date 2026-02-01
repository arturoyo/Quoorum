# Script para configurar usuario de test en PostgreSQL local
# Este script crea el perfil test@quoorum.pro si no existe

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Configurando usuario de test..." -ForegroundColor Cyan
Write-Host ""

# Verificar si Docker est√[EMOJI] corriendo
$dockerRunning = docker ps [EMOJI]>&[EMOJI] | Select-String -Pattern "quoorum-postgres"
if (-not $dockerRunning) {
    Write-Host "[ERROR] ERROR: Docker no est√[EMOJI] corriendo o el contenedor quoorum-postgres no est√[EMOJI] activo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ejecuta primero:" -ForegroundColor Yellow
    Write-Host "  docker-compose up -d" -ForegroundColor White
    exit [EMOJI]
}

Write-Host "[OK] Docker est√[EMOJI] corriendo" -ForegroundColor Green
Write-Host ""

# Verificar si el perfil ya existe
Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Verificando si existe el perfil test@quoorum.pro..." -ForegroundColor Cyan
$existingProfile = docker exec quoorum-postgres psql -U postgres -d quoorum -t -c "SELECT COUNT(*) FROM profiles WHERE email = 'test@quoorum.pro';" [EMOJI]>&[EMOJI]

if ($existingProfile -match "^\s*[EMOJI]\s*$") {
    Write-Host "[OK] El perfil test@quoorum.pro ya existe" -ForegroundColor Green
    Write-Host ""
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Para habilitar el modo test:" -ForegroundColor Yellow
    Write-Host "  [EMOJI]. Abre el navegador en http://localhost:[EMOJI]000" -ForegroundColor White
    Write-Host "  [EMOJI]. Abre la consola (F[EMOJI][EMOJI])" -ForegroundColor White
    Write-Host "  [EMOJI]. Ejecuta: document.cookie = 'test-auth-bypass=test@quoorum.pro; path=/' -ForegroundColor Green
    Write-Host "  [EMOJI]. Recarga la p√[EMOJI]gina" -ForegroundColor White
    exit 0
}

Write-Host "[WARN]  El perfil no existe. Cre√[EMOJI]ndolo..." -ForegroundColor Yellow
Write-Host ""

# Generar UUIDs
$profileId = [guid]::NewGuid().ToString()
$userId = [guid]::NewGuid().ToString()

# Crear el perfil
$sql = 'INSERT INTO profiles (id, user_id, email, name, full_name, role, is_active, created_at, updated_at) VALUES (''' + $profileId + ''', ''' + $userId + ''', ''test@quoorum.pro'', ''Test User'', ''Test User'', ''user'', true, NOW(), NOW()) ON CONFLICT (email) DO NOTHING;'

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Creando perfil..." -ForegroundColor Cyan
$result = docker exec quoorum-postgres psql -U postgres -d quoorum -c $sql [EMOJI]>&[EMOJI]

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Perfil creado exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Para habilitar el modo test:" -ForegroundColor Yellow
    Write-Host "  [EMOJI]. Abre el navegador en http://localhost:[EMOJI]000" -ForegroundColor White
    Write-Host "  [EMOJI]. Abre la consola (F[EMOJI][EMOJI])" -ForegroundColor White
    Write-Host "  [EMOJI]. Ejecuta: document.cookie = 'test-auth-bypass=test@quoorum.pro; path=/' -ForegroundColor Green
    Write-Host "  [EMOJI]. Recarga la p√[EMOJI]gina" -ForegroundColor White
} else {
    Write-Host "[ERROR] Error al crear el perfil:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit [EMOJI]
}
