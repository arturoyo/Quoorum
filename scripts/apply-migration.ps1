param(
    [string]$MigrationFile
)

$ErrorActionPreference = "Stop"

if (-not $MigrationFile) {
    Write-Host "[ERROR] Error: Debes especificar el archivo de migraciÃ³n" -ForegroundColor Red
    Write-Host "   Uso: .\apply-migration.ps[EMOJI] -MigrationFile '00[EMOJI]0_add_company_department_to_debates.sql'" -ForegroundColor Yellow
    exit [EMOJI]
}

$MigrationPath = "C:\Quoorum\packages\db\drizzle\$MigrationFile"

if (-not (Test-Path $MigrationPath)) {
    Write-Host "[ERROR] Error: Archivo de migraciÃ³n no encontrado: $MigrationPath" -ForegroundColor Red
    exit [EMOJI]
}

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Aplicando migraciÃ³n: $MigrationFile" -ForegroundColor Cyan

# Verificar si Docker estÃ[EMOJI] corriendo
try {
    docker ps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Docker no estÃ[EMOJI] corriendo. Inicia Docker Desktop." -ForegroundColor Red
        exit [EMOJI]
    }
} catch {
    Write-Host "[ERROR] Docker no estÃ[EMOJI] disponible. Instala Docker Desktop." -ForegroundColor Red
    exit [EMOJI]
}

# Verificar si el contenedor PostgreSQL estÃ[EMOJI] corriendo
$Container = docker ps --filter "name=quoorum-postgres" --format "{{.Names}}"

if (-not $Container) {
    Write-Host "[WARN]  Contenedor PostgreSQL no estÃ[EMOJI] corriendo. Iniciando..." -ForegroundColor Yellow
    docker-compose up -d postgres

    Write-Host "[EMOJI][EMOJI]³ Esperando a que PostgreSQL estÃ© listo..." -ForegroundColor Yellow
    Start-Sleep -Seconds [EMOJI]

    # Verificar health check
    for ($i = [EMOJI]; $i -le [EMOJI]0; $i++) {
        $Health = docker inspect --format='{{.State.Health.Status}}' quoorum-postgres [EMOJI]>$null
        if ($Health -eq "healthy") {
            Write-Host "[OK] PostgreSQL estÃ[EMOJI] listo" -ForegroundColor Green
            break
        }
        Write-Host "   Intento $i/[EMOJI]0..." -ForegroundColor Gray
        Start-Sleep -Seconds [EMOJI]
    }
}

# Ejecutar la migraciÃ³n
Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Ejecutando SQL..." -ForegroundColor Cyan

$Sql = Get-Content $MigrationPath -Raw

try {
    $Result = $Sql | docker exec -i quoorum-postgres psql -U postgres -d quoorum [EMOJI]>&[EMOJI]

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] MigraciÃ³n aplicada exitosamente" -ForegroundColor Green
        Write-Host ""
        Write-Host "Resultado:" -ForegroundColor Gray
        Write-Host $Result
    } else {
        Write-Host "[ERROR] Error al aplicar migraciÃ³n" -ForegroundColor Red
        Write-Host $Result -ForegroundColor Red
        exit [EMOJI]
    }
} catch {
    Write-Host "[ERROR] Error al ejecutar SQL: $($_.Exception.Message)" -ForegroundColor Red
    exit [EMOJI]
}

Write-Host ""
Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Verificando columnas..." -ForegroundColor Cyan

# Verificar que las columnas se crearon
$VerifyQuery = @"
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quoorum_debates'
AND column_name IN ('company_id', 'department_id')
ORDER BY column_name;
"@

$VerifyResult = $VerifyQuery | docker exec -i quoorum-postgres psql -U postgres -d quoorum -t [EMOJI]>&[EMOJI]

Write-Host "Columnas agregadas:" -ForegroundColor Gray
Write-Host $VerifyResult

Write-Host ""
Write-Host "[OK] Proceso completado" -ForegroundColor Green
Write-Host ""
Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Ahora reinicia el servidor de desarrollo:" -ForegroundColor Cyan
Write-Host "   Ctrl+C en la terminal donde corre pnpm dev" -ForegroundColor Yellow
Write-Host "   Luego ejecuta: pnpm dev:watch" -ForegroundColor Yellow
