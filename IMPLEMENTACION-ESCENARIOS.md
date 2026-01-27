# 🏛️ Implementación de Escenarios de Oro (SDP) - COMPLETADA

## ✅ Estado: IMPLEMENTACIÓN COMPLETA

**Fecha:** 27 Ene 2026
**Versión:** MVP - 3 Escenarios

---

## 📋 Resumen de Implementación

Se ha implementado completamente el sistema de **Escenarios de Oro (Decision Playbooks)** que transforma Quoorum de una herramienta de propósito general a una **Strategic Deliberation Platform (SDP)** basada en soluciones.

### ✅ Completado

1. **Schema de Base de Datos**
   - ✅ Tabla `scenarios` con todos los campos requeridos
   - ✅ Tabla `scenario_usage` para analytics
   - ✅ Enums: `scenario_segment`, `scenario_status`
   - ✅ Migración SQL: `packages/db/drizzle/0034_add_scenarios.sql`

2. **Tipos TypeScript/Zod**
   - ✅ `ScenarioConfig` con validación completa
   - ✅ `AppliedScenario` para configuración aplicada
   - ✅ `ScenarioVariableValues` para variables del prompt
   - ✅ Exportados desde `packages/quoorum/src/index.ts`

3. **Función `applyScenario()`**
   - ✅ Aplica configuración del escenario
   - ✅ Reemplaza variables en prompt template (`{{variable}}`)
   - ✅ Valida expert IDs contra expert database
   - ✅ Convierte a `RunDebateOptions` para el runner

4. **Router tRPC (`scenarios`)**
   - ✅ `list`: Listar escenarios activos (públicos)
   - ✅ `getById`: Obtener escenario por ID
   - ✅ `create`: Crear escenario (admin)
   - ✅ `update`: Actualizar escenario (admin o creador)
   - ✅ `delete`: Soft delete (archivar)
   - ✅ `trackUsage`: Registrar uso del escenario

5. **Integración en `debates.create`**
   - ✅ Acepta `scenarioId` y `scenarioVariables` en input
   - ✅ Carga escenario de la base de datos
   - ✅ Aplica configuración (expertos, framework, prompt)
   - ✅ Trackea uso del escenario
   - ✅ Guarda `scenarioId` en metadata del debate

6. **Seed Data (3 Escenarios MVP)**
   - ✅ **Escenario A:** Validación de Idea & Product-Market Fit (Emprendedor)
   - ✅ **Escenario B:** Contratación Crítica vs. Outsourcing (Pyme/Autónomo)
   - ✅ **Escenario C:** Análisis de Inversión y Mitigación de Riesgo (Corporate/Inversor)
   - ✅ Script ejecutable: `packages/db/scripts/seed-scenarios.ts`

7. **UI Básica**
   - ✅ Página `/scenarios` con lista de escenarios
   - ✅ Filtros por segmento (Emprendedor/Pyme/Corporate)
   - ✅ Búsqueda de escenarios
   - ✅ Botón "Lanzar" que inicia debate con escenario
   - ✅ Link en AppHeader para acceso rápido

---

## 🚀 Pasos para Activar

### 1. Aplicar Migración de Base de Datos

```bash
# Opción A: Push directo (recomendado para desarrollo)
pnpm db:push

# Opción B: Generar y aplicar migración
pnpm db:generate
# Luego aplicar manualmente: packages/db/drizzle/0034_add_scenarios.sql
```

### 2. Ejecutar Seed Data

```bash
pnpm tsx packages/db/scripts/seed-scenarios.ts
```

Esto creará los 3 escenarios MVP en la base de datos.

### 3. Verificar

```bash
# Verificar que los escenarios se crearon
docker exec quoorum-postgres psql -U postgres -d quoorum -c "SELECT name, segment, status FROM scenarios;"
```

Deberías ver:
- Validación de Idea & Product-Market Fit (entrepreneur)
- Contratación Crítica vs. Outsourcing (sme)
- Análisis de Inversión y Mitigación de Riesgo (corporate)

---

## 📊 Los 3 Escenarios MVP

### Escenario A: Validación de Idea & Product-Market Fit

