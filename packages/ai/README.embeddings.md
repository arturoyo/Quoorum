# Embeddings System - Configuration Guide

## Overview

The embeddings system is provider-agnostic and supports:
- **Cloud providers**: OpenAI
- **Self-hosted**: Ollama (local LLM runtime)
- **Custom**: Any embedding service via HTTP API (including Kubernetes pods)

## Environment Variables

Add these to your `.env.local` file:

```bash
# ============================================
# EMBEDDINGS CONFIGURATION
# ============================================

# OpenAI Embeddings (Cloud, Paid)
OPENAI_API_KEY=sk-proj-...

# Ollama (Self-Hosted, Free)
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434

# Custom Provider (Your AI Pod)
CUSTOM_EMBEDDING_ENABLED=true
CUSTOM_EMBEDDING_NAME="Mi IA Local"
CUSTOM_EMBEDDING_ENDPOINT=http://my-ai-pod.cluster.local:8080
CUSTOM_EMBEDDING_API_KEY=optional-bearer-token
CUSTOM_EMBEDDING_MODEL=default
CUSTOM_EMBEDDING_MODELS=default,fast,accurate
CUSTOM_EMBEDDING_DIMS=768
CUSTOM_EMBEDDING_BATCH=32
```

## Providers

### OpenAI

**Models:**
- `text-embedding-3-small` - 1536 dims, $0.02/1M tokens (recommended)
- `text-embedding-3-large` - 3072 dims, $0.13/1M tokens (best quality)
- `text-embedding-ada-002` - 1536 dims, $0.10/1M tokens (legacy)

**Setup:**
```bash
OPENAI_API_KEY=sk-proj-...
```

### Ollama (Self-Hosted)

**Models:**
- `all-minilm` - 768 dims, fast, good quality
- `nomic-embed-text` - 768 dims, strong performance
- `mxbai-embed-large` - 1024 dims, best quality

**Setup:**
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull all-minilm`
3. Enable in env:
```bash
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
```

### Custom Provider (AI Pod)

For self-hosted AI in Kubernetes pods or any custom embedding service.

**Required API Endpoints:**
- `POST /embeddings` - Single embedding
- `POST /embeddings/batch` - Batch embeddings (optional, falls back to sequential)
- `GET /health` - Health check

**Request Format (Single):**
```json
{
  "text": "Hello world",
  "model": "default"
}
```

**Response Format (Single):**
```json
{
  "embedding": [0.123, -0.456, 0.789, ...]
}
```

**Request Format (Batch):**
```json
{
  "texts": ["Hello", "World"],
  "model": "default"
}
```

**Response Format (Batch):**
```json
{
  "embeddings": [
    [0.123, -0.456, ...],
    [0.789, 0.012, ...]
  ]
}
```

**Setup:**
```bash
CUSTOM_EMBEDDING_ENABLED=true
CUSTOM_EMBEDDING_NAME="Mi IA Local"
CUSTOM_EMBEDDING_ENDPOINT=http://my-ai-pod:8080
CUSTOM_EMBEDDING_API_KEY=optional-token
CUSTOM_EMBEDDING_DIMS=768
CUSTOM_EMBEDDING_BATCH=32
```

## Usage

```typescript
import { generateEmbedding, generateEmbeddings } from '@quoorum/ai/embeddings'

// Single embedding
const result = await generateEmbedding('Hello world', {
  provider: 'openai', // or 'local-ollama', 'custom'
  userId: 'user-123', // Uses user preferences if available
})

console.log(result.embedding) // [0.123, -0.456, ...]
console.log(result.dimensions) // 1536
console.log(result.cost) // 0.00001 (USD)
console.log(result.provider) // 'openai'

// Batch embeddings
const batchResult = await generateEmbeddings(
  ['Hello world', 'Goodbye world'],
  { provider: 'local-ollama' } // Free!
)

console.log(batchResult.embeddings.length) // 2
console.log(batchResult.totalCost) // 0 (local is free)
```

## Provider Selection

The system automatically selects the best provider based on:
1. Explicit `provider` option
2. User preferences (from database)
3. Company preferences (from database)
4. Default provider (first healthy one)
5. Automatic fallback if selected provider fails

## Health Checks

```typescript
import { checkProvidersHealth, listEmbeddingProviders } from '@quoorum/ai/embeddings'

// Check all providers
const health = await checkProvidersHealth()
console.log(health) // { openai: true, 'local-ollama': false, custom: true }

// List providers with status
const providers = await listEmbeddingProviders()
console.log(providers)
// [
//   { name: 'openai', displayName: 'OpenAI Embeddings', healthy: true, cost: 'paid' },
//   { name: 'local-ollama', displayName: 'Ollama (Local)', healthy: false, cost: 'free' },
//   { name: 'custom', displayName: 'Mi IA Local', healthy: true, cost: 'free' }
// ]
```

## Cost Comparison

| Provider | Dimensions | Cost per 1M tokens | Notes |
|----------|------------|-------------------|-------|
| OpenAI (small) | 1536 | $0.02 | Fast, reliable |
| OpenAI (large) | 3072 | $0.13 | Best quality |
| Ollama | 768-1024 | $0 | Local, private |
| Custom Pod | Variable | $0 | Your hardware |

## Best Practices

1. **Use OpenAI** for production if budget allows (reliable, fast)
2. **Use Ollama** for development and privacy-sensitive data
3. **Use Custom Pod** for full control and zero marginal cost
4. **Enable fallback** to avoid downtime if primary provider fails
5. **Set dimensions** in database schema based on chosen provider
