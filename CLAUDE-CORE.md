# 🤖 CLAUDE-CORE.md — Reglas Esenciales

> **Versión:** 1.1.0 | **Fecha:** 29 Ene 2026
> **Propósito:** Guía rápida con las 10 reglas más críticas
> **Tiempo de lectura:** 3-5 minutos
> **Documentación completa:** Ver [CLAUDE.md](./CLAUDE.md) o módulos en [docs/claude/](./docs/claude/)

---

## 🐧 CONFIGURACIÓN ACTUAL DEL PROYECTO

**✅ ENTORNO DE DESARROLLO: WSL2 Ubuntu (NO Windows)**

### Estado Actual (29 Ene 2026)
```bash
# Servidor corriendo desde WSL2
- Sistema: Ubuntu en WSL2
- Node.js: 20.20.0 (instalado vía NVM)
- npm: 10.8.2
- pnpm: 9.15.0
- Ubicación proyecto: /mnt/c/Quoorum
```

### Comandos para Desarrollar
```bash
# 1. Abrir terminal WSL2 en VS Code
# 2. Navegar al proyecto
cd /mnt/c/Quoorum/apps/web

# 3. Iniciar servidor (sin predev de PowerShell)
pnpm dev:no-fix

# 4. Servidor escucha en:
#    - Local WSL2: http://localhost:3000
#    - Desde Windows directa: http://172.23.174.216:3000
#      (IP puede cambiar, verificar con: wsl hostname -I)
```

### 🔧 Port Forwarding para OAuth (REQUERIDO)

**Problema:** OAuth de Google solo funciona con `localhost`, no con IP de WSL2.

**Solución:** Configurar port forwarding de Windows → WSL2

**1. Abrir PowerShell COMO ADMINISTRADOR**

**2. Obtener IP actual de WSL2:**
```powershell
wsl hostname -I
# Output: 172.23.174.216 (ejemplo)
```

**3. Configurar port forwarding:**
```powershell
# Reemplaza 172.23.174.216 con la IP de tu WSL2
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=127.0.0.1 connectport=3000 connectaddress=172.23.174.216
```

**4. Verificar configuración:**
```powershell
netsh interface portproxy show all
```

**5. Acceder desde Windows:** http://localhost:3000 ✅

**Para eliminar port forwarding (si es necesario):**
```powershell
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=127.0.0.1
```

**⚠️ NOTA:** Si reinicias WSL2, la IP puede cambiar. Verifica con `wsl hostname -I` y reconfigura el port forwarding si es necesario.

### ⚠️ Configuraciones Críticas

**apps/web/package.json:**
```json
"dev:no-fix": "next dev -p 3000 --hostname 0.0.0.0"
```
- `--hostname 0.0.0.0` permite acceso desde Windows a WSL2

**NO usar en WSL2:**
- `pnpm dev` (requiere PowerShell)
- Scripts con `pwsh` (no disponible en Linux)

### 👤 Usuario de Prueba en PostgreSQL Local

**Creado en Docker (quoorum-postgres):**
- Email: `admin@test.com`
- Role: `admin`
- Autenticación: OAuth Google (no tiene password)

### Ventajas de WSL2 vs Windows
✅ No más errores UTF-8 (encoding nativo)
✅ No más cache corrupto frecuente
✅ Builds 2-3x más rápidos (I/O nativo)
✅ File watching nativo de Linux
✅ Mismo entorno que producción (Vercel usa Linux)

---

## 🚨 ANTES DE EMPEZAR

**Lee estos archivos EN ORDEN (15 min total):**

1. **ERRORES-COMETIDOS.md** (10 min) ← ⚠️ CRÍTICO: NO repetir errores
2. **CLAUDE-CORE.md** (este archivo - 5 min)
3. Consulta módulos específicos según tu tarea

---

## ⚡ TOP 11 REGLAS CRÍTICAS

### -1. 🎯 SÉ PROACTIVO: IDENTIFICA PATRONES, SUGIERE SOLUCIONES ROOT

**⚠️ REGLA META: Si algo falla 2-3 veces, NO apliques el mismo parche de nuevo**

