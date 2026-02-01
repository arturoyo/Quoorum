# 🔍 Style Migration Helper Script
# Finds all files with hardcoded colors and provides migration suggestions

Write-Host "🎨 QUOORUM STYLE MIGRATION CHECKER" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

$webSrc = Join-Path $PSScriptRoot "..\apps\web\src"

if (-not (Test-Path $webSrc)) {
    Write-Host "❌ Error: Could not find apps/web/src directory" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Scanning: $webSrc`n" -ForegroundColor Gray

# Color patterns to search for
$patterns = @{
    "bg-[#0b141a]"    = "styles.colors.bg.primary"
    "bg-[#111b21]"    = "styles.colors.bg.secondary"
    "bg-[#202c33]"    = "styles.colors.bg.tertiary"
    "bg-[#2a3942]"    = "styles.colors.bg.input"
    "text-[#ffffff]"  = "styles.colors.text.primary"
    "text-[#aebac1]"  = "styles.colors.text.secondary"
    "text-[#8696a0]"  = "styles.colors.text.tertiary"
    "text-[#64748b]"  = "styles.colors.text.muted"
    "border-[#2a3942]" = "styles.colors.border.default"
}

Write-Host "📊 Scanning for hardcoded colors...`n" -ForegroundColor Yellow

$totalFiles = 0
$totalMatches = 0
$fileResults = @{}

foreach ($pattern in $patterns.Keys) {
    # Use wildcard pattern instead of regex escape for Select-String
    $searchPattern = "*$pattern*"
    try {
        $files = Get-ChildItem -Path $webSrc -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
        
        foreach ($file in $files) {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if ($content -and $content -like $searchPattern) {
                $lines = Get-Content $file.FullName -ErrorAction SilentlyContinue
                $lineNum = 0
                foreach ($line in $lines) {
                    $lineNum++
                    if ($line -like $searchPattern) {
                        $relativePath = $file.FullName.Replace("$PSScriptRoot\..\", "")
                        if (-not $fileResults.ContainsKey($relativePath)) {
                            $fileResults[$relativePath] = @()
                            $totalFiles++
                        }
                        $fileResults[$relativePath] += @{
                            Pattern = $pattern
                            Replacement = $patterns[$pattern]
                            Line = $lineNum
                            Text = $line.Trim()
                        }
                        $totalMatches++
                    }
                }
            }
        }
    } catch {
        Write-Host "Warning: Error processing pattern $pattern" -ForegroundColor Yellow
    }
}

# Display results
Write-Host "📈 RESULTS" -ForegroundColor Green
Write-Host "=========" -ForegroundColor Green
Write-Host "Total files with hardcoded colors: $totalFiles"
Write-Host "Total hardcoded color instances: $totalMatches`n"

if ($totalFiles -eq 0) {
    Write-Host "✅ No hardcoded colors found! All clean!" -ForegroundColor Green
    exit 0
}

Write-Host "🔍 FILES NEEDING MIGRATION:`n" -ForegroundColor Yellow

$sortedFiles = $fileResults.GetEnumerator() | Sort-Object { $_.Value.Count } -Descending

foreach ($entry in $sortedFiles) {
    $file = $entry.Key
    $fileMatches = $entry.Value
    $count = $fileMatches.Count
    
    Write-Host "📄 $file" -ForegroundColor Cyan
    Write-Host "   $count hardcoded color(s)" -ForegroundColor Yellow
    
    # Group by pattern
    $grouped = $matches | Group-Object Pattern
    foreach ($group in $grouped) {
        $pattern = $group.Name
        $replacement = $patterns[$pattern]
        $instances = $group.Count
        Write-Host "   • $pattern → $replacement ($instances instance(s))" -ForegroundColor White
    }
    Write-Host ""
}

Write-Host "`n💡 NEXT STEPS:" -ForegroundColor Magenta
Write-Host "1. Open each file listed above"
Write-Host "2. Import styles: import { cn, styles } from '@/lib/utils'"
Write-Host "3. Replace hardcoded colors using STYLE-MIGRATION-GUIDE.md"
Write-Host "4. Test the component"
Write-Host "5. Commit changes`n"

Write-Host "📚 Documentation:" -ForegroundColor Blue
Write-Host "   - STYLE-MIGRATION-GUIDE.md (migration examples)"
Write-Host "   - DESIGN-SYSTEM.md (visual reference)"
Write-Host "   - apps/web/src/lib/styles.ts (implementation)`n"

# Top offenders
Write-Host "🎯 TOP 10 FILES (most hardcoded colors):" -ForegroundColor Red
$topFiles = $sortedFiles | Select-Object -First 10
foreach ($entry in $topFiles) {
    $file = Split-Path -Leaf $entry.Key
    $count = $entry.Value.Count
    Write-Host "   $count → $file" -ForegroundColor Yellow
}

Write-Host "`n✨ Run 'pnpm style:check' anytime to see progress!`n" -ForegroundColor Green
