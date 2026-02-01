# 🚀 Market Simulator - Deployment Guide

## ✅ Implementación Completada

### Commits Realizados:
1. `f0a3c12` - Backend implementation (825 líneas)
2. `0cc8bf4` - UI implementation (746 líneas)
3. `fc7c097` - Navigation link + buyer personas seed

**Total:** 3 commits, ~2,500 líneas de código

---

## 📋 Checklist Pre-Deployment

### Backend

- [x] Orchestration logic implementada
- [x] Database migration creada (0046_add_market_simulations.sql)
- [x] TypeScript schema exportado
- [x] tRPC router con 4 procedures
- [x] Integration con Strategic Profiles
- [ ] Migration ejecutada en DB (PENDIENTE)

### Frontend

- [x] Main page creada
- [x] BuyerPersonaSelector component
- [x] SimulationResults component
- [x] Navigation link añadido (desktop + mobile)
- [x] TypeScript errors: 0
- [x] Lint errors: 0

### Data

- [x] Buyer personas seed script creado
- [ ] Seed ejecutado en DB (PENDIENTE)

---

## 🔧 Pasos para Deployment

### 1. Aplicar Migraciones

**⚠️ IMPORTANTE:** Ejecutar ANTES de desplegar

```bash
# Desde la raíz del proyecto
cd packages/db

# Aplicar migración de Strategic Profiles (si no existe)
pnpm db:push  # O manualmente con psql

# Verificar que la tabla existe
psql "$DATABASE_URL" -c "\dt strategic_profiles"
```

**Migraciones requeridas:**
- `0045_add_strategic_profiles.sql` (Strategic Profiles)
- `0046_add_market_simulations.sql` (Market Simulations)

**Aplicación manual (si db:push falla):**
```bash
psql "$DATABASE_URL" -f packages/db/drizzle/0045_add_strategic_profiles.sql
psql "$DATABASE_URL" -f packages/db/drizzle/0046_add_market_simulations.sql
```

---

### 2. Seed Buyer Personas

**⚠️ SOLO después de aplicar migración 0045**

```bash
# Desde packages/db
pnpm seed:buyer-personas
```

**Resultado esperado:**
```
[OK] Created buyer persona: CFO Fintech
[OK] Created buyer persona: Product Manager SaaS
[OK] Created buyer persona: CEO Startup
[OK] Created buyer persona: Marketing Director Enterprise
[OK] Created buyer persona: Operations Manager SaaS

[INFO] Buyer Personas Seed Summary:
  Created: 5
  Updated: 0
  Total: 5
```

**Verificación:**
```sql
SELECT name, category, specialization
FROM strategic_profiles
WHERE type = 'buyer_persona'
  AND is_system_profile = true;
```

---

### 3. Verificar en Desarrollo

```bash
# Desde la raíz
pnpm dev

# Abrir en navegador
http://localhost:3005/market-simulator/new
```

**Tests manuales:**

1. **Navigation**
   - [ ] Link "Simulador" visible en header (desktop hover-expand)
   - [ ] Link "Simulador de Mercado" en mobile menu
   - [ ] Click navega a `/market-simulator/new`

2. **Buyer Persona Selector**
   - [ ] Muestra 5 personas seeded
   - [ ] Checkboxes funcionan
   - [ ] Límite de 10 se respeta
   - [ ] Muestra JTBD y Barriers

3. **Variant Editor**
   - [ ] Permite añadir hasta 5 variantes
   - [ ] Validación de mínimo 10 caracteres funciona
   - [ ] Remove button funciona (mínimo 2)

4. **Run Simulation**
   - [ ] Button disabled si falta data
   - [ ] Ejecuta simulación correctamente
   - [ ] Loading state se muestra
   - [ ] Results se despliegan

5. **Results**
   - [ ] Stats cards muestran datos correctos
   - [ ] Friction map con color coding
   - [ ] Avatares con indicadores verde/rojo
   - [ ] Tooltips muestran argumentos
   - [ ] Síntesis de IA se muestra
   - [ ] Cost breakdown visible

---

### 4. Deploy a Producción

**Vercel Deploy:**
```bash
# Push to main/staging branch
git push origin feat/unified-strategic-profiles

# Vercel auto-deploys on push
```

**Manual Deploy:**
```bash
# Build check
pnpm build

# Si todo OK, merge to main
git checkout main
git merge feat/unified-strategic-profiles
git push origin main
```

