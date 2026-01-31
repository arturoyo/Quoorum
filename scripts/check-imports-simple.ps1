# Simple import checker for Windows
# Checks for .js extensions in TypeScript imports

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Checking for .js extensions in TypeScript imports..." -ForegroundColor Cyan

$ErrorsFound = 0
$Files = @()

# Scan packages and apps directories
$SearchPaths = @("packages", "apps")

foreach ($SearchPath in $SearchPaths) {
    if (Test-Path $SearchPath) {
        $Files += Get-ChildItem -Path $SearchPath -Recurse -Include *.ts,*.tsx -File |
            Where-Object {
                $_.FullName -notmatch "node_modules" -and
                $_.FullName -notmatch "\.next" -and
                $_.FullName -notmatch "dist" -and
                $_.FullName -notmatch "\.turbo"
            }
    }
}

Write-Host "Scanning $($Files.Count) TypeScript files..." -ForegroundColor Gray

foreach ($File in $Files) {
    $Content = Get-Content $File.FullName -Raw -ErrorAction SilentlyContinue

    # Check for .js in both relative and package imports
    $HasRelativeJs = $Content -match 'from\s+[''"]\..*?\.js[''"]'
    $HasPackageJs = $Content -match 'from\s+[''"]@quoorum/[\w-]+/[\w-]+\.js[''"]'

    if ($HasRelativeJs -or $HasPackageJs) {
        $Lines = Get-Content $File.FullName
        $LineNumber = 0

        foreach ($Line in $Lines) {
            $LineNumber++
            if ($Line -match 'from\s+[''"]\..*?\.js[''"]') {
                if ($ErrorsFound -eq 0) {
                    Write-Host ""
                }
                Write-Host "[ERROR] Found .js extension:" -ForegroundColor Red
                Write-Host "   File: $($File.FullName)" -ForegroundColor Yellow
                Write-Host "   Line $LineNumber`: $Line" -ForegroundColor Gray
                $ErrorsFound++
            }
        }
    }
}

Write-Host ""

if ($ErrorsFound -gt 0) {
    Write-Host "[ERROR] Found $ErrorsFound import(s) with .js extensions" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix automatically:" -ForegroundColor Yellow
    Write-Host "  [EMOJI]. Review the files listed above" -ForegroundColor Gray
    Write-Host "  [EMOJI]. Remove .js extensions from relative imports" -ForegroundColor Gray
    Write-Host "  [EMOJI]. Example: from './users.js' [EMOJI][EMOJI][EMOJI] from './users'" -ForegroundColor Gray
    Write-Host ""
    exit [EMOJI]
} else {
    Write-Host "[OK] No .js extensions found in TypeScript imports" -ForegroundColor Green
    exit 0
}
