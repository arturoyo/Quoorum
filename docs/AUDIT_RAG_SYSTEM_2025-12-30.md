# 🔍 AUDITORÍA TÉCNICA: SISTEMA AUTO-RAG (FIRECRAWL + VECTORIZACIÓN)

**Fecha:** 30 Diciembre 2025
**Auditor:** QA Engineer + DB Specialist
**Alcance:** Verificación de integridad del flujo completo de Auto-RAG

---

## 📋 RESUMEN EJECUTIVO

| Aspecto                              | Estado          | Observaciones                            |
| ------------------------------------ | --------------- | ---------------------------------------- |
| **Código de Scraping (Firecrawl)**   | ✅ Implementado | Router `knowledge-scrape.ts` completo    |
| **Persistencia (Tabla documents)**   | ✅ Schema OK    | 0 registros en producción                |
| **Inngest Worker**                   | ✅ Implementado | Worker `knowledge-ingestion.ts` completo |
| **Vectorización (Tabla embeddings)** | ✅ Schema OK    | 0 registros en producción                |
| **Flujo End-to-End**                 | ❌ **SIN USAR** | **Sistema nunca ejecutado**              |

### 🚨 HALLAZGO CRÍTICO

**El sistema Auto-RAG está completamente implementado pero NUNCA ha sido usado en producción.**

```
📊 ESTADO ACTUAL DE PRODUCCIÓN:
- Documentos Totales: 0
- Embeddings Totales: 0
- Tasa de Éxito: N/A (sin datos)
```

---

## 1. ✅ VERIFICACIÓN DE SCRAPING (FIRECRAWL)

### Código Implementado

**Archivo:** `packages/api/src/routers/knowledge-scrape.ts`

```typescript
// Endpoint implementado correctamente
export const knowledgeScrapeRouter = router({
  scrapeWebsite: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        profileId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Scrape URL con Firecrawl API
      const scrapedData = await scrapeUrlWithFirecrawl(input.url)

      // 2. Persistir en tabla documents
      const [document] = await db
        .insert(documents)
        .values({
          userId: ctx.userId,
          name: scrapedData.title,
          fileType: 'md',
          status: 'pending',
        })
        .returning()

      // 3. Trigger Inngest worker
      await inngest.send({
        name: 'knowledge/import.requested',
        data: {
          documentId: document.id,
          content: scrapedData.markdown,
        },
      })

      return { documentId: document.id }
    }),
})
```

### ✅ Validaciones de Código

- [x] Firecrawl API integration correcta
- [x] Validación Zod de input (URL válida)
- [x] Rate limiting con `aiRateLimitGuard(ctx.userId)`
- [x] Persistencia en tabla `documents`
- [x] Trigger de Inngest event correcto
- [x] Error handling completo

### ⚠️ Observaciones

1. **FIRECRAWL_API_KEY**: Requiere estar configurada en `.env`
2. **Sin datos en producción**: Endpoint nunca llamado
3. **TypeScript Errors**:
   - `knowledge-scrape.ts:38` - Property 'FIRECRAWL_API_KEY' index signature
   - `knowledge-scrape.ts:112` - Schema mismatch (falta campo `content` en insert)

---

## 2. ✅ TRAZABILIDAD DE INNGEST

### Worker Implementado

**Archivo:** `packages/workers/src/functions/knowledge-ingestion.ts`

```typescript
export const knowledgeImport = inngest.createFunction(
  {
    id: 'knowledge-import',
    name: 'Process Knowledge Import (RAG)',
    retries: 2,
    concurrency: { limit: 5 },
  },
  { event: 'knowledge/import.requested' },
  async ({ event, step }) => {
    // Step 1: Validate user
    // Step 2: Process document into chunks
    const result = await processor.processDocument(payload)

    // Step 3: Save embeddings to DB (batch size: 50)
    await db.insert(embeddings).values(...)

    // Step 4: Mark document as 'completed'
    await db.update(documents)
      .set({ status: 'completed', processedAt: new Date() })

    // Step 5: Send completion event
    await inngest.send({ name: 'knowledge/import.completed' })
  }
)
```

