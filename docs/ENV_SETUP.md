# 🔐 Guía de Configuración de Variables de Entorno

> **Para:** Desarrollo Local y Deploy en Vercel  
> **Última actualización:** 4 Ene 2026

---

## 📋 Resumen Rápido

### Local (Desarrollo)
1. Copia `.env.example` a `.env.local`
2. Rellena las variables críticas
3. Ejecuta `pnpm validate:env` para verificar
4. Ejecuta `pnpm dev` para iniciar

### Vercel (Producción)
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Añade cada variable según el entorno
4. El sistema valida automáticamente en build

---

## 🚀 Setup Local

### Paso 1: Crear archivo .env.local

```bash
# En la raíz del proyecto
cp .env.example .env.local
```

### Paso 2: Configurar variables críticas

Edita `.env.local` y configura al menos estas variables:

```env
# 🔴 CRÍTICAS (Requeridas)
DATABASE_URL="postgresql://user:password@localhost:5432/quoorum"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
OPENAI_API_KEY="sk-..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Paso 3: Validar configuración

```bash
pnpm validate:env
```

Deberías ver:
- ✅ Si todo está correcto
- ❌ Si faltan variables críticas
- ⚠️ Si faltan variables importantes (features deshabilitadas)

### Paso 4: Iniciar desarrollo

```bash
pnpm dev
```

El sistema validará automáticamente las variables al iniciar.

---

## ☁️ Setup Vercel

### Paso 1: Acceder a Environment Variables

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings → Environment Variables**

### Paso 2: Añadir variables por entorno

Para cada variable, selecciona en qué entornos aplica:

- **Production**: Solo producción
- **Preview**: Branches y PRs
- **Development**: Local (si usas Vercel CLI)

#### Variables Críticas (añadir en todos los entornos)

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=https://quoorum.pro
```

#### Variables Importantes (añadir según necesidad)

```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
FROM_EMAIL=Quoorum <noreply@quoorum.pro>
```

#### Variables Opcionales (añadir si usas esas features)

```env
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=quoorum-debates
REDIS_URL=redis://...
SERPER_API_KEY=...
```

### Paso 3: Verificar en Build

Vercel ejecutará la validación automáticamente durante el build. Si hay errores, verás:

```
❌ Environment Validation Errors:
  - DATABASE_URL is required
  ...
```

---

## 📊 Variables por Categoría

### 🔴 CRÍTICAS (App no funciona sin estas)

| Variable | Descripción | Dónde obtener |
|----------|-------------|---------------|
| `DATABASE_URL` | Connection string PostgreSQL | Supabase Dashboard → Settings → Database |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública Supabase | Supabase Dashboard → Settings → API |
| `OPENAI_API_KEY` | API Key de OpenAI | [OpenAI Platform](https://platform.openai.com/api-keys) |

### 🟠 IMPORTANTES (Features principales)

| Variable | Descripción | Dónde obtener |
|----------|-------------|---------------|
| `STRIPE_SECRET_KEY` | Clave secreta Stripe | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública Stripe | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Secret para webhooks | Stripe Dashboard → Webhooks |
| `RESEND_API_KEY` | API Key de Resend | [Resend Dashboard](https://resend.com/api-keys) |
| `FROM_EMAIL` | Email remitente | Tu dominio verificado en Resend |

### 🟡 OPCIONALES (Funcionalidades avanzadas)

| Variable | Descripción | Dónde obtener |
|----------|-------------|---------------|
| `PINECONE_API_KEY` | API Key Pinecone | [Pinecone Console](https://app.pinecone.io/) |
| `REDIS_URL` | Connection string Redis | Upstash, Redis Cloud, o local |
| `SERPER_API_KEY` | API Key Serper | [Serper.dev](https://serper.dev/) |
| `ANTHROPIC_API_KEY` | API Key Anthropic | [Anthropic Console](https://console.anthropic.com/) |
| `GOOGLE_AI_API_KEY` | API Key Google AI | [Google AI Studio](https://makersuite.google.com/app/apikey) |

---

## ✅ Validación Automática

### En Desarrollo

El sistema valida automáticamente al:
- Importar `@/lib/env` en cualquier archivo
- Iniciar el servidor Next.js
- Ejecutar `pnpm validate:env`

### En Vercel

La validación se ejecuta durante:
- Build time (verás errores si faltan variables críticas)
- Runtime (warnings en logs si faltan opcionales)

---

## 🔍 Comandos Útiles

```bash
# Validar variables de entorno
pnpm validate:env

# Ver estado de configuración
pnpm validate:env | grep "Configuration Status"

# Iniciar desarrollo (valida automáticamente)
pnpm dev

# Build (valida en build time)
pnpm build
```

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL is required"

**Solución:**
1. Verifica que `.env.local` existe en la raíz del proyecto
2. Verifica que `DATABASE_URL` está definida
3. Ejecuta `pnpm validate:env` para ver qué falta

### Error: "NEXT_PUBLIC_SUPABASE_URL is required"

**Solución:**
1. Obtén las credenciales de Supabase Dashboard
2. Añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Las variables `NEXT_PUBLIC_*` son públicas (se exponen al cliente)

### Warning: "STRIPE_SECRET_KEY not set"

**Solución:**
- Esto es solo un warning, no un error
- La app funcionará pero las features de pago estarán deshabilitadas
- Añade las variables de Stripe si necesitas pagos

### Variables no se cargan en Vercel

**Solución:**
1. Verifica que las añadiste en el entorno correcto (Production/Preview)
2. Verifica que no hay espacios extra en los valores
3. Redeploy después de añadir variables nuevas
4. Las variables `NEXT_PUBLIC_*` requieren redeploy para actualizarse

---

## 📝 Checklist Pre-Deploy

Antes de hacer deploy a Vercel, verifica:

- [ ] Todas las variables críticas están configuradas
- [ ] `NEXT_PUBLIC_APP_URL` apunta a la URL de producción
- [ ] `DATABASE_URL` apunta a la base de datos de producción
- [ ] Variables de Stripe son de producción (no test)
- [ ] `FROM_EMAIL` usa un dominio verificado
- [ ] Ejecutaste `pnpm validate:env` localmente sin errores

---

## 🔗 Enlaces Útiles

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Resend Dashboard](https://resend.com/)

---

_Última actualización: 4 Ene 2026_
