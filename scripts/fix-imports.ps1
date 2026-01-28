# Fix all .js extensions in TypeScript imports
# This is the REAL fix, not theoretical

$ErrorActionPreference = "Stop"
$FilesFixed = 0
$TotalErrors = 0

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Fixing .js extensions in TypeScript imports..." -ForegroundColor Cyan

$SearchPaths = @("packages", "apps")

foreach ($SearchPath in $SearchPaths) {
    if (-not (Test-Path $SearchPath)) {
        continue
    }

    $Files = Get-ChildItem -Path $SearchPath -Recurse -Include *.ts,*.tsx -File |
        Where-Object {
            $_.FullName -notmatch "node_modules" -and
            $_.FullName -notmatch "\.next" -and
            $_.FullName -notmatch "dist" -and
            $_.FullName -notmatch "\.turbo"
        }

    foreach ($File in $Files) {
        $OriginalContent = Get-Content $File.FullName -Raw -ErrorAction SilentlyContinue

        # Check for .js extensions in both relative and package imports
        $HasRelativeJsImports = $OriginalContent -match 'from\s+[''"]\..*?\.js[''"]'
        $HasPackageJsImports = $OriginalContent -match 'from\s+[''"]@quoorum/[\w-]+/[\w-]+\.js[''"]'

        if ($HasRelativeJsImports -or $HasPackageJsImports) {
            # Count errors in this file
            $RelativeCount = ([regex]::Matches($OriginalContent, 'from\s+[''"]\..*?\.js[''"]')).Count
            $PackageCount = ([regex]::Matches($OriginalContent, 'from\s+[''"]@quoorum/[\w-]+/[\w-]+\.js[''"]')).Count
            $ErrorCount = $RelativeCount + $PackageCount
            $TotalErrors += $ErrorCount

            # Remove .js extensions from relative imports (./path.js [EMOJI][EMOJI][EMOJI] ./path)
            $NewContent = $OriginalContent -replace 'from\s+([''"])(\.\S*?)\.js\[EMOJI]', 'from $[EMOJI]$[EMOJI]$[EMOJI]'

            # Remove .js extensions from package imports (@quoorum/db/client.js [EMOJI][EMOJI][EMOJI] @quoorum/db/client)
            $NewContent = $NewContent -replace 'from\s+([''"])(@quoorum/[\w-]+/[\w-]+)\.js\[EMOJI]', 'from $[EMOJI]$[EMOJI]$[EMOJI]'

            # Write back
            Set-Content -Path $File.FullName -Value $NewContent -NoNewline

            $FilesFixed++
            Write-Host "[EMOJI][EMOJI][EMOJI] Fixed: $($File.FullName) ($ErrorCount errors)" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Files fixed: $FilesFixed" -ForegroundColor Green
Write-Host "Total errors removed: $TotalErrors" -ForegroundColor Green
Write-Host ""

if ($FilesFixed -gt 0) {
    Write-Host "[OK] All .js extensions removed from TypeScript imports" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[EMOJI][EMOJI][EMOJI] No files needed fixing" -ForegroundColor Blue
    exit 0
}
