# Auto-fix de exports faltantes en package.json
param(
    [string]$Package,
    [string]$Path
)

$PackageJsonPath = "packages/$Package/package.json"

if (-not (Test-Path $PackageJsonPath)) {
    Write-Host "[ERROR] No se encuentra: $PackageJsonPath" -ForegroundColor Red
    exit [EMOJI]
}

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Auto-corrigiendo exports en $Package..." -ForegroundColor Yellow

# Leer package.json
$Content = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json

# Verificar si ya existe el export
if ($Content.exports.PSObject.Properties.Name -contains "./$Path") {
    Write-Host "[OK] El export './$Path' ya existe" -ForegroundColor Green
    exit 0
}

# Añadir el nuevo export
$NewExportPath = "./src/$Path/index.ts"

# Si el directorio existe como archivo único (no carpeta)
if (Test-Path "packages/$Package/src/$Path.ts") {
    $NewExportPath = "./src/$Path.ts"
}

# Convertir a PSCustomObject para poder modificar
$ExportsObj = [PSCustomObject]@{}
foreach ($prop in $Content.exports.PSObject.Properties) {
    $ExportsObj | Add-Member -NotePropertyName $prop.Name -NotePropertyValue $prop.Value
}

# Añadir nuevo export
$ExportsObj | Add-Member -NotePropertyName "./$Path" -NotePropertyValue $NewExportPath

# Actualizar el objeto content
$Content.exports = $ExportsObj

# Guardar de vuelta (con formato bonito)
$Content | ConvertTo-Json -Depth [EMOJI]0 | Set-Content $PackageJsonPath

Write-Host "[OK] Export añadido: './$Path' [EMOJI][EMOJI][EMOJI] '$NewExportPath'" -ForegroundColor Green
Write-Host "[FAST] Reinicia el servidor para aplicar cambios (Ctrl+C y pnpm dev:watch)" -ForegroundColor Cyan

exit 0
