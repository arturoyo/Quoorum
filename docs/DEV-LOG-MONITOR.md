# 📡 MONITOR DE LOGS EN TIEMPO REAL

> **Sistema que lee los logs del servidor mientras desarrollas y auto-corrige errores al instante**

---

## 🚀 USO RÁPIDO

### Opción 1: Modo Observación (solo reporta)

```bash
# Terminal 1: Servidor de desarrollo
pnpm dev

# Terminal 2: Monitor de logs (en paralelo)
pnpm monitor:dev
```

### Opción 2: Modo Auto-Fix ✨ (RECOMENDADO)

```bash
# Terminal 1: Servidor con monitor integrado que auto-corrige
pnpm dev 2>&1 | pnpm monitor:dev:fix
```

**Resultado:**
- ✅ Detecta errores de imports con `.js` en tiempo real
- ✅ Los corrige automáticamente
- ✅ El servidor se recarga con el código corregido
- ✅ **NO NECESITAS PARAR EL SERVIDOR**

---

## 🎯 PROBLEMAS QUE RESUELVE

### Problema 1: "Module not found: Can't resolve './xyz.js'"

**Antes:**
```
1. Ves el error en el navegador
2. Vas al código
3. Buscas el archivo mencionado
4. Quitas el .js manualmente
5. Guardas
6. Esperas recarga
```

**Ahora con el monitor:**
```
1. El monitor detecta el error
2. Ejecuta fix-imports.ps1 automáticamente
3. El servidor se recarga solo
4. LISTO ✅
```

### Problema 2: "Package path ./client.js is not exported"

**Detecta:**
```typescript
// ❌ Error
import { db } from "@quoorum/db/client.js"
```

**Auto-corrige a:**
```typescript
// ✅ Correcto
import { db } from "@quoorum/db/client"
```

---

## 📋 ERRORES QUE DETECTA

| Patrón de Error | Descripción | Auto-Fix |
|-----------------|-------------|----------|
| `Module not found: Can't resolve './path.js'` | Import relativo con .js | ✅ Sí |
| `Package path ./file.js is not exported` | Import de package con .js | ✅ Sí |
| `TypeScript error in file.ts:(10,5)` | Error de TypeScript | ❌ Solo reporta |
| `Failed to compile` | Build falló | ❌ Solo reporta |

---

## 🛠️ CÓMO FUNCIONA

### Arquitectura

```
Servidor Next.js (pnpm dev)
      ↓ STDOUT/STDERR
Monitor de Logs (PowerShell)
      ↓ Detecta patrón de error
Regex Pattern Matching
      ↓ Identifica tipo de error
Auto-Fix Script (fix-imports.ps1)
      ↓ Corrige archivos
Next.js detecta cambios
      ↓ Recarga automáticamente
✅ Código corregido en < 5 segundos
```

### Patrones de Detección

El monitor usa regex para detectar errores en tiempo real:

```powershell
# Ejemplo de patrón
"Module not found.*Can't resolve '(\.\/[^']+)\.js'"
#                                   ↑ Captura el path

# Si encuentra match → Ejecuta fix automático
```

---

## 📊 EJEMPLO DE USO REAL

### Terminal 1: Servidor con Monitor Auto-Fix

```bash
PS C:\Quoorum> pnpm dev 2>&1 | pnpm monitor:dev:fix

🔍 DEV LOG MONITOR - Tiempo Real
=================================

🔧 MODO AUTO-FIX ACTIVADO
   Los errores se corregirán automáticamente

📡 Leyendo logs desde STDIN...

> @quoorum/web:dev: starting server on http://localhost:3000
> @quoorum/api:dev: watching for changes...

❌ ERROR DETECTADO: Import relativo con .js extension
   Línea: Module not found: Can't resolve './client.js'
  → Detectado: import from './client.js'
  ✅ AUTO-FIX EJECUTADO

⚡ Cambios aplicados. El servidor debería recargar...

> @quoorum/web:dev: ✓ compiled successfully
```

### Terminal 2: Desarrollo normal

Sigues trabajando en tu código, el monitor detecta y corrige errores en segundo plano.

---

## 🔧 CONFIGURACIÓN AVANZADA

### Añadir nuevos patrones de error

Edita `scripts/dev-log-monitor.ps1`:

