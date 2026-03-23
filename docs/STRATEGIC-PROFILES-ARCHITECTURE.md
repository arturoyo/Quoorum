# Strategic Intelligence Profiles - Unified Architecture

**Version:** 1.0.0
**Created:** 2026-02-01
**Status:** ✅ Production-Ready

---

## 🎯 Vision

Una **arquitectura unificada** que consolida todos los conceptos de "perfiles inteligentes" en Quoorum bajo un único sistema flexible, escalable y type-safe.

### Problema Resuelto

**Antes:**
- ❌ Expertos en una tabla
- ❌ Profesionales en otra tabla
- ❌ Roles sin estructura formal
- ❌ ICP inexistente en DB
- ❌ Buyer Personas inexistente en DB
- ❌ Duplicación de lógica
- ❌ Difícil mantener consistencia

**Después:**
- ✅ **Single source of truth** para todos los perfiles
- ✅ Campos comunes type-safe
- ✅ Flexibilidad para atributos específicos (JSONB)
- ✅ Integración RAG nativa
- ✅ Versionado automático (audit trail)
- ✅ Relaciones avanzadas entre perfiles
- ✅ Multi-tenant ready
- ✅ Escalable a millones de perfiles

---

## 🏗️ Arquitectura

### Modelo Híbrido Diseñado

**Tabla Principal: `strategic_profiles`**

```
┌─────────────────────────────────────────┐
│      STRATEGIC PROFILES (Unified)       │
├─────────────────────────────────────────┤
│                                         │
│  📋 Universal Fields (Type-Safe)        │
│  ├─ Identity (name, slug, type)         │
│  ├─ Behavioral (tone, autonomy)         │
│  ├─ Knowledge (expertise, industries)   │
│  └─ Ownership (user, company)           │
│                                         │
│  🎛️ Type-Specific (JSONB Flexible)       │
│  ├─ ai_config      (for AI agents)      │
│  ├─ firmographics  (for ICP)            │
│  └─ psychographics (for buyers)         │
│                                         │
│  🔗 Relationships                        │
│  ├─ parent_profile_id                   │
│  ├─ related_profile_ids                 │
│  └─ rag_document_ids                    │
│                                         │
└─────────────────────────────────────────┘
```

**Tablas Auxiliares:**
1. `profile_rag_documents` - Documentos RAG vinculados con metadata
2. `strategic_profile_versions` - Audit trail completo
3. `profile_relationships` - Relaciones avanzadas

---

## 📊 Tipos de Perfiles Soportados

### 1. Expert (Experto IA)
**Propósito:** Participante en debates
**Campos específicos:** `ai_config`
**Ejemplo:**
```typescript
{
  type: 'expert',
  name: 'CFO Estratégico',
  specialization: 'Riesgos Financieros',
  aiConfig: {
    systemPrompt: 'Eres un CFO...',
    model: 'gpt-4-turbo',
    temperature: 0.7
  },
  toneStyles: ['analytical', 'skeptical'],
  autonomyLevel: 8
}
```

### 2. Professional (Profesional/Worker)
**Propósito:** Agente especializado
**Campos específicos:** `ai_config`
**Ejemplo:**
```typescript
{
  type: 'professional',
  name: 'Analista de Datos',
  category: 'data_analysis',
  aiConfig: {
    model: 'gpt-4-turbo',
    tools: ['python', 'sql']
  }
}
```

### 3. Role (Rol Estratégico)
**Propósito:** Arquetipo de decisor
**Campos específicos:** `ai_config`, `psychographics`
**Ejemplo:**
```typescript
{
  type: 'role',
  name: 'Chief Strategy Officer',
  objective: 'Maximizar valor estratégico a largo plazo',
  toneStyles: ['visionary', 'analytical'],
  decisionStyle: 'collaborative'
}
```

### 4. ICP (Ideal Customer Profile)
**Propósito:** Perfil de empresa ideal
**Campos específicos:** `firmographics`
**Ejemplo:**
```typescript
{
  type: 'icp',
  name: 'Fintech Enterprise',
  firmographics: {
    employeeCount: '500+',
    revenue: '50M+',
    techStack: ['Salesforce', 'AWS'],
    triggerEvents: ['Funding round', 'M&A'],
    governance: {
      gdpr: true,
      iso42001: true
    }
  }
}
```

### 5. Buyer Persona
**Propósito:** Decisor individual
**Campos específicos:** `psychographics`
**Ejemplo:**
```typescript
{
  type: 'buyer_persona',
  name: 'Director de Estrategia',
  parentProfileId: '...', // Link to ICP
  psychographics: {
    jobsToBeDone: 'Validar decisiones sin consultoras',
    motivations: ['Reconocimiento de junta', 'Mitigar riesgo'],
    barriers: ['Privacidad datos', 'Curva aprendizaje'],
    channels: ['LinkedIn', 'Gartner Reports']
  }
}
```