**"Patrón de 3 strikes":**
```
Problema ocurre 1 vez → Aplico solución documentada
Problema ocurre 2 vez → Menciono: "Esto pasó antes en [contexto], ¿es patrón?"
Problema ocurre 3 vez → STOP: "Esto es estructural, sugiero [solución raíz]"
```

**Antes de aplicar un parche, pregúntate:**
1. ¿Estoy curando o parchando?
2. ¿Hay una solución que elimine este problema para siempre?
3. ¿El usuario está perdiendo tiempo por algo con mejor solución?

**Ejemplos reales:**

| Problema repetitivo | ❌ Parche (malo) | ✅ Solución raíz (sugerir) |
|---------------------|------------------|---------------------------|
| Cache corrupto 3+ veces | "limpia .next cada vez" | "Usa WSL2, file watching mejor" |
| Errores UTF-8 scripts | "reemplaza emojis" | "Usa WSL2, UTF-8 nativo" |
| PowerShell falla | "arregla encoding" | "Usa bash en WSL2" |
| Build lento | "espera" | "WSL2 es 2-3x más rápido" |
| Import errors 5+ veces | "arregla imports" | "Hay problema en structure?" |

**Tu trabajo NO es solo ejecutar, es MEJORAR el sistema.**

**Si el usuario tiene que preguntarte "¿por qué pasa esto 1000 veces?", ya fallaste.**

---

### 0. 🚫 EMOJIS EN CÓDIGO - PROHIBIDO ABSOLUTAMENTE (BAJO PENA DE MUERTE)

**⚠️ ESTA ES LA REGLA MÁS CRÍTICA - BLOQUEA COMPLETAMENTE EL DESARROLLO**

```typescript
// ❌ PROHIBIDO ABSOLUTAMENTE - Causa error UTF-8 en Windows
console.log('✅ Success')
console.error('❌ Error')
Write-Host "🔧 Fixing..."
logger.info('🎯 Target')

// ✅ SIEMPRE usar etiquetas de texto
console.log('[OK] Success')
console.error('[ERROR] Error')
Write-Host "[INFO] Fixing..."
logger.info('[INFO] Target')
```

**Causa:** Error `Windows stdio in console mode does not support writing non-UTF-8 byte sequences`
**Impacto:** El servidor NO inicia, desarrollo completamente bloqueado
**Frecuencia:** Ha ocurrido múltiples veces, causando pérdida de horas de trabajo

**El auto-fix detectará y reemplazará automáticamente, pero es mejor prevenir.**

