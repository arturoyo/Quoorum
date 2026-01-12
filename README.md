# Forum - Sistema de Deliberación Multi-Agente

> Sistema de debates AI multi-agente para validar decisiones complejas mediante consenso inteligente.

---

## Descripción

Forum es un sistema de deliberación que simula debates entre múltiples agentes AI especializados para analizar preguntas complejas y llegar a un consenso fundamentado. Cada agente tiene un rol específico (optimizador, crítico, analista, sintetizador) que aporta una perspectiva única al debate.

### Características Principales

- **Multi-Agente**: 4 agentes especializados con roles distintos
- **Consenso Inteligente**: Algoritmo que detecta acuerdo (threshold 70%)
- **Búsqueda Vectorial**: Pinecone para encontrar debates similares
- **Exportación PDF**: Genera reportes profesionales con Puppeteer
- **Cache Redis**: Optimización de respuestas frecuentes
- **WebSockets**: Debates en tiempo real

---

## Quick Start

### Requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL (o Supabase)
- Redis (opcional, para cache)

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd forum

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Aplicar migraciones de base de datos
pnpm db:push

# Iniciar desarrollo
pnpm dev
```

### Variables de Entorno

```env
# Base de datos (requerido)
DATABASE_URL="postgresql://user:password@localhost:5432/forum"

# OpenAI (requerido para debates)
OPENAI_API_KEY="sk-..."

# Pinecone (opcional, para búsqueda vectorial)
PINECONE_API_KEY="..."
PINECONE_INDEX="forum-debates"

# Redis (opcional, para cache)
REDIS_URL="redis://localhost:6379"

# Aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                     │
│                         apps/web/                            │
├─────────────────────────────────────────────────────────────┤
│                      API (tRPC v11)                          │
│                      packages/api/                           │
├─────────────────────────────────────────────────────────────┤
│                   FORUM ENGINE                               │
│                    packages/forum/                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Optimizer │  │ Critic   │  │ Analyst  │  │Synthesizer│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    DATABASE (Drizzle)                        │
│                       packages/db/                           │
├─────────────────────────────────────────────────────────────┤
│              INFRAESTRUCTURA (PostgreSQL)                    │
└─────────────────────────────────────────────────────────────┘
```

### Packages del Monorepo

| Paquete        | Propósito                                    | Dependencias Clave       |
| -------------- | -------------------------------------------- | ------------------------ |
| `@forum/forum` | Motor de debates multi-agente                | OpenAI, Pinecone, Redis  |
| `@forum/api`   | tRPC routers para la API                     | tRPC, Zod                |
| `@forum/db`    | Schemas y cliente de base de datos           | Drizzle ORM, PostgreSQL  |
| `@forum/ai`    | Providers de IA (OpenAI, Anthropic, etc.)    | OpenAI, Anthropic, Groq  |
| `@forum/core`  | Utilidades compartidas                       | TypeScript               |

### Estructura de Carpetas

```
forum/
├── apps/
│   └── web/                  # Next.js App
│       ├── src/app/          # Pages (App Router)
│       ├── src/components/   # Componentes React
│       └── src/lib/          # Utilidades cliente
│
├── packages/
│   ├── forum/                # Motor de debates
│   │   ├── src/
│   │   │   ├── runner.ts     # Orquestador de debates
│   │   │   ├── consensus.ts  # Algoritmo de consenso
│   │   │   ├── ai-assistant.ts # Agentes AI
│   │   │   └── integrations/ # Pinecone, Redis, etc.
│   │   └── package.json
│   │
│   ├── api/                  # tRPC routers
│   │   └── src/routers/
│   │
│   ├── db/                   # Database layer
│   │   └── src/schema/
│   │
│   ├── ai/                   # Providers de IA
│   │   └── src/providers/
│   │
│   └── core/                 # Utilidades compartidas
│
├── .env.example              # Variables de entorno
├── vitest.config.ts          # Configuración de tests
└── README.md                 # Este archivo
```

---

## Uso

### Ejecutar un Debate Programáticamente

```typescript
import { runDebate } from '@forum/forum';

const result = await runDebate({
  sessionId: 'session-123',
  question: '¿Deberíamos expandir a mercados internacionales?',
  context: {
    sources: [],
    combinedContext: 'La empresa tiene 50 empleados y $2M en revenue...',
  },
  onRoundComplete: async (round) => {
    console.log(`Ronda ${round.round} completada`);
  },
});

// Resultado
console.log(result.consensusScore);  // 0.85 (85% consenso)
console.log(result.ranking);         // [{ option: 'Sí', successRate: 85 }, ...]
console.log(result.rounds);          // Array de rondas
console.log(result.totalCostUsd);    // 0.023
```

### Buscar Debates Similares

```typescript
import { searchSimilarDebates } from '@forum/forum/integrations/pinecone';

const similar = await searchSimilarDebates('¿Deberíamos expandir?', {
  topK: 5,
  minConsensus: 0.7,
});

