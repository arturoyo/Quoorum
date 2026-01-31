# 🛠️ Stack Tecnológico

> **Stack aprobado (NO cambiar sin autorización)**

---

## 📋 STACK APROBADO

| Categoría | Tecnología | Alternativas Prohibidas |
|-----------|------------|------------------------|
| **Framework** | Next.js 14+ (App Router) | Pages Router, Remix, Gatsby |
| **Lenguaje** | TypeScript 5+ (strict) | JavaScript puro |
| **Estilos** | Tailwind CSS + shadcn/ui | CSS Modules, styled-components |
| **API** | tRPC v11+ | REST directo, GraphQL |
| **ORM** | Drizzle ORM | Prisma, TypeORM, Sequelize |
| **Database** | PostgreSQL (local Docker) | MongoDB, MySQL, Firebase |
| **Auth** | Supabase Auth | NextAuth, Clerk, Auth0 |
| **Validación** | Zod | Yup, Joi, class-validator |
| **State** | Zustand / TanStack Query | Redux, MobX, Recoil |
| **Testing** | Vitest + Playwright | Jest (excepto legacy) |
| **IA** | OpenAI / Anthropic / Google AI / Groq | Modelos no aprobados |
| **Monorepo** | Turborepo + pnpm | npm, yarn workspaces |
| **Monitoring** | Sentry | Alternativas sin aprobar |
| **Analytics** | PostHog | Mixpanel, Amplitude |
| **Background Jobs** | Inngest | BullMQ, Agenda |

---

## 📦 LIBRERÍAS APROBADAS

### UI

```json
{
  "ui": [
    "@radix-ui/*",
    "lucide-react",
    "framer-motion",
    "sonner"
  ]
}
```

### Forms

```json
{
  "forms": [
    "react-hook-form",
    "@hookform/resolvers"
  ]
}
```

### Dates

```json
{
  "dates": ["date-fns"]
}
```

### Utils

```json
{
  "utils": [
    "clsx",
    "tailwind-merge",
    "superjson"
  ]
}
```

### Charts

```json
{
  "charts": ["recharts"]
}
```

### Tables

```json
{
  "tables": ["@tanstack/react-table"]
}
```

### Emails

```json
{
  "emails": [
    "@react-email/*",
    "resend"
  ]
}
```

### Files

```json
{
  "files": [
    "uploadthing",
    "@vercel/blob"
  ]
}
```

### AI

```json
{
  "ai": [
    "openai",
    "@anthropic-ai/sdk",
    "@google/generative-ai",
    "groq-sdk",
    "langchain",
    "@langchain/openai",
    "@langchain/anthropic"
  ]
}
```

### Monitoring

```json
{
  "monitoring": [
    "@sentry/nextjs",
    "@sentry/node"
  ]
}
```

### Analytics

```json
{
  "analytics": [
    "posthog-js",
    "posthog-node"
  ]
}
```

### Jobs

```json
{
  "jobs": ["inngest"]
}
```

### Messaging

```json
{
  "messaging": ["@emoji-mart/*"]
}
```

### PDF

```json
{
  "pdf": [
    "@react-pdf/renderer",
    "jspdf"
  ]
}
```

### Rate Limiting

```json
{
  "rate-limiting": [
    "@upstash/ratelimit",
    "@upstash/redis"
  ]
}
```

---

## 🚫 ALTERNATIVAS PROHIBIDAS

### ❌ NO USAR

- **CSS-in-JS:** styled-components, Emotion, Stitches
- **State Management:** Redux Toolkit, MobX, Recoil, Jotai
- **Forms:** Formik, Final Form
- **Query:** SWR (usar TanStack Query)
- **ORM:** Prisma, TypeORM, Sequelize
- **Testing:** Jest para nuevos tests (legacy ok)
- **Package Manager:** npm, yarn (usar pnpm)

---

## 📌 JUSTIFICACIONES

### ¿Por qué Drizzle y no Prisma?

- ✅ SQL-like syntax (más familiar)
- ✅ Type-safe sin generación de código
- ✅ Mejor performance
- ✅ Más control sobre queries

### ¿Por qué tRPC y no REST/GraphQL?

- ✅ End-to-end type safety
- ✅ No codegen necesario
- ✅ Mejor DX (Developer Experience)
- ✅ Menos boilerplate

### ¿Por qué Vitest y no Jest?

- ✅ Más rápido
- ✅ ESM nativo
- ✅ Compatible con Vite
- ✅ Mejor experiencia de debugging

### ¿Por qué pnpm y no npm/yarn?

- ✅ Más rápido
- ✅ Ahorra espacio en disco
- ✅ Monorepo-friendly
- ✅ Strict mode por defecto

---

## 🔄 PROCESO PARA AÑADIR NUEVA LIBRERÍA

Si necesitas añadir una librería NO listada aquí:

1. **Buscar alternativa aprobada** en la lista
2. **Justificar por qué es necesaria** la nueva librería
3. **Proponer en PR** con justificación completa
4. **Esperar aprobación** antes de instalar
5. **Documentar decisión** en este archivo

### Template de Justificación

```markdown
## Propuesta: [Nombre Librería]

**Problema:** [Qué problema resuelve]
**Alternativa actual:** [Qué usamos ahora]
**Por qué no sirve:** [Limitaciones de la alternativa]
**Beneficios:** [Qué aporta la nueva librería]
**Riesgos:** [Posibles problemas]
**Mantenimiento:** [Estado del proyecto, comunidad]
**Bundle size:** [Impacto en el bundle]
```

---

## 📊 STACK ESTADÍSTICAS

**Estado actual (26 Ene 2026):**
- ✅ **Packages del proyecto:** 7 (ai, api, core, db, quoorum, ui, workers)
- ✅ **Dependencias totales:** ~150
- ✅ **Bundle size (web):** ~300KB (gzipped)
- ✅ **Build time:** ~2 min
- ✅ **Type check time:** ~30 seg

---

_Ver documentación completa en [CLAUDE.md](../../CLAUDE.md#stack-tecnológico)_
