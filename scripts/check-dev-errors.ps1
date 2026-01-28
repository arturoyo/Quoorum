# Quick check for Next.js dev server errors
# Run this to see current errors without continuous monitoring

$TerminalDir = "$env:USERPROFILE\.cursor\projects\c-Quoorum\terminals"

if (-not (Test-Path $TerminalDir)) {
    Write-Host "[ERROR] Terminal logs directory not found" -ForegroundColor Red
    exit 1
}

# Check multiple recent logs, not just the latest
$RecentLogs = Get-ChildItem -Path $TerminalDir -Filter "*.txt" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5

if (-not $RecentLogs -or $RecentLogs.Count -eq 0) {
    Write-Host "[ERROR] No log files found" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Checking $($RecentLogs.Count) recent log(s):" -ForegroundColor Cyan
foreach ($Log in $RecentLogs) {
    Write-Host "   • $($Log.Name) - $($Log.LastWriteTime)" -ForegroundColor Gray
}
Write-Host ""

# Combine content from all recent logs
$Content = ""
foreach ($Log in $RecentLogs) {
    $LogContent = Get-Content $Log.FullName -Raw -ErrorAction SilentlyContinue
    if ($LogContent) {
        $Content += "`n=== $($Log.Name) ===`n" + $LogContent + "`n"
    }
}

if (-not $Content) {
    Write-Host "[OK] No errors found (or log is empty)" -ForegroundColor Green
    exit 0
}

# Check for common error patterns
$ErrorPatterns = @(
    @{ Pattern = "Module not found"; Name = "Module Resolution" },
    @{ Pattern = "Can't resolve"; Name = "Import Resolution" },
    @{ Pattern = "Cannot find module"; Name = "Module Not Found" },
    @{ Pattern = "Build Error"; Name = "Build Failure" },
    @{ Pattern = "Error:"; Name = "Runtime Error" },
    @{ Pattern = "Failed to compile"; Name = "Compilation Failure" },
    @{ Pattern = "Type error"; Name = "TypeScript Error" },
    @{ Pattern = "Syntax error"; Name = "Syntax Error" },
    @{ Pattern = "Attempted import error"; Name = "Import Error" },
    @{ Pattern = "EADDRINUSE"; Name = "Port In Use" },
    @{ Pattern = "ECONNREFUSED"; Name = "Connection Refused" },
    @{ Pattern = "ENOENT"; Name = "File Not Found" },
    @{ Pattern = "EACCES"; Name = "Permission Denied" },
    @{ Pattern = "UnhandledPromiseRejection"; Name = "Unhandled Promise" },
    @{ Pattern = "ReferenceError"; Name = "Reference Error" },
    @{ Pattern = "TypeError"; Name = "Type Error" }
)

$FoundErrors = @()

foreach ($ErrorType in $ErrorPatterns) {
    if ($Content -match $ErrorType.Pattern) {
        $Matches = [regex]::Matches($Content, $ErrorType.Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        $LastMatch = $Matches[-1]
        
        if ($LastMatch) {
            $StartPos = [Math]::Max(0, $LastMatch.Index - 200)
            $EndPos = [Math]::Min($Content.Length, $LastMatch.Index + 500)
            $Context = $Content.Substring($StartPos, $EndPos - $StartPos)
            
            $FoundErrors += @{
                Type = $ErrorType.Name
                Pattern = $ErrorType.Pattern
                Context = $Context
            }
        }
    }
}

if ($FoundErrors.Count -eq 0) {
    Write-Host "[OK] No errors detected in logs" -ForegroundColor Green
    exit 0
}

Write-Host "[WARN]  FOUND $($FoundErrors.Count) ERROR(S):`n" -ForegroundColor Yellow
Write-Host ("=" * 70) -ForegroundColor DarkGray

foreach ($Err in $FoundErrors) {
    Write-Host "`n[ERROR] $($Err.Type)" -ForegroundColor Red
    Write-Host ("─" * 70) -ForegroundColor DarkGray
    
    # Extract the most relevant error message
    $Lines = $Err.Context -split "`n"
    $RelevantLines = $Lines | Where-Object { 
        $_ -match "error|Error|ERROR|failed|Failed|FAILED" -or
        $_ -match "Module not found|Can't resolve|Build Error"
    } | Select-Object -First 10
    
    foreach ($Line in $RelevantLines) {
        if ($Line.Trim().Length -gt 0) {
            Write-Host $Line -ForegroundColor DarkGray
        }
    }
}

Write-Host ("`n" + ("=" * 70)) -ForegroundColor DarkGray
Write-Host "`n💡 Tip: Run 'pnpm check:errors' to see this automatically" -ForegroundColor Cyan
Write-Host "   Or use 'pnpm watch:errors' for continuous monitoring`n" -ForegroundColor Cyan

exit 1
