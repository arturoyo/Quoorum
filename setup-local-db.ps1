# Setup Local Database - Quoorum
# Ejecutar DESPUÉS de arrancar Docker Desktop

Write-Host "🚀 Configurando Base de Datos Local..." -ForegroundColor Cyan

# 1. Verificar que Docker está corriendo
Write-Host "`n📦 Verificando Docker..." -ForegroundColor Yellow
docker ps > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker Desktop no está corriendo" -ForegroundColor Red
    Write-Host "   Por favor, arranca Docker Desktop y ejecuta este script de nuevo" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker está corriendo" -ForegroundColor Green

# 2. Levantar PostgreSQL
Write-Host "`n🐘 Levantando PostgreSQL..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al levantar PostgreSQL" -ForegroundColor Red
    exit 1
}

# 3. Esperar a que PostgreSQL esté listo
Write-Host "`n⏳ Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$ready = $false
$attempts = 0
$maxAttempts = 10

while (-not $ready -and $attempts -lt $maxAttempts) {
    $attempts++
    Write-Host "   Intento $attempts/$maxAttempts..." -ForegroundColor Gray

    docker exec quoorum-postgres pg_isready -U postgres > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
    } else {
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "❌ PostgreSQL no respondió después de $maxAttempts intentos" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PostgreSQL está listo" -ForegroundColor Green

# 4. Actualizar .env.local
Write-Host "`n📝 Actualizando .env.local..." -ForegroundColor Yellow

$localDbUrl = "postgresql://postgres:postgres@localhost:5433/quoorum"

# Leer .env.local actual
$envPath = "apps\web\.env.local"
$envContent = Get-Content $envPath -Raw -ErrorAction SilentlyContinue

if ($envContent) {
    # Reemplazar DATABASE_URL existente
    if ($envContent -match "DATABASE_URL=") {
        $envContent = $envContent -replace 'DATABASE_URL=.*', "DATABASE_URL=`"$localDbUrl`""
    } else {
        # Añadir DATABASE_URL
        $envContent += "`nDATABASE_URL=`"$localDbUrl`"`n"
    }

    Set-Content -Path $envPath -Value $envContent -NoNewline
    Write-Host "✅ .env.local actualizado" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local no encontrado, creando..." -ForegroundColor Yellow
    Set-Content -Path $envPath -Value "DATABASE_URL=`"$localDbUrl`"`n"
    Write-Host "✅ .env.local creado" -ForegroundColor Green
}

# 5. Ejecutar migraciones
Write-Host "`n🔄 Ejecutando migraciones de Drizzle..." -ForegroundColor Yellow
Write-Host "   (Esto puede tardar 1-2 minutos)" -ForegroundColor Gray

# Primero compilar el schema
cd packages\db
pnpm build

# Luego ejecutar migraciones
$env:DATABASE_URL = $localDbUrl
pnpm db:push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migraciones completadas" -ForegroundColor Green
} else {
    Write-Host "⚠️  Hubo algún problema con las migraciones, pero la BD está lista" -ForegroundColor Yellow
}

cd ..\..

# 6. Verificar conexión
Write-Host "`n🔍 Verificando conexión..." -ForegroundColor Yellow
docker exec quoorum-postgres psql -U postgres -d quoorum -c "SELECT current_database(), current_user;"

Write-Host "`n✅ ¡Todo listo!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Conexión local configurada:" -ForegroundColor Cyan
Write-Host "   $localDbUrl" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Puedes arrancar el servidor con:" -ForegroundColor Cyan
Write-Host "   pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   docker-compose down    # Parar la BD" -ForegroundColor Gray
Write-Host "   docker-compose up -d   # Arrancar la BD" -ForegroundColor Gray
Write-Host "   docker-compose logs -f # Ver logs" -ForegroundColor Gray
Write-Host ""
