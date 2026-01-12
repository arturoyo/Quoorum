# 📚 LESSONS_LEARNED.md — Errores y Cómo Evitarlos

> **Versión:** 1.0.0 | **Última actualización:** 04 Dic 2025
> **Propósito:** Documentar errores cometidos y crear reglas para prevenirlos

---

## 🎯 Propósito de Este Documento

Este documento recopila errores reales encontrados en el proyecto Wallie y establece reglas concretas para evitar que se repitan. Cada sección incluye:

1. **El error** - Qué pasó
2. **El impacto** - Por qué es grave
3. **La regla** - Cómo prevenirlo
4. **El checklist** - Verificación práctica

---

## 🔴 ERROR #1: Dependencias Incompatibles Entre Paquetes

### El Error
```
Root package.json:     "zod": "^4.1.13"
apps/web/package.json: "zod": "^3.23.0"
```

Zod 4.x y Zod 3.x son **INCOMPATIBLES**. Los schemas pueden comportarse diferente en frontend vs backend, causando errores de runtime impredecibles.

### El Impacto
- Validaciones que pasan en backend fallan en frontend (o viceversa)
- Errores de tipos en runtime que TypeScript no detecta
- Bugs muy difíciles de reproducir y debuggear

### La Regla

> **REGLA D-1: VERSIONES ÚNICAS EN MONOREPO**
>
> En un monorepo, cada dependencia compartida DEBE tener UNA SOLA versión.
> Las dependencias críticas (zod, react, typescript) NUNCA deben tener
> versiones diferentes entre paquetes.

### Checklist de Prevención

```bash
# ANTES de añadir/actualizar una dependencia:
1. [ ] Buscar si ya existe: grep -r '"dependencia":' */package.json
2. [ ] Si existe, usar EXACTAMENTE la misma versión
3. [ ] Si necesitas actualizar, actualizar en TODOS los package.json
4. [ ] Ejecutar: pnpm install && pnpm typecheck && pnpm test
```

### Comando de Verificación

```bash
# Detectar versiones inconsistentes (añadir a CI)
pnpm ls zod --depth=0 -r 2>/dev/null | grep -E "zod@" | sort | uniq -c | sort -rn
```

---

## 🔴 ERROR #2: Migraciones de Base de Datos Huérfanas

### El Error

```
packages/db/drizzle/
├── 0002_enable_pgvector.sql       ❌ NO en journal
├── 0002_parched_spencer_smythe.sql ✅ En journal
└── 0003_client_level_rag.sql      ❌ NO en journal
```

Archivos SQL manuales que no están registrados en `meta/_journal.json` de Drizzle.

### El Impacto
- Drizzle no sabe qué migraciones aplicar
- Conflictos al hacer `db:push` o `db:generate`
- Estado de DB inconsistente entre entornos
- Posible pérdida de datos o corrupción de esquema

### La Regla

> **REGLA DB-1: SOLO MIGRACIONES VÍA DRIZZLE**
>
> NUNCA crear archivos SQL manualmente en `/drizzle/`.
> SIEMPRE usar `pnpm db:generate` para crear migraciones.
> Si necesitas SQL custom, usa `db.execute()` en código.

### Flujo Correcto

```bash
# ✅ CORRECTO: Modificar schema y generar migración
1. Editar packages/db/src/schema/*.ts
2. pnpm db:generate  # Genera migración automáticamente
3. Revisar el SQL generado
4. pnpm db:push      # Aplicar a DB

# ❌ INCORRECTO: Crear SQL manual
1. Crear 0003_mi_cambio.sql manualmente  # ❌ NO HACER
```

### Checklist de Prevención

```bash
# ANTES de cada commit que toque /db/:
1. [ ] ¿Modifiqué archivos en drizzle/*.sql manualmente? → NO COMMITEAR
2. [ ] ¿El nuevo archivo está en meta/_journal.json? → Si no, regenerar
3. [ ] Ejecutar: ls drizzle/*.sql | wc -l == $(jq '.entries | length' drizzle/meta/_journal.json)
```

---

## 🟠 ERROR #3: Código Placeholder en Producción

### El Error

```typescript
// packages/agents/src/agents/calendar.ts
async queryEvents(query, context) {
  // TODO: Replace with actual DB query when integrated
  await Promise.resolve()
  return { events: [], totalEvents: 0 }  // ❌ Siempre vacío
}
```

Agentes y funciones que retornan datos vacíos/mock en lugar de implementación real.

### El Impacto
- Features que parecen funcionar pero no hacen nada
- Usuarios frustrados por funcionalidad "rota"
- Difícil detectar qué está implementado vs placeholder

### La Regla

> **REGLA P-1: NO PLACEHOLDERS EN MAIN**
>
> Código con `// TODO` que afecta funcionalidad NO debe mergearse a main.
> Alternativas:
> - Implementar la feature completa
> - Lanzar error explícito: `throw new Error('Not implemented')`
> - Deshabilitar la feature en UI

### Alternativas Aceptables

