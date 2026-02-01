# 🚀 PROMPT PARA IMPLEMENTAR MONITOR DE ERRORES EN OTROS PROYECTOS

> **Copia este prompt y pégalo en Claude (o cualquier IA) para implementar el sistema de monitoreo completo en cualquier proyecto**

---

## 📋 PROMPT (Copiar todo lo de abajo)

```
Necesito implementar un sistema de monitoreo de errores en tiempo real para mi proyecto de desarrollo que:

1. **Lea los logs del servidor mientras se ejecuta** (Next.js, React, Node, etc.)
2. **Detecte errores automáticamente** usando patrones regex
3. **Auto-corrija los errores** cuando sea posible
4. **Muestre instrucciones claras** para errores que requieren corrección manual

---

## REQUISITOS DEL SISTEMA

### 1. Script Principal de Monitoreo

Crear archivo: `scripts/watch-dev.ps1` (PowerShell) o `scripts/watch-dev.sh` (Bash)

**Funcionalidad:**
- Leer desde stdin (pipe de logs del servidor)
- Detectar patrones de error comunes
- Ejecutar scripts de auto-fix cuando corresponda
- Mostrar resumen al final (errores detectados vs corregidos)

**Tipos de errores a detectar (mínimo):**

1. **Imports con extensiones incorrectas** (ej: `.js` en TypeScript)
   - Patrón: `Module not found.*Can't resolve.*\.js`
   - Auto-fix: Remover extensiones `.js`

2. **Package exports faltantes**
   - Patrón: `Package path \.\/([\w-]+) is not exported from package`
   - Auto-fix: Añadir export a package.json

3. **Dependencias npm faltantes**
   - Patrón: `Cannot find module '([^']+)'` o `Module not found.*Can't resolve '([^']+)'`
   - Auto-fix: `npm install <package>` (o pnpm/yarn según el proyecto)

4. **ESLint errors auto-corregibles**
   - Patrón: `ESLint:.*Error:`
   - Auto-fix: `npm run lint --fix`

5. **TypeScript errors** (reportar, no auto-corregir por seguridad)
   - Patrón: `TypeScript error in ([\w\/\.-]+):\((\d+),(\d+)\): (.+)`
   - Auto-fix: NO (reportar solo con ubicación exacta)

6. **Syntax errors** (reportar solo)
   - Patrón: `SyntaxError: (.+)`
   - Auto-fix: NO (muy peligroso)

---

### 2. Scripts de Auto-Fix

Crear los siguientes scripts auxiliares:

#### A) `scripts/fix-imports.ps1` o `.sh`
- Buscar todos los archivos TypeScript/JavaScript
- Usar regex para encontrar imports con extensiones `.js`
- Remover las extensiones
- Reportar cuántos archivos se corrigieron

#### B) `scripts/auto-fix-package-exports.ps1` o `.sh`
- Recibe parámetros: `-Package <nombre>` y `-Path <ruta>`
- Lee el package.json del package especificado
- Añade el export faltante a la sección `"exports"`
- Guarda el archivo con formato JSON correcto

#### C) `scripts/check-imports.ps1` o `.sh` (opcional, para verificación manual)
- Escanear proyecto sin modificar
- Reportar todos los imports con extensiones incorrectas
- Útil para pre-commit hooks

---

### 3. Integración con package.json

Añadir estos scripts a `package.json`:

```json
{
  "scripts": {
    "dev:watch": "npm run dev 2>&1 | pwsh -NoProfile -File scripts/watch-dev.ps1 -AutoFix",
    "monitor:dev": "pwsh -NoProfile -File scripts/watch-dev.ps1",
    "validate:imports": "pwsh -NoProfile -File scripts/check-imports.ps1",
    "validate:imports:fix": "pwsh -NoProfile -File scripts/fix-imports.ps1"
  }
}
```

**Para proyectos Bash/Linux:**
```json
{
  "scripts": {
    "dev:watch": "npm run dev 2>&1 | bash scripts/watch-dev.sh --auto-fix",
    "monitor:dev": "bash scripts/watch-dev.sh",
    "validate:imports": "bash scripts/check-imports.sh",
    "validate:imports:fix": "bash scripts/fix-imports.sh"
  }
}
```

---

### 4. Formato de Output del Monitor

El monitor debe mostrar:

