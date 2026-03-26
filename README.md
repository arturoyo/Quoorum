# Quoorum - Sistema de Deliberación Multi-Agente con IA

> Estado actual del repo: hay documentación, tests e integraciones en transición. Antes de asumir que el proyecto está "verde", ejecuta `pnpm typecheck`, `pnpm test` y revisa [CLAUDE.md](./CLAUDE.md).

> **Quoorum es la única plataforma que simula un Comité Ejecutivo de expertos de IA (la Capa de Inteligencia Corporativa) para debatir, criticar y sintetizar la mejor decisión estratégica, eliminando los sesgos humanos y la lentitud de las reuniones, y entregando un consenso accionable en minutos.**

**🌐 Website:** [quoorum.pro](https://quoorum.pro)

---

## Descripción

Quoorum es la única plataforma que simula un **Comité Ejecutivo de expertos de IA** (la **Capa de Inteligencia Corporativa**) para debatir, criticar y sintetizar la mejor decisión estratégica. 

**Elimina los sesgos humanos y la lentitud de las reuniones**, entregando un **consenso accionable en minutos** en lugar de semanas de reuniones interminables.

El sistema selecciona dinámicamente entre 25+ expertos especializados según la naturaleza de la pregunta, cada uno con conocimientos profundos en diferentes dominios (estrategia, finanzas, tecnología, ética, marketing, operaciones, etc.), simulando un verdadero comité ejecutivo que debate hasta alcanzar consenso.

### Características Principales

- **25+ Expertos Especializados**: Sistema dinámico que selecciona los expertos más relevantes según la pregunta
- **Debates Auto-Mejorados**: Quality Monitor que detecta argumentos superficiales y redirige hacia mayor profundidad
- **Memoria Institucional**: Búsqueda semántica de debates similares del pasado
- **Consenso Inteligente**: Algoritmo que detecta acuerdo (threshold 70%)
- **Meta-Moderador**: Interviene automáticamente cuando la calidad del debate baja
- **Sistema de Aprendizaje**: Mejora continua basada en debates pasados
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
git clone https://github.com/arturoyo/Quoorum.git
cd quoorum

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
DATABASE_URL="postgresql://user:password@localhost:5432/quoorum"

# OpenAI (requerido para debates)
OPENAI_API_KEY="sk-..."

# Pinecone (opcional, para búsqueda vectorial)
PINECONE_API_KEY="..."
PINECONE_INDEX="quoorum-debates"

# Redis (opcional, para cache)
REDIS_URL="redis://localhost:6379"

# Email (opcional)
QUOORUM_EMAIL_FROM="Quoorum <noreply@quoorum.pro>"

# Aplicación
NEXT_PUBLIC_APP_URL="https://quoorum.pro"
NODE_ENV="development"
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                     │
│                         apps/web/                            │
│                  Landing 2026-27 Design                      │
├─────────────────────────────────────────────────────────────┤
│                      API (tRPC v11)                          │
│                      packages/api/                           │
├─────────────────────────────────────────────────────────────┤
│                   QUOORUM ENGINE                             │
│                    packages/quoorum/                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  25+ Expertos Especializados (Selección Dinámica)    │   │
│  │  Strategy | Finance | Tech | Ethics | Legal | etc.   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Quality Monitor│  │Meta-Moderator│  │Learning System│     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                    DATABASE (Drizzle)                        │
│                       packages/db/                           │
├─────────────────────────────────────────────────────────────┤
│              INFRAESTRUCTURA (PostgreSQL)                    │
└─────────────────────────────────────────────────────────────┘
```

### Packages del Monorepo

| Paquete              | Propósito                                    | Dependencias Clave       |
| -------------------- | -------------------------------------------- | ------------------------ |
| `@quoorum/quoorum`   | Motor de debates multi-agente                | OpenAI, Pinecone, Redis  |
| `@quoorum/api`       | tRPC routers para la API                     | tRPC, Zod                |
| `@quoorum/db`        | Schemas y cliente de base de datos           | Drizzle ORM, PostgreSQL  |
| `@quoorum/ai`        | Providers de IA (OpenAI, Anthropic, etc.)    | OpenAI, Anthropic, Groq  |
| `@quoorum/core`      | Utilidades compartidas                       | TypeScript               |
| `@quoorum/ui`        | Componentes UI compartidos                   | React, Tailwind          |

### Estructura de Carpetas

```
quoorum/
├── apps/
│   └── web/                  # Next.js App
│       ├── src/app/          # Pages (App Router)
│       ├── src/components/   # Componentes React
│       └── src/lib/          # Utilidades cliente
│
├── packages/
│   ├── quoorum/              # Motor de debates
│   │   ├── src/
│   │   │   ├── runner.ts     # Orquestador de debates
│   │   │   ├── consensus.ts  # Algoritmo de consenso
│   │   │   ├── expert-database.ts # 25+ expertos
│   │   │   ├── quality-monitor.ts # Control de calidad
│   │   │   ├── meta-moderator.ts  # Meta-moderador
│   │   │   ├── learning-system.ts # Sistema de aprendizaje
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
│   ├── ui/                   # Componentes UI
│   │   └── src/components/
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
import { runDebate } from '@quoorum/quoorum';

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
console.log(result.qualityMetrics);  // Métricas de calidad del debate
```

### Buscar Debates Similares

```typescript
import { searchSimilarDebates } from '@quoorum/quoorum/question-similarity';

const similar = await searchSimilarDebates('¿Deberíamos expandir?', {
  topK: 5,
  minConsensus: 0.7,
});

// Retorna debates anteriores con preguntas similares
```

### Exportar Debate a PDF

```typescript
import { exportDebateToPDF } from '@quoorum/quoorum/pdf-export';

const pdfBuffer = await exportDebateToPDF(result);
// Guardar o enviar el PDF
```

### API REST (tRPC)

```typescript
// Cliente
import { api } from '@/lib/trpc';

// Iniciar debate
const debate = await api.debates.create.mutate({
  question: '¿Deberíamos invertir en AI?',
  context: 'Contexto relevante...',
});

// Obtener resultado
const result = await api.debates.get.query({ id: debate.id });

// Listar debates del usuario
const debates = await api.debates.list.query({ limit: 10 });
```

---

## Sistema de Expertos

Quoorum cuenta con 25+ expertos especializados que se seleccionan dinámicamente según la pregunta:

### Categorías de Expertos

| Categoría | Expertos |
| --------- | -------- |
| **Estrategia** | Strategy Expert, Business Model Expert, Innovation Expert |
| **Finanzas** | Financial Analyst, Investment Advisor, Risk Manager |
| **Tecnología** | Tech Architect, Data Scientist, Security Expert |
| **Operaciones** | Operations Manager, Supply Chain Expert, Quality Expert |
| **Marketing** | Marketing Strategist, Brand Expert, Growth Hacker |
| **Legal & Compliance** | Legal Advisor, Compliance Officer, Ethics Expert |
| **Recursos Humanos** | HR Specialist, Culture Expert, Talent Acquisition |
| **Producto** | Product Manager, UX Expert, Customer Success |

### Selección Dinámica

El sistema analiza la pregunta y selecciona automáticamente los 4-6 expertos más relevantes para el debate.

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

### Quality Monitor

El Quality Monitor evalúa cada mensaje en 3 dimensiones:
- **Profundidad**: Presencia de datos, razonamiento causal, ejemplos
- **Diversidad**: Variedad de perspectivas y enfoques
- **Originalidad**: Aportaciones nuevas vs repetición

### Meta-Moderador

Interviene cuando detecta problemas:
- Argumentos superficiales
- Falta de diversidad
- Consenso prematuro
- Repetición excesiva

---

## Comandos

### Desarrollo

```bash
pnpm dev              # Iniciar desarrollo
pnpm build            # Build producción
pnpm typecheck        # Verificar TypeScript
pnpm lint             # Ejecutar linter
pnpm test             # Ejecutar tests (166 tests)
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
pnpm --filter @quoorum/quoorum demo

# Ejecutar debate desde CLI
pnpm --filter @quoorum/quoorum cli "¿Deberíamos invertir en Bitcoin?"
```

---

## Testing

```bash
# Ejecutar todos los tests
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests de un paquete específico
pnpm --filter @quoorum/quoorum test
pnpm --filter @quoorum/api test
```

`pnpm test` incluye pruebas que requieren PostgreSQL local. Si no tienes DB levantada, parte de la suite de integración fallará.

### Cobertura de Tests

- La cobertura y el conteo exacto deben obtenerse ejecutando `pnpm test:coverage`.
- No uses cifras hardcodeadas de tests pasados como señal de salud actual.
- El estado operativo real debe verificarse en tu entorno local antes de mergear o desplegar.

---

## CI/CD

Este repo no incluye GitHub Actions en su estado actual.

- Desarrollo local: scripts de validación (`pnpm validate:env`, `pnpm typecheck`, `pnpm test`)
- Hooks locales: Husky
- Deploy: Vercel para la app web

Si necesitas CI en GitHub, hay que crear `.github/workflows/` explícitamente; no existe hoy.

---

## Configuración Avanzada

### Pinecone (Búsqueda Vectorial)

Para habilitar búsqueda de debates similares:

1. Crear cuenta en [Pinecone](https://www.pinecone.io/)
2. Crear índice `quoorum-debates` con dimensión 1536
3. Configurar variables:

```env
PINECONE_API_KEY="your-api-key"
PINECONE_INDEX="quoorum-debates"
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

## Deployment

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build imagen
docker build -t quoorum .

# Run container
docker run -p 3000:3000 quoorum
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
| Framework     | Next.js 15 (App Router) |
| Lenguaje      | TypeScript 5+        |
| Estilos       | Tailwind CSS + shadcn/ui |
| API           | tRPC v11             |
| ORM           | Drizzle ORM          |
| Database      | PostgreSQL           |
| IA            | OpenAI, Anthropic, Google AI, Groq |
| Testing       | Vitest (166 tests)   |
| Monorepo      | Turborepo + pnpm     |

---

## Roadmap

- [ ] Integración con más providers de IA
- [ ] Dashboard de analytics avanzado
- [ ] API pública REST/GraphQL
- [ ] Mobile app (React Native)
- [ ] Integración con Slack/Teams
- [ ] Webhooks para eventos
- [ ] Multi-idioma (i18n)

---

_Quoorum v1.0.0_  
_Sistema de Deliberación Multi-Agente con IA_  
_[quoorum.pro](https://quoorum.pro)_
