# Setup PostgreSQL Dedicado para Quoorum
# Puerto 5433 (separado de jarkis:5432)

Write-Host "🚀 Configurando PostgreSQL dedicado para Quoorum..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Docker
Write-Host "📦 Verificando Docker..." -ForegroundColor Yellow
docker ps > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker Desktop no está corriendo" -ForegroundColor Red
    Write-Host "   Por favor, arranca Docker Desktop y ejecuta de nuevo" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker está corriendo" -ForegroundColor Green

# 2. Levantar PostgreSQL dedicado
Write-Host "`n🐘 Levantando PostgreSQL en puerto 5433..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al levantar PostgreSQL" -ForegroundColor Red
    exit 1
}

# 3. Esperar a que esté listo
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

# 4. Ejecutar migraciones
Write-Host "`n🔄 Ejecutando migraciones..." -ForegroundColor Yellow

# Primero compilar
Write-Host "   Compilando schema..." -ForegroundColor Gray
cd packages\db
pnpm build > $null 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Schema compilado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Error compilando schema" -ForegroundColor Yellow
}

# Ejecutar migraciones SQL directamente
Write-Host "   Aplicando migraciones SQL..." -ForegroundColor Gray
cd ..\..

$migrations = Get-ChildItem -Path "packages\db\drizzle\*.sql" | Sort-Object Name

foreach ($migration in $migrations) {
    Write-Host "     → $($migration.Name)" -ForegroundColor Gray
    Get-Content $migration.FullName | docker exec -i quoorum-postgres psql -U postgres -d quoorum > $null 2>&1
}

Write-Host "   ✅ Migraciones aplicadas" -ForegroundColor Green

# 5. Verificar tablas
Write-Host "`n🔍 Verificando tablas creadas..." -ForegroundColor Yellow
$tableCount = docker exec quoorum-postgres psql -U postgres -d quoorum -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
$tableCount = $tableCount.Trim()

Write-Host "   ✅ $tableCount tablas creadas" -ForegroundColor Green

# 6. Test de conexión
Write-Host "`n🧪 Test de conexión..." -ForegroundColor Yellow
docker exec quoorum-postgres psql -U postgres -d quoorum -c "SELECT current_database() as database, current_user as user, version();" 2>&1 | Select-String -Pattern "quoorum|postgres|PostgreSQL" | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }

Write-Host ""
Write-Host "✅ ¡PostgreSQL configurado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Conexión:" -ForegroundColor Cyan
Write-Host "   postgresql://postgres:postgres@localhost:5433/quoorum" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Siguiente paso:" -ForegroundColor Cyan
Write-Host "   1. CIERRA el terminal actual donde corre 'pnpm dev'" -ForegroundColor Yellow
Write-Host "   2. Abre un NUEVO terminal en C:\Quoorum" -ForegroundColor Yellow
Write-Host "   3. Ejecuta: pnpm dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Comandos útiles:" -ForegroundColor Cyan
Write-Host "   docker-compose down        # Parar PostgreSQL" -ForegroundColor Gray
Write-Host "   docker-compose up -d       # Arrancar PostgreSQL" -ForegroundColor Gray
Write-Host "   docker-compose logs -f     # Ver logs" -ForegroundColor Gray
Write-Host "   docker exec -it quoorum-postgres psql -U postgres -d quoorum  # Conectar" -ForegroundColor Gray
Write-Host ""
