# 🔒 Clasificación de Seguridad RAG - Protección de IP

**Fecha:** 31 Dic 2025
**Criticidad:** 🔴 ALTA - Propiedad Intelectual

---

## 📋 Estado Actual

### Documentos Ingestados (266 chunks)

Todos los 120 archivos markdown de `/docs` fueron ingestados como `system_support`.

**⚠️ PROBLEMA CRÍTICO:**
Esta documentación contiene arquitectura, estrategias de negocio, y código interno que NO debe ser accesible a clientes regulares.

---

## 🛡️ Jerarquía de Acceso Implementada

### 🔓 `public_support` - Acceso Cliente

**Usuarios:** Cualquier usuario autenticado
**Contenido:** FAQs, guías de uso, ayuda básica
**Ubicación:** `/docs/public/` (pendiente de crear)

**Ejemplos de contenido apropiado:**

- "¿Cómo cambio mi contraseña?"
- "Configuración de horario de trabajo"
- "Interpretación de estadísticas"
- "Integración con WhatsApp (usuario final)"
- "Planes y precios"

### 🔒 `system_support` - SOLO ADMIN

**Usuarios:** `isAdmin: true` únicamente
**Contenido:** Arquitectura técnica, código, estrategia
**Ubicación:** `/docs/` (actual - 120 archivos)

**Contenido RESTRINGIDO:**

- ✅ CLAUDE.md - Instrucciones para IA
- ✅ SYSTEM.md - Arquitectura completa
- ✅ /development/\* - Estándares de código, gitflow
- ✅ /operations/\* - Deployment, seguridad, DB
- ✅ /architecture/\* - Diseño de sistema
- ✅ /features/\* - Estrategia de producto
- ✅ API-REFERENCE.md - Endpoints internos
- ✅ Todos los archivos de compliance/security

---

## 📊 Clasificación de 120 Archivos Actuales

| Categoría          | Archivos             | Clasificación     | Razón                         |
| ------------------ | -------------------- | ----------------- | ----------------------------- |
| **Core Docs**      | CLAUDE.md, SYSTEM.md | 🔒 system_support | IP crítica - instrucciones IA |
| **Development**    | 8 archivos           | 🔒 system_support | Estándares de código internos |
| **Operations**     | 16 archivos          | 🔒 system_support | Deployment, seguridad, DB     |
| **Architecture**   | 3 archivos           | 🔒 system_support | Diseño de sistema             |
| **Features**       | 9 archivos           | 🔒 system_support | Estrategia de producto        |
| **Compliance**     | 4 archivos           | 🔒 system_support | Seguridad, producción         |
| **Status/Project** | 14 archivos          | 🔒 system_support | Roadmap, planificación        |
| **Guides**         | 1 archivo            | 🔒 system_support | RLS técnico                   |
| **Otros técnicos** | 65 archivos          | 🔒 system_support | APIs, workers, integraciones  |

**TOTAL: 120 archivos = 100% system_support (admin-only)**

---

## ✅ Acciones Implementadas

### 1. Schema Actualizado ✅

```typescript
export type EmbeddingSourceType =
  | 'public_support' // 🔓 PUBLIC: Ayuda cliente
  | 'system_support' // 🔒 ADMIN-ONLY: Arquitectura técnica
// ... otros tipos
```

### 2. Router de Soporte Restringido ✅

```typescript
// packages/api/src/routers/wallie-support.ts
supportChat: protectedProcedure.mutation(async ({ ctx, input }) => {
  // ⚠️ RESTRINGIDO: Solo busca en public_support
  const ragResults = await caller.knowledge.search({
    query: input.message,
    sourceTypes: ['public_support'], // ← SOLO PÚBLICO
    limit: 5,
  })
})
```

### 3. Endpoint Admin Creado ✅

```typescript
// packages/api/src/routers/admin-knowledge.ts
adminKnowledgeQuery: protectedProcedure
  .input(z.object({ query: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Verificar admin
    if (!ctx.session?.user?.isAdmin) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    // Acceso TOTAL a system_support + public_support
    const results = await caller.knowledge.search({
      sourceTypes: ['system_support', 'public_support'],
      query: input.query,
    })
  })
```

### 4. System Prompts Diferenciados ✅

**Cliente (supportChat):**

```
"Eres un asistente de ayuda al usuario. No tienes acceso a información
técnica de servidores, código fuente o arquitectura. Si te preguntan
por cómo estás hecho, responde que es información confidencial por
seguridad."
```

**Admin (Meta-Wallie):**

```
"Eres Meta-Wallie, asistente técnico senior. Tienes acceso COMPLETO
a toda la documentación interna, arquitectura, y código. Ayuda con
consultas técnicas citando fuentes."
```

---

## 📍 Ubicación en UI

### Para Clientes

**Ruta:** `/dashboard` → Ajustes → Soporte
**Widget:** Chat amable con FAQ + public_support RAG
**Acceso:** `api.wallie.supportChat.useMutation()`

### Para Admin (Meta-Wallie)

**Ruta:** `/admin/docs-ai` (nuevo)
**Widget:** Chat técnico con system_support RAG
**Acceso:** `api.admin.knowledgeQuery.useMutation()`

---

## 🚨 Pendientes Críticos

### ALTA PRIORIDAD

1. ❌ **Crear `/docs/public/`** con contenido de ayuda al usuario
2. ❌ **Ingestar public docs** con `sourceType: 'public_support'`
3. ❌ **Implementar UI `/admin/docs-ai`** para Meta-Wallie admin
4. ❌ **Migrar supportChat UI** a usar solo public_support

### MEDIA PRIORIDAD

5. ⚠️ Agregar logging de queries a system_support (audit trail)
6. ⚠️ Rate limiting específico para admin queries
7. ⚠️ Dashboard de uso de RAG por tipo de fuente

---

## 🔐 Matriz de Permisos

| Usuario             | public_support | system_support | Endpoint              |
| ------------------- | -------------- | -------------- | --------------------- |
| **Cliente Regular** | ✅ Read        | ❌ Denied      | `supportChat`         |
| **Admin**           | ✅ Read        | ✅ Read        | `adminKnowledgeQuery` |
| **Super Admin**     | ✅ Read/Write  | ✅ Read/Write  | `adminKnowledge.*`    |

---

## 📝 Notas de Seguridad

1. **Todos los 266 chunks actuales son ADMIN-ONLY** hasta que se cree contenido público
2. **El supportChat está protegido** - solo busca en public_support (actualmente vacío)
3. **Fallback a FAQ hardcodeado** funciona para clientes mientras tanto
4. **Meta-Wallie técnico requiere crear nueva ruta admin**

---

## ✅ Verificación de Seguridad

```sql
-- Verificar que NO hay leaks de system_support en queries de cliente
SELECT
  source_type,
  COUNT(*) as chunks
FROM embeddings
GROUP BY source_type;

-- Resultado esperado:
-- system_support: 266 (TODOS protegidos)
-- public_support: 0 (pendiente de crear contenido)
```

**Estado:** 🔒 **SEGURO** - Toda la IP técnica está protegida detrás de admin auth.