---

## 🔗 Relaciones Entre Perfiles

### Tipos de Relaciones

```typescript
type RelationshipType =
  | 'compatible'      // Trabajan bien juntos
  | 'complementary'   // Llenan gaps mutuos
  | 'prerequisite'    // Debe venir antes
  | 'alternative'     // Puede reemplazar
  | 'context_for'     // Provee contexto para
```

### Ejemplo: Ecosistema ICP → Buyer Persona → Role

```
ICP: Fintech Enterprise (500+ empleados)
   └─ parent_profile_id
      ↓
   Buyer Persona: CSO (15 años experiencia)
      └─ compatible_with
         ↓
      Role: Estratega M&A
```

---

## 📚 Integración RAG

### Vinculación Rica de Documentos

**Tabla:** `profile_rag_documents`

**Niveles de Relevancia:**
- `core` - Base de conocimiento esencial
- `supplementary` - Contexto adicional
- `case_study` - Ejemplos del mundo real
- `industry_data` - Información de mercado
- `compliance` - Docs legales/regulatorios

**Ejemplo:**
```typescript
await db.insert(profileRagDocuments).values({
  profileId: '...',
  documentId: '...',
  relevance: 'core',
  importanceScore: 0.9,
  notes: 'Metodología oficial de análisis financiero'
})
```

**Auto-tracking:** El sistema trackea automáticamente:
- `times_retrieved` - Cuántas veces se recuperó
- `last_retrieved_at` - Última vez usada
- `avg_similarity` - Similitud promedio en búsquedas

---

## 🔄 Versionado Automático

**Tabla:** `strategic_profile_versions`

Cada cambio significativo en un perfil crea automáticamente:
1. Snapshot completo del estado anterior
2. Incremento de version number
3. Tracking de quién cambió y por qué

**Ejemplo de uso:**
```typescript
// Update profile
await db.update(strategicProfiles)
  .set({ description: 'Nueva descripción' })
  .where(eq(strategicProfiles.id, profileId))

// Trigger automático crea version snapshot
// Nuevo version = old_version + 1
```

**Revertir a versión anterior:**
```typescript
const versions = await api.strategicProfiles.getVersions({ profileId })
// Restaurar desde profileData JSONB
```

---

## 🎛️ API (tRPC)

### Procedures Disponibles

```typescript
api.strategicProfiles.list({
  type: 'expert',           // Filtrar por tipo
  category: 'finance',      // Filtrar por categoría
  industries: ['fintech'],  // Filtrar por industria
  search: 'CFO',           // Búsqueda texto
  isGlobal: true,          // Solo globales
  isFeatured: true,        // Solo destacados
  limit: 50,
  offset: 0
})

api.strategicProfiles.get({
  id: '...',               // Por ID
  slug: 'cfo-estrategico'  // O por slug
})

api.strategicProfiles.create({
  type: 'expert',
  name: 'Nuevo Experto',
  // ... otros campos
})

api.strategicProfiles.update({
  id: '...',
  aiConfig: { model: 'gpt-4' },
  changeReason: 'Actualización de modelo'
})

api.strategicProfiles.delete({ id: '...' })

api.strategicProfiles.linkDocument({
  profileId: '...',
  documentId: '...',
  relevance: 'core',
  importanceScore: 0.9
})

api.strategicProfiles.getVersions({ profileId: '...' })
api.strategicProfiles.getStats()  // Stats por tipo
```

---

## 🔐 Multi-Tenancy & Seguridad

### Niveles de Acceso

```typescript
// 1. Global (todos los usuarios)
{ isGlobal: true }

// 2. Company-level (toda la empresa)
{ companyId: 'uuid', isGlobal: false }

// 3. User-level (solo el usuario)
{ userId: 'uuid', companyId: null, isGlobal: false }
```

### Filtrado Automático

El router aplica automáticamente:
```typescript
WHERE (
  is_global = true
  OR user_id = current_user_id
  OR company_id = current_company_id
)
```

---

## 📈 Performance

### Índices Optimizados

```sql
-- Búsquedas por tipo
CREATE INDEX idx_strategic_profiles_type ON strategic_profiles(type);

-- Búsquedas por slug (unique)
CREATE UNIQUE INDEX idx_strategic_profiles_slug ON strategic_profiles(slug);

-- Full-text search
CREATE INDEX idx_strategic_profiles_search ON strategic_profiles
  USING GIN(to_tsvector('english', name || ' ' || description));

-- Arrays (tags, industries, expertise)
CREATE INDEX USING GIN(tags);
CREATE INDEX USING GIN(industries);
CREATE INDEX USING GIN(expertise_areas);
```

