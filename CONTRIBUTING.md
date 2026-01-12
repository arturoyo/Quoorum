# 🤝 Guía de Contribución a Wallie

> **Última actualización:** 31 Dic 2025
> **Para:** Desarrolladores y colaboradores del proyecto

---

## 📋 Tabla de Contenidos

1. [⚡ Pre-Commit Hook: El Estándar de Oro](#-pre-commit-hook-el-estándar-de-oro)
2. [Flujo de Git](#-flujo-de-git)
3. [Convención de Commits](#-convención-de-commits)
4. [Checklist Pre-PR](#-checklist-pre-pr)
5. [Reglas Obligatorias](#-reglas-obligatorias)
6. [Proceso de Desarrollo](#-proceso-de-desarrollo)
7. [Recursos Adicionales](#-recursos-adicionales)

---

## ⚡ Pre-Commit Hook: El Estándar de Oro

### 🎯 ¿Qué es el Pre-Commit Hook?

El **pre-commit hook de Husky** es el **estándar de oro** del proyecto Wallie. Es la **última línea de defensa** que garantiza que **ningún código con errores** llegue al repositorio.

**⚠️ CRÍTICO:** Este hook se ejecuta **automáticamente** en cada `git commit`. **NO puedes saltártelo** sin usar `--no-verify` (que está desaconsejado).

### 🛡️ Validaciones Automáticas

El hook ejecuta **3 validaciones críticas** en cada commit:

#### 1. ✅ TypeScript Check (BLOQUEANTE)

```bash
pnpm typecheck
```

**¿Qué valida?**
- Errores de tipos en todo el monorepo
- Incompatibilidades de tipos
- Imports incorrectos
- Tipos faltantes o mal definidos

**⚠️ CONSECUENCIA:** Si falla, **el commit es RECHAZADO automáticamente**.

**Mensaje de error:**
```
❌ =============================================
   TYPESCRIPT CHECK FAILED
   =============================================

⚠️  CRITICAL: No se permiten commits con errores de tipos.
   Por favor, corrige los errores de TypeScript antes de continuar.

💡 Tip: Ejecuta 'pnpm typecheck' para ver los errores detallados.
```

**No hay excepciones.** Incluso si es un "pequeño cambio", si hay errores de tipos, el commit será bloqueado.

#### 2. ✅ Lint-Staged (BLOQUEANTE)

```bash
pnpm exec lint-staged
```

**¿Qué valida?**
- ESLint en archivos modificados (`*.ts`, `*.tsx`)
- Prettier para formateo automático
- Correcciones automáticas cuando es posible

**⚠️ CONSECUENCIA:** Si hay errores de linting que no se pueden corregir automáticamente, **el commit es RECHAZADO**.

**Proceso:**
1. El hook intenta corregir automáticamente (ESLint `--fix`, Prettier `--write`)
2. Si hay errores que requieren intervención manual, el commit se bloquea
3. Debes corregir los errores y volver a hacer commit

**Mensaje de error:**
```
❌ =============================================
   LINT-STAGED FAILED
   =============================================

⚠️  Se encontraron errores de linting o formato.
   lint-staged intentó corregirlos automáticamente.
   Por favor, revisa los cambios y vuelve a hacer commit.
```

#### 3. ✅ Security Check (BLOQUEANTE)

**¿Qué valida?**
- Detección de API keys hardcodeadas
- Passwords en código
- Secrets y tokens
- Connection strings con credenciales

**⚠️ CONSECUENCIA:** Si detecta posibles secrets, **el commit es RECHAZADO**.

**Patrones detectados:**
- `sk-ant-...` (Anthropic API keys)
- `sk-...` (OpenAI API keys)
- `sk_live_...` (Stripe live keys)
- Passwords hardcodeados
- JWTs en código
- Connection strings con passwords

**Mensaje de error:**
```
❌ =============================================
   SECURITY CHECK FAILED
   =============================================

⚠️  CRITICAL: Posibles secrets detectados en archivos staged.

   Por favor, verifica que no estés subiendo:
   - API Keys (OpenAI, Anthropic, Stripe, etc.)
   - Passwords hardcodeados
   - Tokens o secrets
   - Connection strings con credenciales

💡 Tip: Usa variables de entorno (process.env) en lugar de valores hardcodeados.
```

### 🚫 ¿Puedo Saltarme el Hook?

**Técnicamente sí, pero NO DEBES:**

```bash
# ⚠️ NO RECOMENDADO - Solo en casos excepcionales
git commit --no-verify -m "mensaje"
```

**Cuándo está permitido:**
- Cambios de documentación pura (sin código)
- Fixes de emergencia críticos (y debes ejecutar las validaciones manualmente después)
- Cambios en archivos de configuración que no afectan código

**Cuándo NUNCA está permitido:**
- ❌ Código con errores de tipos
- ❌ Código con errores de linting
- ❌ Código con secrets
- ❌ "Solo es un pequeño cambio"
- ❌ "Ya lo arreglaré después"

**⚠️ CONSECUENCIA:** Si usas `--no-verify` y subes código con errores:
- El PR será rechazado
- Tendrás que corregir y hacer un nuevo commit
- Puede bloquear a otros desarrolladores

### 💡 Flujo de Trabajo Recomendado

```bash
# 1. Hacer cambios
git add .

# 2. Intentar commit (el hook se ejecuta automáticamente)
git commit -m "feat: nueva funcionalidad"

# Si el hook pasa → ✅ Commit exitoso
# Si el hook falla → ❌ Commit rechazado con mensaje claro

# 3. Si falla, corregir errores
pnpm typecheck  # Ver errores de tipos
pnpm lint       # Ver errores de linting

# 4. Corregir y volver a intentar
git add .
git commit -m "feat: nueva funcionalidad"
```

### 🎯 Por Qué Es el Estándar de Oro

1. **Prevención Proactiva:** Atrapa errores **antes** de que lleguen al repositorio
2. **Consistencia:** Garantiza que **todos** los commits cumplan los mismos estándares
3. **Automatización:** No depende de que el desarrollador recuerde ejecutar validaciones
4. **Feedback Inmediato:** Sabes inmediatamente si tu código cumple los estándares
5. **Protección del Repositorio:** Mantiene el historial de Git limpio y funcional

### 📊 Estadísticas del Hook

El hook es **extremadamente rápido**:
- TypeCheck: ~5-15 segundos (depende del tamaño del cambio)
- Lint-Staged: ~2-5 segundos (solo archivos modificados)
- Security Check: ~1 segundo

**Total:** ~8-21 segundos por commit (vs. horas de debugging después)

### ✅ Checklist Mental Antes de Commit

Antes de hacer commit, pregúntate:

- [ ] ¿He ejecutado `pnpm typecheck` localmente? (El hook lo hará, pero es bueno verificar antes)
- [ ] ¿He ejecutado `pnpm lint` localmente?
- [ ] ¿Hay algún `console.log` en mi código?
- [ ] ¿Hay algún secret o API key hardcodeada?
- [ ] ¿Mi código sigue las convenciones del proyecto?

Si respondiste "sí" a todas, el hook debería pasar sin problemas.

---

## 🌿 Flujo de Git

### Estructura de Ramas

```
main (producción)
  ↑
develop (desarrollo)
  ↑
feature/xxx (nuevas funcionalidades)
fix/xxx (correcciones de bugs)
docs/xxx (documentación)
refactor/xxx (refactorizaciones)
```

### Reglas de Ramificación

**⚠️ REGLA CRÍTICA:** Todas las ramas deben crearse **SIEMPRE** desde `develop`.

```bash
# ✅ CORRECTO - Crear rama desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nueva-funcionalidad

# ❌ INCORRECTO - Crear rama desde main u otra rama
git checkout main
git checkout -b feature/nueva-funcionalidad  # ❌ NUNCA
```

### Nomenclatura de Ramas

| Tipo        | Formato                    | Ejemplo                          |
| ----------- | -------------------------- | -------------------------------- |
| Feature     | `feature/nombre-descritivo` | `feature/clients-search`         |
| Fix         | `fix/nombre-descritivo`    | `fix/auth-token-expiration`      |
| Docs        | `docs/nombre-descritivo`   | `docs/api-documentation`         |
| Refactor    | `refactor/nombre-descritivo` | `refactor/db-client`          |
| Hotfix      | `hotfix/nombre-descritivo` | `hotfix/critical-security-patch` |

**Nota:** Los hotfixes son la única excepción y pueden crearse desde `main` cuando sea necesario, pero deben mergearse tanto a `main` como a `develop`.

---

## 📝 Convención de Commits

Wallie utiliza **Conventional Commits** para mantener un historial claro y automatizable.

### Formato

```
<tipo>(<ámbito>): <descripción>

[descripción opcional más detallada]

[footer opcional con referencias a issues]
```

### Tipos de Commit

| Tipo       | Descripción                                    | Ejemplo                                    |
| ---------- | ---------------------------------------------- | ------------------------------------------ |
| `feat`     | Nueva funcionalidad                            | `feat(clients): add client search filter`  |
| `fix`      | Corrección de bug                              | `fix(auth): resolve token expiration`      |
| `docs`     | Cambios en documentación                       | `docs: update API documentation`           |
| `style`    | Cambios de formato (no afectan lógica)         | `style: format code with prettier`         |
| `refactor` | Refactorización sin cambio de funcionalidad    | `refactor(db): simplify connection logic`  |
| `test`     | Añadir o modificar tests                       | `test(clients): add unit tests for search` |
| `chore`    | Tareas de mantenimiento                        | `chore: update dependencies`               |
| `perf`     | Mejoras de rendimiento                         | `perf(api): optimize query performance`   |
| `ci`       | Cambios en CI/CD                               | `ci: add GitHub Actions workflow`         |
| `build`    | Cambios en sistema de build                    | `build: update turbo.json config`          |

### Ámbitos (Opcional pero Recomendado)

Los ámbitos ayudan a identificar qué parte del sistema se ve afectada:

- `api` - Cambios en routers tRPC o lógica de API
- `web` - Cambios en la aplicación Next.js
- `db` - Cambios en schemas o migraciones
- `ui` - Cambios en componentes compartidos
- `auth` - Cambios en autenticación
- `workers` - Cambios en background jobs
- `ai` - Cambios en lógica de IA
- `whatsapp` - Cambios en integración WhatsApp
- `email` - Cambios en emails transaccionales

### Ejemplos de Commits Correctos

```bash
# ✅ CORRECTO - Feature con ámbito
git commit -m "feat(clients): add advanced search with filters"

# ✅ CORRECTO - Fix con descripción detallada
git commit -m "fix(auth): resolve token expiration issue

Token expiration was not being handled correctly when
refresh token was invalid. Now properly redirects to
login page with error message."

# ✅ CORRECTO - Docs sin ámbito
git commit -m "docs: update contributing guidelines"

# ✅ CORRECTO - Refactor con ámbito
git commit -m "refactor(db): simplify connection pooling logic"

# ✅ CORRECTO - Test con ámbito
git commit -m "test(api): add integration tests for clients router"

# ❌ INCORRECTO - Sin tipo
git commit -m "add search feature"

# ❌ INCORRECTO - Tipo incorrecto
git commit -m "update: fix bug in auth"

# ❌ INCORRECTO - Mensaje muy vago
git commit -m "fix: bug"

# ❌ INCORRECTO - Sin descripción clara
git commit -m "feat: stuff"
```

### Referencias a Issues

Si tu commit resuelve o está relacionado con un issue, inclúyelo en el footer:

```bash
git commit -m "fix(auth): resolve token expiration

Fixes #123"
```

---

## ✅ Checklist Pre-PR

**ANTES de crear un Pull Request, verifica que TODOS estos puntos estén completados:**

> **💡 NOTA IMPORTANTE:** El pre-commit hook ya ejecuta automáticamente las validaciones 1 y 2 (TypeCheck y Lint-Staged) en cada commit. Este checklist es para verificación adicional antes de crear el PR.

### 1. Verificación de TypeScript

```bash
pnpm typecheck
```

**✅ Debe pasar sin errores**

**Nota:** El pre-commit hook **bloquea automáticamente** commits con errores de tipos. Si todos tus commits pasaron el hook, este paso debería pasar también.

Si hay errores de tipos, corrígelos antes de continuar. No uses `@ts-ignore` o `any` como solución rápida.

### 2. Verificación de Linting

```bash
pnpm lint
```

**✅ Debe pasar sin warnings ni errores**

**Nota:** El pre-commit hook ejecuta `lint-staged` en cada commit, que aplica ESLint y Prettier a archivos modificados. Si todos tus commits pasaron el hook, este paso debería pasar también.

Si hay problemas de formato, ejecuta:

```bash
pnpm lint:fix
```

### 3. Ausencia de console.log en Producción

**⚠️ REGLA CRÍTICA:** No debe haber `console.log`, `console.error`, `console.warn` o `console.debug` en código de producción.

```bash
# Verificar manualmente
grep -r "console\." apps/web/src packages/*/src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test." | grep -v ".spec."

# O usar el script de verificación
pnpm run check:console
```

**✅ No debe encontrar ningún resultado**

Si necesitas logging, usa el sistema de logger estructurado:

```typescript
// ❌ INCORRECTO
console.log('User logged in', userId)

// ✅ CORRECTO
import { logger } from '@wallie/api/lib/logger'
logger.info('User logged in', { userId })
```

### 4. Tests Pasando

```bash
pnpm test
```

**✅ Todos los tests deben pasar**

Si añadiste nueva funcionalidad, asegúrate de incluir tests correspondientes.

### 5. Build Exitoso

```bash
pnpm build
```

**✅ El build debe completarse sin errores**

### Checklist Completo

Antes de crear el PR, marca cada ítem:

- [ ] `pnpm typecheck` pasa sin errores
- [ ] `pnpm lint` pasa sin warnings
- [ ] No hay `console.log` en código de producción
- [ ] `pnpm test` pasa todos los tests
- [ ] `pnpm build` completa exitosamente
- [ ] Commits siguen la convención de Conventional Commits
- [ ] Rama creada desde `develop`
- [ ] Código revisado personalmente antes de subir

---

## 📖 Reglas Obligatorias

### CLAUDE.md es de Cumplimiento Obligatorio

**⚠️ IMPORTANTE:** Todas las directrices documentadas en `CLAUDE.md` son de **cumplimiento obligatorio**.

Esto incluye:

- ✅ **Reglas Inviolables** - No negociables bajo ninguna circunstancia
- ✅ **Stack Tecnológico** - Solo tecnologías aprobadas
- ✅ **Estructura de Archivos** - Ubicaciones correctas para cada tipo de archivo
- ✅ **Convenciones de Código** - Naming, imports, estructura de componentes
- ✅ **Patrones Obligatorios** - tRPC Router Pattern, Schema Drizzle Pattern, etc.
- ✅ **Prohibiciones Absolutas** - No usar `any`, `console.log`, etc.
- ✅ **Seguridad** - Validación, autorización, sanitización
- ✅ **Testing** - Coverage mínimo 80%

### Antes de Escribir Código

1. **Lee CLAUDE.md completo** - Especialmente las secciones relevantes a tu tarea
2. **Consulta el Checkpoint Protocol** - Verifica que tu acción cumple las reglas
3. **Busca ejemplos existentes** - Revisa código similar en el proyecto
4. **Pregunta si no estás seguro** - Mejor preguntar que violar reglas

### Consecuencias de Violar Reglas

- ❌ **PR será rechazado** - Sin excepciones
- ❌ **Código será revertido** - Si ya se mergeó, se revertirá
- ❌ **Pérdida de tiempo** - Tienes que rehacer el trabajo correctamente

---

## 🔄 Proceso de Desarrollo

### 1. Preparación

```bash
# Asegúrate de estar en develop y actualizado
git checkout develop
git pull origin develop

# Verifica que todo funciona
pnpm install
pnpm typecheck
pnpm lint
```

### 2. Crear Rama de Trabajo

```bash
# Crea la rama desde develop
git checkout -b feature/mi-nueva-funcionalidad

# O para un fix
git checkout -b fix/mi-correccion
```

### 3. Desarrollo

- Escribe código siguiendo las convenciones de CLAUDE.md
- Haz commits frecuentes con mensajes descriptivos
- Ejecuta verificaciones localmente antes de push

### 4. Verificación Pre-Push

> **💡 NOTA:** El pre-commit hook ya ejecutó TypeCheck y Lint-Staged automáticamente. Esta verificación es adicional para asegurar que todo el proyecto está en buen estado.

```bash
# Ejecuta el checklist completo
pnpm typecheck  # Verificación global (el hook solo valida cambios staged)
pnpm lint       # Verificación global (el hook solo valida archivos modificados)
pnpm test
pnpm build

# Verifica console.log
grep -r "console\." apps/web/src packages/*/src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test."
```

**⚠️ IMPORTANTE:** Si el pre-commit hook pasó en todos tus commits, estos comandos deberían pasar también. Si fallan, significa que hay errores en otras partes del código que no modificaste, pero que debes corregir antes del PR.

### 5. Push y Pull Request

```bash
# Push de la rama
git push origin feature/mi-nueva-funcionalidad
```

Luego crea el PR en GitHub:

- **Base:** `develop` (nunca `main`)
- **Título:** Sigue la convención de commits (ej: `feat(clients): add search filter`)
- **Descripción:** Incluye contexto, cambios realizados, y referencias a issues si aplica
- **Checklist:** Marca todos los ítems del checklist pre-PR

### 6. Revisión de Código

- Responde a comentarios de revisores
- Haz los cambios solicitados
- Mantén el PR actualizado con `develop` si es necesario:

```bash
git checkout develop
git pull origin develop
git checkout feature/mi-nueva-funcionalidad
git merge develop
# Resuelve conflictos si los hay
git push origin feature/mi-nueva-funcionalidad
```

### 7. Merge

Una vez aprobado:

- El PR será mergeado a `develop`
- `develop` se mergeará a `main` en releases programadas
- Tu rama puede ser eliminada después del merge

---

## 📚 Recursos Adicionales

### Documentación del Proyecto

- **[CLAUDE.md](./CLAUDE.md)** - ⭐ **OBLIGATORIO** - Reglas y estándares del proyecto
- **[SYSTEM.md](./docs/SYSTEM.md)** - Arquitectura completa del sistema
- **[PHASES.md](./docs/PHASES.md)** - Fase actual del proyecto
- **[STACK.md](./docs/STACK.md)** - Stack tecnológico aprobado
- **[STANDARDS.md](./docs/STANDARDS.md)** - Estándares de código detallados

### Enlaces Útiles

- [Conventional Commits](https://www.conventionalcommits.org/) - Especificación oficial
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/) - Modelo de branching
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - Documentación TypeScript

### Comandos Útiles

```bash
# Verificar estado del proyecto
pnpm typecheck    # TypeScript
pnpm lint         # Linting
pnpm test         # Tests
pnpm build        # Build

# Base de datos
pnpm db:generate  # Generar migraciones
pnpm db:push      # Aplicar migraciones
pnpm db:studio    # Abrir Drizzle Studio

# Desarrollo
pnpm dev          # Iniciar desarrollo
pnpm dev --filter @wallie/web  # Solo web app
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo crear una rama desde main?

**No.** Todas las ramas deben crearse desde `develop`. La única excepción son hotfixes críticos que necesitan ir directamente a producción.

### ¿Qué pasa si mi PR tiene errores de tipo?

**El PR será rechazado.** Además, si usaste el pre-commit hook correctamente, **nunca deberías llegar a este punto**, porque el hook bloquea commits con errores de tipos automáticamente.

Si tu PR tiene errores de tipos, significa que:
1. Usaste `--no-verify` (no recomendado)
2. Los errores aparecieron después de tus commits (merge de develop, etc.)

En cualquier caso, debes corregir todos los errores de TypeScript antes de que pueda ser mergeado.

### ¿El pre-commit hook es realmente obligatorio?

**SÍ, absolutamente.** Es el **estándar de oro** del proyecto. No hay excepciones para:
- ❌ TypeCheck fallando
- ❌ Lint fallando
- ❌ Secrets detectados

El único caso donde `--no-verify` está permitido es para cambios de documentación pura (sin código TypeScript/JavaScript).

**Si el hook falla, tu commit será rechazado automáticamente.** No hay forma de saltárselo sin usar `--no-verify`, que está desaconsejado.

### ¿Puedo usar `@ts-ignore` temporalmente?

**No.** Está prohibido usar `@ts-ignore` o `any` como solución. Si hay un problema de tipos, debe resolverse correctamente. El pre-commit hook detectará estos problemas y bloqueará el commit.

### ¿Necesito tests para cada cambio?

Sí, especialmente para:
- Nuevas funcionalidades
- Correcciones de bugs (añade test que reproduzca el bug)
- Cambios en lógica crítica

### ¿Qué hago si encuentro un bug en producción?

1. Crea un hotfix desde `main`
2. Corrige el bug
3. Mergea a `main` y `develop`
4. Crea un PR normal para documentar el cambio

---

## 🆘 ¿Necesitas Ayuda?

Si tienes dudas sobre:

- **Proceso de desarrollo:** Revisa esta guía y CLAUDE.md
- **Arquitectura:** Consulta SYSTEM.md
- **Estándares de código:** Lee STANDARDS.md
- **Stack tecnológico:** Revisa STACK.md

**Recuerda:** Es mejor preguntar antes que violar reglas y tener que rehacer el trabajo.

---

## 🚩 Sistema de Feature Flags

Wallie utiliza un sistema de Feature Flags para controlar el despliegue gradual de nuevas funcionalidades. Esto permite:

- **Rollout gradual:** Activar features para un porcentaje de usuarios
- **A/B Testing:** Probar diferentes versiones de features
- **Beta Features:** Activar features solo para usuarios específicos
- **Rollback rápido:** Desactivar features sin deploy

### Uso en Frontend

```tsx
import { useFeatureFlag } from '@/hooks/use-feature-flag'

function MyComponent() {
  const { enabled, isLoading } = useFeatureFlag('voiceAI')

  if (isLoading) {
    return <Skeleton />
  }

  if (!enabled) {
    return null // O mostrar una versión alternativa
  }

  return <VoiceAISection />
}
```

### Crear un Feature Flag (Admin)

Los feature flags se crean desde el backend usando el router tRPC:

```typescript
// En un router admin o script
await api.featureFlags.create.mutate({
  name: 'voiceAI',
  description: 'Funcionalidad de IA de voz',
  isActive: true,
  rolloutPercentage: 25, // 25% de usuarios
})
```

### Configurar Rollout

El sistema usa un hash determinístico del `userId` para garantizar que el mismo usuario siempre tenga el mismo resultado:

- **0%:** Flag deshabilitado para todos
- **25%:** Flag habilitado para ~25% de usuarios (consistente)
- **100%:** Flag habilitado para todos

### Override por Usuario

Los admins pueden crear overrides específicos para usuarios:

```typescript
await api.featureFlags.setUserOverride.mutate({
  flagName: 'voiceAI',
  userId: 'user-123',
  isActive: true, // Forzar activación para este usuario
})
```

### Ejemplo Completo

```tsx
'use client'

import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { Button } from '@/components/ui/button'

export function VoiceAIFeature() {
  const { enabled, isLoading, source } = useFeatureFlag('voiceAI')

  if (isLoading) {
    return <div>Cargando...</div>
  }

  if (!enabled) {
    return (
      <div className="text-muted-foreground">
        Esta funcionalidad no está disponible para tu cuenta.
      </div>
    )
  }

  return (
    <div>
      <h2>IA de Voz</h2>
      <p>Funcionalidad activa (fuente: {source})</p>
      <Button>Usar IA de Voz</Button>
    </div>
  )
}
```

---

_Última actualización: 31 Dic 2025_