**📖 Ver detalles:** [ERRORES-COMETIDOS.md - Error #5](./ERRORES-COMETIDOS.md#error-5-emojis-en-consolelog-causan-error-utf-8-en-windows)

---

### 1. 🔧 HERRAMIENTAS DEDICADAS > BASH

```bash
❌ PROHIBIDO en bash:
   grep, sed, awk, cat, head, tail, find, echo

✅ USA HERRAMIENTAS:
   Grep, Edit, Read, Glob (+ texto directo en respuesta)

✅ PERMITIDO en bash:
   git, npm, pnpm, docker, mv, rm, mkdir, ls, cd
```

**Consecuencia:** Commit rechazado + código revertido

---

### 2. 📋 CHECKPOINT PROTOCOL

**ANTES de cada acción, consulta la tabla:**

| Acción | Consultar | Verificar |
|--------|-----------|-----------|
| **Modificar UI** | Regla #13 (UX/Design) | ¿Paleta oficial? ¿Variables CSS? |
| **Crear tRPC router** | Patrón tRPC | Validación Zod + userId filter |
| **Query a DB** | Regla #5 (Seguridad) | ¿Filtra por userId? |
| **Crear archivo .tsx** | INDEX.md | ¿Ya existe? ¿Duplicado? |
| **React component** | React Hooks Rules | Hooks ANTES de early returns |

**📖 Ver tabla completa:** [docs/claude/02-checkpoint-protocol.md](./docs/claude/02-checkpoint-protocol.md)

---

### 3. 🗄️ BASE DE DATOS: PostgreSQL Local ÚNICAMENTE

```typescript
// ❌ NUNCA
const { data } = await ctx.supabase.from('clients').select('*')

// ✅ SIEMPRE
const data = await db.select().from(clients)
```

**Regla:** Supabase = Solo Auth | PostgreSQL local = Todos los datos

**Error común:** `violates foreign key constraint` → Perfil NO existe en PostgreSQL local

**Solución:** Ver [docs/claude/03-database.md](./docs/claude/03-database.md)

---

### 4. 🔐 SEGURIDAD: userId EN TODAS LAS QUERIES

```typescript
// ❌ INSEGURO
await db.select().from(clients).where(eq(clients.id, id))

// ✅ SEGURO
await db.select().from(clients).where(
  and(
    eq(clients.id, id),
    eq(clients.userId, ctx.userId) // ← OBLIGATORIO
  )
)
```

---

### 5. ⚛️ REACT HOOKS: SIEMPRE ANTES DE EARLY RETURNS

```typescript
// ❌ ROMPE LA APP
function Component() {
  const params = useParams()
  if (!params.id) return <Error /> // ❌ Early return ANTES de hooks

  const { data } = api.users.get.useQuery() // ❌ Hook condicional
}

// ✅ CORRECTO
function Component() {
  const params = useParams()
  const { data } = api.users.get.useQuery(undefined, {
    enabled: !!params?.id, // ✅ Condicionar con `enabled`
  })

  if (!params?.id) return <Error /> // ✅ Early return DESPUÉS de hooks
}
```

---

### 6. 🎨 UX: VARIABLES CSS, NO COLORES HARDCODEADOS

```typescript
// ❌ FALLA en light mode
<div className="bg-white/5 text-white border-white/10">

// ✅ Funciona en light Y dark mode
<div className="bg-[var(--theme-landing-card)] text-[var(--theme-text-primary)] border-[var(--theme-landing-border)]">
```

**Regla:** Si el color cambia entre light/dark, usa variables CSS

**Variables:** Ver [docs/claude/08-design-system.md](./docs/claude/08-design-system.md)

---

### 7. 🚫 PROHIBICIONES ABSOLUTAS

| ❌ NUNCA | ✅ USA |
|---------|--------|
| **🚫 EMOJIS en código** | **Etiquetas de texto: `[OK]`, `[ERROR]`, `[WARN]`, `[INFO]`** |
| `any` | Tipo explícito o `unknown` + type guard |
| `console.log` en prod | Logger estructurado |
| `@ts-ignore` | Arreglar el tipo correctamente |
| Queries sin `userId` | SIEMPRE filtrar por `userId` |
| Hardcodear provider/modelo IA | Config centralizada (`config/agent-config.ts`) |
| Colores hardcodeados UI | Variables CSS de tema |

**Lista completa:** [docs/claude/06-prohibitions.md](./docs/claude/06-prohibitions.md)

---

### 8. 📝 CONVENCIONES DE NAMING

```typescript
// Componentes: PascalCase
export function ClientCard() {}

// Hooks: camelCase + prefijo "use"
export function useClientData() {}

// Constantes: SCREAMING_SNAKE_CASE
export const MAX_RETRY_COUNT = 3

// Archivos: kebab-case
// client-card.tsx ✅
// ClientCard.tsx ❌
```

---

### 9. 🔄 ORDEN DE DESARROLLO: BACKEND FIRST

```
✅ CORRECTO (Orden):
1. Schema/tipos
2. Migraciones DB
3. Router tRPC + Tests
4. Componente UI + Tests

❌ INCORRECTO:
1. UI con mock data
2. "Backend después"
```

---

### 10. ✅ CHECKLIST PRE-COMMIT

```bash
# Ejecutar SIEMPRE antes de commit:
pnpm typecheck  # TypeScript sin errores
pnpm lint       # ESLint sin warnings
pnpm test       # Tests pasan

# Verificar manualmente:
- [ ] No hay console.log en producción
- [ ] No hay `any` en tipos
- [ ] Queries filtran por userId
- [ ] Input validado con Zod
```

---

## 📚 DOCUMENTACIÓN COMPLETA

### Para tareas específicas, consulta:

| Tarea | Módulo |
|-------|--------|
| **Reglas completas** | [docs/claude/04-rules.md](./docs/claude/04-rules.md) |
| **Patrones tRPC/Drizzle** | [docs/claude/05-patterns.md](./docs/claude/05-patterns.md) |
| **Stack tecnológico** | [docs/claude/07-stack.md](./docs/claude/07-stack.md) |
| **Testing** | [docs/claude/09-testing.md](./docs/claude/09-testing.md) |
| **Seguridad** | [docs/claude/10-security.md](./docs/claude/10-security.md) |
| **FAQ + Comandos** | [docs/claude/11-faq.md](./docs/claude/11-faq.md) |

### Referencia completa (56K tokens):

- **CLAUDE.md** - Documentación completa y detallada
- **Buscar keyword:** Usa herramienta Grep sobre CLAUDE.md

---

## 🎯 FLUJO DE TRABAJO RECOMENDADO

```
1. Leo CLAUDE-CORE.md (5 min) ✅ Ahora
   ↓
2. Identifico mi tarea
   ↓
3. Consulto módulo específico (3-5 min)
   ↓
4. Verifico checkpoint protocol
   ↓
5. Implemento siguiendo el patrón
   ↓
6. Pre-commit checklist
   ↓
7. Commit
```

---

## ⚡ RECURSOS RÁPIDOS

**Scripts útiles:**
```bash
pnpm preflight        # Pre-flight checks (2 min)
pnpm typecheck        # TypeScript check
pnpm lint             # Linter
pnpm test             # Tests unitarios
pnpm test:e2e         # Tests E2E
pnpm db:studio        # Drizzle Studio
```

**Git restore desde producción:**
```bash
git checkout main -- archivo.tsx
```

**Limpiar cache Next.js:**
```bash
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache
```

---

## 🐧 PARA DEVELOPERS EN WINDOWS: USA WSL2

**⚠️ IMPORTANTE:** Si estás en Windows, te ahorrarás HORAS de frustración usando WSL2 en lugar de Windows nativo.

### Por qué WSL2 > Windows nativo

| Aspecto | Windows nativo | WSL2 (Ubuntu) |
|---------|----------------|---------------|
| **Emojis en código** | 🔴 Crash UTF-8 | ✅ Sin problemas |
| **Cache Next.js** | 🔴 Corrupto frecuente | ✅ Raros |
| **Build speed** | 🟡 Medio | ✅ 2-3x más rápido |
| **Scripts bash** | 🔴 Necesita adaptar | ✅ Funcionan nativos |
| **Mismo que producción** | ❌ No | ✅ Sí (Linux) |

### Setup WSL2 (15 minutos)

```powershell
# 1. Instalar WSL2
wsl --install

# 2. Reiniciar PC

# 3. Abrir Ubuntu
wsl -d Ubuntu

# 4. Instalar Node.js 20
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
npm install -g pnpm

# 5. Ir a tu proyecto
cd /mnt/c/Quoorum
pnpm install
pnpm dev
```

**Guía completa:** [docs/claude/11-faq.md#wsl2-setup](./docs/claude/11-faq.md)

### Ventajas inmediatas

- ✅ **No más errores UTF-8** - Puedes usar emojis en logs
- ✅ **Menos cache corruption** - File watching mejor
- ✅ **Builds más rápidos** - I/O nativo de Linux
- ✅ **Mismo entorno que producción** - Vercel usa Linux

**Regla de oro:** Si desarrollas en Windows + Node.js/React, usa WSL2. Es lo que usa el 90% de la industria.

---

## 💡 CUANDO TIENES DUDAS

1. ✅ **Busca en CLAUDE.md:** Usa Grep con keyword
2. ✅ **Consulta ejemplos:** Busca código similar en el proyecto
3. ✅ **Pregunta ANTES:** No asumas, verifica primero
4. ❌ **NO inventes:** No crees estructuras nuevas sin aprobar

---

_Este archivo resume las reglas esenciales. Para detalles completos, ver [CLAUDE.md](./CLAUDE.md)_
