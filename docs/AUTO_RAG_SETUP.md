# 🕸️ Auto-RAG System - Configuración y Testing

Sistema automático de scraping web y generación de embeddings para RAG (Retrieval-Augmented Generation).

## 📋 Componentes

| Componente         | Ubicación                                                                | Descripción                       |
| ------------------ | ------------------------------------------------------------------------ | --------------------------------- |
| **Router API**     | `packages/api/src/routers/knowledge-scrape.ts`                           | Endpoints tRPC para scraping      |
| **UI Integration** | `apps/web/src/components/onboarding/wizard-v2/steps/step-06-profile.tsx` | Wizard Step 6 con auto-scraping   |
| **Worker**         | `packages/workers/src/functions/knowledge-ingestion.ts`                  | Procesamiento de embeddings       |
| **Schema**         | `packages/db/src/schema/embeddings.ts`                                   | Tablas `documents` y `embeddings` |

## 🔧 Configuración

### 1. Variables de Entorno Requeridas

Copia `.env.example` a `.env.local` y configura:

```bash
# Firecrawl API (Scraping)
FIRECRAWL_API_KEY=fc-xxx  # Obtener de https://firecrawl.dev

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# AI Provider (para generar embeddings)
GEMINI_API_KEY=AIza...  # Opción recomendada (gratis + 768 dimensiones)
# OPENAI_API_KEY=sk-...  # Alternativa
# ANTHROPIC_API_KEY=sk-ant-...  # Alternativa
```

### 2. Obtener API Keys

#### Firecrawl (Scraping)

1. Ir a https://firecrawl.dev
2. Crear cuenta (gratis: 500 créditos/mes)
3. Copiar API Key desde el dashboard
4. Añadir a `.env.local` como `FIRECRAWL_API_KEY`

#### Gemini (Embeddings)

1. Ir a https://aistudio.google.com/app/apikey
2. Crear API Key (gratis)
3. Copiar y añadir como `GEMINI_API_KEY`

### 3. Verificar Base de Datos

Asegúrate de que las tablas existen:

```bash
# Aplicar migraciones
pnpm db:push

# Verificar en Drizzle Studio
pnpm db:studio
```

Tablas requeridas:

- ✅ `documents` - Metadata de documentos scrapeados
- ✅ `embeddings` - Vectores de embeddings (768 dimensiones)
- ✅ `profiles` - Campo `ragDocuments` (JSONB)

## 🧪 Testing

### Test Automático

```bash
# Ejecutar script de verificación
node scripts/test-auto-rag.mjs

# Test con URL específica
node scripts/test-auto-rag.mjs https://wallie.pro
```

El script verifica:

1. ✅ Conexión con Firecrawl API
2. ✅ Scraping de contenido
3. ✅ Conexión con Supabase
4. ✅ Schema de tablas `documents` y `embeddings`

### Test Manual (UI)

1. Iniciar aplicación:

```bash
pnpm dev
```

2. Navegar al Wizard Step 6:
   - Ir a `/onboarding` (o donde esté el wizard)
   - Completar Steps 1-5
   - Llegar a Step 6 "Fuente de Verdad"

3. Probar scraping:
   - Escribir URL: `https://wallie.pro`
   - **Dejar el input** (trigger en `onBlur`)
   - Observar:
     - ⏳ Spinner de carga
     - ✅ Checkmark verde al completar
     - 📄 Mensaje: "Contenido extraído: [título] • X.Xk caracteres"

4. Verificar en Database:

```bash
# Abrir Drizzle Studio
pnpm db:studio

# Verificar tabla documents
SELECT * FROM documents ORDER BY created_at DESC LIMIT 10;

# Verificar tabla embeddings (después de que el worker procese)
SELECT * FROM embeddings ORDER BY created_at DESC LIMIT 10;
```

## 🔄 Flujo Completo

```mermaid
sequenceDiagram
    participant User as Usuario (Wizard)
    participant UI as step-06-profile.tsx
    participant API as knowledge-scrape.ts
    participant FC as Firecrawl API
    participant DB as Supabase DB
    participant INN as Inngest
    participant Worker as knowledge-ingestion.ts

    User->>UI: Escribe URL + blur
    UI->>API: scrapeWebsite.mutate({ url })
    API->>FC: POST /v0/scrape
    FC-->>API: { markdown, title, description }
    API->>DB: INSERT INTO documents
    API->>DB: UPDATE profiles.ragDocuments
    API->>INN: send('knowledge/import.requested')
    API-->>UI: { documentId, title, contentLength }
    UI->>User: ✅ Contenido extraído

    INN->>Worker: trigger knowledgeImport
    Worker->>Worker: processDocument()
    Worker->>Worker: generateEmbeddings()
    Worker->>DB: INSERT INTO embeddings (batch)
    Worker->>DB: UPDATE documents.status = 'completed'
    Worker->>INN: send('knowledge/import.completed')
```

