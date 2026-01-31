# Search for two import statements on same line
Write-Host "=== SEARCH 1: Multiple imports on same line ===" -ForegroundColor Cyan
Get-ChildItem -Path "c:\Quoorum\apps\web\src" -Recurse -Include "*.tsx","*.ts" | ForEach-Object {
    $lines = Get-Content $_.FullName -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($lines) {
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            # Look for: import...from...import
            if ($line -match 'import.*from.*import') {
                Write-Host "$($_.FullName):$($i+1): $line" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host "`n=== SEARCH 2: Duplicate 'cn' imports ===" -ForegroundColor Cyan
Get-ChildItem -Path "c:\Quoorum\apps\web\src" -Recurse -Include "*.tsx","*.ts" | ForEach-Object {
    $f = $_.FullName
    $lines = Get-Content $f -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($lines) {
        $cnCount = 0
        $cnLines = @()
        for ($i = 0; $i -lt $lines.Count; $i++) {
            # Look for: import { ... cn ... }
            if ($lines[$i] -match 'import\s*\{[^}]*\bcn\b') {
                $cnCount++
                $cnLines += ($i+1)
            }
        }
        if ($cnCount -gt 1) {
            Write-Host "$f : cn imported $cnCount times at lines $($cnLines -join ', ')" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nSearch complete!" -ForegroundColor Green
