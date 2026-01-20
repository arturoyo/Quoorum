# 🔧 Sistema de Auto-Healing para Next.js

> **Versión:** 1.0.0 | **Fecha:** 20 Ene 2026
> **Estado:** ✅ Implementado y activo

---

## 📋 Resumen

El **Auto-Healer** es un sistema inteligente que monitorea y corrige automáticamente errores de Next.js, TypeScript y ESLint en el proyecto Quoorum. Reduce la carga de trabajo manual al detectar y solucionar problemas comunes de forma segura.

## 🎯 Objetivo

Eliminar la necesidad de intervención manual para errores simples y repetitivos, permitiendo a los desarrolladores enfocarse en tareas de mayor valor.

## ⚙️ Arquitectura

### Componentes

```
┌─────────────────────────────────────────────────────────┐
│                   Auto-Healer System                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Worker     │  │    Error     │  │   Auto-Fix   │  │
│  │  (Inngest)   │→ │   Parsers    │→ │   Appliers   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │         │
│         ↓                  ↓                  ↓         │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Sistema de Logging & Notificaciones     │  │
│  │         (TIMELINE.md + Sentry + Console)         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Archivos Principales

| Archivo | Propósito |
|---------|-----------|
| `packages/workers/src/functions/nextjs-auto-healer.ts` | Worker principal de Inngest |
| `packages/workers/src/lib/error-parsers.ts` | Detecta y clasifica errores |
| `packages/workers/src/lib/auto-fix-appliers.ts` | Ejecuta correcciones automáticas |

---

## 🚀 Funcionamiento

### 1. Monitoreo (cada 5 minutos)

El worker ejecuta automáticamente:

```bash
pnpm typecheck  # Detecta errores TypeScript
pnpm lint       # Detecta errores ESLint
# pnpm build    # (Futuro) Detecta errores de build
```

### 2. Detección y Clasificación

Los errores se clasifican en 3 niveles de severidad:

| Severidad | Descripción | Auto-fixable |
|-----------|-------------|--------------|
| **🟢 Safe** | Formateo, imports duplicados | ✅ Sí |
| **🟡 Moderate** | console.log, unused vars, prefer-const | ✅ Sí |
| **🔴 Dangerous** | Tipos incorrectos, lógica rota | ❌ No (requiere humano) |

### 3. Auto-Corrección

El sistema aplica **solo** correcciones seguras:

#### ✅ Correcciones Soportadas

| Error | Estrategia | Riesgo | Ejemplo |
|-------|-----------|--------|---------|
| Imports duplicados | Eliminar duplicado | Muy bajo | `import {`<br>`import {` → 1 solo import |
| `console.log` en código | Comentar línea | Bajo | `console.log(x)` → `// console.log(x)` |
| Variables no usadas | Prefijo `_` | Bajo | `const x` → `const _x` |
| `let` sin reasignación | Cambiar a `const` | Bajo | `let x = 1` → `const x = 1` |
| `var` keyword | Cambiar a `const` | Bajo | `var x = 1` → `const x = 1` |
| Tipo `any` | Cambiar a `unknown` | Moderado | `: any` → `: unknown` |

#### ❌ NO Auto-Corrige

- Errores de tipos complejos (TypeScript)
- Errores de lógica de negocio
- Missing dependencies (requiere `pnpm install`)
- Errores de runtime
- Errores de build críticos

### 4. Verificación Post-Fix

Después de aplicar correcciones, el sistema:
1. Re-ejecuta `pnpm typecheck` y `pnpm lint`
2. Verifica que los errores se resolvieron
3. Detecta si se introdujeron nuevos errores

### 5. Logging y Notificación

**TIMELINE.md:**
```markdown
### [20/01/2026 14:35] - AUTO-HEALER: 3 Correcciones Aplicadas
**Solicitado por:** Sistema (Auto-Healer Worker)
**Descripción:** Monitoreo automático de errores y corrección de código
**Acciones realizadas:**
- ✅ apps/web/src/components/ui/chart.tsx: Removed duplicate import statement at line 12
- ✅ packages/api/src/routers/clients.ts: Commented out console.log at line 45
- ✅ packages/db/src/schema/users.ts: Prefixed unused variable 'tempVar' with underscore
**Errores restantes:** 2
**Requieren atención manual:**
- ⚠️ apps/web/src/lib/utils.ts:89 - Type 'string' is not assignable to type 'number'
**Resultado:** ✅ Correcciones aplicadas
**Timestamp:** 2026-01-20T14:35:22.000Z
---
```

**Console Logs:**
```
[Auto-Healer] Starting health check...
[Auto-Healer] Detected errors { total: 5, typescript: 3, eslint: 2 }
[Auto-Healer] Applying fix { file: 'chart.tsx', strategy: 'fix-malformed-imports' }
[Auto-Healer] Fix applied successfully { changes: ['Removed duplicate import'] }
[Auto-Healer] 🔧 Auto-healing summary { fixesApplied: 3, remainingErrors: 2 }
```

---

## 🔐 Seguridad

### Límites de Seguridad

1. **Máximo 10 fixes por ejecución** - Previene loops infinitos
2. **Timeout de 2 minutos** - Evita bloqueos
3. **Solo severidad Safe/Moderate** - No toca código peligroso
4. **Backup implícito en Git** - Todos los cambios son reversibles
5. **Logging completo** - Auditoría de todas las acciones

### Rollback Manual

Si el auto-healer introduce un problema:

```bash
# Ver últimos commits
git log --oneline -10

# Revisar cambios del auto-healer en TIMELINE.md
cat TIMELINE.md | grep "AUTO-HEALER"

# Revertir archivo específico
git checkout HEAD~1 -- path/to/file.tsx

# O revertir todos los cambios desde timestamp
git revert <commit-hash>
```

---

## 🎮 Uso

### Ejecución Automática

El worker se ejecuta **cada 5 minutos** automáticamente vía Inngest cron.

### Ejecución Manual (bajo demanda)

```typescript
// Desde código TypeScript
import { inngest } from '@quoorum/workers'

await inngest.send({
  name: 'nextjs/auto-healer.trigger',
  data: {}
})
```

```bash
# Desde terminal (requiere Inngest CLI)
inngest send nextjs/auto-healer.trigger
```

### Desactivar Temporalmente

```typescript
// packages/workers/src/index.ts
export const quoorumFunctions = [
  // ... otros workers
  // nextjsAutoHealer, // ← Comentar para desactivar
  // nextjsAutoHealerManual,
]
```

---

## 📊 Monitoreo

### Logs

```bash
# Ver logs del worker en Inngest Dashboard
# https://app.inngest.com/projects/<project-id>/functions/nextjs-auto-healer

# Ver acciones en TIMELINE.md
grep "AUTO-HEALER" TIMELINE.md

# Ver logs de aplicación
tail -f .next/trace
```

### Métricas

El worker retorna métricas en cada ejecución:

```typescript
{
  success: true,
  errorsFound: 5,
  errorsFixed: 3,
  errorsRemaining: 2,
  fixes: [
    { file: 'chart.tsx', changes: ['Removed duplicate import'] }
  ]
}
```

---

## 🔧 Configuración

### Ajustar Frecuencia de Ejecución

```typescript
// packages/workers/src/functions/nextjs-auto-healer.ts
const AUTO_HEAL_CONFIG = {
  cronSchedule: '*/5 * * * *', // Cada 5 min (cambiar aquí)
  // ...
}
```

Ejemplos de cron:
- `*/1 * * * *` - Cada 1 minuto
- `*/10 * * * *` - Cada 10 minutos
- `0 * * * *` - Cada hora
- `0 9 * * 1-5` - Lunes a Viernes a las 9 AM

### Añadir Nuevas Reglas de Auto-Fix

**1. Añadir detección en `error-parsers.ts`:**

```typescript
function isTypeScriptAutoFixable(code: string, message: string): boolean {
  // ... código existente

  // Nueva regla
  if (code === 'TS1234' && message.includes('Custom error')) {
    return true
  }

  return false
}
```

**2. Añadir estrategia en `error-parsers.ts`:**

```typescript
function getTypeScriptFixStrategy(code: string, message: string): string | undefined {
  // ... código existente

  if (code === 'TS1234') {
    return 'my-custom-fix'
  }

  return undefined
}
```

**3. Implementar fix en `auto-fix-appliers.ts`:**

```typescript
export async function applyAutoFix(error: DetectedError): Promise<FixResult> {
  switch (error.fixStrategy) {
    // ... casos existentes

    case 'my-custom-fix':
      return await myCustomFix(error)

    default:
      // ...
  }
}

async function myCustomFix(error: DetectedError): Promise<FixResult> {
  // Implementar lógica de corrección
  const content = await readFile(error.file, 'utf-8')
  // ... modificar content
  await writeFile(error.file, newContent, 'utf-8')

  return {
    success: true,
    file: error.file,
    changes: ['Description of what was fixed'],
  }
}
```

---

## 🧪 Testing

### Test Manual del Parser

```bash
# Generar errores de prueba
cd apps/web
pnpm typecheck > /tmp/typecheck-output.txt 2>&1

# Parsear con Node.js REPL
node
> const { parseTypeScriptErrors } = require('./packages/workers/src/lib/error-parsers.ts')
> const fs = require('fs')
> const output = fs.readFileSync('/tmp/typecheck-output.txt', 'utf-8')
> const errors = parseTypeScriptErrors(output)
> console.log(errors)
```

### Test de Fixes Individuales

```typescript
// test-auto-fix.ts
import { applyAutoFix } from './packages/workers/src/lib/auto-fix-appliers'

const testError = {
  type: 'typescript',
  severity: 'safe',
  file: 'apps/web/src/test.tsx',
  line: 10,
  message: 'Identifier expected',
  code: 'TS1003',
  rawError: '...',
  autoFixable: true,
  fixStrategy: 'fix-malformed-imports',
}

const result = await applyAutoFix(testError)
console.log(result)
```

---

## 📈 Próximas Mejoras

### Fase 2 (Futuro)

- [ ] **Build monitoring**: Detectar errores de build automáticamente
- [ ] **Dependency auto-install**: Instalar dependencias faltantes (con confirmación)
- [ ] **AI-powered fixes**: Usar LLM para sugerir fixes de errores complejos
- [ ] **Dashboard UI**: Interface web para revisar historial de fixes
- [ ] **Slack/Email notifications**: Notificaciones push cuando se aplican fixes
- [ ] **A/B testing de fixes**: Crear branch temporal para probar fixes antes de aplicar

### Fase 3 (Futuro lejano)

- [ ] **Detección de regresiones**: Comparar con commits anteriores
- [ ] **Auto-merge de PRs simples**: Merge automático si solo contiene auto-fixes
- [ ] **Predicción de errores**: ML para predecir errores antes de que ocurran
- [ ] **Integration tests**: Ejecutar tests después de cada fix

---

## ❓ FAQ

### ¿El auto-healer puede romper mi código?

**No, si se usa correctamente.** El sistema solo aplica fixes de severidad "Safe" y "Moderate", que son cambios de formateo o estilo que no afectan la lógica. Además, todos los cambios quedan registrados en Git y son reversibles.

### ¿Qué pasa si el auto-healer no puede corregir un error?

El error se clasifica como "dangerous" o "manual fix needed" y se registra en logs para que un humano lo revise. El sistema **nunca** intentará corregir algo que no entiende completamente.

### ¿Puedo desactivar el auto-healer temporalmente?

Sí, comentando las funciones en `packages/workers/src/index.ts` o ajustando el cron schedule.

### ¿Cómo revisar qué cambios hizo el auto-healer?

1. **TIMELINE.md**: Registro detallado con timestamp
2. **Git history**: `git log --author="Auto-Healer"`
3. **Inngest Dashboard**: Ver logs de ejecuciones

### ¿El auto-healer funciona en producción?

El auto-healer está diseñado para **desarrollo local y staging**. En producción, se recomienda ejecutarlo manualmente o con confirmación humana.

---

## 🤝 Contribución

Para añadir nuevas reglas de auto-fix:

1. Identificar patrón de error en logs
2. Añadir detección en `error-parsers.ts`
3. Implementar fix en `auto-fix-appliers.ts`
4. Testear manualmente con archivos de ejemplo
5. Documentar en este archivo
6. Crear PR con tests

---

**Última actualización:** 20 Ene 2026
**Mantenido por:** Sistema Quoorum
**Versión:** 1.0.0