// Retorna debates anteriores con preguntas similares
```

### Exportar Debate a PDF

```typescript
import { exportDebateToPDF } from '@forum/forum/pdf-export';

const pdfBuffer = await exportDebateToPDF(result);
// Guardar o enviar el PDF
```

### API REST (tRPC)

```typescript
// Cliente
import { api } from '@/lib/trpc';

// Iniciar debate
const debate = await api.forum.startDebate.mutate({
  question: '¿Deberíamos invertir en AI?',
  context: 'Contexto relevante...',
});

// Obtener resultado
const result = await api.forum.getDebate.query({ id: debate.id });

// Listar debates del usuario
const debates = await api.forum.list.query({ limit: 10 });
```

---

## Algoritmo de Consenso

El sistema utiliza un algoritmo de consenso basado en:

1. **Extracción de Opciones**: Analiza mensajes de todos los agentes
2. **Cálculo de Success Rate**: Probabilidad de éxito por opción (0-100%)
3. **Criterios de Consenso**:
   - Consenso fuerte: Top option >= 70% success rate
   - Gap significativo: Diferencia >= 30% con segunda opción
   - Mínimo 3 rondas completadas
4. **Máximo 20 rondas**: Si no hay consenso, se termina con mejor opción

### Agentes Especializados

| Agente       | Rol                                    |
| ------------ | -------------------------------------- |
| Optimizer    | Busca la mejor solución posible        |
| Critic       | Identifica riesgos y problemas         |
| Analyst      | Analiza datos y métricas               |
| Synthesizer  | Resume y encuentra puntos en común     |

---

## Comandos

### Desarrollo

```bash
pnpm dev              # Iniciar desarrollo
pnpm build            # Build producción
pnpm typecheck        # Verificar TypeScript
pnpm lint             # Ejecutar linter
pnpm test             # Ejecutar tests
```

### Base de Datos

```bash
pnpm db:generate      # Generar migraciones
pnpm db:push          # Aplicar migraciones
pnpm db:studio        # Abrir Drizzle Studio
```

### Demo CLI

```bash
# Ejecutar demo interactiva
pnpm --filter @forum/forum demo

# Ejecutar debate desde CLI
pnpm --filter @forum/forum cli "¿Deberíamos invertir en Bitcoin?"
```

---

## Testing

```bash
# Ejecutar todos los tests
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests de un paquete específico
pnpm --filter @forum/forum test
pnpm --filter @forum/api test
```

### Estructura de Tests

```
packages/
├── forum/
│   └── src/__tests__/
│       ├── runner.test.ts
│       ├── consensus.test.ts
│       └── ai-assistant.test.ts
│
└── api/
    └── src/routers/__tests__/
        └── forum.test.ts
```

---

## CI/CD

El proyecto usa GitHub Actions para CI/CD:

- **Validate**: TypeScript check en todo el monorepo
- **Test**: Tests unitarios (API + Forum)
- **Build**: Build de producción

Ver `.github/workflows/ci.yml` para detalles.

---

## Configuración Avanzada

### Pinecone (Búsqueda Vectorial)

Para habilitar búsqueda de debates similares:

1. Crear cuenta en [Pinecone](https://www.pinecone.io/)
2. Crear índice `forum-debates` con dimensión 1536
3. Configurar variables:

```env
PINECONE_API_KEY="your-api-key"
PINECONE_INDEX="forum-debates"
```

### Redis (Cache)

Para habilitar cache de respuestas:

```env
REDIS_URL="redis://localhost:6379"
```

### Múltiples Providers de IA

El sistema soporta múltiples providers:

```env
# OpenAI (principal)
OPENAI_API_KEY="sk-..."

# Anthropic (fallback)
ANTHROPIC_API_KEY="sk-ant-..."

# Google (fallback)
GOOGLE_AI_API_KEY="..."

# Groq (fallback rápido)
GROQ_API_KEY="..."
```

---

## Contribuir

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/mi-feature`
3. Commit: `git commit -m "feat: mi nueva feature"`
4. Push: `git push origin feature/mi-feature`
5. Crear Pull Request

### Reglas de Código

- TypeScript strict mode
- Sin `any` types
- Tests obligatorios para features nuevas
- Commits semánticos (`feat:`, `fix:`, `docs:`, etc.)

---

## Licencia

MIT

---

## Stack Tecnológico

| Categoría     | Tecnología           |
| ------------- | -------------------- |
| Framework     | Next.js 14 (App Router) |
| Lenguaje      | TypeScript 5+        |
| Estilos       | Tailwind CSS + shadcn/ui |
| API           | tRPC v11             |
| ORM           | Drizzle ORM          |
| Database      | PostgreSQL           |
| IA            | OpenAI, Anthropic, Google AI, Groq |
| Testing       | Vitest               |
| Monorepo      | Turborepo + pnpm     |

---

_Forum v1.0.0_
_Sistema de Deliberación Multi-Agente_
