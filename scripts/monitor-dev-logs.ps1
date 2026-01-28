# Monitor Next.js Dev Server Logs
# Automatically detects and reports build/runtime errors

param(
    [string]$LogFile = "",
    [int]$CheckInterval = 5, # seconds
    [switch]$Watch = $false
)

$ErrorActionPreference = "Continue"

# Find the latest terminal log file if not specified
if ([string]::IsNullOrEmpty($LogFile)) {
    $TerminalDir = "$env:USERPROFILE\.cursor\projects\c-Quoorum\terminals"
    if (Test-Path $TerminalDir) {
        $LatestLog = Get-ChildItem -Path $TerminalDir -Filter "*.txt" | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 1
        if ($LatestLog) {
            $LogFile = $LatestLog.FullName
            Write-Host "📋 Monitoring log file: $LogFile" -ForegroundColor Cyan
        }
    }
}

if ([string]::IsNullOrEmpty($LogFile) -or -not (Test-Path $LogFile)) {
    Write-Host "[ERROR] No log file found. Make sure dev server is running." -ForegroundColor Red
    exit 1
}

# Error patterns to detect
$ErrorPatterns = @(
    "Module not found",
    "Can't resolve",
    "Build Error",
    "Error:",
    "ERROR",
    "Failed to compile",
    "Type error",
    "Syntax error",
    "Import error",
    "Export error",
    "Attempted import error"
)

$LastPosition = 0
$ErrorCount = 0

function Check-ForErrors {
    param([string]$Content)
    
    $Errors = @()
    foreach ($Pattern in $ErrorPatterns) {
        $Matches = [regex]::Matches($Content, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        foreach ($Match in $Matches) {
            $LineNumber = ($Content.Substring(0, $Match.Index) -split "`n").Count
            $Context = Get-Context -Content $Content -Position $Match.Index -LinesBefore 3 -LinesAfter 5
            $Errors += @{
                Pattern = $Pattern
                Line = $LineNumber
                Context = $Context
                Match = $Match.Value
            }
        }
    }
    
    return $Errors
}

function Get-Context {
    param(
        [string]$Content,
        [int]$Position,
        [int]$LinesBefore = 3,
        [int]$LinesAfter = 5
    )
    
    $Before = $Content.Substring([Math]::Max(0, $Position - 500), [Math]::Min(500, $Position))
    $After = $Content.Substring($Position, [Math]::Min(500, $Content.Length - $Position))
    
    $BeforeLines = ($Before -split "`n")[-$LinesBefore..-1]
    $AfterLines = ($After -split "`n")[0..$LinesAfter]
    
    return ($BeforeLines + $AfterLines) -join "`n"
}

Write-Host "🔍 Starting log monitoring..." -ForegroundColor Green
Write-Host "   Check interval: ${CheckInterval}s" -ForegroundColor Gray
Write-Host "   Press Ctrl+C to stop`n" -ForegroundColor Gray

while ($true) {
    try {
        $Content = Get-Content $LogFile -Raw -ErrorAction SilentlyContinue
        if ($Content) {
            $NewContent = $Content.Substring($LastPosition)
            $LastPosition = $Content.Length
            
            if ($NewContent.Length -gt 0) {
                $Errors = Check-ForErrors -Content $NewContent
                
                if ($Errors.Count -gt 0) {
                    $ErrorCount += $Errors.Count
                    Write-Host "`n[WARN]  ERRORS DETECTED ($($Errors.Count) new)" -ForegroundColor Yellow
                    Write-Host ("=" * 60) -ForegroundColor DarkGray
                    
                    foreach ($Err in $Errors) {
                        Write-Host "`n[ERROR] Pattern: $($Err.Pattern)" -ForegroundColor Red
                        Write-Host "   Line: $($Err.Line)" -ForegroundColor Gray
                        Write-Host "   Context:" -ForegroundColor Gray
                        Write-Host $Err.Context -ForegroundColor DarkGray
                    }
                    
                    Write-Host ("`n" + ("=" * 60)) -ForegroundColor DarkGray
                    Write-Host "📊 Total errors found: $ErrorCount`n" -ForegroundColor Yellow
                }
            }
        }
        
        if (-not $Watch) {
            break
        }
        
        Start-Sleep -Seconds $CheckInterval
    }
    catch {
        Write-Host "[ERROR] Error monitoring logs: $_" -ForegroundColor Red
        break
    }
}

Write-Host "`n[OK] Monitoring complete. Total errors: $ErrorCount" -ForegroundColor Green