## 📊 Estados del Sistema

### Estados de UI (step-06-profile.tsx)

| Estado     | Indicador     | Descripción             |
| ---------- | ------------- | ----------------------- |
| `idle`     | 💡 Info text  | URL vacía o sin validar |
| `scraping` | ⏳ Spinner    | Extrayendo contenido    |
| `success`  | ✅ Checkmark  | Scraping completado     |
| `error`    | ❌ Alert icon | Fallo en scraping       |

### Estados de Documento (documents.status)

| Status       | Descripción                     |
| ------------ | ------------------------------- |
| `pending`    | Creado, esperando procesamiento |
| `processing` | Worker generando embeddings     |
| `completed`  | Embeddings generados ✅         |
| `failed`     | Error en procesamiento          |

## 🐛 Troubleshooting

### Error: "FIRECRAWL_API_KEY not configured"

**Solución:**

```bash
# Verificar que existe en .env.local
grep FIRECRAWL_API_KEY .env.local

# Debe retornar: FIRECRAWL_API_KEY=fc-xxx
```

### Error: "Failed to scrape URL"

**Posibles causas:**

- URL inválida (debe ser http:// o https://)
- Sitio bloquea scraping (robots.txt)
- Firecrawl API alcanzó límite de rate

**Solución:**

- Verificar URL en navegador
- Revisar créditos en https://firecrawl.dev/dashboard
- Probar con otra URL

### Scraping exitoso pero no aparecen embeddings

**Solución:**

1. Verificar que Inngest worker esté corriendo:

```bash
# Verificar logs de Inngest
# (En producción: https://app.inngest.com)
```

2. Verificar eventos en Supabase:

```sql
SELECT * FROM inngest_events
WHERE name = 'knowledge/import.requested'
ORDER BY created_at DESC
LIMIT 10;
```

3. Revisar status del documento:

```sql
SELECT id, name, status, error_message, created_at
FROM documents
ORDER BY created_at DESC
LIMIT 10;
```

### Worker no procesa documentos

**Verificar:**

1. Worker está registrado en `packages/workers/src/index.ts`
2. Evento `knowledge/import.requested` está definido en `packages/api/src/lib/inngest.ts`
3. Payload del evento coincide con interfaz esperada

## 📈 Métricas de Rendimiento

### Tiempos esperados

- **Scraping (Firecrawl)**: 2-5 segundos
- **Generación de embeddings**: 5-15 segundos (depende del tamaño)
- **Total (end-to-end)**: 10-20 segundos

### Límites

- **Firecrawl Free Tier**: 500 créditos/mes (1 scrape = 1 crédito)
- **Embedding size**: 768 dimensiones (Gemini)
- **Max documento size**: ~100k caracteres (chunkeado automáticamente)

## 🎯 Casos de Uso

### Wizard Onboarding (Step 6)

- Usuario escribe URL de su negocio
- Auto-scraping extrae: Servicios, productos, precios, FAQs
- RAG usa este contenido para responder preguntas de clientes

### Knowledge Base Manual

- Admin añade URLs de documentación
- Sistema mantiene knowledge base actualizada
- AI responde con información precisa

### Competencia Analysis

- Scraping de sitios competidores
- Análisis de servicios y pricing
- Generación de insights

## 🚀 Próximas Mejoras

- [ ] **Scraping periódico**: Re-scraping automático cada X días
- [ ] **Multi-URL**: Scraping de múltiples páginas del mismo dominio
- [ ] **Sitemap parsing**: Descubrir automáticamente URLs relevantes
- [ ] **Image OCR**: Extraer texto de imágenes con Firecrawl
- [ ] **PDF support**: Upload directo + parsing con pdf.js
- [ ] **Analytics**: Dashboard con stats de scraping

## 📚 Referencias

- [Firecrawl Docs](https://docs.firecrawl.dev)
- [Inngest Docs](https://www.inngest.com/docs)
- [Drizzle ORM - pgvector](https://orm.drizzle.team/docs/extensions/pg)
- [Gemini Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)

---

**¿Problemas?** Revisa `packages/api/src/routers/knowledge-scrape.ts` para logs detallados de errores.