**Segmento:** Emprendedor
**Expertos:**
- `april_dunford` - Positioning & Market Fit
- `rahul_vohra` - Product-Market Fit
- `brian_balfour` - Growth Hacker (Devil's Advocate)
- `patrick_campbell` - Financial Analyst

**Lógica:** El Growth Hacker actúa como "Abogado del Diablo" y cuestiona agresivamente la viabilidad.

**Success Metrics:**
- `viability_score` (0-100)
- `critical_risk` (string)
- `validation_required` (array)
- `has_pmf_potential` (boolean)

### Escenario B: Contratación Crítica vs. Outsourcing

**Segmento:** Pyme / Autónomo
**Expertos:**
- `steli_efti` - Operations & GTM (HR Director proxy)
- `patrick_campbell` - CFO (extremely conservative)
- `brian_balfour` - Operations Specialist

**Lógica:** El CFO es extremadamente conservador con el gasto. Compara costes a 12 meses vs. flexibilidad.

**Success Metrics:**
- `recommendation` (Contratar/Outsourcing/Híbrido)
- `cost_difference_12m` (number)
- `risk_level` (Bajo/Medio/Alto)

### Escenario C: Análisis de Inversión y Mitigación de Riesgo

**Segmento:** Corporate / Inversor
**Expertos:**
- `marc_andreessen` - Risk Analyst (VC perspective)
- `bill_gurley` - Market Specialist
- `chamath_palihapitiya` - Legal/Mercantil (as proxy)

**Lógica:** Usa framework de **Premortem**. Los expertos asumen que la inversión ha fallado y explican por qué.

**Success Metrics:**
- `critical_risks` (array)
- `mitigation_strategies` (array)
- `success_probability` (0-100%)
- `recommendation` (Sí/No/Con condiciones)

---

## 🎯 Uso del Sistema

### Para Usuarios

1. Ir a `/scenarios`
2. Seleccionar un escenario
3. Click en "Lanzar"
4. Introducir caso/pregunta
5. El sistema pre-configura expertos, framework y prompt automáticamente

### Para Admins (Futuro)

1. Ir a `/admin/scenarios` (pendiente de implementar)
2. Crear/editar escenarios
3. Configurar expertos, frameworks, prompts
4. Definir success metrics
5. Publicar escenario

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

- `packages/db/src/schema/scenarios.ts` - Schema de escenarios
- `packages/db/src/schema/scenario-usage.ts` - Tracking de uso
- `packages/db/drizzle/0034_add_scenarios.sql` - Migración SQL
- `packages/db/src/seed/scenarios.ts` - Seed data con 3 escenarios
- `packages/db/scripts/seed-scenarios.ts` - Script ejecutable
- `packages/quoorum/src/scenarios/types.ts` - Tipos TypeScript/Zod
- `packages/quoorum/src/scenarios/apply-scenario.ts` - Función de aplicación
- `packages/api/src/routers/scenarios.ts` - Router tRPC
- `apps/web/src/app/scenarios/page.tsx` - UI de escenarios

### Archivos Modificados

- `packages/db/src/schema/index.ts` - Export de scenarios
- `packages/quoorum/src/index.ts` - Export de tipos de escenarios
- `packages/api/src/routers/index.ts` - Export de scenariosRouter
- `packages/api/src/index.ts` - Añadido scenariosRouter a appRouter
- `packages/api/src/routers/debates.ts` - Soporte para scenarioId
- `apps/web/src/components/layout/app-header.tsx` - Link a escenarios

---

## 🔧 Próximos Pasos (Opcional)

1. **Panel Admin para Editar Escenarios**
   - UI en `/admin/scenarios`
   - Editor de prompt templates con preview
   - Selector visual de expertos
   - Configuración de success metrics

2. **Extract Success Metrics Automáticamente**
   - Después del debate, extraer métricas usando los extractors definidos
   - Guardar en `scenario_usage.success_metrics_extracted`

3. **Certificados de Gobernanza**
   - Generar PDF con el certificado del debate
   - Incluir escenario usado, expertos, métricas extraídas

4. **Más Escenarios**
   - Escenarios verticales (SaaS, E-commerce, etc.)
   - Escenarios por industria
   - Escenarios personalizados por usuario

---

## ✅ Verificación de Funcionamiento

1. **Aplicar migración:**
   ```bash
   pnpm db:push
   ```

2. **Ejecutar seed:**
   ```bash
   pnpm tsx packages/db/scripts/seed-scenarios.ts
   ```

3. **Iniciar servidor:**
   ```bash
   pnpm dev
   ```

4. **Probar:**
   - Ir a `http://localhost:3000/scenarios`
   - Ver los 3 escenarios
   - Click en "Lanzar" de un escenario
   - Introducir pregunta
   - Verificar que el debate se crea con los expertos pre-configurados

---

## 🎉 Resultado Final

**Quoorum ahora es una Strategic Deliberation Platform (SDP)** con:
- ✅ Escenarios preconfigurados (Decision Playbooks)
- ✅ One-click launch de debates de alta calidad
- ✅ Expertos, frameworks y contextos pre-seleccionados
- ✅ Success metrics extraíbles
- ✅ Audit trail completo
- ✅ Sistema extensible para más escenarios

**Sin romper nada existente** - Todo es aditivo y compatible con el sistema actual.