```typescript
// ✅ OPCIÓN 1: Error explícito
async queryEvents() {
  throw new TRPCError({
    code: 'NOT_IMPLEMENTED',
    message: 'Calendar integration coming soon'
  })
}

// ✅ OPCIÓN 2: Feature flag
if (!featureFlags.calendarEnabled) {
  return { events: [], message: 'Feature coming soon' }
}

// ❌ INCORRECTO: Silenciosamente retornar vacío
return { events: [] }  // Usuario no sabe que está roto
```

### Checklist de Prevención

```bash
# ANTES de merge a main:
1. [ ] grep -r "TODO.*Replace" packages/ → Debe estar vacío
2. [ ] grep -r "TODO.*when integrated" packages/ → Debe estar vacío
3. [ ] Cada función retorna datos reales O lanza error explícito
```

---

## 🟠 ERROR #4: Tests Solo de Validación, No de Lógica

### El Error

```typescript
// Todos los tests son así:
describe('gamification validation', () => {
  it('should accept valid points', () => {
    const result = schema.safeParse({ points: 5 })
    expect(result.success).toBe(true)
  })
})
// Pero NINGÚN test verifica la lógica de negocio real
```

### El Impacto
- Tests pasan pero el código puede estar roto
- Refactors rompen funcionalidad sin que los tests lo detecten
- Falsa sensación de seguridad

### La Regla

> **REGLA T-1: TESTS DE COMPORTAMIENTO, NO SOLO VALIDACIÓN**
>
> Por cada router/servicio, DEBE haber tests que:
> - Verifiquen que la DB se modifica correctamente
> - Verifiquen los edge cases de la lógica de negocio
> - Usen mocks solo para servicios externos, NO para la DB

### Estructura de Tests Requerida

```typescript
// ✅ CORRECTO: Test de comportamiento
describe('gamification.addPoints', () => {
  it('increases user total points', async () => {
    // Arrange: crear usuario con 0 puntos
    const user = await createTestUser({ points: 0 })

    // Act: llamar al endpoint
    await caller.gamification.addPoints({
      userId: user.id,
      points: 10
    })

    // Assert: verificar que la DB cambió
    const updated = await db.query.users.findFirst({
      where: eq(users.id, user.id)
    })
    expect(updated.totalPoints).toBe(10)
  })
})
```

---

## 🟡 ERROR #5: Archivos SQL/Config No Versionados Correctamente

### El Error

Crear migraciones o configs que dependen del estado local sin verificar consistencia:

```sql
-- 0003_client_level_rag.sql
ALTER TABLE embeddings ADD COLUMN client_id UUID;
-- Pero ¿qué pasa si embeddings no existe aún en ese entorno?
```

### La Regla

> **REGLA V-1: MIGRACIONES IDEMPOTENTES**
>
> Toda migración SQL DEBE ser idempotente (segura de re-ejecutar):
> - Usar `IF NOT EXISTS` para CREATE
> - Usar `IF EXISTS` para DROP
> - Verificar estado previo antes de ALTER

### Ejemplo Correcto

```sql
-- ✅ CORRECTO: Idempotente
ALTER TABLE embeddings
ADD COLUMN IF NOT EXISTS client_id UUID;

CREATE INDEX IF NOT EXISTS idx_embeddings_client
ON embeddings(client_id);

-- ❌ INCORRECTO: Falla si ya existe
ALTER TABLE embeddings ADD COLUMN client_id UUID;
```

---

## 📋 Checklist Maestro Pre-Commit

Antes de cada commit, verificar:

### Dependencias
- [ ] `grep -r '"zod":' */package.json | cut -d: -f3 | sort | uniq | wc -l` = 1
- [ ] Las versiones de deps compartidas son idénticas en todos los paquetes

### Migraciones
- [ ] No hay archivos SQL en `/drizzle/` que no estén en `_journal.json`
- [ ] Todas las migraciones fueron generadas con `pnpm db:generate`

### Código
- [ ] `grep -r "TODO.*Replace\|TODO.*when integrated" packages/` está vacío
- [ ] Funciones placeholder lanzan error explícito o están deshabilitadas

### Tests
- [ ] Cada router nuevo tiene tests de validación Y de comportamiento
- [ ] `pnpm test` pasa sin errores

---

## 🔄 Proceso de Actualización

Este documento DEBE actualizarse cuando:

1. Se encuentre un nuevo tipo de error recurrente
2. Se mejore una regla existente
3. Se añada una herramienta de prevención

**Formato de actualización:**
```markdown
## 🔴 ERROR #N: [Título descriptivo]

### El Error
[Descripción con código de ejemplo]

### El Impacto
[Por qué es grave]

### La Regla
[Cómo prevenirlo]

### Checklist de Prevención
[Pasos concretos]
```

---

## 📚 Referencias

- [CLAUDE.md](../../CLAUDE.md) - Reglas generales del proyecto
- [STANDARDS.md](./STANDARDS.md) - Estándares de código
- [GITFLOW.md](./GITFLOW.md) - Flujo de trabajo Git

---

_Última actualización: 04 Dic 2025_
