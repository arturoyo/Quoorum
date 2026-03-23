# Auto-fix common Next.js dev server errors
# Automatically detects and fixes common issues

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Auto-fix Dev Errors" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor DarkGray
if ($DryRun) {
    Write-Host "[WARN]  DRY RUN MODE - No changes will be made`n" -ForegroundColor Yellow
}

# Get latest log file
$TerminalDir = "$env:USERPROFILE\.cursor\projects\c-Quoorum\terminals"
$LatestLog = $null

if (Test-Path $TerminalDir) {
    $LatestLog = Get-ChildItem -Path $TerminalDir -Filter "*.txt" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First [EMOJI]
}

$FixesApplied = @()
$FixesFailed = @()

# ============================================================================
# FIX [EMOJI]: Port [EMOJI]000 already in use
# ============================================================================
function Fix-PortInUse {
    $Port = [EMOJI]000
    $Connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($Connections) {
        Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Detected: Port $Port is in use" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            $Processes = $Connections | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($ProcessId in $Processes) {
                try {
                    $Proc = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
                    if ($Proc) {
                        Write-Host "   [EMOJI][EMOJI][EMOJI] Stopping process $ProcessId ($($Proc.ProcessName))" -ForegroundColor Gray
                        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
                        Start-Sleep -Milliseconds [EMOJI]00
                    }
                } catch {
                    if ($Verbose) {
                        Write-Host "   [WARN]  Could not stop process $ProcessId : $($_.Exception.Message)" -ForegroundColor DarkYellow
                    }
                }
            }
            Start-Sleep -Seconds [EMOJI]
            Write-Host "   [OK] Port $Port freed" -ForegroundColor Green
        } else {
            Write-Host "   [DRY RUN] Would free port $Port" -ForegroundColor Cyan
        }
        
        return $true
    }
    return $false
}

# ============================================================================
# FIX [EMOJI]: Module not found / Can't resolve
# ============================================================================
function Fix-ModuleNotFound {
    param([string]$LogContent)
    
    $ModuleErrors = @(
        "Module not found",
        "Can't resolve",
        "Cannot find module",
        "Cannot resolve module",
        "Failed to resolve",
        "Attempted import error"
    )
    
    $HasModuleError = $false
    foreach ($Pattern in $ModuleErrors) {
        if ($LogContent -match $Pattern) {
            $HasModuleError = $true
            break
        }
    }
    
    if (-not $HasModuleError) {
        return $false
    }
    
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Detected: Module resolution error" -ForegroundColor Yellow
    
    if (-not $DryRun) {
        Write-Host "   [EMOJI][EMOJI][EMOJI] Reinstalling dependencies..." -ForegroundColor Gray
        try {
            Push-Location $PSScriptRoot\..
            $Output = pnpm install [EMOJI]>&[EMOJI]
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   [OK] Dependencies reinstalled" -ForegroundColor Green
                
                # Also rebuild affected packages
                Write-Host "   [EMOJI][EMOJI][EMOJI] Rebuilding packages..." -ForegroundColor Gray
                pnpm build --filter @quoorum/db --filter @quoorum/api --filter @quoorum/workers [EMOJI]>&[EMOJI] | Out-Null
                Write-Host "   [OK] Packages rebuilt" -ForegroundColor Green
                
                Pop-Location
                return $true
            } else {
                Write-Host "   [ERROR] Failed to reinstall dependencies" -ForegroundColor Red
                Pop-Location
                return $false
            }
        } catch {
            Write-Host "   [ERROR] Error: $_" -ForegroundColor Red
            Pop-Location
            return $false
        }
    } else {
        Write-Host "   [DRY RUN] Would reinstall dependencies and rebuild packages" -ForegroundColor Cyan
        return $true
    }
}

