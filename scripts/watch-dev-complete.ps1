# Monitor COMPLETO de desarrollo - Auto-corrige TODO tipo de errores
param([switch]$AutoFix)

$ErrorActionPreference = "Continue"

Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] MONITOR COMPLETO DE DESARROLLO" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
if ($AutoFix) {
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Auto-fix: ACTIVADO - Corregir�[EMOJI] TODOS los errores autom�[EMOJI]ticamente" -ForegroundColor Green
} else {
    Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Auto-fix: DESACTIVADO - Solo reportar�[EMOJI] (usa -AutoFix)" -ForegroundColor Yellow
}
Write-Host ""

$ErrorsFound = 0
$ErrorsFixed = 0
$ErrorsManual = 0

# ============================================================================
# FUNCIONES DE AUTO-FIX
# ============================================================================

function Fix-JsExtensions {
    Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Corrigiendo extensiones .js..." -ForegroundColor Yellow
    $output = pwsh -NoProfile -File scripts/fix-imports.ps[EMOJI] [EMOJI]>&[EMOJI]
    return $LASTEXITCODE -eq 0
}

function Fix-PackageExports {
    param($Package, $Path)
    Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Añadiendo export a package.json..." -ForegroundColor Yellow
    $output = pwsh -NoProfile -File scripts/auto-fix-package-exports.ps[EMOJI] -Package $Package -Path $Path [EMOJI]>&[EMOJI]
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [WARN]  REINICIA EL SERVIDOR para aplicar cambios" -ForegroundColor Yellow
        return $true
    }
    return $false
}

function Fix-MissingDependency {
    param($Dependency)
    Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Instalando dependencia faltante: $Dependency..." -ForegroundColor Yellow
    pnpm add $Dependency [EMOJI]>&[EMOJI] | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [WARN]  REINICIA EL SERVIDOR para aplicar cambios" -ForegroundColor Yellow
        return $true
    }
    return $false
}

function Fix-TypeScriptError {
    param($FilePath, $LineNum, $Error)

    # Casos comunes de errores TypeScript que podemos auto-corregir

    # [EMOJI]. Unused variable/parameter/import (TS6[EMOJI][EMOJI][EMOJI])
    if ($Error -match "is declared but its value is never read" -or $Error -match "TS6[EMOJI][EMOJI][EMOJI]") {
        return Fix-UnusedVariable -FilePath $FilePath -LineNum $LineNum -Error $Error
    }

    # [EMOJI]. Index signature error (TS[EMOJI][EMOJI][EMOJI][EMOJI])
    if ($Error -match "Property '(\w+)' comes from an index signature" -or $Error -match "TS[EMOJI][EMOJI][EMOJI][EMOJI]") {
        $PropertyName = if ($Matches[[EMOJI]]) { $Matches[[EMOJI]] } else { $null }
        return Fix-IndexSignature -FilePath $FilePath -LineNum $LineNum -PropertyName $PropertyName -Error $Error
    }

    # [EMOJI]. Missing return type (TS70[EMOJI]0)
    if ($Error -match "Function lacks return type" -or $Error -match "TS70[EMOJI]0" -or $Error -match "lacks return type annotation") {
        return Fix-MissingReturnType -FilePath $FilePath -LineNum $LineNum -Error $Error
    }

    # No podemos auto-corregir este error
    return $false
}

