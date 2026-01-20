# Smart Dev Monitor - Auto-detect and auto-fix errors
# Monitors logs and automatically fixes common issues

param(
    [int]$CheckInterval = 10, # seconds
    [switch]$AutoFix = $false
)

$ErrorActionPreference = "Continue"

Write-Host "🤖 Smart Dev Monitor" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor DarkGray
Write-Host "   Auto-detection: ✅ Enabled" -ForegroundColor Green
Write-Host "   Auto-fix: $(if ($AutoFix) { '✅ Enabled' } else { '❌ Disabled (use -AutoFix)' })" -ForegroundColor $(if ($AutoFix) { 'Green' } else { 'Yellow' })
Write-Host "   Check interval: ${CheckInterval}s`n" -ForegroundColor Gray

$TerminalDir = "$env:USERPROFILE\.cursor\projects\c-Quoorum\terminals"
$LastErrorCount = 0
$FixAttempts = 0
$MaxFixAttempts = 3

while ($true) {
    try {
        # Get latest log
        $LatestLog = Get-ChildItem -Path $TerminalDir -Filter "*.txt" -ErrorAction SilentlyContinue | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 1
        
        if (-not $LatestLog) {
            Write-Host "⏳ Waiting for dev server to start..." -ForegroundColor Yellow
            Start-Sleep -Seconds $CheckInterval
            continue
        }
        
        # Check for errors
        $Content = Get-Content $LatestLog.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $Content) {
            Start-Sleep -Seconds $CheckInterval
            continue
        }
        
        # Count errors
        $ErrorPatterns = @(
            "Module not found",
            "Can't resolve",
            "Build Error",
            "Failed to compile",
            "Type error",
            "EADDRINUSE"
        )
        
        $CurrentErrorCount = 0
        foreach ($Pattern in $ErrorPatterns) {
            $Matches = [regex]::Matches($Content, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $CurrentErrorCount += $Matches.Count
        }
        
        # If errors detected
        if ($CurrentErrorCount -gt $LastErrorCount) {
            $NewErrors = $CurrentErrorCount - $LastErrorCount
            Write-Host "`n⚠️  $NewErrors new error(s) detected!" -ForegroundColor Yellow
            Write-Host ("=" * 70) -ForegroundColor DarkGray
            
            # Show error summary
            & "$PSScriptRoot\check-dev-errors.ps1" | Out-Null
            
            # Auto-fix if enabled
            if ($AutoFix -and $FixAttempts -lt $MaxFixAttempts) {
                Write-Host "`n🔧 Attempting auto-fix..." -ForegroundColor Cyan
                $FixAttempts++
                
                $FixOutput = & "$PSScriptRoot\auto-fix-dev-errors.ps1" 2>&1
                Write-Host $FixOutput
                
                # Wait a bit for fixes to take effect
                Start-Sleep -Seconds 5
                
                # Re-check
                $Content = Get-Content $LatestLog.FullName -Raw -ErrorAction SilentlyContinue
                $AfterFixCount = 0
                foreach ($Pattern in $ErrorPatterns) {
                    $Matches = [regex]::Matches($Content, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                    $AfterFixCount += $Matches.Count
                }
                
                if ($AfterFixCount -lt $CurrentErrorCount) {
                    Write-Host "✅ Fixes applied! Error count reduced." -ForegroundColor Green
                    $FixAttempts = 0 # Reset on success
                } else {
                    Write-Host "⚠️  Fixes applied but errors persist. Manual intervention may be needed." -ForegroundColor Yellow
                }
            } elseif ($AutoFix) {
                Write-Host "⚠️  Max auto-fix attempts reached. Manual intervention required." -ForegroundColor Red
            }
            
            Write-Host ""
        } elseif ($CurrentErrorCount -eq 0 -and $LastErrorCount -gt 0) {
            Write-Host "✅ All errors resolved!" -ForegroundColor Green
            $FixAttempts = 0
        }
        
        $LastErrorCount = $CurrentErrorCount
        
        # Show status
        $Timestamp = Get-Date -Format "HH:mm:ss"
        if ($CurrentErrorCount -eq 0) {
            Write-Host "[$Timestamp] ✅ No errors" -ForegroundColor Green
        } else {
            Write-Host "[$Timestamp] ⚠️  $CurrentErrorCount error(s) detected" -ForegroundColor Yellow
        }
        
        Start-Sleep -Seconds $CheckInterval
    }
    catch {
        Write-Host "❌ Monitor error: $_" -ForegroundColor Red
        Start-Sleep -Seconds $CheckInterval
    }
}