**Durante ejecución:**
```
🔍 MONITOR COMPLETO DE DESARROLLO
===================================
🔧 Auto-fix: ACTIVADO

[logs normales del servidor...]

❌ ERROR 1: Import con .js extension
   → Tipo: Module Resolution Error
  🔧 Corrigiendo extensiones .js...
  ✅ CORREGIDO - Servidor recargando...

[logs normales continúan...]

❌ ERROR 2: Export faltante en package
   → Package: @mi-proyecto/core
   → Path: ./utils
  🔧 Añadiendo export a package.json...
  ✅ CORREGIDO - Reinicia el servidor
  ⚠️  REINICIA EL SERVIDOR para aplicar cambios

[logs normales continúan...]
```

**Al finalizar (Ctrl+C):**
```
========================================
RESUMEN DEL MONITOR
========================================

Errores detectados: 15
Errores corregidos: 12
Errores manuales: 3

✅ 12 errores fueron corregidos automáticamente
⚠️  3 errores requieren corrección manual
```

---

### 5. Características Importantes

**Debe tener:**
- ✅ Mostrar TODOS los logs del servidor (no ocultarlos)
- ✅ Detectar errores con regex (no parsing complejo)
- ✅ Ejecutar auto-fix en background (sin bloquear logs)
- ✅ Separación clara entre errores auto-corregibles y manuales
- ✅ Contador de errores detectados vs corregidos
- ✅ Colores en terminal (rojo=error, verde=fix, amarillo=manual)

**NO debe:**
- ❌ Bloquear el servidor mientras auto-corrige
- ❌ Modificar código de forma peligrosa (syntax errors, lógica)
- ❌ Auto-corregir TypeScript errors complejos
- ❌ Perder logs del servidor original

---

### 6. Documentación

Crear archivo: `docs/MONITOR-DESARROLLO.md`

**Contenido mínimo:**
- Cómo instalar/usar el monitor
- Lista de errores detectados y cuáles se auto-corrigen
- Comandos disponibles
- Troubleshooting (qué hacer si el monitor falla)
- Cómo añadir nuevos tipos de errores

---

## ESTRUCTURA DE ARCHIVOS ESPERADA

```
proyecto/
├── scripts/
│   ├── watch-dev.ps1 (o .sh)          # Monitor principal
│   ├── fix-imports.ps1 (o .sh)        # Auto-fix imports
│   ├── auto-fix-package-exports.ps1   # Auto-fix exports
│   └── check-imports.ps1              # Verificador
├── docs/
│   └── MONITOR-DESARROLLO.md          # Documentación
└── package.json                        # Con scripts añadidos
```

---

## USO ESPERADO

```bash
# Usuario inicia servidor con monitor:
npm run dev:watch

# El monitor:
# 1. Lee todos los logs del servidor
# 2. Detecta errores en tiempo real
# 3. Auto-corrige lo que puede
# 4. Muestra qué corrigió y qué no
# 5. Al final muestra resumen de estadísticas
```

---

## CASOS DE PRUEBA

Después de implementar, verificar que:

1. **Test de imports con .js:**
   - Crear archivo con `import { x } from './file.js'`
   - El monitor debe detectar y corregir a `import { x } from './file'`

2. **Test de export faltante:**
   - Importar `@mi-proyecto/core/utils` sin tener export en package.json
   - El monitor debe añadir `"./utils": "./src/utils/index.ts"` al package.json

3. **Test de dependencia faltante:**
   - Importar package no instalado
   - El monitor debe ejecutar `npm install <package>`

4. **Test de logs normales:**
   - Logs sin errores deben aparecer normalmente
   - El monitor NO debe interferir con output normal

---

## TECNOLOGÍAS DEL PROYECTO

Especifica:
- [ ] Framework: (Next.js / React / Node / Vue / etc.)
- [ ] Package Manager: (npm / pnpm / yarn)
- [ ] Lenguaje: (TypeScript / JavaScript)
- [ ] OS: (Windows / macOS / Linux)
- [ ] Shell preferido: (PowerShell / Bash / Zsh)

---

## PRIORIDADES

Implementa en este orden:

1. **Primero:** Monitor básico que lea logs y detecte 1-2 errores simples
2. **Segundo:** Auto-fix de imports (el más común)
3. **Tercero:** Auto-fix de exports
4. **Cuarto:** Resto de detectores de errores
5. **Quinto:** Documentación completa

---

## EJEMPLO DE IMPLEMENTACIÓN

Aquí un esqueleto básico del monitor principal:

