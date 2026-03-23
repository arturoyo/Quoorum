param(
    [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"
$separator = "------------------------------------------------------------"

Write-Host ""
Write-Host $separator -ForegroundColor Cyan
Write-Host "[INFO] EMOJI CHECK ($Mode): Verificando emojis en codigo" -ForegroundColor Cyan
Write-Host $separator -ForegroundColor Cyan
Write-Host ""

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

$extensions = @(
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs"
)

# Use Unicode category matching for emoji detection
# Matches surrogate pairs and common emoji Unicode blocks
$emojiRegex = [regex]::new('[\u2600-\u27BF\u2B50-\u2B55\u231A-\u23F3\u2934-\u2935\u25AA-\u25FE\u2702-\u27B0\u3030\u303D\uD83C-\uDBFF][\uDC00-\uDFFF]?|[\uD83C-\uDBFF][\uDC00-\uDFFF]')

$files = & git -C $repoRoot ls-files 2>$null
if ($LASTEXITCODE -ne 0 -or -not $files) {
    Write-Host "[WARN] No se pudieron obtener archivos con git. Continuando sin bloqueo." -ForegroundColor Yellow
    exit 0
}

# Folders to exclude (scripts use emojis in CLI output, not in runtime code)
# Folders to exclude:
# - scripts/: CLI tools use emojis in output
# - docs/: documentation
# - packages/db/drizzle/: SQL migrations
# - packages/quoorum/visualization/: demo components (emojis in UI strings, not console)
# - packages/workers/: background workers (separate process)
$excludePrefixes = @("scripts/", "docs/", "packages/db/drizzle/", "packages/db/seed-", "packages/quoorum/visualization/", "packages/quoorum/examples/", "packages/workers/")

$filesToCheck = @()
foreach ($file in $files) {
    $ext = [IO.Path]::GetExtension($file).ToLowerInvariant()
    if ($extensions -contains $ext) {
        $skip = $false
        foreach ($prefix in $excludePrefixes) {
            if ($file.Replace('\','/').StartsWith($prefix)) { $skip = $true; break }
        }
        if (-not $skip) {
            $filesToCheck += $file
        }
    }
}

$violations = @()
foreach ($file in $filesToCheck) {
    $fullPath = Join-Path $repoRoot $file
    if (-not (Test-Path $fullPath)) {
        continue
    }

    $lineNumber = 0
    foreach ($line in Get-Content -LiteralPath $fullPath -Encoding UTF8) {
        $lineNumber++
        # Only check lines that write to console/logger (the actual crash cause)
        if (($line -match 'console\.' -or $line -match 'logger\.' -or $line -match 'Write-Host') -and $emojiRegex.IsMatch($line)) {
            $violations += [pscustomobject]@{
                File = $file
                Line = $lineNumber
            }
        }
    }
}

if ($violations.Count -gt 0) {
    Write-Host "[ERROR] Emojis detectados en codigo. Bloqueando $Mode." -ForegroundColor Red
    Write-Host ""
    Write-Host "Archivos con emojis:" -ForegroundColor Yellow

    foreach ($item in $violations) {
        Write-Host "  - $($item.File):$($item.Line)" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Accion requerida:" -ForegroundColor Yellow
    Write-Host "  - Reemplaza emojis por etiquetas de texto: [OK], [ERROR], [WARN], [INFO]" -ForegroundColor Yellow
    Write-Host "  - Usa logger estructurado cuando sea posible" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "[OK] No se detectaron emojis en codigo" -ForegroundColor Green
Write-Host ""
exit 0