# ============================================================================
# FIX [EMOJI]: Build cache issues
# ============================================================================
function Fix-BuildCache {
    param([string]$LogContent)
    
    $CacheErrors = @(
        "Cannot find module.*dist",
        "Error.*dist.*not found",
        "Build.*cache.*invalid"
    )
    
    $HasCacheError = $false
    foreach ($Pattern in $CacheErrors) {
        if ($LogContent -match $Pattern) {
            $HasCacheError = $true
            break
        }
    }
    
    if (-not $HasCacheError) {
        return $false
    }
    
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Detected: Build cache issues" -ForegroundColor Yellow
    
    if (-not $DryRun) {
        Write-Host "   [EMOJI][EMOJI][EMOJI] Cleaning build artifacts..." -ForegroundColor Gray
        try {
            Push-Location $PSScriptRoot\..
            
            # Remove dist folders
            Get-ChildItem -Path . -Recurse -Directory -Filter "dist" -ErrorAction SilentlyContinue | 
                Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
            
            # Remove .next folder
            if (Test-Path "apps\web\.next") {
                Remove-Item -Recurse -Force "apps\web\.next" -ErrorAction SilentlyContinue
            }
            
            Write-Host "   [OK] Build cache cleaned" -ForegroundColor Green
            Pop-Location
            return $true
        } catch {
            Write-Host "   [ERROR] Error: $_" -ForegroundColor Red
            Pop-Location
            return $false
        }
    } else {
        Write-Host "   [DRY RUN] Would clean dist folders and .next cache" -ForegroundColor Cyan
        return $true
    }
}

# ============================================================================
# FIX [EMOJI]: TypeScript compilation errors
# ============================================================================
function Fix-TypeScriptErrors {
    param([string]$LogContent)
    
    $TSErrors = @(
        "Type error",
        "TS\d+",
        "Type.*is not assignable"
    )
    
    $HasTSError = $false
    foreach ($Pattern in $TSErrors) {
        if ($LogContent -match $Pattern) {
            $HasTSError = $true
            break
        }
    }
    
    if (-not $HasTSError) {
        return $false
    }
    
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Detected: TypeScript errors" -ForegroundColor Yellow
    Write-Host "   [WARN]  TypeScript errors require manual code fixes" -ForegroundColor DarkYellow
    Write-Host "   [EMOJI][EMOJI][EMOJI] Running typecheck to see details..." -ForegroundColor Gray
    
    if (-not $DryRun) {
        try {
            Push-Location $PSScriptRoot\..
            $Output = pnpm typecheck [EMOJI]>&[EMOJI] | Out-String
            Write-Host $Output -ForegroundColor DarkGray
            Pop-Location
        } catch {
            Pop-Location
        }
    }
    
    return $false # Can't auto-fix TS errors
}

