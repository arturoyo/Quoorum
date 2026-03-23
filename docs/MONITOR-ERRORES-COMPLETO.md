# 🚨 MONITOR DE ERRORES COMPLETO

> **Sistema que detecta y auto-corrige TODOS los tipos de errores durante desarrollo**

---

## 🚀 USO

```bash
# Servidor con monitor completo y auto-fix activado
pnpm dev:watch
```

**El monitor detecta y corrige automáticamente:**
- ✅ Imports con `.js` extensions
- ✅ Exports faltantes en package.json
- ✅ Dependencias npm faltantes
- ✅ ESLint errors auto-corregibles
- ⚠️ TypeScript errors (algunos casos)
- ⚠️ Syntax errors (reporta, no auto-corrige)

---

## 📋 TIPOS DE ERRORES DETECTADOS

### ERROR 1: Import con .js Extension

**Ejemplo:**
```typescript
import { db } from "./client.js"  // ❌
import { db } from "@quoorum/db/client.js"  // ❌
```

**Auto-Fix:** ✅ SÍ
```typescript
import { db } from "./client"  // ✅
import { db } from "@quoorum/db/client"  // ✅
```

**Cómo funciona:**
1. Detecta patrón: `Module not found.*Can't resolve.*\.js`
2. Ejecuta: `scripts/fix-imports.ps1`
3. Remueve todas las extensiones `.js`
4. El servidor recarga automáticamente

**Output del monitor:**
```
❌ ERROR 1: Import con .js extension
   → Tipo: Module Resolution Error
  🔧 Corrigiendo extensiones .js...
  ✅ CORREGIDO - Servidor recargando...
```

---

### ERROR 2: Export Faltante en Package.json

**Ejemplo:**
```javascript
// En código:
import { frameworks } from "@quoorum/quoorum/frameworks"

// Error:
// Package path ./frameworks is not exported from package @quoorum/quoorum
```

**Auto-Fix:** ✅ SÍ (requiere reiniciar servidor)

**Cómo funciona:**
1. Detecta patrón: `Package path \.([\w-]+) is not exported from package.*@quoorum\/([\w-]+)`
2. Ejecuta: `scripts/auto-fix-package-exports.ps1 -Package quoorum -Path frameworks`
3. Añade automáticamente a `package.json`:
   ```json
   "exports": {
     "./frameworks": "./src/frameworks/index.ts"
   }
   ```
4. Avisa que debes **reiniciar el servidor**

**Output del monitor:**
```
❌ ERROR 2: Export faltante en package
   → Package: @quoorum/quoorum
   → Path: ./frameworks
  🔧 Añadiendo export a package.json...
  ✅ CORREGIDO - Reinicia el servidor
  ⚠️  REINICIA EL SERVIDOR para aplicar cambios
```

---

### ERROR 3: Módulo No Encontrado (Genérico)

**Ejemplo:**
```javascript
import { Button } from "some-ui-library"  // ❌ No instalado
```

**Auto-Fix:** ✅ SÍ (si es dependencia npm)

**Cómo funciona:**
1. Detecta patrón: `Module not found.*Can't resolve '([^']+)'`
2. Verifica si es package npm (no empieza con `./` ni `@quoorum`)
3. Ejecuta: `pnpm add some-ui-library`
4. Avisa que debes **reiniciar el servidor**

**Output del monitor:**
```
❌ ERROR 3: Módulo no encontrado
   → Módulo: some-ui-library
   → Posible dependencia faltante
  🔧 Instalando dependencia faltante: some-ui-library...
  ✅ CORREGIDO - Reinicia el servidor
  ⚠️  REINICIA EL SERVIDOR para aplicar cambios
```

**Si es archivo local:**
```
❌ ERROR 3: Módulo no encontrado
   → Módulo: ./components/MyComponent
  ⚠️  Verifica que el archivo exista: ./components/MyComponent
```

---

### ERROR 4: TypeScript Errors

**Ejemplo:**
```typescript
function hello() {  // ❌ Error: Function lacks return type
  return "hello"
}

const x = 5  // ❌ Error: 'x' is declared but its value is never read
```

**Auto-Fix:** ⚠️ PARCIAL (solo casos comunes)

**Casos que PUEDE auto-corregir:**
- Unused variables → Añade prefijo `_` (futuro)

**Casos que NO puede auto-corregir:**
- Missing return types
- Type incompatibilities
- Generic type issues

**Output del monitor:**
```
❌ ERROR 4: TypeScript
   → Archivo: src/components/MyComponent.tsx:10:5
   → Error: Function lacks return type annotation
  ⚠️  Error TypeScript requiere corrección manual
```

---

### ERROR 5: ESLint Errors

**Ejemplo:**
```javascript
const x = 5;  // ❌ ESLint: Unexpected var, use let or const instead
console.log(x)
```

**Auto-Fix:** ✅ SÍ (casos auto-corregibles)

**Cómo funciona:**
1. Detecta patrón: `ESLint:.*Error:`
2. Ejecuta: `pnpm lint --fix`
3. ESLint corrige reglas simples automáticamente

**Output del monitor:**
```
❌ ERROR 5: ESLint
  🔧 Ejecutando eslint --fix...
  ✅ CORREGIDO - ESLint auto-fix aplicado
```

**Si no puede auto-corregir:**
```
❌ ERROR 5: ESLint
  ⚠️  ESLint error requiere corrección manual
```

---

### ERROR 6: Syntax Errors

**Ejemplo:**
```javascript
const x = {
  name: "test"
  age: 25  // ❌ SyntaxError: Missing comma
}
```

**Auto-Fix:** ❌ NO (demasiado peligroso)

**Cómo funciona:**
1. Detecta patrón: `SyntaxError: (.+)`
2. **Solo reporta**, no auto-corrige
3. Muestra el error para que lo corrijas manualmente