```powershell
$ErrorPatterns = @{
    "TuNuevoError" = @{
        Pattern = "regex pattern aquí"
        Description = "Descripción del error"
        AutoFix = {
            param($Match)
            # Lógica de corrección
            Write-Host "  ✅ Corregido!" -ForegroundColor Green
            return $true
        }
    }
}
```

### Monitorear solo ciertos errores

Comenta los patrones que no quieras monitorear en `$ErrorPatterns`.

---

## 🚨 LIMITACIONES

### ❌ NO puede auto-corregir:

- Errores de lógica de negocio
- Errores de TypeScript complejos (tipos incompatibles)
- Errores de sintaxis (falta punto y coma, etc.)
- Errores de runtime (null pointer, etc.)

### ✅ SÍ puede auto-corregir:

- Imports con `.js` extensions (relativos y packages)
- Paths incorrectos (si el script lo detecta)
- Estilos inconsistentes de imports

---

## 💡 TIPS DE USO

### 1. Siempre con Auto-Fix

```bash
# ❌ No recomendado (solo observa)
pnpm monitor:dev

# ✅ Recomendado (auto-corrige)
pnpm dev 2>&1 | pnpm monitor:dev:fix
```

### 2. Combinar con Pre-Flight

```bash
# ANTES de empezar a desarrollar
pnpm preflight

# DURANTE desarrollo
pnpm dev 2>&1 | pnpm monitor:dev:fix
```

### 3. Verificar que el fix funcionó

Después de que el monitor auto-corrija:

```bash
# Verificar que no quedan errores
pnpm validate:imports
```

---

## 🎯 INTEGRACIÓN CON WORKFLOW

### Workflow Completo

```bash
# 1. Pre-flight checks (antes de empezar)
pnpm preflight

# 2. Servidor con monitor auto-fix (mientras desarrollas)
pnpm dev 2>&1 | pnpm monitor:dev:fix

# 3. Pre-commit (antes de commit)
git commit -m "feat: nuevo cambio"
# → Pre-commit hook detecta y bloquea si hay .js extensions
```

### Si el Monitor No Está Activo

Si te olvidas de correr el monitor y ves errores:

```bash
# Fix manual rápido
pnpm validate:imports:fix

# Verificar
pnpm validate:imports
```

---

## 📈 ESTADÍSTICAS

**Tiempo ahorrado por error:**
- Sin monitor: ~2-5 minutos (buscar → editar → guardar → recargar)
- Con monitor: ~5 segundos (automático)

**Errores prevenidos:**
- Pre-commit hook: Bloquea antes de commit
- Monitor en dev: Corrige mientras escribes código
- Pre-flight: Detecta antes de empezar

**Cobertura:**
- ✅ Imports relativos con `.js`
- ✅ Imports de packages con `.js`
- 🔄 Más patrones en desarrollo

---

## 🆘 TROUBLESHOOTING

### El monitor no detecta errores

**Problema:** Los logs no se están capturando

**Solución:**
```bash
# Asegúrate de redirigir STDERR también
pnpm dev 2>&1 | pnpm monitor:dev:fix
#        ^^^^  Importante: captura errores también
```

### El auto-fix no corrige

**Problema:** El patrón de error no coincide

**Solución:**
1. Copia el mensaje de error completo
2. Añade el patrón a `$ErrorPatterns` en el script
3. Prueba el regex en https://regex101.com

### El servidor no recarga después del fix

**Problema:** Next.js no detecta cambios

**Solución:**
```bash
# Verifica que el archivo se guardó correctamente
git status

# Fuerza recarga manual
# Toca cualquier archivo en apps/web/src
```

---

## 🔗 SCRIPTS RELACIONADOS

| Script | Descripción | Cuándo Usar |
|--------|-------------|-------------|
| `check-imports-simple.ps1` | Detecta .js extensions | Manual, pre-commit |
| `fix-imports.ps1` | Corrige .js extensions | Manual, auto-fix |
| `dev-log-monitor.ps1` | Monitor en tiempo real | Durante desarrollo |
| `pre-flight.sh` | Checks antes de empezar | Antes de trabajar |

---

**Actualizado:** 22 Enero 2026
**Estado:** ✅ PRODUCCIÓN
**Mantenido por:** Sistema de Calidad Automatizado