**Post-Deploy:**
1. Ejecutar migraciones en DB de producción
2. Ejecutar seed de buyer personas
3. Verificar feature en producción
4. Monitorear logs por errores

---

## 🔍 Troubleshooting

### Problema: "relation strategic_profiles does not exist"

**Causa:** Migración 0045 no aplicada

**Solución:**
```bash
# Opción 1: Drizzle push
cd packages/db && pnpm db:push

# Opción 2: Manual
psql "$DATABASE_URL" -f packages/db/drizzle/0045_add_strategic_profiles.sql
```

---

### Problema: "No buyer personas found"

**Causa:** Seed no ejecutado

**Solución:**
```bash
cd packages/db && pnpm seed:buyer-personas
```

---

### Problema: "Type error in market-simulator files"

**Causa:** Imports incorrectos o tipos faltantes

**Solución:**
```bash
cd apps/web && pnpm typecheck
# Revisar errores específicos
```

---

### Problema: Navigation link no aparece

**Causa:** Header component no actualizado

**Verificación:**
```typescript
// apps/web/src/components/layout/app-header.tsx
// Buscar: href="/market-simulator/new"
```

---

## 📊 Métricas de Deployment

**Backend:**
- Archivos: 11
- Líneas: 825
- Procedures: 4 (runSimulation, getSimulation, listSimulations, deleteSimulation)

**Frontend:**
- Archivos: 4
- Líneas: 746
- Components: 3 (Page, BuyerPersonaSelector, SimulationResults)

**Database:**
- Migraciones: 2
- Tablas: 2 (strategic_profiles reutilizada, market_simulations nueva)
- Seed data: 5 buyer personas

**Total:**
- Commits: 3
- Archivos modificados: 22
- Líneas totales: ~2,500

---

## ✅ Verificación Post-Deployment

### Checklist de Producción:

- [ ] Migraciones aplicadas correctamente
- [ ] Buyer personas visibles en selector
- [ ] Navigation link funciona
- [ ] Simulación ejecuta sin errores
- [ ] Results se muestran correctamente
- [ ] No hay errores en console
- [ ] Cost tracking registra correctamente
- [ ] Multi-tenancy funciona (userId, companyId)

### Monitoreo:

**Logs a revisar:**
```bash
# Errores de tRPC
grep "marketSimulator" logs/api.log

# Errores de AI
grep "runMarketSimulation" logs/quoorum.log

# Performance
grep "executionTime" logs/metrics.log
```

**Métricas a monitorear:**
- Execution time por simulación (~15-20s esperado)
- Cost per simulation (~$0.006 esperado)
- Error rate (<1% esperado)
- User adoption (conversions a simulación)

---

## 🎯 Next Steps (Opcionales)

### Features Adicionales:

1. **History Page**
   - Route: `/market-simulator`
   - Listar simulaciones pasadas
   - Cards con preview de ganadora

2. **Export Functionality**
   - Export to PDF
   - Export to CSV
   - Share link

3. **Advanced Analytics**
   - Compare múltiples simulaciones
   - Track winning patterns
   - Suggest improvements

4. **A/B Testing Integration**
   - Link to actual campaign results
   - Track prediction accuracy
   - Learn from outcomes

---

## 📚 Documentación

**Archivos de referencia:**
- `MARKET-SIMULATOR-COMPLETE.md` - Documentación técnica completa
- `SESSION-SUMMARY-2026-02-01.md` - Resumen de sesión
- `packages/quoorum/src/orchestration/market-simulator.ts` - Lógica core
- `packages/api/src/routers/market-simulator.ts` - API endpoints
- `apps/web/src/app/market-simulator/new/page.tsx` - UI principal

---

## 🚨 Rollback Plan

Si algo falla en producción:

```bash
# 1. Revert commits
git revert fc7c097  # Navigation + seed
git revert 0cc8bf4  # UI
git revert f0a3c12  # Backend

# 2. Push revert
git push origin main

# 3. Rollback migrations (si necesario)
psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS market_simulations;"

# 4. Verificar que todo vuelve a funcionar
```

**⚠️ NOTA:** Solo hacer rollback si hay errores críticos. Mejor fix-forward si es posible.

---

_Guía de deployment generada: 1 Feb 2026_
_Feature: Market Simulator (AI Focus Group)_