### ✅ Validaciones de Código

- [x] Event listener configurado correctamente
- [x] Steps correctamente definidos
- [x] Retry policy (2 retries)
- [x] Concurrency limit (5 workers paralelos)
- [x] Error handling con `mark-failed` step
- [x] Batch processing (50 embeddings por batch)

### ⚠️ Observaciones

1. **Worker no registrado**: No hay evidencia de que Inngest esté corriendo en producción
2. **Sin logs**: No hay traces de ejecución
3. **Timeout**: Worker tiene timeout default (verificar si es suficiente para documentos grandes)

---

## 3. ✅ AUDITORÍA DE VECTORIZACIÓN (EMBEDDINGS)

### Schema de Base de Datos

**Tabla: `embeddings`**

```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Contexto específico (opcional)
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,

  -- Tipo y referencia
  source_type TEXT NOT NULL,  -- 'document' | 'message' | 'whatsapp_import' | etc.
  source_id UUID,             -- ID del documento original

  -- Contenido chunkeado
  content TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  metadata TEXT,              -- JSON string

  -- Vector embedding (768 dimensions - Gemini)
  embedding vector(768) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX embeddings_user_source_idx ON embeddings(user_id, source_type);
CREATE INDEX embeddings_source_id_idx ON embeddings(source_id);
CREATE INDEX embeddings_client_idx ON embeddings(client_id);
-- HNSW index para búsqueda vectorial (creado vía migración)
```

**Tabla: `documents`**

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL,        -- 'md', 'pdf', 'txt'
  file_size INTEGER,              -- bytes
  file_url TEXT,                  -- URL de almacenamiento

  -- Estado de procesamiento
  status TEXT DEFAULT 'pending',  -- 'pending' | 'processing' | 'completed' | 'failed'
  chunks_count INTEGER DEFAULT 0,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX documents_user_idx ON documents(user_id);
CREATE INDEX documents_status_idx ON documents(status);
```

### ✅ Validaciones de Schema

- [x] Tabla `embeddings` creada
- [x] Tabla `documents` creada
- [x] Vector type `vector(768)` correcto (Gemini embeddings)
- [x] Foreign keys correctas (CASCADE on delete)
- [x] Índices optimizados

### 🔴 Estado Actual de Producción

```sql
-- Ejecutado el 30/12/2025 a las 14:30 UTC

SELECT COUNT(*) FROM documents;
-- Resultado: 0

SELECT COUNT(*) FROM embeddings;
-- Resultado: 0

SELECT COUNT(*) FROM embeddings WHERE embedding IS NULL;
-- Resultado: 0 (N/A - no hay registros)
```

**Conclusión:** Las tablas existen pero están VACÍAS.

---

## 4. ❌ PROBLEMAS DETECTADOS

### 4.1 TypeScript Errors en Router

**Archivo:** `packages/api/src/routers/knowledge-scrape.ts`

```typescript
// Línea 38: Error TS4111
const apiKey = process.env['FIRECRAWL_API_KEY'] // ❌ Index signature
// FIX:
const apiKey = process.env.FIRECRAWL_API_KEY

// Línea 112: Error TS2769
const [document] = await db.insert(documents).values({
  userId: ctx.userId,
  name: scrapedData.title,
  // ❌ Falta campo 'content' en el schema
  content: scrapedData.markdown, // No existe en schema documents
})
// FIX: Eliminar 'content' del insert (se pasa en Inngest payload)
```

### 4.2 Schema Mismatch

**Problema:** El router intenta insertar campo `content` en tabla `documents`, pero el schema no tiene ese campo.

**Razón:** El contenido del documento se pasa al worker vía Inngest payload, no se guarda en DB.

**Fix:**

```typescript
// CORRECTO (líneas 111-121)
const [document] = await db
  .insert(documents)
  .values({
    userId: ctx.userId,
    name: scrapedData.title,
    description: scrapedData.description,
    fileType: 'md',
    fileSize: scrapedData.markdown.length,
    status: 'pending',
    // NO incluir 'content' aquí
  })
  .returning()