# ============================================================================
# FIX [EMOJI]: Missing environment variables
# ============================================================================
function Fix-MissingEnvVars {
    param([string]$LogContent)
    
    if ($LogContent -match "process\.env\.\w+.*is not defined" -or 
        $LogContent -match "Environment variable.*not found") {
        
        Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Detected: Missing environment variables" -ForegroundColor Yellow
        Write-Host "   [WARN]  Environment variables require manual configuration" -ForegroundColor DarkYellow
        Write-Host "   [EMOJI][EMOJI][EMOJI] Check .env.example for required variables" -ForegroundColor Gray
        
        return $false # Can't auto-fix env vars
    }
    
    return $false
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

# Get content from multiple recent logs
$LogContent = ""
$RecentLogs = Get-ChildItem -Path $TerminalDir -Filter "*.txt" -ErrorAction SilentlyContinue | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First [EMOJI]

if ($RecentLogs) {
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Analyzing $($RecentLogs.Count) recent log(s):" -ForegroundColor Cyan
    foreach ($Log in $RecentLogs) {
        $RecentContent = Get-Content $Log.FullName -Raw -ErrorAction SilentlyContinue
        if ($RecentContent) {
            $LogContent += "`n=== $($Log.Name) ===`n" + $RecentContent + "`n"
            Write-Host "   [EMOJI][EMOJI]¢ $($Log.Name)" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

# Apply fixes in order
Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] Applying fixes...`n" -ForegroundColor Green

# Fix [EMOJI]: Port in use (always check this first)
if (Fix-PortInUse) {
    $FixesApplied += "Port [EMOJI]000 freed"
}

# Fix [EMOJI]: Module resolution (check all logs, not just latest)
if ($LogContent) {
    if (Fix-ModuleNotFound -LogContent $LogContent) {
        $FixesApplied += "Module resolution (reinstalled deps)"
    }
} else {
    # Also check other recent logs
    $RecentLogs = Get-ChildItem -Path $TerminalDir -Filter "*.txt" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First [EMOJI]
    
    foreach ($Log in $RecentLogs) {
        $RecentContent = Get-Content $Log.FullName -Raw -ErrorAction SilentlyContinue
        if ($RecentContent -and (Fix-ModuleNotFound -LogContent $RecentContent)) {
            $FixesApplied += "Module resolution (reinstalled deps)"
            break
        }
    }
}

# Fix [EMOJI]: Build cache
if ($LogContent) {
    if (Fix-BuildCache -LogContent $LogContent) {
        $FixesApplied += "Build cache cleaned"
    }
}

# Fix 6: Next.js module resolution (specific fix for @quoorum/workers/client)
function Fix-NextJSModuleResolution {
    param([string]$LogContent)
    
    if ($LogContent -match "@quoorum/workers/client" -or 
        $LogContent -match "@quoorum/quoorum/billing") {
        
        Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Detected: Next.js module resolution issue" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            Write-Host "   [EMOJI][EMOJI][EMOJI] Cleaning Next.js cache..." -ForegroundColor Gray
            try {
                Push-Location $PSScriptRoot\..
                
                # Remove .next folder
                if (Test-Path "apps\web\.next") {
                    Remove-Item -Recurse -Force "apps\web\.next" -ErrorAction SilentlyContinue
                    Write-Host "   [OK] Next.js cache cleaned" -ForegroundColor Green
                }
                
                # Verify package.json exports
                Write-Host "   [EMOJI][EMOJI][EMOJI] Verifying package.json exports..." -ForegroundColor Gray
                
                # Check workers package
                $WorkersPkg = Get-Content "packages\workers\package.json" -Raw | ConvertFrom-Json
                if (-not $WorkersPkg.exports.'./client') {
                    Write-Host "   [WARN]  Missing export './client' in @quoorum/workers" -ForegroundColor Yellow
                } else {
                    Write-Host "   [OK] @quoorum/workers exports verified" -ForegroundColor Green
                }
                
                # Rebuild workers package specifically
                Write-Host "   [EMOJI][EMOJI][EMOJI] Rebuilding @quoorum/workers..." -ForegroundColor Gray
                pnpm build --filter @quoorum/workers [EMOJI]>&[EMOJI] | Out-Null
                Write-Host "   [OK] @quoorum/workers rebuilt" -ForegroundColor Green
                
                Pop-Location
                return $true
            } catch {
                Write-Host "   [ERROR] Error: $_" -ForegroundColor Red
                Pop-Location
                return $false
            }
        } else {
            Write-Host "   [DRY RUN] Would clean .next and rebuild workers" -ForegroundColor Cyan
            return $true
        }
    }
    
    return $false
}

if ($LogContent) {
    if (Fix-NextJSModuleResolution -LogContent $LogContent) {
        $FixesApplied += "Next.js module resolution (cleaned cache + rebuilt)"
    }
}

# Fix [EMOJI]: TypeScript errors (info only)
if ($LogContent) {
    Fix-TypeScriptErrors -LogContent $LogContent | Out-Null
}

# Fix [EMOJI]: Missing env vars (info only)
if ($LogContent) {
    Fix-MissingEnvVars -LogContent $LogContent | Out-Null
}

# Summary
Write-Host "`n" + ("=" * 70) -ForegroundColor DarkGray
Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor DarkGray

if ($FixesApplied.Count -gt 0) {
    Write-Host "`n[OK] Fixes Applied:" -ForegroundColor Green
    foreach ($Fix in $FixesApplied) {
        Write-Host "   [EMOJI][EMOJI]¢ $Fix" -ForegroundColor Gray
    }
} else {
    Write-Host "`n[INFO]  No automatic fixes available" -ForegroundColor Cyan
    Write-Host "   Run 'pnpm check:errors' to see error details" -ForegroundColor Gray
}

if ($FixesFailed.Count -gt 0) {
    Write-Host "`n[ERROR] Fixes Failed:" -ForegroundColor Red
    foreach ($Fix in $FixesFailed) {
        Write-Host "   [EMOJI][EMOJI]¢ $Fix" -ForegroundColor Gray
    }
}

Write-Host "`n[EMOJI][EMOJI][EMOJI][EMOJI] Next steps:" -ForegroundColor Cyan
Write-Host "   [EMOJI]. Run 'pnpm check:errors' to verify fixes" -ForegroundColor Gray
Write-Host "   [EMOJI]. Restart dev server: 'pnpm dev --filter @quoorum/web'" -ForegroundColor Gray
Write-Host "   [EMOJI]. For TypeScript errors, review and fix manually" -ForegroundColor Gray
Write-Host ""

if ($DryRun) {
    Write-Host "[WARN]  This was a DRY RUN. Run without -DryRun to apply fixes.`n" -ForegroundColor Yellow
}