**PowerShell:**
```powershell
param([switch]$AutoFix)

$ErrorsFound = 0
$ErrorsFixed = 0

foreach ($Line in $input) {
    # Mostrar línea original
    Write-Host $Line

    # Detectar error 1: Imports con .js
    if ($Line -match "Module not found.*Can't resolve.*\.js") {
        Write-Host "❌ ERROR: Import con .js extension" -ForegroundColor Red
        $ErrorsFound++

        if ($AutoFix) {
            # Ejecutar auto-fix
            pwsh -File scripts/fix-imports.ps1
            Write-Host "✅ CORREGIDO" -ForegroundColor Green
            $ErrorsFixed++
        }
    }

    # Añadir más detectores aquí...
}

# Resumen final
Write-Host "Errores: $ErrorsFound | Corregidos: $ErrorsFixed"
```

**Bash:**
```bash
#!/bin/bash
AUTO_FIX=false
[[ "$1" == "--auto-fix" ]] && AUTO_FIX=true

ERRORS=0
FIXED=0

while IFS= read -r line; do
    # Mostrar línea original
    echo "$line"

    # Detectar error 1: Imports con .js
    if echo "$line" | grep -q "Module not found.*Can't resolve.*\.js"; then
        echo "❌ ERROR: Import con .js extension"
        ((ERRORS++))

        if $AUTO_FIX; then
            bash scripts/fix-imports.sh
            echo "✅ CORREGIDO"
            ((FIXED++))
        fi
    fi

    # Añadir más detectores aquí...
done

echo "Errores: $ERRORS | Corregidos: $FIXED"
```

---

## ENTREGABLE

Implementa:
1. ✅ Scripts de monitoreo completos
2. ✅ Scripts de auto-fix funcionales
3. ✅ Integración en package.json
4. ✅ Documentación clara
5. ✅ Tests básicos para verificar funcionamiento

**Y muestra cómo ejecutarlo con un ejemplo real del proyecto.**
```

---

## 📝 INSTRUCCIONES DE USO DEL PROMPT

1. **Copia TODO el contenido del prompt** (desde "Necesito implementar..." hasta el final)

2. **Pega en Claude** (o tu IA preferida) en un proyecto nuevo

3. **Especifica tu stack tecnológico:**
   ```
   Mi proyecto usa:
   - Framework: Next.js 14
   - Package Manager: pnpm
   - Lenguaje: TypeScript
   - OS: Windows
   - Shell: PowerShell
   ```

4. **La IA implementará** todo el sistema adaptado a tu proyecto

5. **Pruébalo:**
   ```bash
   pnpm dev:watch
   ```

---

## 🎯 VARIACIONES DEL PROMPT

### Para proyectos React (sin Next.js):

Añade al final del prompt:
```
NOTA: Este es un proyecto React puro (Create React App / Vite).
Los errores de "Module not found" vienen de Webpack/Vite, no Next.js.
Adapta los patrones regex según corresponda.
```

### Para proyectos Node.js (backend):

Añade al final del prompt:
```
NOTA: Este es un proyecto Node.js backend (Express / Fastify / NestJS).
No hay hot-reload como Next.js. Después de auto-corregir, debe reiniciar el servidor automáticamente con nodemon.
```

### Para proyectos Vue:

Añade al final del prompt:
```
NOTA: Este es un proyecto Vue.js.
Los errores vienen de Vite/Webpack.
Adapta patrones regex y considera errores específicos de Vue (.vue files).
```

---

## 💡 TIPS PARA MEJORES RESULTADOS

1. **Sé específico con tu stack:**
   - Menciona versiones exactas (Next.js 14, React 18, etc.)
   - Indica si usas Turbo, Webpack, Vite, etc.

2. **Proporciona ejemplos de errores reales:**
   - Copia/pega 3-5 errores que ves frecuentemente
   - La IA adaptará los regex mejor

3. **Indica prioridades:**
   - "El error más común es X, enfócate en ese primero"
   - "No necesito auto-fix de TypeScript, solo reportar"

4. **Pide iteraciones:**
   - "Primero implementa el monitor básico"
   - "Ahora añade auto-fix de imports"
   - "Ahora añade detección de exports faltantes"

---

## 🆘 SI ALGO FALLA

### El monitor no detecta errores

Pide a la IA:
```
El monitor no detecta errores. Aquí está un ejemplo de error real:
[pega el error completo]

Ajusta el regex para que lo detecte.
```

### El auto-fix no funciona

Pide a la IA:
```
El auto-fix de [tipo de error] no funciona.
Aquí está el código del script: [pega el script]
Aquí está el error: [pega el error]

Depura y corrige el script.
```

### Quiero añadir un nuevo tipo de error

Pide a la IA:
```
Quiero que el monitor también detecte este error:
[pega ejemplo del error]

Añade detección y auto-fix para este caso.
```

---

**Creado:** 22 Enero 2026
**Versión:** 1.0
**Probado en:** Next.js 15, React 19, TypeScript 5, pnpm 9, Windows 11