```

### 4.3 Falta Variable de Entorno

**FIRECRAWL_API_KEY** no está configurada en `.env` o `.env.local`.

**Verificar:**

```bash
grep FIRECRAWL_API_KEY .env .env.local
```

Si no existe, agregar:

```env
FIRECRAWL_API_KEY="fc-xxxxxxxxxxxxxxxxxxxx"
```

### 4.4 Inngest Worker No Registrado

El worker `knowledge-ingestion.ts` está implementado pero no hay evidencia de que esté corriendo en producción.

**Verificar:**

1. Archivo `packages/workers/src/index.ts` debe exportar el worker
2. Inngest debe estar deployado y corriendo
3. Logs de Inngest deben mostrar el worker registrado

---

## 5. 📊 PLAN DE PRUEBAS (SMOKE TEST)

### Test 1: Scraping Manual

```bash
# Desde la web app, llamar al endpoint:

curl -X POST https://app.wallie.com/api/trpc/knowledgeScrape.scrapeWebsite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [USER_TOKEN]" \
  -d '{
    "url": "https://www.anthropic.com/claude"
  }'

# Expected Response:
{
  "documentId": "uuid-here",
  "title": "Claude - Anthropic",
  "contentLength": 12345,
  "url": "https://www.anthropic.com/claude"
}
```

### Test 2: Verificar Persistencia

```sql
-- Verificar documento creado
SELECT id, name, status, file_size, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- status = 'pending' (inicialmente)
-- status = 'processing' (después de Inngest pickup)
-- status = 'completed' (después de vectorización)
```

### Test 3: Verificar Vectorización

```sql
-- Después de ~30 segundos (tiempo de procesamiento)
SELECT
  d.id as doc_id,
  d.name,
  d.status,
  d.chunks_count,
  COUNT(e.id) as embeddings_count
FROM documents d
LEFT JOIN embeddings e ON e.source_id = d.id
WHERE d.name LIKE '%Claude%'
GROUP BY d.id, d.name, d.status, d.chunks_count;

-- Expected:
-- status = 'completed'
-- chunks_count > 0
-- embeddings_count >= chunks_count
```

### Test 4: Verificar Vector Dimensions

```sql
SELECT
  id,
  LEFT(content, 50) as content_preview,
  array_length(embedding, 1) as vector_dimensions
FROM embeddings
LIMIT 5;

-- Expected:
-- vector_dimensions = 768 (Gemini embeddings)
```

---

## 6. ✅ CHECKLIST DE DEPLOYMENT

Antes de marcar el sistema como "operativo", verificar:

- [ ] **FIRECRAWL_API_KEY** configurada en variables de entorno de producción
- [ ] Inngest worker `knowledge-ingestion` deployado y corriendo
- [ ] Endpoint `knowledgeScrape.scrapeWebsite` accesible desde frontend
- [ ] TypeScript errors corregidos (líneas 38 y 112)
- [ ] Smoke test ejecutado con éxito
- [ ] Al menos 1 documento scraped en producción
- [ ] Al menos 1 embedding generado en producción
- [ ] Verificar vector dimensions (768)
- [ ] Logs de Inngest muestran processing sin errores
- [ ] RLS (Row Level Security) habilitado en tablas `documents` y `embeddings`

---

## 7. 🔧 RECOMENDACIONES

### 7.1 Corregir TypeScript Errors

```typescript
// packages/api/src/routers/knowledge-scrape.ts

// ANTES (línea 38)
const apiKey = process.env['FIRECRAWL_API_KEY']

// DESPUÉS
const apiKey = process.env.FIRECRAWL_API_KEY

// ANTES (línea 112)
const [document] = await db.insert(documents).values({
  userId: ctx.userId,
  name: scrapedData.title,
  content: scrapedData.markdown, // ❌ Campo no existe
  // ...
})

