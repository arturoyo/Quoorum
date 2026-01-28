# Smart Dev Monitor - Auto-detect and auto-fix errors
# Monitors logs and automatically fixes common issues

param(
    [int]$CheckInterval = [EMOJI]0, # seconds
    [switch]$AutoFix = $false
)

$ErrorActionPreference = "Continue"

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Smart Dev Monitor" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor DarkGray
Write-Host "   Auto-detection: [OK] Enabled" -ForegroundColor Green
Write-Host "   Auto-fix: $(if ($AutoFix) { '[OK] Enabled' } else { '[ERROR] Disabled (use -AutoFix)' })" -ForegroundColor $(if ($AutoFix) { 'Green' } else { 'Yellow' })
Write-Host "   Check interval: ${CheckInterval}s`n" -ForegroundColor Gray

$TerminalDir = "$env:USERPROFILE\.cursor\projects\c-Quoorum\terminals"
$LastErrorCount = 0
$FixAttempts = 0
$MaxFixAttempts = [EMOJI]

while ($true) {
    try {
        # Get latest log
        $LatestLog = Get-ChildItem -Path $TerminalDir -Filter "*.txt" -ErrorAction SilentlyContinue | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First [EMOJI]
        
        if (-not $LatestLog) {
            Write-Host "[EMOJI][EMOJI]³ Waiting for dev server to start..." -ForegroundColor Yellow
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
            Write-Host "`n[WARN]  $NewErrors new error(s) detected!" -ForegroundColor Yellow
            Write-Host ("=" * 70) -ForegroundColor DarkGray
            
            # Show error summary
            & "$PSScriptRoot\check-dev-errors.ps[EMOJI]" | Out-Null
            
            # Auto-fix if enabled
            if ($AutoFix -and $FixAttempts -lt $MaxFixAttempts) {
                Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] Attempting auto-fix..." -ForegroundColor Cyan
                $FixAttempts++
                
                $FixOutput = & "$PSScriptRoot\auto-fix-dev-errors.ps[EMOJI]" [EMOJI]>&[EMOJI]
                Write-Host $FixOutput
                
                # Wait a bit for fixes to take effect
                Start-Sleep -Seconds [EMOJI]
                
                # Re-check
                $Content = Get-Content $LatestLog.FullName -Raw -ErrorAction SilentlyContinue
                $AfterFixCount = 0
                foreach ($Pattern in $ErrorPatterns) {
                    $Matches = [regex]::Matches($Content, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                    $AfterFixCount += $Matches.Count
                }
                
                if ($AfterFixCount -lt $CurrentErrorCount) {
                    Write-Host "[OK] Fixes applied! Error count reduced." -ForegroundColor Green
                    $FixAttempts = 0 # Reset on success
                } else {
                    Write-Host "[WARN]  Fixes applied but errors persist. Manual intervention may be needed." -ForegroundColor Yellow
                }
            } elseif ($AutoFix) {
                Write-Host "[WARN]  Max auto-fix attempts reached. Manual intervention required." -ForegroundColor Red
            }
            
            Write-Host ""
        } elseif ($CurrentErrorCount -eq 0 -and $LastErrorCount -gt 0) {
            Write-Host "[OK] All errors resolved!" -ForegroundColor Green
            $FixAttempts = 0
        }
        
        $LastErrorCount = $CurrentErrorCount
        
        # Show status
        $Timestamp = Get-Date -Format "HH:mm:ss"
        if ($CurrentErrorCount -eq 0) {
            Write-Host "[$Timestamp] [OK] No errors" -ForegroundColor Green
        } else {
            Write-Host "[$Timestamp] [WARN]  $CurrentErrorCount error(s) detected" -ForegroundColor Yellow
        }
        
        Start-Sleep -Seconds $CheckInterval
    }
    catch {
        Write-Host "[ERROR] Monitor error: $_" -ForegroundColor Red
        Start-Sleep -Seconds $CheckInterval
    }
}