**Output del monitor:**
```
❌ ERROR 6: Syntax Error
   → Error: Unexpected token '}', expected ','
  ⚠️  Syntax error requiere corrección manual
```

---

### ERROR 7: Build Failed (Genérico)

**Ejemplo:**
```
Failed to compile
```

**Auto-Fix:** ❌ NO

**Cómo funciona:**
1. Detecta patrón: `Failed to compile`
2. Indica que hay errores anteriores que causaron el fallo
3. Revisa los errores detectados arriba

**Output del monitor:**
```
❌ ERROR 7: Build Failed
   → Revisa los errores anteriores
```

---

### ERROR 8: Dependencias No Encontradas

**Ejemplo:**
```javascript
// En Node.js
const express = require('express')  // ❌ Cannot find module 'express'
```

**Auto-Fix:** ✅ SÍ

**Cómo funciona:**
1. Detecta patrón: `Cannot find module '([^']+)'`
2. Ejecuta: `pnpm add express`
3. Avisa que debes **reiniciar el servidor**

**Output del monitor:**
```
❌ ERROR 8: Dependencia no encontrada
   → Módulo: express
  🔧 Instalando dependencia faltante: express...
  ✅ CORREGIDO - Reinicia el servidor
  ⚠️  REINICIA EL SERVIDOR para aplicar cambios
```

---

## 📊 RESUMEN DE CAPACIDADES

| Error | Auto-Fix | Requiere Reinicio | Ejemplo |
|-------|----------|-------------------|---------|
| ✅ Imports `.js` | SÍ | No | `import x from './file.js'` |
| ✅ Exports faltantes | SÍ | **Sí** | `./frameworks` no exportado |
| ✅ Deps npm faltantes | SÍ | **Sí** | `import x from 'missing-pkg'` |
| ✅ ESLint auto-fix | SÍ | No | Reglas simples |
| ⚠️ TypeScript errors | Parcial | No | Depende del error |
| ❌ Syntax errors | NO | - | Corrección manual |
| ❌ Build failed | NO | - | Reporta solo |

---

## 🎯 FLUJO DE TRABAJO RECOMENDADO

### Inicio del día:

```bash
# 1. Pre-flight checks
pnpm preflight

# 2. Iniciar servidor con monitor
pnpm dev:watch
```

### Durante desarrollo:

```
→ Escribes código
→ Guardas archivo
→ Monitor detecta errores automáticamente
→ Auto-corrige lo que puede
→ Te avisa de errores manuales
→ Servidor recarga con código corregido
```

### Si el monitor corrige algo:

**Casos que NO requieren reinicio:**
- Imports con `.js` → Servidor recarga solo
- ESLint fixes → Servidor recarga solo

**Casos que SÍ requieren reinicio:**
- Exports en package.json → **Ctrl+C y pnpm dev:watch**
- Dependencias npm instaladas → **Ctrl+C y pnpm dev:watch**

---

## 🔧 CONFIGURACIÓN AVANZADA

### Añadir nuevos tipos de errores

Edita `scripts/watch-dev-complete.ps1`:

```powershell
# Añadir después de ERROR 8:

# ------------------------------------------------------------------------
# 9. TU NUEVO ERROR
# ------------------------------------------------------------------------
if ($Line -match "TU_PATRON_REGEX") {
    Write-Host ""
    Write-Host "❌ ERROR 9: Tu Descripción" -ForegroundColor Red
    $ErrorsFound++
    $ErrorDetected = $true

    if ($AutoFix) {
        # Tu lógica de auto-fix
        Write-Host "  ✅ CORREGIDO" -ForegroundColor Green
        $ErrorsFixed++
    } else {
        Write-Host "  💡 Fix: Tu comando manual" -ForegroundColor Cyan
    }
}
```

### Deshabilitar auto-fix de ciertos errores

Comenta las secciones que no quieras en el script.

---

## 📈 ESTADÍSTICAS DEL MONITOR

Al final de la sesión (cuando presionas Ctrl+C):

```
========================================
RESUMEN DEL MONITOR
========================================

Errores detectados: 12
Errores corregidos: 8
Errores manuales: 4

✅ 8 errores fueron corregidos automáticamente
⚠️  4 errores requieren corrección manual
```

---

## 🆘 TROUBLESHOOTING

### El monitor no detecta un error

**Solución:**
1. Verifica que el error aparece en los logs
2. Añade el patrón regex al script
3. Ejecuta: `pnpm dev:watch` para reiniciar

### El auto-fix no funciona

**Solución:**
1. Verifica que estás usando `-AutoFix`: `pnpm dev:watch`
2. Revisa los logs del monitor para ver qué falló
3. Ejecuta el comando manual que sugiere

### El servidor no recarga después del fix

**Solución:**
- Si el error fue exports o dependencies: **REINICIA EL SERVIDOR**
- Si fue imports o ESLint: Espera unos segundos, Next.js recarga automáticamente

---

## 💡 TIPS

### 1. Deja el monitor siempre activo

```bash
# No uses pnpm dev normal
# Siempre usa:
pnpm dev:watch
```

### 2. Combina con pre-flight

```bash
# Antes de empezar
pnpm preflight

# Durante desarrollo
pnpm dev:watch
```

### 3. Revisa el resumen al final del día

Cuando detengas el servidor (Ctrl+C), el monitor muestra:
- Cuántos errores detectó
- Cuántos corrigió automáticamente
- Cuántos requirieron intervención manual

Esto te da métricas de calidad de código.

---

**Actualizado:** 22 Enero 2026
**Estado:** ✅ PRODUCCIÓN
**Cobertura:** 8 tipos de errores detectados y auto-corregidos