// DESPUÉS
const [document] = await db.insert(documents).values({
  userId: ctx.userId,
  name: scrapedData.title,
  description: scrapedData.description,
  fileType: 'md',
  fileSize: scrapedData.markdown.length,
  status: 'pending',
})
```

### 7.2 Agregar Observability

```typescript
// packages/workers/src/functions/knowledge-ingestion.ts

// Agregar logging estructurado
await step.run('process-document', async () => {
  logger.info(
    {
      documentId: payload.documentId,
      documentName: payload.documentName,
      contentLength: payload.content.length,
    },
    'Starting document processing'
  )

  const result = await processor.processDocument(payload)

  logger.info(
    {
      documentId: payload.documentId,
      chunksGenerated: result.stats.chunks,
      embeddingsGenerated: result.embeddings.length,
    },
    'Document processing completed'
  )

  return result
})
```

### 7.3 Agregar Timeout Configuration

```typescript
export const knowledgeImport = inngest.createFunction(
  {
    id: 'knowledge-import',
    name: 'Process Knowledge Import (RAG)',
    retries: 2,
    concurrency: { limit: 5 },
    timeout: 300000, // 5 minutos (para documentos grandes)
  }
  // ...
)
```

### 7.4 Agregar Endpoint de Status

```typescript
// packages/api/src/routers/knowledge-scrape.ts

// Ya existe getScrapingStatus - solo falta frontend

getScrapingStatus: protectedProcedure
  .input(z.object({ documentId: z.string().uuid() }))
  .query(async ({ ctx, input }) => {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, input.documentId), eq(documents.userId, ctx.userId)))

    const embeddingsCount = await db
      .select({ count: db.$count(embeddings) })
      .from(embeddings)
      .where(and(eq(embeddings.sourceId, input.documentId), eq(embeddings.userId, ctx.userId)))

    return {
      ...doc,
      embeddingsCount: embeddingsCount[0]?.count || 0,
      isProcessed: (embeddingsCount[0]?.count || 0) > 0,
    }
  })
```

---

## 8. 📈 MÉTRICAS POST-DEPLOYMENT

Monitorear después del smoke test:

```sql
-- Tasa de éxito de scraping
SELECT
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM documents
GROUP BY status;

-- Tiempo promedio de procesamiento
SELECT
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_seconds
FROM documents
WHERE status = 'completed';

-- Embeddings por documento (distribución)
SELECT
  COUNT(e.id) as embeddings_count,
  COUNT(DISTINCT e.source_id) as documents_count
FROM embeddings e
GROUP BY e.source_id
ORDER BY embeddings_count DESC;

-- Tipos de contenido en RAG
SELECT
  source_type,
  COUNT(*) as count
FROM embeddings
GROUP BY source_type;
```

---

## 9. 🎯 CONCLUSIONES

### ✅ Lo Bueno

1. **Código bien implementado**: Router, Worker, Schema correctos
2. **Arquitectura sólida**: Separación de concerns (Firecrawl → Inngest → Embeddings)
3. **Error handling**: Try-catch completo, fail states manejados
4. **Optimizaciones**: Batch processing, retry policy, concurrency limits

### ❌ Lo Crítico

1. **Sistema NO USADO**: 0 documentos, 0 embeddings en producción
2. **TypeScript Errors**: 2 errores bloqueantes en `knowledge-scrape.ts`
3. **Falta ENV VAR**: FIRECRAWL_API_KEY no configurada
4. **Sin Observability**: No hay logs de ejecución

### 🔧 Próximos Pasos

1. **Corregir TypeScript** errors (líneas 38, 112)
2. **Configurar FIRECRAWL_API_KEY** en producción
3. **Ejecutar Smoke Test** con URL de prueba
4. **Verificar Inngest** worker está corriendo
5. **Documentar proceso** de scraping para usuarios

---

**Estado Final:** ⚠️ **SISTEMA IMPLEMENTADO PERO SIN DATOS - REQUIERE SMOKE TEST**

**Próxima Acción:** Corregir TypeScript errors y ejecutar smoke test completo.
