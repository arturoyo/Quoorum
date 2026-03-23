# Auto Migration Script for Centralized Styles
# Migrates all hardcoded colors to centralized styles system

param()

#pragma warning disable PSAvoidAssignmentToAutomaticVariable
#pragma warning disable PSUseDeclaredVarsMoreThanAssignments

Write-Host "🚀 AUTOMATIC STYLE MIGRATION" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Define replacement patterns - MUST match exact regex patterns
$patterns = @(
    # Background colors - HEX
    @{ Old = 'bg-[#0b141a]'; New = '{styles.colors.bg.primary}'; Type = 'bg' }
    @{ Old = 'bg-[#111b21]'; New = '{styles.colors.bg.secondary}'; Type = 'bg' }
    @{ Old = 'bg-[#202c33]'; New = '{styles.colors.bg.tertiary}'; Type = 'bg' }
    @{ Old = 'bg-[#2a3942]'; New = '{styles.colors.bg.input}'; Type = 'bg' }
    
    # Text colors - HEX
    @{ Old = 'text-[#ffffff]'; New = '{styles.colors.text.primary}'; Type = 'text' }
    @{ Old = 'text-[#aebac1]'; New = '{styles.colors.text.secondary}'; Type = 'text' }
    @{ Old = 'text-[#8696a0]'; New = '{styles.colors.text.tertiary}'; Type = 'text' }
    @{ Old = 'text-[#64748b]'; New = '{styles.colors.text.muted}'; Type = 'text' }
    
    # Border colors - HEX
    @{ Old = 'border-[#2a3942]'; New = '{styles.colors.border.default}'; Type = 'border' }
)

$targetDir = "c:\Quoorum\apps\web\src"

# Find all TypeScript/TSX files
$files = Get-ChildItem -Path $targetDir -Recurse -Include *.tsx,*.ts | Where-Object {
    -not ($_.FullName -like '*node_modules*') -and
    -not ($_.FullName -like '*\.next*') -and
    -not ($_.FullName -like '*lib\styles.ts') -and
    -not ($_.FullName -like '*lib/styles.ts')  # Exclude the styles file itself
}

Write-Host "📁 Found $($files.Count) files to process" -ForegroundColor Yellow
Write-Host ""

$migratedFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $originalContent = $content
    $replacements = 0

    # Check if file has hardcoded colors
    $hasHardcodedColors = $false
    foreach ($pattern in $patterns) {
        if ($content.Contains($pattern.Old)) {
            $hasHardcodedColors = $true
            break
        }
    }

    if (-not $hasHardcodedColors) { continue }

    Write-Host "🔧 Processing: $($file.Name)" -ForegroundColor Cyan

    # Add import if needed
    if ($content.Contains("from '@/lib/utils'") -and $content.Contains('cn') -and -not $content.Contains('styles')) {
        $content = $content.Replace("{ cn }", "{ cn, styles }")
        $content = $content.Replace("{cn}", "{ cn, styles }")
        Write-Host "  ✓ Added styles to existing import" -ForegroundColor Green
    }
    elseif (-not $content.Contains("from '@/lib/utils'")) {
        # Add new import after first import
        $firstImportIndex = $content.IndexOf("import ")
        if ($firstImportIndex -ge 0) {
            $lineEnd = $content.IndexOf("`n", $firstImportIndex)
            if ($lineEnd -ge 0) {
                $content = $content.Insert($lineEnd + 1, "import { cn, styles } from '@/lib/utils'`n")
            }
        }
        Write-Host "  ✓ Added new import for cn and styles" -ForegroundColor Green
    }

    # Apply replacements
    foreach ($pattern in $patterns) {
        $count = 0
        $index = $content.IndexOf($pattern.Old)
        while ($index -ge 0) {
            $count++
            $index = $content.IndexOf($pattern.Old, $index + $pattern.Old.Length)
        }
        if ($count -gt 0) {
            # Replace in className strings - need to wrap in cn() if not already
            $content = $content.Replace($pattern.Old, $pattern.New)
            $replacements += $count
        }
    }

    # Only save if changes were made
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $migratedFiles++
        $totalReplacements += $replacements
        Write-Host "  ✅ Replaced $replacements instances" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✨ MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "  Files migrated: $migratedFiles" -ForegroundColor Cyan
Write-Host "  Total replacements: $totalReplacements" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  NOTE: This script does basic replacements." -ForegroundColor Yellow
Write-Host "   You should review files to ensure className props use cn() properly." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: pnpm style:check" -ForegroundColor White
Write-Host "  2. Review and fix any remaining issues" -ForegroundColor White
Write-Host "  3. Test: pnpm dev" -ForegroundColor White
