# 🔴 Reglas Inviolables

> **Estas reglas son NO NEGOCIABLES. Cualquier violación será RECHAZADA.**

---

## 0. 🎯 OPCIONES: Evaluar y elegir la mejor

Cuando el usuario pida una feature, fix o cambio:

1. **Enumerar** las opciones viables (2–5 alternativas)
2. **Analizar** pros/contras de cada una
3. **Elegir** la mejor y **implementarla**

```
✅ CORRECTO: "Hay 3 opciones: A, B, C. Recomiendo B porque... La implemento."
❌ INCORRECTO: Implementar la primera idea sin considerar alternativas.
```

---

## 1. 📖 SIEMPRE LEER DOCUMENTACIÓN PRIMERO

```
✅ CORRECTO:
1. Leer CLAUDE.md → SYSTEM.md → PHASES.md
2. Entender la arquitectura actual
3. Verificar en qué fase estamos
4. LUEGO escribir código

❌ INCORRECTO:
- Empezar a codear directamente
- Asumir la arquitectura
- Inventar estructuras nuevas
```

---

## 2. 🚫 ZERO TOLERANCE: Datos Mock en Producción

```typescript
// ✅ CORRECTO: API real con error handling
const { data, error, isLoading } = api.clients.list.useQuery()
if (error) return <ErrorState message={error.message} />
if (isLoading) return <Skeleton />
return <ClientList data={data} />

// ❌ INCORRECTO: Fallback a mock data
const { data } = api.clients.list.useQuery()
const finalData = data || MOCK_CLIENTS // ❌ NUNCA
```

**Por qué:** La integridad del producto depende de datos reales.

---

## 3. 🏗️ ARQUITECTURA: Respetar Separación de Concerns

```
✅ CORRECTO:
- Componentes de UI → /components/
- Lógica de negocio → /services/ o /lib/
- Acceso a datos → /api/ o routers tRPC
- Tipos → /types/ o colocados con su módulo

❌ INCORRECTO:
- Lógica de negocio en componentes
- Queries SQL en componentes
- Fetch directo en UI
- Mezclar capas
```

---

## 4. 📝 TYPESCRIPT: Tipado Estricto Obligatorio

```typescript
// ✅ CORRECTO
function getClient(id: string): Promise<Client | null> {
  return db.query.clients.findFirst({ where: eq(clients.id, id) })
}

// ❌ INCORRECTO
function getClient(id: any): any {
  return db.query.clients.findFirst({ where: eq(clients.id, id) })
}
```

---

## 5. 🔐 SEGURIDAD: Validar Todo, Confiar en Nada

```typescript
// ✅ CORRECTO: Validación + autorización
const schema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1).max(100),
})

const [client] = await db
  .select()
  .from(clients)
  .where(
    and(
      eq(clients.id, input.clientId),
      eq(clients.userId, ctx.userId) // ⚠️ OBLIGATORIO
    )
  )

// ❌ INCORRECTO: Sin validación ni autorización
const client = await db.select().from(clients).where(eq(clients.id, id))
```

---

## 6. 🧪 TESTING: No Commit Sin Tests

```
✅ CORRECTO:
- Función nueva → Test nuevo
- Bug fix → Test que reproduce el bug
- Coverage mínimo: 80%

❌ INCORRECTO:
- Commit sin tests
- Tests que no verifican nada
- Coverage < 80%
```

---

## 7. 🔄 ORDEN DE DESARROLLO: Backend First

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

## 8. 📦 COMMITS: Atómicos y Descriptivos

```bash
# ✅ CORRECTO
git commit -m "feat(clients): add create client endpoint with validation"
git commit -m "fix(auth): resolve token expiration issue"

# ❌ INCORRECTO
git commit -m "fix"
git commit -m "wip"
git commit -m "changes"
```

---

## 9. 🎨 LANDING PAGE: Componentes Oficiales ÚNICOS

```
⚠️ LA LANDING TIENE UNA VERSIÓN ESTABLE OFICIAL
Commit: 786d2d2 (16 Dic 2024, 23:11)

✅ COMPONENTES OFICIALES (en orden):
1. FomoBanner
2. MarketingHeader
3. Hero
4. TrustBar
5. ProblemSection
6. SolutionSection
7. CopilotSection
8. SafeZoneSection
9. TestimonialsSection
10. PricingSection
11. FAQ
12. FinalCTA
13. MarketingFooter

❌ NUNCA usar componentes de _archived/
```

