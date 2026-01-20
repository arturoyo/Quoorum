# Check Next.js compilation errors from .next directory and build output
# This catches errors that might not appear in terminal logs

$ErrorActionPreference = "Continue"

Write-Host "🔍 Checking Next.js Compilation Errors" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor DarkGray

$ErrorsFound = @()

# Check .next directory for error files
$NextDir = "apps\web\.next"
if (Test-Path $NextDir) {
    Write-Host "`n📁 Checking .next directory..." -ForegroundColor Gray
    
    # Check for error overlay files
    $ErrorFiles = Get-ChildItem -Path $NextDir -Recurse -Filter "*error*" -ErrorAction SilentlyContinue
    if ($ErrorFiles) {
        foreach ($File in $ErrorFiles) {
            $Content = Get-Content $File.FullName -Raw -ErrorAction SilentlyContinue
            if ($Content -match "error|Error|ERROR|Module not found|Can't resolve") {
                $ErrorsFound += @{
                    Source = ".next directory"
                    File = $File.FullName
                    Content = $Content
                }
            }
        }
    }
}

# Check terminal logs for compilation errors
$TerminalDir = "$env:USERPROFILE\.cursor\projects\c-Quoorum\terminals"
$LatestLog = Get-ChildItem -Path $TerminalDir -Filter "*.txt" -ErrorAction SilentlyContinue | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

if ($LatestLog) {
    Write-Host "`n📋 Checking terminal logs..." -ForegroundColor Gray
    $LogContent = Get-Content $LatestLog.FullName -Raw -ErrorAction SilentlyContinue
    
    # Look for compilation errors in Next.js output
    $CompilationErrors = @(
        "Failed to compile",
        "Compiled with errors",
        "Error occurred while rendering",
        "Module not found",
        "Can't resolve",
        "Cannot find module",
        "Type error",
        "Syntax error"
    )
    
    foreach ($Pattern in $CompilationErrors) {
        if ($LogContent -match $Pattern) {
            $Matches = [regex]::Matches($LogContent, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $LastMatch = $Matches[-1]
            
            if ($LastMatch) {
                $StartPos = [Math]::Max(0, $LastMatch.Index - 300)
                $EndPos = [Math]::Min($LogContent.Length, $LastMatch.Index + 500)
                $Context = $LogContent.Substring($StartPos, $EndPos - $StartPos)
                
                $ErrorsFound += @{
                    Source = "Terminal logs"
                    Pattern = $Pattern
                    Context = $Context
                }
            }
        }
    }
}

# Check browser console errors (if accessible)
# This would require the dev server to expose error endpoints
# For now, we'll check if there are any build artifacts with errors

# Summary
Write-Host "`n" + ("=" * 70) -ForegroundColor DarkGray
if ($ErrorsFound.Count -eq 0) {
    Write-Host "✅ No compilation errors found" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  FOUND $($ErrorsFound.Count) ERROR(S):`n" -ForegroundColor Yellow
    
    foreach ($Err in $ErrorsFound) {
        Write-Host "🔴 Source: $($Err.Source)" -ForegroundColor Red
        if ($Err.Pattern) {
            Write-Host "   Pattern: $($Err.Pattern)" -ForegroundColor Gray
        }
        if ($Err.File) {
            Write-Host "   File: $($Err.File)" -ForegroundColor Gray
        }
        if ($Err.Context) {
            Write-Host "   Context:" -ForegroundColor Gray
            $Lines = ($Err.Context -split "`n") | Where-Object { $_.Trim().Length -gt 0 } | Select-Object -First 10
            foreach ($Line in $Lines) {
                Write-Host "   $Line" -ForegroundColor DarkGray
            }
        }
        Write-Host ""
    }
    
    exit 1
}
