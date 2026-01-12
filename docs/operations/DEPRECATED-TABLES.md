# 🗑️ Tablas y Features Deprecadas

> **Última actualización:** 26 Dic 2024
> **Motivo:** Operación Limpieza Total - FASE 1

---

## 📋 Resumen Ejecutivo

Durante la auditoría de "Cascarones Vacíos", se identificaron 3 tablas con infraestructura completa pero **0 filas en producción** y **0 uso en frontend**.

**Decisión del CTO:** Marcar como DEPRECATED y fusionar funcionalidad en `wallie_annotations`.

---

## 🚫 Tablas Deprecadas

### 1. `reciprocity_ledger`

**Estado:** ❌ DEPRECATED (26 Dic 2024)

**Propósito Original:**

- Tracking de "favores" dados/recibidos basado en principio de Cialdini
- Ejemplos: free_consultation, exclusive_content, special_discount

**Por qué se depreca:**

- ✅ Router backend existe (`packages/api/src/routers/reciprocity.ts`)
- ❌ Frontend NO lo usa (0 llamadas a `api.reciprocity.*`)
- ❌ Worker NO pobla la tabla (0 filas en producción)
- ✅ `wallie_annotations` ya cumple este rol con campo `psychologyPrinciple`

**Migración:**
En lugar de `reciprocityLedger.insert({ eventType: 'free_consultation', valuePoints: 5 })`, usar:

```typescript
wallieAnnotations.insert({
  annotationType: 'psychology_tip',
  title: 'Reciprocidad Activada',
  content: 'Cliente recibió consulta gratuita valorada en 5 puntos',
  psychologyPrinciple: 'Cialdini: Reciprocidad - free_consultation',
  priority: 'medium',
})
```

---

### 2. `reciprocity_balance`

**Estado:** ❌ DEPRECATED (26 Dic 2024)

**Propósito Original:**

- Acumulador de balance neto de reciprocidad por cliente
- Cálculo: Σ(valuePoints \* direction)

**Por qué se depreca:**

- Mismo motivo que `reciprocity_ledger`
- No hay workers que calculen el balance automáticamente
- La complejidad no justifica el valor (ventas de Alto Ticket son cualitativas, no contables)

**Migración:**
El concepto de "momentum" y "riskLevel" en `conversation_psychology` ya captura la dinámica relacional sin necesidad de contabilidad de favores.

---

### 3. `psychology_suggestion_log`

**Estado:** ❌ DEPRECATED (26 Dic 2024)

**Propósito Original:**

- Log histórico de sugerencias psicológicas mostradas al vendedor
- Tracking de aceptación/rechazo

**Por qué se depreca:**

- ❌ NO hay worker que popule esta tabla
- ✅ `wallie_annotations` ya registra las sugerencias con campos:
  - `isActionable: boolean`
  - `wasHelpful: boolean | null` (tracking de feedback)
  - `createdAt` (historial)

**Migración:**
Ya está migrado - todas las anotaciones psicológicas van a `wallie_annotations` desde FASE 1.

---

## 📊 Estadísticas de Uso

| Tabla                       | Router Backend | Frontend Calls | Worker Activo | Filas en Prod | Veredicto     |
| --------------------------- | -------------- | -------------- | ------------- | ------------- | ------------- |
| `reciprocity_ledger`        | ✅ Existe      | ❌ 0           | ❌ No         | 0             | 🗑️ DEPRECATED |
| `reciprocity_balance`       | ✅ Existe      | ❌ 0           | ❌ No         | 0             | 🗑️ DEPRECATED |
| `psychology_suggestion_log` | ❌ No          | ❌ 0           | ❌ No         | 0             | 🗑️ DEPRECATED |

---

## 🛠️ Plan de Eliminación

### Fase 1: DEPRECATED (Actual) ✅

- [x] Documentar tablas como deprecated
- [x] Verificar que no hay uso en frontend
- [x] Confirmar 0 filas en producción

### Fase 2: Código Comentado (Próximo Sprint)

- [ ] Comentar exports en `packages/db/src/schema/psychology.ts`
- [ ] Comentar router en `packages/api/src/root.ts`
- [ ] Añadir warnings en TSDoc

### Fase 3: Eliminación Física (Cuando no hay dependencias)

- [ ] Drop tables en Supabase
- [ ] Eliminar schemas de Drizzle
- [ ] Eliminar routers
- [ ] Eliminar tests

---

## 💡 Lecciones Aprendidas

### "Regla de Oro" Violada

Estas tablas violaron la **Regla #11 de CLAUDE.md**:

> "No se crea una tabla en Supabase si no viene acompañada del Worker que la alimenta con datos reales."

### Cómo Evitarlo en el Futuro

1. ✅ **Antes de crear tabla**: Implementar worker primero
2. ✅ **Antes de deploy**: Verificar que worker escribe datos
3. ✅ **Después de 1 semana**: Verificar filas > 0 en producción
4. ❌ **Si 0 filas después de 2 semanas**: DEPRECATED automático

---

## 🔗 Referencias

- **Audit Original:** `docs/operations/AUDIT-CASCARONES.md` (si existe)
- **Regla Violada:** `CLAUDE.md` - Regla #11
- **Worker Consolidado:** `packages/workers/src/functions/emotion-analysis.ts`
- **Tabla de Reemplazo:** `packages/db/src/schema/psychology.ts` → `wallieAnnotations`

---

_Documentado por: Claude Code (Operación Limpieza Total)_
_Aprobado por: CTO (Decision: Opción C - Fusión en wallie_annotations)_