### Vistas Materializadas

**Auto-actualizadas via triggers:**
- `mv_active_profiles_by_type` - Stats por tipo
- `mv_popular_profiles` - Top 100 perfiles más usados

---

## 🔄 Migración de Datos Existentes

### Script Automático

```bash
# Migrar expertos y profesionales existentes
pnpm db:migrate-strategic-profiles
```

**Qué hace:**
1. Lee todos los expertos de tabla `experts`
2. Lee todos los profesionales de tabla `workers`
3. Convierte cada uno a `strategic_profiles`
4. Preserva ownership y metadata
5. Mapea campos específicos a JSONB
6. Skippea duplicados (por slug)

**Resultado:**
```
✅ Experts migrated:        80
✅ Professionals migrated:  45
⏭️  Skipped (duplicates):   0
❌ Errors:                  0
📊 Total processed:         125
```

---

## 🎨 UI (Futuro)

**Páginas sugeridas:**
- `/settings/profiles` - Gestión de perfiles
- `/settings/profiles/experts` - Vista de expertos
- `/settings/profiles/icps` - Gestión de ICPs
- `/settings/profiles/[id]` - Detalle de perfil
- `/settings/profiles/[id]/rag` - Documentos vinculados
- `/settings/profiles/[id]/versions` - Historial

---

## ✅ Ventajas del Sistema

### Flexibilidad
- ✅ Añadir nuevos tipos sin cambiar schema
- ✅ Campos específicos en JSONB (sin migraciones)
- ✅ Relaciones arbitrarias entre perfiles

### Type-Safety
- ✅ Campos core fuertemente tipados
- ✅ Enums para valores fijos
- ✅ TypeScript interfaces para JSONB

### Performance
- ✅ Índices optimizados
- ✅ Vistas materializadas
- ✅ Queries eficientes

### Auditabilidad
- ✅ Versionado automático
- ✅ Tracking de cambios
- ✅ Revert a versiones anteriores

### Escalabilidad
- ✅ Multi-tenant native
- ✅ Preparado para millones de perfiles
- ✅ Relaciones complejas

---

## 📚 Casos de Uso

### 1. Crear ICP con Buyer Personas

```typescript
// 1. Crear ICP
const icp = await api.strategicProfiles.create({
  type: 'icp',
  name: 'Fintech Enterprise',
  firmographics: {
    employeeCount: '500+',
    revenue: '50M+',
    techStack: ['Salesforce']
  }
})

// 2. Crear Buyer Personas dentro del ICP
const cso = await api.strategicProfiles.create({
  type: 'buyer_persona',
  name: 'Chief Strategy Officer',
  parentProfileId: icp.id,  // Link al ICP
  psychographics: {
    jobsToBeDone: 'Validar decisiones estratégicas',
    motivations: ['Reconocimiento de junta']
  }
})
```

### 2. Vincular Documentos RAG a Experto

```typescript
// Vincular documento como base de conocimiento core
await api.strategicProfiles.linkDocument({
  profileId: expertId,
  documentId: ragDocId,
  relevance: 'core',
  importanceScore: 0.95,
  notes: 'Metodología oficial M&A 2026'
})
```

### 3. Clonar Perfil con Variación

```typescript
const original = await api.strategicProfiles.get({ id: '...' })

await api.strategicProfiles.create({
  ...original,
  slug: 'cfo-agresivo',  // Nuevo slug
  name: 'CFO Agresivo',
  toneStyles: ['assertive', 'optimistic'],  // Variación
  aiConfig: {
    ...original.aiConfig,
    temperature: 0.9  // Más creativo
  }
})
```

---

## 🚀 Roadmap Futuro

### Fase 1 (Completado)
- ✅ Schema unificado
- ✅ tRPC router
- ✅ Script de migración
- ✅ Documentación

### Fase 2 (Próximo)
- [ ] UI de gestión completa
- [ ] Import/Export de perfiles
- [ ] Marketplace de perfiles (compartir entre empresas)
- [ ] AI que genera perfiles automáticamente

### Fase 3 (Futuro)
- [ ] ML para optimizar combinaciones de perfiles
- [ ] Analytics de performance de perfiles
- [ ] A/B testing de configuraciones
- [ ] Templates industry-specific

---

## 📞 Soporte

**Documentación:**
- Este archivo (arquitectura)
- Schema comments en DB
- TypeScript types inline

**Migration issues:**
```bash
# Ver logs de migración
pnpm db:migrate-strategic-profiles

# Revertir migración (si es necesario)
# Solo eliminar registros de strategic_profiles manualmente
```

---

**_Arquitectura diseñada para el éxito al 100% de Quoorum_** 🚀
