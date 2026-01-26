# 🛠️ STACK.md — Stack Tecnológico de Quoorum

> **Versión:** 1.0.1 | **Última actualización:** 24 Dic 2025
> **Para:** Referencia rápida de tecnologías aprobadas y prohibidas

---

## 📋 ÍNDICE

1. [Stack Principal](#-stack-principal)
2. [Librerías Aprobadas](#-librerías-aprobadas)
3. [Alternativas Prohibidas](#-alternativas-prohibidas)
4. [Versiones Mínimas](#-versiones-mínimas)
5. [Configuración del Entorno](#-configuración-del-entorno)

---

## 🎯 STACK PRINCIPAL

### Core Technologies

| Categoría           | Tecnología  | Versión | Propósito                     |
| ------------------- | ----------- | ------- | ----------------------------- |
| **Framework**       | Next.js 14+ | ^14.2.0 | App Router, Server Components |
| **Lenguaje**        | TypeScript  | ^5.3.0  | Strict mode obligatorio       |
| **Runtime**         | Node.js     | ^20.0.0 | LTS version                   |
| **Package Manager** | pnpm        | ^8.0.0  | Workspaces, fast installs     |
| **Monorepo**        | Turborepo   | ^2.0.0  | Build orchestration           |

### Frontend

| Categoría        | Tecnología    | Propósito                   |
| ---------------- | ------------- | --------------------------- |
| **UI Framework** | React 18      | Server + Client Components  |
| **Styling**      | Tailwind CSS  | Utility-first CSS           |
| **Components**   | shadcn/ui     | Componentes base (Radix UI) |
| **Icons**        | Lucide React  | Iconografía consistente     |
| **Animations**   | Framer Motion | Animaciones declarativas    |
| **Toasts**       | Sonner        | Notificaciones elegantes    |

### Backend / API

| Categoría      | Tecnología        | Propósito                     |
| -------------- | ----------------- | ----------------------------- |
| **API Layer**  | tRPC v11          | Type-safe API, end-to-end     |
| **Validation** | Zod               | Schema validation runtime     |
| **ORM**        | Drizzle ORM       | Type-safe queries, migrations |
| **Database**   | PostgreSQL        | Via Supabase                  |
| **Auth**       | Supabase Auth     | OAuth, Magic Links, Phone OTP |
| **Realtime**   | Supabase Realtime | WebSocket subscriptions       |

### AI / Machine Learning

| Categoría          | Tecnología | Propósito              |
| ------------------ | ---------- | ---------------------- |
| **Primary LLM**    | OpenAI     | GPT-4, GPT-4-Turbo     |
| **Secondary LLM**  | Anthropic  | Claude Sonnet, Opus    |
| **Tertiary LLM**   | Google AI  | Gemini Pro, Flash      |
| **Fast Inference** | Groq       | LLaMA inference rápido |
| **Orchestration**  | LangChain  | Chains, agents, tools  |
| **Voice AI**       | ElevenLabs | Text-to-speech         |

### Infrastructure

| Categoría           | Tecnología    | Propósito                    |
| ------------------- | ------------- | ---------------------------- |
| **Hosting**         | Vercel        | Edge Functions, auto-scaling |
| **Database**        | Supabase      | PostgreSQL managed           |
| **Background Jobs** | Inngest       | Event-driven workers         |
| **Rate Limiting**   | Upstash Redis | Serverless Redis             |
| **File Storage**    | Vercel Blob   | Object storage               |
| **GPU Computing**   | RunPod        | Heavy AI workloads           |

### Monitoring & Analytics

| Categoría          | Tecnología        | Propósito                        |
| ------------------ | ----------------- | -------------------------------- |
| **Error Tracking** | Sentry            | Frontend + Backend errors        |
| **Analytics**      | PostHog           | Product analytics, feature flags |
| **Logging**        | Structured Logger | JSON logs → Sentry               |

### Integrations

| Categoría      | Tecnología          | Propósito               |
| -------------- | ------------------- | ----------------------- |
| **WhatsApp**   | Cloud API + Baileys | Messaging oficial + dev |
| **Email Sync** | Gmail API           | OAuth2 sync             |
| **Email Send** | Resend              | Transactional emails    |
| **Payments**   | Stripe              | Subscriptions, webhooks |
| **Calendar**   | Google Calendar API | Scheduling              |

---

## 📦 LIBRERÍAS APROBADAS

### UI & Components

```json
{
  "ui": ["@radix-ui/*", "lucide-react", "framer-motion", "sonner", "@headlessui/react"],
  "forms": ["react-hook-form", "@hookform/resolvers"],
  "tables": ["@tanstack/react-table"],
  "charts": ["recharts"],
  "dates": ["date-fns"],
  "rich-text": ["@tiptap/react", "@tiptap/starter-kit"]
}
```

### Data & State

```json
{
  "state": ["zustand", "@tanstack/react-query", "jotai"],
  "validation": ["zod"],
  "utils": ["clsx", "tailwind-merge", "superjson", "nanoid"]
}
```

### Backend & API

```json
{
  "api": ["@trpc/server", "@trpc/client", "@trpc/react-query"],
  "database": ["drizzle-orm", "drizzle-kit", "@supabase/supabase-js"],
  "auth": ["@supabase/ssr"]
}
```

### AI & ML

```json
{
  "ai": [
    "openai",
    "@anthropic-ai/sdk",
    "@google/generative-ai",
    "groq-sdk",
    "langchain",
    "@langchain/openai",
    "@langchain/anthropic",
    "@langchain/google-genai"
  ],
  "voice": ["elevenlabs"],
  "embeddings": ["@pinecone-database/pinecone"]
}
```

### Integrations

```json
{
  "whatsapp": ["@whiskeysockets/baileys"],
  "email": ["@react-email/*", "resend", "googleapis"],
  "payments": ["stripe"],
  "messaging": ["@emoji-mart/*"],
  "pdf": ["@react-pdf/renderer", "jspdf"]
}
```

### DevOps & Monitoring

```json
{
  "monitoring": ["@sentry/nextjs", "@sentry/node"],
  "analytics": ["posthog-js", "posthog-node"],
  "jobs": ["inngest"],
  "rate-limiting": ["@upstash/ratelimit", "@upstash/redis"]
}
```

### Development

```json
{
  "testing": ["vitest", "@testing-library/react", "playwright"],
  "linting": ["eslint", "@typescript-eslint/*", "prettier", "prettier-plugin-tailwindcss"],
  "git": ["husky", "lint-staged"]
}
```

---

## 🚫 ALTERNATIVAS PROHIBIDAS

### NO usar estas tecnologías

| Categoría      | Prohibido         | Usar en su lugar | Razón                      |
| -------------- | ----------------- | ---------------- | -------------------------- |
| **Router**     | Pages Router      | App Router       | Legacy, menos features     |
| **Styling**    | CSS Modules       | Tailwind         | Inconsistencia             |
| **Styling**    | styled-components | Tailwind         | Runtime overhead           |
| **Styling**    | Emotion           | Tailwind         | Complejidad innecesaria    |
| **API**        | REST directo      | tRPC             | Sin type-safety            |
| **API**        | GraphQL           | tRPC             | Overhead para nuestro caso |
| **ORM**        | Prisma            | Drizzle          | Performance, bundle size   |
| **ORM**        | TypeORM           | Drizzle          | Complejidad                |
| **ORM**        | Sequelize         | Drizzle          | Legacy, sin types          |
| **Database**   | MongoDB           | PostgreSQL       | Relational data            |
| **Database**   | MySQL             | PostgreSQL       | Menos features             |
| **Database**   | Firebase          | Supabase         | Vendor lock-in             |
| **Auth**       | NextAuth          | Supabase Auth    | Ya integrado               |
| **Auth**       | Clerk             | Supabase Auth    | Costo adicional            |
| **Auth**       | Auth0             | Supabase Auth    | Complejidad                |
| **State**      | Redux             | Zustand          | Boilerplate excesivo       |
| **State**      | MobX              | Zustand          | Complejidad                |
| **State**      | Recoil            | Zustand          | Facebook dependency        |
| **Validation** | Yup               | Zod              | Menos type inference       |
| **Validation** | Joi               | Zod              | No TypeScript-first        |
| **Testing**    | Jest              | Vitest           | Más lento, config compleja |
| **Icons**      | Font Awesome      | Lucide           | Bundle size                |
| **Icons**      | Material Icons    | Lucide           | Inconsistencia visual      |

### Librerías específicamente prohibidas

```typescript
// ❌ NUNCA instalar estas dependencias
const BANNED_PACKAGES = [
  'lodash', // → Usar ES native methods
  'moment', // → Usar date-fns
  'axios', // → Usar fetch nativo o tRPC
  'jquery', // → Usar React
  'underscore', // → Usar ES native methods
  'request', // → Deprecated, usar fetch
  'node-fetch', // → Usar fetch nativo (Node 18+)
  'express', // → Usar Next.js API routes
  'cors', // → Configurar en Next.js
  'body-parser', // → Next.js lo incluye
  'dotenv', // → Next.js lo incluye
]
```

---

## 📌 VERSIONES MÍNIMAS

### Runtime

```json
{
  "node": ">=20.0.0",
  "pnpm": ">=8.0.0",
  "npm": "NO USAR - usar pnpm",
  "yarn": "NO USAR - usar pnpm"
}
```

### Core Dependencies

```json
{
  "next": "^14.2.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.3.0",
  "@trpc/server": "^11.0.0",
  "@trpc/client": "^11.0.0",
  "drizzle-orm": "^0.44.0",
  "zod": "^3.23.0"
}
```

### AI SDKs

```json
{
  "openai": "^4.100.0",
  "@anthropic-ai/sdk": "^0.70.0",
  "@google/generative-ai": "^0.24.0",
  "groq-sdk": "^0.35.0",
  "langchain": "^0.3.0"
}
```

---

## ⚙️ CONFIGURACIÓN DEL ENTORNO

### Variables de Entorno Requeridas

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AI...
GROQ_API_KEY=gsk_...

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_WEBHOOK_SECRET=...

# Email
RESEND_API_KEY=re_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# App
NEXT_PUBLIC_APP_URL=https://app.quoorum.ai
```

### TypeScript Config (tsconfig.json)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"],
      "@quoorum/*": ["../../packages/*/src"]
    }
  }
}
```

### ESLint Rules Obligatorias

```javascript
// .eslintrc.cjs
module.exports = {
  rules: {
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // General
    'no-console': 'error',
    'no-debugger': 'error',
    'no-alert': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // React
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Import
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
      },
    ],
  },
}
```

### Tailwind Config

```javascript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // WhatsApp Dark Theme
        'wa-bg-dark': '#111b21',
        'wa-bg-panel': '#202c33',
        'wa-bg-hover': '#2a3942',
        'wa-green': '#00a884',
        'wa-blue': '#53bdeb',
        'wa-text-primary': '#e9edef',
        'wa-text-secondary': '#8696a0',
      },
    },
  },
}
```

---

## 🔄 PROCESO DE ACTUALIZACIÓN

### Cuándo actualizar dependencias

1. **Security patches**: Inmediatamente
2. **Bug fixes (patch)**: Semanal
3. **Minor versions**: Mensual (con testing)
4. **Major versions**: Planificado (con migration plan)

### Comando de actualización

```bash
# Ver outdated
pnpm outdated

# Actualizar patch/minor
pnpm update

# Actualizar major (con cuidado)
pnpm update --latest

# Verificar después de actualizar
pnpm typecheck && pnpm lint && pnpm test
```

---

**Última actualización:** 24 Dic 2025
**Versión:** 1.0.1
**Mantenido por:** Equipo Quoorum
