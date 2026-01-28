#!/usr/bin/env pwsh

# Fix semantic color buttons to always have white text
# Purple/green/red buttons should keep text-white regardless of theme

$componentsRoot = "apps/web/src/components"

Write-Host "[INFO] Fixing semantic color buttons..." -ForegroundColor Cyan

$fileCount = 0
$changeCount = 0

# Find all TSX files
Get-ChildItem -Path $componentsRoot -Filter "*.tsx" -Recurse | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Fix purple buttons: bg-purple-* ... text-[var(--theme-text-primary)] → text-white
    $content = $content -replace '(bg-purple-[^\s"]+[^"]*?)text-\[var\(--theme-text-primary\)\]', '$1text-white'

    # Fix green buttons: bg-green-* ... text-[var(--theme-text-primary)] → text-white
    $content = $content -replace '(bg-green-[^\s"]+[^"]*?)text-\[var\(--theme-text-primary\)\]', '$1text-white'

    # Fix red buttons: bg-red-* ... text-[var(--theme-text-primary)] → text-white
    $content = $content -replace '(bg-red-[^\s"]+[^"]*?)text-\[var\(--theme-text-primary\)\]', '$1text-white'

    # Fix emerald buttons: bg-emerald-* ... text-[var(--theme-text-primary)] → text-white
    $content = $content -replace '(bg-emerald-[^\s"]+[^"]*?)text-\[var\(--theme-text-primary\)\]', '$1text-white'

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $fileCount++
        $changesInFile = ([regex]::Matches($originalContent, 'text-\[var\(--theme-text-primary\)\]')).Count - ([regex]::Matches($content, 'text-\[var\(--theme-text-primary\)\]')).Count
        $changeCount += $changesInFile
        Write-Host "[OK] Fixed $($file.Name) - $changesInFile changes" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[INFO] ========================================" -ForegroundColor Cyan
Write-Host "[INFO] Summary:" -ForegroundColor Cyan
Write-Host "[INFO] Files modified: $fileCount" -ForegroundColor Yellow
Write-Host "[INFO] Semantic buttons fixed: $changeCount" -ForegroundColor Yellow
Write-Host "[INFO] ========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Verifica los cambios con: git diff" -ForegroundColor Cyan