function Fix-UnusedVariable {
    param($FilePath, $LineNum, $Error)

    try {
        # Resolver ruta completa del archivo
        $FullPath = if ([System.IO.Path]::IsPathRooted($FilePath)) {
            $FilePath
        } else {
            # Buscar en packages y apps
            $PossiblePaths = @(
                "packages\$FilePath",
                "apps\$FilePath",
                "packages\api\src\$FilePath",
                "packages\api\src\lib\$FilePath",
                "packages\api\src\routers\$FilePath",
                "apps\web\src\$FilePath",
                "apps\web\src\app\$FilePath",
                "apps\web\src\components\$FilePath"
            )
            
            $Found = $null
            foreach ($Path in $PossiblePaths) {
                if (Test-Path $Path) {
                    $Found = $Path
                    break
                }
            }
            
            if (-not $Found) {
                Write-Host "  [WARN]  Archivo no encontrado: $FilePath" -ForegroundColor Yellow
                return $false
            }
            $Found
        }

        if (-not (Test-Path $FullPath)) {
            Write-Host "  [WARN]  Archivo no existe: $FullPath" -ForegroundColor Yellow
            return $false
        }

        # Leer contenido del archivo
        $Content = Get-Content $FullPath -Raw
        $Lines = $Content -split "`n"
        
        if ([int]$LineNum -gt $Lines.Count) {
            Write-Host "  [WARN]  Línea $LineNum fuera de rango" -ForegroundColor Yellow
            return $false
        }

        $TargetLine = $Lines[[int]$LineNum - [EMOJI]]
        $Modified = $false

        # Extraer nombre de variable del error
        # Patrones: "'variableName' is declared but its value is never read"
        #           "variableName is declared but its value is never read"
        $VarName = $null
        if ($Error -match "[''']([^''']+)[''']\s+is declared") {
            $VarName = $Matches[[EMOJI]]
        } elseif ($Error -match "(\w+)\s+is declared") {
            $VarName = $Matches[[EMOJI]]
        }

        if (-not $VarName) {
            Write-Host "  [WARN]  No se pudo extraer nombre de variable del error" -ForegroundColor Yellow
            return $false
        }

        Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Corrigiendo variable no usada: $VarName" -ForegroundColor Yellow

        # CASO [EMOJI]: Import no usado
        # Detectar: import { VarName } from '...' o import VarName from '...'
        if ($TargetLine -match "^\s*import\s+") {
            # Es un import statement
            $ImportLine = $TargetLine.Trim()
            
            # Caso [EMOJI]a: Named import único: import { VarName } from '...'
            if ($ImportLine -match "import\s+\{\s*$VarName\s*\}\s+from\s+") {
                # Eliminar toda la línea del import
                $NewLines = @()
                for ($i = 0; $i -lt $Lines.Count; $i++) {
                    if ($i -ne ([int]$LineNum - [EMOJI])) {
                        $NewLines += $Lines[$i]
                    }
                }
                $Content = $NewLines -join "`n"
                $Modified = $true
                Write-Host "    [EMOJI][EMOJI][EMOJI] Eliminado import completo: $VarName" -ForegroundColor Gray
            }
            # Caso [EMOJI]b: Named import múltiple: import { A, VarName, B } from '...'
            elseif ($ImportLine -match "import\s+\{([^}]+)\}\s+from\s+") {
                $Imports = $Matches[[EMOJI]]
                $ImportList = $Imports -split ',' | ForEach-Object { $_.Trim() }
                
                if ($ImportList -contains $VarName) {
                    # Remover VarName de la lista
                    $NewImportList = $ImportList | Where-Object { $_ -ne $VarName }
                    
                    if ($NewImportList.Count -eq 0) {
                        # Si no quedan imports, eliminar toda la línea
                        $NewLines = @()
                        for ($i = 0; $i -lt $Lines.Count; $i++) {
                            if ($i -ne ([int]$LineNum - [EMOJI])) {
                                $NewLines += $Lines[$i]
                            }
                        }
                        $Content = $NewLines -join "`n"
                    } else {
                        # Reconstruir import statement
                        $NewImports = $NewImportList -join ', '
                        $NewLine = $ImportLine -replace "\{[^}]+\}", "{ $NewImports }"
                        $Lines[[int]$LineNum - [EMOJI]] = $NewLine
                        $Content = $Lines -join "`n"
                    }
                    $Modified = $true
                    Write-Host "    [EMOJI][EMOJI][EMOJI] Removido $VarName de import múltiple" -ForegroundColor Gray
                }
            }
            # Caso [EMOJI]c: Default import: import VarName from '...'
            elseif ($ImportLine -match "import\s+$VarName\s+from\s+") {
                # Eliminar toda la línea
                $NewLines = @()
                for ($i = 0; $i -lt $Lines.Count; $i++) {
                    if ($i -ne ([int]$LineNum - [EMOJI])) {
                        $NewLines += $Lines[$i]
                    }
                }
                $Content = $NewLines -join "`n"
                $Modified = $true
                Write-Host "    [EMOJI][EMOJI][EMOJI] Eliminado default import: $VarName" -ForegroundColor Gray
            }
            # Caso [EMOJI]d: Type import: import type { VarName } from '...'
            elseif ($ImportLine -match "import\s+type\s+") {
                # Similar a named imports pero con 'type'
                if ($ImportLine -match "import\s+type\s+\{\s*$VarName\s*\}\s+from\s+") {
                    $NewLines = @()
                    for ($i = 0; $i -lt $Lines.Count; $i++) {
                        if ($i -ne ([int]$LineNum - [EMOJI])) {
                            $NewLines += $Lines[$i]
                        }
                    }
                    $Content = $NewLines -join "`n"
                    $Modified = $true
                    Write-Host "    [EMOJI][EMOJI][EMOJI] Eliminado type import: $VarName" -ForegroundColor Gray
                } elseif ($ImportLine -match "import\s+type\s+\{([^}]+)\}\s+from\s+") {
                    $Imports = $Matches[[EMOJI]]
                    $ImportList = $Imports -split ',' | ForEach-Object { $_.Trim() }
                    
                    if ($ImportList -contains $VarName) {
                        $NewImportList = $ImportList | Where-Object { $_ -ne $VarName }
                        
                        if ($NewImportList.Count -eq 0) {
                            $NewLines = @()
                            for ($i = 0; $i -lt $Lines.Count; $i++) {
                                if ($i -ne ([int]$LineNum - [EMOJI])) {
                                    $NewLines += $Lines[$i]
                                }
                            }
                            $Content = $NewLines -join "`n"
                        } else {
                            $NewImports = $NewImportList -join ', '
                            $NewLine = $ImportLine -replace "\{[^}]+\}", "{ $NewImports }"
                            $Lines[[int]$LineNum - [EMOJI]] = $NewLine
                            $Content = $Lines -join "`n"
                        }
                        $Modified = $true
                        Write-Host "    [EMOJI][EMOJI][EMOJI] Removido $VarName de type import múltiple" -ForegroundColor Gray
                    }
                }
            }
        }
        # CASO [EMOJI]: Par�[EMOJI]metro de función no usado
        # Detectar: function name(param[EMOJI], VarName, param[EMOJI]) o (VarName: Type)
        elseif ($TargetLine -match "\([^)]*$VarName[^)]*\)" -or 
                ($Lines[[int]$LineNum - [EMOJI]] -match "function\s+\w+\s*\(" -or 
                 $Lines[[int]$LineNum - [EMOJI]] -match "const\s+\w+\s*=\s*\([^)]*\)\s*=>" -or
                 $Lines[[int]$LineNum - [EMOJI]] -match "=>\s*\{") -or
                $TargetLine -match "^\s*$VarName\s*:") {
            
            # Añadir prefijo _ al par�[EMOJI]metro
            $NewLine = $TargetLine -replace "\b$VarName\b", "_$VarName"
            $Lines[[int]$LineNum - [EMOJI]] = $NewLine
            $Content = $Lines -join "`n"
            $Modified = $true
            Write-Host "    [EMOJI][EMOJI][EMOJI] Par�[EMOJI]metro renombrado: $VarName [EMOJI][EMOJI][EMOJI] _$VarName" -ForegroundColor Gray
        }
        # CASO [EMOJI]: Variable local no usada
        # Detectar: const VarName = ... o let VarName = ... o var VarName = ...
        elseif ($TargetLine -match "^\s*(const|let|var)\s+$VarName\s*=") {
            # Añadir prefijo _
            $NewLine = $TargetLine -replace "\b$VarName\b", "_$VarName"
            $Lines[[int]$LineNum - [EMOJI]] = $NewLine
            $Content = $Lines -join "`n"
            $Modified = $true
            Write-Host "    [EMOJI][EMOJI][EMOJI] Variable renombrada: $VarName [EMOJI][EMOJI][EMOJI] _$VarName" -ForegroundColor Gray
        }
        # CASO [EMOJI]: Tipo no usado (type alias o interface)
        elseif ($TargetLine -match "^\s*(type|interface)\s+$VarName\s*") {
            # Para tipos, solo reportar (no eliminar por seguridad)
            Write-Host "    [WARN]  Tipo no usado: $VarName (requiere revisión manual)" -ForegroundColor Yellow
            return $false
        }
        # CASO [EMOJI]: Función no usada
        elseif ($TargetLine -match "^\s*(function|const)\s+$VarName\s*[=(]") {
            # Para funciones, solo reportar (no eliminar por seguridad)
            Write-Host "    [WARN]  Función no usada: $VarName (requiere revisión manual)" -ForegroundColor Yellow
            return $false
        }
        # CASO 6: Genérico - añadir prefijo _ como fallback
        else {
            # Buscar la variable en la línea y añadir prefijo
            if ($TargetLine -match "\b$VarName\b") {
                $NewLine = $TargetLine -replace "\b$VarName\b", "_$VarName"
                $Lines[[int]$LineNum - [EMOJI]] = $NewLine
                $Content = $Lines -join "`n"
                $Modified = $true
                Write-Host "    [EMOJI][EMOJI][EMOJI] Variable renombrada: $VarName [EMOJI][EMOJI][EMOJI] _$VarName" -ForegroundColor Gray
            } else {
                Write-Host "    [WARN]  No se pudo encontrar $VarName en la línea $LineNum" -ForegroundColor Yellow
                return $false
            }
        }

        if ($Modified) {
            # Guardar archivo
            Set-Content -Path $FullPath -Value $Content -NoNewline
            Write-Host "  [OK] CORREGIDO - Archivo actualizado: $FullPath" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  [WARN]  No se pudo aplicar corrección autom�[EMOJI]tica" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "  [ERROR] Error al corregir: $_" -ForegroundColor Red
        return $false
    }
}

function Fix-ESLintError {
    Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Ejecutando eslint --fix..." -ForegroundColor Yellow
    pnpm lint --fix [EMOJI]>&[EMOJI] | Out-Null
    return $LASTEXITCODE -eq 0
}

function Fix-SyntaxError {
    param($FilePath, $Line, $Error)

    # Casos comunes de syntax errors

    # [EMOJI]. Missing semicolon
    if ($Error -match "Missing semicolon") {
        Write-Host "  [WARN]  Syntax error - revisa el código manualmente" -ForegroundColor Yellow
        return $false
    }

    # No podemos auto-corregir syntax errors de forma segura
    return $false
}

function Fix-IndexSignature {
    param($FilePath, $LineNum, $PropertyName, $Error)

    try {
        # Resolver ruta completa del archivo
        $FullPath = if ([System.IO.Path]::IsPathRooted($FilePath)) {
            $FilePath
        } else {
            $PossiblePaths = @(
                "packages\$FilePath",
                "apps\$FilePath",
                "packages\api\src\$FilePath",
                "packages\api\src\lib\$FilePath",
                "packages\api\src\routers\$FilePath",
                "apps\web\src\$FilePath",
                "apps\web\src\app\$FilePath",
                "apps\web\src\components\$FilePath"
            )
            
            $Found = $null
            foreach ($Path in $PossiblePaths) {
                if (Test-Path $Path) {
                    $Found = $Path
                    break
                }
            }
            
            if (-not $Found) {
                Write-Host "  [WARN]  Archivo no encontrado: $FilePath" -ForegroundColor Yellow
                return $false
            }
            $Found
        }

        if (-not (Test-Path $FullPath)) {
            Write-Host "  [WARN]  Archivo no existe: $FullPath" -ForegroundColor Yellow
            return $false
        }

        # Leer contenido del archivo
        $Content = Get-Content $FullPath -Raw
        $Lines = $Content -split "`n"
        
        if ([int]$LineNum -gt $Lines.Count) {
            Write-Host "  [WARN]  Línea $LineNum fuera de rango" -ForegroundColor Yellow
            return $false
        }

        $TargetLine = $Lines[[int]$LineNum - [EMOJI]]
        $Modified = $false

        # Extraer nombre de propiedad si no se proporcionó
        if (-not $PropertyName) {
            if ($Error -match "Property '(\w+)' comes from an index signature") {
                $PropertyName = $Matches[[EMOJI]]
            } else {
                Write-Host "  [WARN]  No se pudo extraer nombre de propiedad del error" -ForegroundColor Yellow
                return $false
            }
        }

        Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Corrigiendo index signature: $PropertyName" -ForegroundColor Yellow

        # Buscar patrones: obj.prop [EMOJI][EMOJI][EMOJI] obj['prop']
        # Patrones a buscar:
        # - obj.prop
        # - obj.prop.method()
        # - obj.prop = value
        # - obj.prop?.method()
        
        # Regex para encontrar obj.prop (pero no obj['prop'] que ya est�[EMOJI] correcto)
        $Pattern = "(\w+)\.$([regex]::Escape($PropertyName))\b"
        
        if ($TargetLine -match $Pattern) {
            $ObjectName = $Matches[[EMOJI]]
            # Reemplazar obj.prop con obj['prop'] (escapar PropertyName para regex)
            $EscapedProp = [regex]::Escape($PropertyName)
            $NewLine = $TargetLine -replace "(\w+)\.$EscapedProp\b", "$[EMOJI]['$PropertyName']"
            $Lines[[int]$LineNum - [EMOJI]] = $NewLine
            $Content = $Lines -join "`n"
            $Modified = $true
            Write-Host "    [EMOJI][EMOJI][EMOJI] Cambiado: $ObjectName.$PropertyName [EMOJI][EMOJI][EMOJI] $ObjectName['$PropertyName']" -ForegroundColor Gray
        } else {
            Write-Host "    [WARN]  No se encontró patrón $PropertyName en la línea" -ForegroundColor Yellow
            return $false
        }

        if ($Modified) {
            # Guardar archivo
            Set-Content -Path $FullPath -Value $Content -NoNewline
            Write-Host "  [OK] CORREGIDO - Archivo actualizado: $FullPath" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  [WARN]  No se pudo aplicar corrección autom�[EMOJI]tica" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "  [ERROR] Error al corregir: $_" -ForegroundColor Red
        return $false
    }
}

function Fix-MissingReturnType {
    param($FilePath, $LineNum, $Error)

    try {
        # Resolver ruta completa del archivo
        $FullPath = if ([System.IO.Path]::IsPathRooted($FilePath)) {
            $FilePath
        } else {
            $PossiblePaths = @(
                "packages\$FilePath",
                "apps\$FilePath",
                "packages\api\src\$FilePath",
                "packages\api\src\lib\$FilePath",
                "packages\api\src\routers\$FilePath",
                "apps\web\src\$FilePath",
                "apps\web\src\app\$FilePath",
                "apps\web\src\components\$FilePath"
            )
            
            $Found = $null
            foreach ($Path in $PossiblePaths) {
                if (Test-Path $Path) {
                    $Found = $Path
                    break
                }
            }
            
            if (-not $Found) {
                Write-Host "  [WARN]  Archivo no encontrado: $FilePath" -ForegroundColor Yellow
                return $false
            }
            $Found
        }

        if (-not (Test-Path $FullPath)) {
            Write-Host "  [WARN]  Archivo no existe: $FullPath" -ForegroundColor Yellow
            return $false
        }

        # Leer contenido del archivo
        $Content = Get-Content $FullPath -Raw
        $Lines = $Content -split "`n"
        
        if ([int]$LineNum -gt $Lines.Count) {
            Write-Host "  [WARN]  Línea $LineNum fuera de rango" -ForegroundColor Yellow
            return $false
        }

        $TargetLine = $Lines[[int]$LineNum - [EMOJI]]
        $Modified = $false

        Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Analizando función para inferir tipo de retorno..." -ForegroundColor Yellow

        # Buscar función en las líneas siguientes (hasta [EMOJI]0 líneas)
        $FunctionStart = [int]$LineNum - [EMOJI]
        $FunctionBody = ""
        $MaxSearch = [Math]::Min($FunctionStart + [EMOJI]0, $Lines.Count)
        
        for ($i = $FunctionStart; $i -lt $MaxSearch; $i++) {
            $FunctionBody += $Lines[$i] + "`n"
            # Detectar fin de función (llave de cierre)
            if ($Lines[$i] -match "^\s*\}" -and $i -gt $FunctionStart) {
                break
            }
        }

        # Intentar inferir tipo de retorno
        $ReturnType = $null
        
        # Caso [EMOJI]: return string literal o string
        if ($FunctionBody -match "return\s+['""][^'""]+['""]" -or $FunctionBody -match "return\s+\w+\.\w+\s*\+\s*['""]") {
            $ReturnType = "string"
        }
        # Caso [EMOJI]: return number
        elseif ($FunctionBody -match "return\s+\d+" -or $FunctionBody -match "return\s+\w+\s*[\+\-\*\/]\s*\d+") {
            $ReturnType = "number"
        }
        # Caso [EMOJI]: return boolean
        elseif ($FunctionBody -match "return\s+(true|false)" -or $FunctionBody -match "return\s+\w+\s*(===|!==|>|<)") {
            $ReturnType = "boolean"
        }
        # Caso [EMOJI]: return void (no return o return sin valor)
        elseif ($FunctionBody -match "return\s*;" -or ($FunctionBody -notmatch "return\s+")) {
            $ReturnType = "void"
        }
        # Caso [EMOJI]: return Promise (async function)
        elseif ($TargetLine -match "async\s+function" -or $TargetLine -match "async\s+\(") {
            $ReturnType = "Promise<unknown>"
        }

        if ($ReturnType) {
            # Añadir tipo de retorno a la función
            # Patrones: function name() [EMOJI][EMOJI][EMOJI] function name(): ReturnType
            #          const name = () [EMOJI][EMOJI][EMOJI] const name = (): ReturnType =>
            #          const name = async () [EMOJI][EMOJI][EMOJI] const name = async (): ReturnType =>
            
            if ($TargetLine -match "function\s+(\w+)\s*\(") {
                $NewLine = $TargetLine -replace "function\s+(\w+)\s*\(", "function `$[EMOJI](): $ReturnType ("
                $Lines[[int]$LineNum - [EMOJI]] = $NewLine
                $Content = $Lines -join "`n"
                $Modified = $true
                Write-Host "    [EMOJI][EMOJI][EMOJI] Añadido tipo de retorno: : $ReturnType" -ForegroundColor Gray
            }
            elseif ($TargetLine -match "^\s*export\s+function\s+(\w+)\s*\(") {
                $NewLine = $TargetLine -replace "export\s+function\s+(\w+)\s*\(", "export function `$[EMOJI](): $ReturnType ("
                $Lines[[int]$LineNum - [EMOJI]] = $NewLine
                $Content = $Lines -join "`n"
                $Modified = $true
                Write-Host "    [EMOJI][EMOJI][EMOJI] Añadido tipo de retorno: : $ReturnType" -ForegroundColor Gray
            }
            elseif ($TargetLine -match "const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>") {
                $NewLine = $TargetLine -replace "(const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\))\s*=>", "`$[EMOJI]: $ReturnType =>"
                $Lines[[int]$LineNum - [EMOJI]] = $NewLine
                $Content = $Lines -join "`n"
                $Modified = $true
                Write-Host "    [EMOJI][EMOJI][EMOJI] Añadido tipo de retorno: : $ReturnType" -ForegroundColor Gray
            }
            else {
                Write-Host "    [WARN]  No se pudo identificar patrón de función" -ForegroundColor Yellow
                return $false
            }
        } else {
            Write-Host "    [WARN]  No se pudo inferir tipo de retorno (requiere revisión manual)" -ForegroundColor Yellow
            return $false
        }

        if ($Modified) {
            # Guardar archivo
            Set-Content -Path $FullPath -Value $Content -NoNewline
            Write-Host "  [OK] CORREGIDO - Archivo actualizado: $FullPath" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  [WARN]  No se pudo aplicar corrección autom�[EMOJI]tica" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "  [ERROR] Error al corregir: $_" -ForegroundColor Red
        return $false
    }
}

function Fix-ConsoleLog {
    param($FilePath, $LineNum)

    try {
        # Resolver ruta completa del archivo
        $FullPath = if ([System.IO.Path]::IsPathRooted($FilePath)) {
            $FilePath
        } else {
            $PossiblePaths = @(
                "packages\$FilePath",
                "apps\$FilePath",
                "packages\api\src\$FilePath",
                "packages\api\src\lib\$FilePath",
                "packages\api\src\routers\$FilePath",
                "apps\web\src\$FilePath",
                "apps\web\src\app\$FilePath",
                "apps\web\src\components\$FilePath"
            )
            
            $Found = $null
            foreach ($Path in $PossiblePaths) {
                if (Test-Path $Path) {
                    $Found = $Path
                    break
                }
            }
            
            if (-not $Found) {
                Write-Host "  [WARN]  Archivo no encontrado: $FilePath" -ForegroundColor Yellow
                return $false
            }
            $Found
        }

        if (-not (Test-Path $FullPath)) {
            Write-Host "  [WARN]  Archivo no existe: $FullPath" -ForegroundColor Yellow
            return $false
        }

        # Leer contenido del archivo
        $Content = Get-Content $FullPath -Raw
        $Lines = $Content -split "`n"
        
        if ([int]$LineNum -gt $Lines.Count) {
            Write-Host "  [WARN]  Línea $LineNum fuera de rango" -ForegroundColor Yellow
            return $false
        }

        $TargetLine = $Lines[[int]$LineNum - [EMOJI]]
        $Modified = $false

        Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Reemplazando console.log con logger..." -ForegroundColor Yellow

        # Detectar tipo de console y reemplazar
        $LoggerMethod = $null
        if ($TargetLine -match "console\.log\(") {
            $LoggerMethod = "logger.info"
        }
        elseif ($TargetLine -match "console\.error\(") {
            $LoggerMethod = "logger.error"
        }
        elseif ($TargetLine -match "console\.warn\(") {
            $LoggerMethod = "logger.warn"
        }
        elseif ($TargetLine -match "console\.debug\(") {
            $LoggerMethod = "logger.debug"
        }

        if ($LoggerMethod) {
            # Reemplazar console.X con logger.X
            $NewLine = $TargetLine -replace "console\.(log|error|warn|debug)\(", "$LoggerMethod("
            $Lines[[int]$LineNum - [EMOJI]] = $NewLine
            $Content = $Lines -join "`n"
            $Modified = $true
            Write-Host "    [EMOJI][EMOJI][EMOJI] Reemplazado: console.X [EMOJI][EMOJI][EMOJI] $LoggerMethod" -ForegroundColor Gray

            # Verificar si logger est�[EMOJI] importado
            $HasLoggerImport = $false
            foreach ($Line in $Lines) {
                if ($Line -match "import.*logger.*from" -or $Line -match "from.*logger") {
                    $HasLoggerImport = $true
                    break
                }
            }

            if (-not $HasLoggerImport) {
                # Buscar dónde añadir el import (después de otros imports)
                $ImportIndex = -[EMOJI]
                for ($i = 0; $i -lt [Math]::Min([EMOJI]0, $Lines.Count); $i++) {
                    if ($Lines[$i] -match "^\s*import\s+") {
                        $ImportIndex = $i
                    }
                    elseif ($ImportIndex -ge 0 -and $Lines[$i] -match "^\s*$" -and $i -gt $ImportIndex) {
                        # Añadir import después del último import
                        $NewImport = "import { logger } from '@/lib/logger'"
                        $NewLines = @()
                        for ($j = 0; $j -lt $Lines.Count; $j++) {
                            $NewLines += $Lines[$j]
                            if ($j -eq $ImportIndex) {
                                $NewLines += $NewImport
                            }
                        }
                        $Lines = $NewLines
                        $Content = $Lines -join "`n"
                        Write-Host "    [EMOJI][EMOJI][EMOJI] Añadido import de logger" -ForegroundColor Gray
                        break
                    }
                }
            }
        } else {
            Write-Host "    [WARN]  No se encontró console.log/error/warn en la línea" -ForegroundColor Yellow
            return $false
        }

        if ($Modified) {
            # Guardar archivo
            Set-Content -Path $FullPath -Value $Content -NoNewline
            Write-Host "  [OK] CORREGIDO - Archivo actualizado: $FullPath" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  [WARN]  No se pudo aplicar corrección autom�[EMOJI]tica" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "  [ERROR] Error al corregir: $_" -ForegroundColor Red
        return $false
    }
}

function Fix-MissingEnumValue {
    param($EnumName, $Value)

    try {
        Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Añadiendo valor '$Value' al enum '$EnumName'..." -ForegroundColor Yellow

        # Verificar si Docker est�[EMOJI] corriendo
        $DockerRunning = docker ps --filter "name=quoorum-postgres" --format "{{.Names}}" [EMOJI]>&[EMOJI]
        if ($LASTEXITCODE -ne 0 -or -not $DockerRunning) {
            Write-Host "    [WARN]  Contenedor PostgreSQL no encontrado. Verifica que Docker esté corriendo." -ForegroundColor Yellow
            Write-Host "    [EMOJI][EMOJI][EMOJI][EMOJI] SQL sugerido: ALTER TYPE $EnumName ADD VALUE IF NOT EXISTS '$Value';" -ForegroundColor Cyan
            return $false
        }

        # Ejecutar SQL en PostgreSQL local
        $SqlCommand = "ALTER TYPE $EnumName ADD VALUE IF NOT EXISTS '$Value';"
        $DockerCommand = "docker exec quoorum-postgres psql -U postgres -d quoorum -c `"$SqlCommand`""
        
        $Output = Invoke-Expression $DockerCommand [EMOJI]>&[EMOJI]
        $Success = $LASTEXITCODE -eq 0

        if ($Success) {
            Write-Host "  [OK] CORREGIDO - Valor '$Value' añadido al enum '$EnumName'" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  [WARN]  Error al ejecutar SQL: $Output" -ForegroundColor Yellow
            Write-Host "    [EMOJI][EMOJI][EMOJI][EMOJI] SQL sugerido: ALTER TYPE $EnumName ADD VALUE IF NOT EXISTS '$Value';" -ForegroundColor Cyan
            return $false
        }
    }
    catch {
        Write-Host "  [ERROR] Error al corregir: $_" -ForegroundColor Red
        Write-Host "    [EMOJI][EMOJI][EMOJI][EMOJI] SQL sugerido: ALTER TYPE $EnumName ADD VALUE IF NOT EXISTS '$Value';" -ForegroundColor Cyan
        return $false
    }
}

function Detect-MissingColumn {
    param($TableName, $ColumnName)

    try {
        Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Detectando columna faltante: $TableName.$ColumnName..." -ForegroundColor Yellow

        # Verificar si Docker est�[EMOJI] corriendo
        $DockerRunning = docker ps --filter "name=quoorum-postgres" --format "{{.Names}}" [EMOJI]>&[EMOJI]
        if ($LASTEXITCODE -ne 0 -or -not $DockerRunning) {
            Write-Host "    [WARN]  Contenedor PostgreSQL no encontrado." -ForegroundColor Yellow
            return $false
        }

        # Verificar si la columna existe
        $SqlCommand = "SELECT column_name FROM information_schema.columns WHERE table_name = '$TableName' AND column_name = '$ColumnName';"
        $DockerCommand = "docker exec quoorum-postgres psql -U postgres -d quoorum -t -c `"$SqlCommand`""
        
        $Output = Invoke-Expression $DockerCommand [EMOJI]>&[EMOJI]
        $ColumnExists = $Output -match $ColumnName

        if (-not $ColumnExists) {
            Write-Host "  [WARN]  COLUMNA FALTANTE DETECTADA: $TableName.$ColumnName" -ForegroundColor Red
            Write-Host "    [EMOJI][EMOJI][EMOJI][EMOJI] SQL sugerido: ALTER TABLE $TableName ADD COLUMN $ColumnName <TIPO>;" -ForegroundColor Cyan
            Write-Host "    [WARN]  Revisa el schema Drizzle para obtener el tipo correcto" -ForegroundColor Yellow
            return $true
        } else {
            Write-Host "    [OK] Columna existe en la base de datos" -ForegroundColor Green
            return $false
        }
    }
    catch {
        Write-Host "  [ERROR] Error al detectar: $_" -ForegroundColor Red
        return $false
    }
}

# ============================================================================
# DETECTOR DE ERRORES
# ============================================================================

foreach ($Line in $input) {
    # Detectar si la línea contiene un error y mostrarla en rojo
    $IsErrorLine = $false
    
    # Patrones comunes de errores para colorear en rojo
    $ErrorPatterns = @(
        "error",
        "Error",
        "ERROR",
        "failed",
        "Failed",
        "FAILED",
        "[ERROR]",
        "error TS",
        "error:",
        "Error:",
        "ERROR:",
        "Cannot find",
        "Module not found",
        "TypeScript error",
        "ESLint:",
        "SyntaxError",
        "Build Failed",
        "ENOENT",
        "not found",
        "does not exist",
        "invalid",
        "Invalid",
        "INVALID",
        "exception",
        "Exception",
        "EXCEPTION",
        "warning.*error",
        "critical",
        "Critical",
        "CRITICAL",
        "RollupError",
        "DTS Build error",
        "Failed to compile",
        "Cannot resolve",
        "Type error",
        "Type.*error",
        "Property.*does not exist",
        "is not assignable",
        "has no exported member",
        "is declared but never used",
        "Cannot read property",
        "undefined is not",
        "null is not",
        "ReferenceError",
        "TypeError",
        "RangeError",
        "Syntax error",
        "Parse error",
        "Compilation error",
        "Build error",
        "Runtime error",
        "[EMOJI]00",
        "[EMOJI]0[EMOJI]",
        "[EMOJI]0[EMOJI]",
        "[EMOJI]0[EMOJI]",
        "[EMOJI]00",
        "GET.*[EMOJI]00",
        "POST.*[EMOJI]00",
        "PUT.*[EMOJI]00",
        "DELETE.*[EMOJI]00"
    )
    
    foreach ($Pattern in $ErrorPatterns) {
        if ($Line -match $Pattern) {
            $IsErrorLine = $true
            break
        }
    }
    
    # Mostrar la línea con color según si es error o no
    if ($IsErrorLine) {
        Write-Host $Line -ForegroundColor Red
    } else {
        Write-Host $Line
    }

    $ErrorDetected = $false
    $Fixed = $false

    # ------------------------------------------------------------------------
    # [EMOJI]. IMPORTS CON .JS EXTENSION
    # ------------------------------------------------------------------------
    if ($Line -match "Module not found.*Can't resolve.*\.js") {
        Write-Host ""
        Write-Host "[ERROR] ERROR [EMOJI]: Import con .js extension" -ForegroundColor Red
        Write-Host "   [EMOJI][EMOJI][EMOJI] Tipo: Module Resolution Error" -ForegroundColor Gray
        $ErrorsFound++
        $ErrorDetected = $true

        if ($AutoFix) {
            if (Fix-JsExtensions) {
                Write-Host "  [OK] CORREGIDO - Servidor recargando..." -ForegroundColor Green
                $ErrorsFixed++
                $Fixed = $true
            }
        } else {
            Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: pnpm validate:imports:fix" -ForegroundColor Cyan
        }
    }

    # ------------------------------------------------------------------------
    # [EMOJI]. PACKAGE EXPORTS FALTANTES
    # ------------------------------------------------------------------------
    if ($Line -match "Package path \.\/([\w-]+) is not exported from package.*@quoorum\/([\w-]+)") {
        $Path = $Matches[[EMOJI]]
        $Package = $Matches[[EMOJI]]

        Write-Host ""
        Write-Host "[ERROR] ERROR [EMOJI]: Export faltante en package" -ForegroundColor Red
        Write-Host "   [EMOJI][EMOJI][EMOJI] Package: @quoorum/$Package" -ForegroundColor Gray
        Write-Host "   [EMOJI][EMOJI][EMOJI] Path: ./$Path" -ForegroundColor Gray
        $ErrorsFound++
        $ErrorDetected = $true

        if ($AutoFix) {
            if (Fix-PackageExports -Package $Package -Path $Path) {
                Write-Host "  [OK] CORREGIDO - Reinicia el servidor" -ForegroundColor Green
                $ErrorsFixed++
                $Fixed = $true
            }
        } else {
            Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: Añade './$Path' a exports en package.json" -ForegroundColor Cyan
        }
    }

    # ------------------------------------------------------------------------
    # [EMOJI]. MODULE NOT FOUND (genérico)
    # ------------------------------------------------------------------------
    # Detectar tanto comillas normales como Unicode (' " ' ")
    if ($Line -match "Module not found.*Can[''']t resolve ['\u[EMOJI]0[EMOJI]8\u[EMOJI]0[EMOJI]9\""]([^'\u[EMOJI]0[EMOJI]8\u[EMOJI]0[EMOJI]9\""]+)['\u[EMOJI]0[EMOJI]8\u[EMOJI]0[EMOJI]9\""]") {
        $Module = $Matches[[EMOJI]]

        # Si ya manejamos este caso arriba, skip
        if (-not $ErrorDetected) {
            Write-Host ""
            Write-Host "[ERROR] ERROR [EMOJI]: Módulo no encontrado" -ForegroundColor Red
            Write-Host "   [EMOJI][EMOJI][EMOJI] Módulo: $Module" -ForegroundColor Gray
            $ErrorsFound++
            $ErrorDetected = $true

            # Detectar si es un package npm (no empieza con . o @quoorum)
            if ($Module -notmatch "^\.\." -and $Module -notmatch "^\.\/" -and $Module -notmatch "^@quoorum") {
                Write-Host "   [EMOJI][EMOJI][EMOJI] Posible dependencia faltante" -ForegroundColor Yellow

                if ($AutoFix) {
                    if (Fix-MissingDependency -Dependency $Module) {
                        Write-Host "  [OK] CORREGIDO - Reinicia el servidor" -ForegroundColor Green
                        $ErrorsFixed++
                        $Fixed = $true
                    }
                } else {
                    Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: pnpm add $Module" -ForegroundColor Cyan
                }
            } else {
                Write-Host "  [WARN]  Verifica que el archivo exista: $Module" -ForegroundColor Yellow
                Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Revisa la ruta: $Module" -ForegroundColor Cyan
                $ErrorsManual++
            }
        }
    }

    # ------------------------------------------------------------------------
    # [EMOJI]. TYPESCRIPT ERRORS (múltiples formatos)
    # ------------------------------------------------------------------------
    
    # Formato [EMOJI]: TypeScript error in file.ts:(line,col): message
    if ($Line -match "TypeScript error in ([\w\/\.-]+):\((\d+),(\d+)\): (.+)") {
        $File = $Matches[[EMOJI]]
        $LineNum = $Matches[[EMOJI]]
        $Col = $Matches[[EMOJI]]
        $Message = $Matches[[EMOJI]]

        Write-Host ""
        Write-Host "[ERROR] ERROR [EMOJI]: TypeScript" -ForegroundColor Red
        Write-Host "   [EMOJI][EMOJI][EMOJI] Archivo: ${File}:${LineNum}:${Col}" -ForegroundColor Gray
        Write-Host "   [EMOJI][EMOJI][EMOJI] Error: $Message" -ForegroundColor Gray
        $ErrorsFound++
        $ErrorDetected = $true

        if ($AutoFix) {
            if (Fix-TypeScriptError -FilePath $File -LineNum $LineNum -Error $Message) {
                Write-Host "  [OK] CORREGIDO" -ForegroundColor Green
                $ErrorsFixed++
                $Fixed = $true
            } else {
                Write-Host "  [WARN]  Error TypeScript requiere corrección manual" -ForegroundColor Yellow
                $ErrorsManual++
            }
        } else {
            Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: Revisa ${File}:${LineNum}" -ForegroundColor Cyan
        }
    }
    # Formato [EMOJI]: @package:dev: file.ts(line,col): error TS6[EMOJI][EMOJI][EMOJI]: 'var' is declared but its value is never read.
    elseif ($Line -match "([\w\/\.-]+)\((\d+),(\d+)\):\s+error\s+TS6[EMOJI][EMOJI][EMOJI]:\s+(.+)") {
        $File = $Matches[[EMOJI]]
        $LineNum = $Matches[[EMOJI]]
        $Col = $Matches[[EMOJI]]
        $Message = $Matches[[EMOJI]]

        Write-Host ""
        Write-Host "[ERROR] ERROR [EMOJI]: TypeScript (TS6[EMOJI][EMOJI][EMOJI] - Unused Variable)" -ForegroundColor Red
        Write-Host "   [EMOJI][EMOJI][EMOJI] Archivo: ${File}:${LineNum}:${Col}" -ForegroundColor Gray
        Write-Host "   [EMOJI][EMOJI][EMOJI] Error: $Message" -ForegroundColor Gray
        $ErrorsFound++
        $ErrorDetected = $true

        if ($AutoFix) {
            if (Fix-TypeScriptError -FilePath $File -LineNum $LineNum -Error $Message) {
                Write-Host "  [OK] CORREGIDO" -ForegroundColor Green
                $ErrorsFixed++
                $Fixed = $true
            } else {
                Write-Host "  [WARN]  Error TypeScript requiere corrección manual" -ForegroundColor Yellow
                $ErrorsManual++
            }
        } else {
            Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: Revisa ${File}:${LineNum}" -ForegroundColor Cyan
        }
    }
    # Formato [EMOJI]: TS[EMOJI][EMOJI][EMOJI][EMOJI] - Index Signature Error
    elseif ($Line -match "([\w\/\.-]+)\((\d+),(\d+)\):\s+error\s+TS[EMOJI][EMOJI][EMOJI][EMOJI]:\s+(.+)") {
        $File = $Matches[[EMOJI]]
        $LineNum = $Matches[[EMOJI]]
        $Col = $Matches[[EMOJI]]
        $Message = $Matches[[EMOJI]]

        Write-Host ""
        Write-Host "[ERROR] ERROR [EMOJI]: TypeScript (TS[EMOJI][EMOJI][EMOJI][EMOJI] - Index Signature)" -ForegroundColor Red
        Write-Host "   [EMOJI][EMOJI][EMOJI] Archivo: ${File}:${LineNum}:${Col}" -ForegroundColor Gray
        Write-Host "   [EMOJI][EMOJI][EMOJI] Error: $Message" -ForegroundColor Gray
        $ErrorsFound++
        $ErrorDetected = $true

        if ($AutoFix) {
            if (Fix-TypeScriptError -FilePath $File -LineNum $LineNum -Error $Message) {
                Write-Host "  [OK] CORREGIDO" -ForegroundColor Green
                $ErrorsFixed++
                $Fixed = $true
            } else {
                Write-Host "  [WARN]  Error TypeScript requiere corrección manual" -ForegroundColor Yellow
                $ErrorsManual++
            }
        } else {
            Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: Revisa ${File}:${LineNum}" -ForegroundColor Cyan
        }
    }
    # Formato [EMOJI]: TS70[EMOJI]0 - Missing Return Type
    elseif ($Line -match "([\w\/\.-]+)\((\d+),(\d+)\):\s+error\s+TS70[EMOJI]0:\s+(.+)") {
        $File = $Matches[[EMOJI]]
        $LineNum = $Matches[[EMOJI]]
        $Col = $Matches[[EMOJI]]
        $Message = $Matches[[EMOJI]]

        Write-Host ""
        Write-Host "[ERROR] ERROR [EMOJI]: TypeScript (TS70[EMOJI]0 - Missing Return Type)" -ForegroundColor Red
        Write-Host "   [EMOJI][EMOJI][EMOJI] Archivo: ${File}:${LineNum}:${Col}" -ForegroundColor Gray
        Write-Host "   [EMOJI][EMOJI][EMOJI] Error: $Message" -ForegroundColor Gray
        $ErrorsFound++
        $ErrorDetected = $true

        if ($AutoFix) {
            if (Fix-TypeScriptError -FilePath $File -LineNum $LineNum -Error $Message) {
                Write-Host "  [OK] CORREGIDO" -ForegroundColor Green
                $ErrorsFixed++
                $Fixed = $true
            } else {
                Write-Host "  [WARN]  Error TypeScript requiere corrección manual" -ForegroundColor Yellow
                $ErrorsManual++
            }
        } else {
            Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: Revisa ${File}:${LineNum}" -ForegroundColor Cyan
        }
    }

    # ------------------------------------------------------------------------
    # [EMOJI]. ESLINT ERRORS
    # ------------------------------------------------------------------------
    if ($Line -match "ESLint:.*Error:") {
        Write-Host ""
        Write-Host "[ERROR] ERROR [EMOJI]: ESLint" -ForegroundColor Red
        $ErrorsFound++
        $ErrorDetected = $true

        if ($AutoFix) {
            if (Fix-ESLintError) {
                Write-Host "  [OK] CORREGIDO - ESLint auto-fix aplicado" -ForegroundColor Green
                $ErrorsFixed++
                $Fixed = $true
            } else {
                Write-Host "  [WARN]  ESLint error requiere corrección manual" -ForegroundColor Yellow
                $ErrorsManual++
            }
        } else {
            Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: pnpm lint --fix" -ForegroundColor Cyan
        }
    }
    # ESLint: Console.log error
    if ($Line -match "ESLint:.*Unexpected console statement.*\(no-console\)" -or 
        $Line -match "ESLint:.*console\.(log|error|warn|debug)") {
        
        # Extraer archivo y línea del error ESLint
        if ($Line -match "([\w\/\.-]+):(\d+):(\d+)") {
            $File = $Matches[[EMOJI]]
            $LineNum = $Matches[[EMOJI]]
            
            Write-Host ""
            Write-Host "[ERROR] ERROR [EMOJI]b: ESLint (Console.log en producción)" -ForegroundColor Red
            Write-Host "   [EMOJI][EMOJI][EMOJI] Archivo: ${File}:${LineNum}" -ForegroundColor Gray
            $ErrorsFound++
            $ErrorDetected = $true

            if ($AutoFix) {
                if (Fix-ConsoleLog -FilePath $File -LineNum $LineNum) {
                    Write-Host "  [OK] CORREGIDO - console.log reemplazado con logger" -ForegroundColor Green
                    $ErrorsFixed++
                    $Fixed = $true
                } else {
                    Write-Host "  [WARN]  Error requiere corrección manual" -ForegroundColor Yellow
                    $ErrorsManual++
                }
            } else {
                Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: Reemplaza console.log con logger.info" -ForegroundColor Cyan
            }
        }
    }

    # ------------------------------------------------------------------------
    # 6. SYNTAX ERRORS
    # ------------------------------------------------------------------------
    if ($Line -match "SyntaxError: (.+)") {
        $Message = $Matches[[EMOJI]]

        Write-Host ""
        Write-Host "[ERROR] ERROR 6: Syntax Error" -ForegroundColor Red
        Write-Host "   [EMOJI][EMOJI][EMOJI] Error: $Message" -ForegroundColor Gray
        $ErrorsFound++
        $ErrorDetected = $true
        $ErrorsManual++

        Write-Host "  [WARN]  Syntax error requiere corrección manual" -ForegroundColor Yellow
    }

    # ------------------------------------------------------------------------
    # 7. BUILD FAILED (genérico)
    # ------------------------------------------------------------------------
    if ($Line -match "Failed to compile") {
        Write-Host ""
        Write-Host "[ERROR] ERROR 7: Build Failed" -ForegroundColor Red
        Write-Host "   [EMOJI][EMOJI][EMOJI] Revisa los errores anteriores" -ForegroundColor Gray
        $ErrorsFound++
        $ErrorDetected = $true
    }

    # ------------------------------------------------------------------------
    # 8. DEPENDENCY ERRORS
    # ------------------------------------------------------------------------
    if ($Line -match "Cannot find module '([^']+)'") {
        $Module = $Matches[[EMOJI]]

        # No tratar rutas de archivo como paquetes npm (ej. .next\...\_app.js)
        $IsFilePath = $Module -match '[\\/]' -or $Module -match '\.next' -or
            $Module -match '^[A-Za-z]:' -or $Module -match '\.(js|ts|mjs|cjs)$'

        Write-Host ""
        Write-Host "[ERROR] ERROR 8: Dependencia no encontrada" -ForegroundColor Red
        Write-Host "   [EMOJI][EMOJI][EMOJI] Módulo: $Module" -ForegroundColor Gray
        $ErrorsFound++
        $ErrorDetected = $true

        if ($IsFilePath) {
            Write-Host "   [EMOJI][EMOJI][EMOJI] Ruta de archivo (no es un paquete npm)" -ForegroundColor Yellow
            Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: Borra .next y cache, luego reinicia. Ej.: Remove-Item -Recurse apps\web\.next; pnpm dev:no-fix" -ForegroundColor Cyan
            $ErrorsManual++
        } elseif ($AutoFix) {
            if ($Module -match "^@quoorum/") {
                Write-Host "   [EMOJI][EMOJI][EMOJI] Package interno - verifica que existe en packages/" -ForegroundColor Yellow
                $ErrorsManual++
            } else {
                if (Fix-MissingDependency -Dependency $Module) {
                    Write-Host "  [OK] CORREGIDO - Reinicia el servidor" -ForegroundColor Green
                    $ErrorsFixed++
                    $Fixed = $true
                }
            }
        } else {
            Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: pnpm add $Module" -ForegroundColor Cyan
        }
    }

    # ------------------------------------------------------------------------
    # 9. DATABASE ERRORS - Missing Enum Value
    # ------------------------------------------------------------------------
    if ($Line -match "invalid input value for enum (\w+): ['""]([^'""]+)['""]") {
        $EnumName = $Matches[[EMOJI]]
        $Value = $Matches[[EMOJI]]

        Write-Host ""
        Write-Host "[ERROR] ERROR 9: Database (Enum value faltante)" -ForegroundColor Red
        Write-Host "   [EMOJI][EMOJI][EMOJI] Enum: $EnumName" -ForegroundColor Gray
        Write-Host "   [EMOJI][EMOJI][EMOJI] Valor faltante: '$Value'" -ForegroundColor Gray
        $ErrorsFound++
        $ErrorDetected = $true

        if ($AutoFix) {
            if (Fix-MissingEnumValue -EnumName $EnumName -Value $Value) {
                Write-Host "  [OK] CORREGIDO - Valor añadido al enum" -ForegroundColor Green
                $ErrorsFixed++
                $Fixed = $true
            } else {
                Write-Host "  [WARN]  Error requiere corrección manual" -ForegroundColor Yellow
                $ErrorsManual++
            }
        } else {
            Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: ALTER TYPE $EnumName ADD VALUE IF NOT EXISTS '$Value';" -ForegroundColor Cyan
        }
    }

    # ------------------------------------------------------------------------
    # [EMOJI]0. DATABASE ERRORS - Missing Column
    # ------------------------------------------------------------------------
    if ($Line -match "column ['""]([\w_]+)['""] does not exist" -or 
        $Line -match "column ([\w_]+) does not exist") {
        $ColumnName = $Matches[[EMOJI]]
        
        # Intentar extraer nombre de tabla del contexto del error
        $TableName = $null
        if ($Line -match "table ['""]([\w_]+)['""]" -or $Line -match "table ([\w_]+)") {
            $TableName = $Matches[[EMOJI]]
        }

        Write-Host ""
        Write-Host "[ERROR] ERROR [EMOJI]0: Database (Columna faltante)" -ForegroundColor Red
        Write-Host "   [EMOJI][EMOJI][EMOJI] Columna: $ColumnName" -ForegroundColor Gray
        if ($TableName) {
            Write-Host "   [EMOJI][EMOJI][EMOJI] Tabla: $TableName" -ForegroundColor Gray
        }
        $ErrorsFound++
        $ErrorDetected = $true

        # Solo detectar, NO auto-fix (demasiado peligroso)
        if ($TableName) {
            Detect-MissingColumn -TableName $TableName -ColumnName $ColumnName | Out-Null
        }
        
        Write-Host "  [WARN]  Requiere corrección manual (revisa schema Drizzle)" -ForegroundColor Yellow
        Write-Host "  [EMOJI][EMOJI][EMOJI][EMOJI] Fix: ALTER TABLE $TableName ADD COLUMN $ColumnName <TIPO>;" -ForegroundColor Cyan
        $ErrorsManual++
    }

    # Separador después de cada error
    if ($ErrorDetected) {
        Write-Host ""
    }
}

# ============================================================================
# RESUMEN FINAL
# ============================================================================

if ($ErrorsFound -gt 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "RESUMEN DEL MONITOR" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Errores detectados: $ErrorsFound" -ForegroundColor Yellow

    if ($AutoFix) {
        Write-Host "Errores corregidos: $ErrorsFixed" -ForegroundColor Green
        Write-Host "Errores manuales: $ErrorsManual" -ForegroundColor Yellow
        Write-Host ""

        if ($ErrorsFixed -gt 0) {
            Write-Host "[OK] $ErrorsFixed errores fueron corregidos autom�[EMOJI]ticamente" -ForegroundColor Green
        }

        if ($ErrorsManual -gt 0) {
            Write-Host "[WARN]  $ErrorsManual errores requieren corrección manual" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "[EMOJI][EMOJI][EMOJI][EMOJI] Ejecuta con -AutoFix para corrección autom�[EMOJI]tica" -ForegroundColor Cyan
        Write-Host "   pnpm dev:watch" -ForegroundColor Gray
    }

    Write-Host ""
}