---

## 10. 📊 DASHBOARD: Estructura Oficial ÚNICA

```
⚠️ EL DASHBOARD TIENE UNA ÚNICA VERSIÓN OFICIAL
Archivo: apps/web/src/app/dashboard/page.tsx

✅ ESTRUCTURA:
- Header: Título + Fecha
- Quick Stats (4 cards)
- AI Suggested Reminders
- Main Grid:
  - Actividad Reciente (2 cols)
  - PointsWidget + Acciones + AI Efficiency (1 col)

❌ NO crear versiones duplicadas
```

---

## 11. 🏗️ NO TABLAS SIN WORKERS

```
⚠️ REGLA DE INTEGRIDAD DE DATOS

"No se crea una tabla en PostgreSQL si no viene acompañada
del Worker que la alimenta con datos reales."

✅ PROCESO:
1. Diseñar tabla en schema Drizzle
2. Crear worker que inserta/actualiza datos
3. Registrar worker en packages/workers/src/index.ts
4. Verificar que el worker se ejecuta en producción
5. SOLO ENTONCES hacer push del schema

❌ PROHIBIDO:
- Tablas vacías "para el futuro"
- Workers con valores hardcodeados
- Workers con regex en lugar de IA
```

---

## 12. 📊 TIMELINE: Registro de Todas las Acciones

```
⚠️ REGLA DE TRAZABILIDAD

"Toda acción debe quedar registrada en TIMELINE.md con timestamp,
archivos afectados y resultado."

✅ FORMATO:
### [HH:MM] - TÍTULO
**Solicitado por:** Usuario/Sistema
**Descripción:** Breve descripción
**Acciones realizadas:**
- Acción 1
**Archivos afectados:**
- /ruta/archivo.tsx
**Resultado:** ✅/❌/⚠️
**Notas:** Observaciones

❌ PROHIBIDO:
- Cambios sin documentar
- Documentar solo al final (debe ser en tiempo real)
```

---

## 13. 🎨 UX/DESIGN: Paleta de Colores Oficial

```
⚠️ REGLA CRÍTICA DE CONSISTENCIA VISUAL

"SIEMPRE usar variables CSS de tema.
NUNCA hardcodear colores (text-white, bg-white/5, etc.)"

// ❌ MAL - Colores hardcodeados
<div className="bg-white/5 border-white/10 text-white">

// ✅ BIEN - Variables CSS
<div className="bg-[var(--theme-landing-card)] border-[var(--theme-landing-border)] text-[var(--theme-text-primary)]">
```

**Ver detalles completos:** [08-design-system.md](./08-design-system.md)

---

## 23. 🔄 ENUMS Y TYPES: Inferir desde DB

```
⚠️ REGLA DE SINGLE SOURCE OF TRUTH

"NUNCA definir manualmente enums/types que ya existen en el schema de DB."

✅ CORRECTO:
```typescript
import type { debateStatusEnum } from '@quoorum/db/schema'
export type DebateStatus = (typeof debateStatusEnum.enumValues)[number]
```

❌ INCORRECTO:
```typescript
export type DebateStatus = 'draft' | 'pending' | 'in_progress'
// ← Hardcoded, se desincroniza con DB
```

**Por qué:** Evita desincronización entre frontend y backend.

**Consecuencias de hardcodear:**
- ❌ Frontend no reconoce valores nuevos del enum
- ❌ TypeScript no detecta el problema
- ❌ Errores en runtime al renderizar
- ❌ Pérdida de tiempo corrigiendo en 2 lugares

**Ver:**
- [AUDITORIA-CAPAS-MULTIPLES.md](../../AUDITORIA-CAPAS-MULTIPLES.md) - Auditoría completa
- [ERRORES-COMETIDOS.md#error-6](../../ERRORES-COMETIDOS.md#error-6) - Historia del error
- [05-patterns.md#type-inference](./05-patterns.md#type-inference) - Patrón completo
```

---

## 📖 Ver Todas las Reglas

Las 23 reglas completas con ejemplos detallados están en:
- **[CLAUDE.md](../../CLAUDE.md#reglas-inviolables)** - Documentación completa

---

_Ver [INDEX.md](./INDEX.md) para más módulos de documentación_
