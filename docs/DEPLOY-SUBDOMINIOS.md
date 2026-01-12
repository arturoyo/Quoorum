# 🚀 Guía de Configuración de Subdominios (Producción + Desarrollo)

> **Última actualización:** 16 Dic 2024
> **Propósito:** Configurar entornos separados para producción y desarrollo

---

## 📋 Arquitectura de Subdominios

```
📍 PRODUCCIÓN
app.wallie.pro          → rama: main
                        → Usuarios reales
                        → BD de producción
                        → Login: waitlist (beta cerrada)

📍 DESARROLLO/STAGING
dev.wallie.pro          → rama: develop
                        → Testing continuo
                        → BD de staging
                        → Login: email/password superadmin

📍 PREVIEW (Automático)
wallie-git-xxx.vercel.app  → ramas: feature/*
                            → Pull requests automáticos
```

---

## 🔧 Paso 1: Configurar Dominios en Vercel

### 1.1 Añadir `app.wallie.pro` (Producción)

1. Ve a [Vercel Dashboard](https://vercel.com) → Tu proyecto → **Settings** → **Domains**
2. Click **Add Domain**
3. Escribe: `app.wallie.pro`
4. Vercel te mostrará los registros DNS necesarios
5. Selecciona **Production Branch**: `main`

### 1.2 Añadir `dev.wallie.pro` (Desarrollo)

1. Click **Add Domain** de nuevo
2. Escribe: `dev.wallie.pro`
3. En **Git Branch**, selecciona: `develop`
4. Desmarca "Production" (debe ser staging/preview)

---

## 🌐 Paso 2: Configurar DNS

Ve a tu proveedor de dominios (donde compraste `wallie.pro`) y añade:

```
Tipo   Nombre    Valor                      TTL
----   ------    -----                      ---
CNAME  app       cname.vercel-dns.com       3600
CNAME  dev       cname.vercel-dns.com       3600
```

**Nota:** Vercel te dará los valores exactos en el dashboard. Pueden variar.

**Tiempo de propagación:** 5-30 minutos (a veces hasta 24h)

---

## 🔐 Paso 3: Configurar Variables de Entorno

### 3.1 Variables para PRODUCCIÓN (`app.wallie.pro`)

En Vercel → **Settings** → **Environment Variables**, añade:

```bash
# ═══════════════════════════════════════════════════
# PRODUCCIÓN - app.wallie.pro
# ═══════════════════════════════════════════════════

# App
NEXT_PUBLIC_APP_URL=https://app.wallie.pro
NODE_ENV=production

# Supabase (PRODUCCIÓN)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# API Keys (PRODUCCIÓN)
GEMINI_API_KEY=AIza...
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_live_...

# NO INCLUIR: DEV_ADMIN_EMAIL, DEV_ADMIN_PASSWORD
```

**En cada variable, selecciona:**

- ✅ **Environment**: Production
- ✅ **Vercel Deployment**: app.wallie.pro

### 3.2 Variables para DESARROLLO (`dev.wallie.pro`)

```bash
# ═══════════════════════════════════════════════════
# DESARROLLO - dev.wallie.pro
# ═══════════════════════════════════════════════════

# App
NEXT_PUBLIC_APP_URL=https://dev.wallie.pro
NODE_ENV=development

# Supabase (STAGING - usar proyecto separado si es posible)
NEXT_PUBLIC_SUPABASE_URL=https://xxx-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:xxx@db.xxx-staging.supabase.co:5432/postgres

# API Keys (TEST)
GEMINI_API_KEY=AIza...
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_test_...

# Dev Login (SOLO DESARROLLO)
DEV_ADMIN_EMAIL=tu@email.com
DEV_ADMIN_PASSWORD=tu-password-seguro
```

**En cada variable, selecciona:**

- ✅ **Environment**: Preview
- ✅ **Git Branch**: develop

---

## 👤 Paso 4: Crear Usuario Superadmin en BD de Staging

### Opción A: Directamente en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard) → Proyecto de staging
2. **SQL Editor** → New query
3. Ejecuta:

```sql
-- Crear usuario superadmin
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'tu@email.com',  -- ← Mismo email que DEV_ADMIN_EMAIL
  crypt('tu-password-seguro', gen_salt('bf')),  -- ← Mismo password que DEV_ADMIN_PASSWORD
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Crear perfil asociado
INSERT INTO public.users (
  id,
  email,
  name,
  role
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'tu@email.com'),
  'tu@email.com',
  'Superadmin',
  'superadmin'
);
```

### Opción B: Automático al primer login

El endpoint `/api/auth/dev-login` intentará crear el usuario automáticamente si no existe.

---

## 🧪 Paso 5: Probar los Entornos

### Probar Producción (`app.wallie.pro`)

```bash
# 1. Hacer push a main
git checkout main
git merge develop
git push origin main

# 2. Esperar deployment en Vercel (2-3 min)

# 3. Visitar
https://app.wallie.pro

# Debe mostrar: Página de waitlist (beta cerrada)
```

### Probar Desarrollo (`dev.wallie.pro`)

```bash
# 1. Hacer push a develop
git checkout develop
git push origin develop

# 2. Esperar deployment en Vercel (2-3 min)

# 3. Visitar
https://dev.wallie.pro/login

# Debe redirigir a: https://dev.wallie.pro/dev-login

# 4. Login con credenciales de DEV_ADMIN_EMAIL/PASSWORD

# 5. Debe redirigir a: https://dev.wallie.pro/dashboard
```

---

## 🔄 Workflow de Desarrollo

### Día a día

```bash
# 1. Trabajar en rama feature
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# 2. Vercel crea preview automático
# URL: wallie-git-feature-nueva-funcionalidad-xxx.vercel.app

# 3. Cuando esté listo, merge a develop
git checkout develop
git merge feature/nueva-funcionalidad
git push origin develop

# 4. dev.wallie.pro se actualiza automáticamente (2-3 min)

# 5. Probar en dev.wallie.pro

# 6. Si todo OK, merge a main
git checkout main
git merge develop
git push origin main

# 7. app.wallie.pro se actualiza automáticamente
```

---

## ❓ FAQ

### ¿Por qué dos subdominios en lugar de uno?

- **Separación de datos**: Producción y staging usan bases de datos diferentes
- **Testing seguro**: Puedes probar features sin afectar usuarios reales
- **URLs estables**: `dev.wallie.pro` no cambia, fácil de compartir con equipo

### ¿Cuánto tarda en propagarse el DNS?

- **Mínimo**: 5-10 minutos
- **Típico**: 1-2 horas
- **Máximo**: 24-48 horas

### ¿Puedo usar el mismo proyecto de Supabase para ambos entornos?

Puedes, pero **NO es recomendado**. Mejor crear dos proyectos:

- `wallie-production`
- `wallie-staging`

### ¿Qué pasa con las preview URLs automáticas?

Siguen funcionando! Cada PR genera su propia URL temporal.

### ¿Cómo cambio entre entornos en local?

```bash
# Desarrollo local
NEXT_PUBLIC_APP_URL=http://localhost:3000 pnpm dev

# Apuntando a staging
NEXT_PUBLIC_APP_URL=https://dev.wallie.pro pnpm dev

# Apuntando a producción (CUIDADO)
NEXT_PUBLIC_APP_URL=https://app.wallie.pro pnpm dev
```

---

## 🆘 Troubleshooting

### Error: "Domain not found"

- Verifica que los registros DNS estén correctos
- Espera 30 min más para propagación
- Verifica en [DNS Checker](https://dnschecker.org)

### Error: "Environment variable not found"

- Ve a Vercel → Settings → Environment Variables
- Verifica que esté seleccionado el entorno correcto (Production vs Preview)
- Re-deploy el proyecto después de añadir variables

### Dev login no funciona

1. Verifica que `DEV_ADMIN_EMAIL` y `DEV_ADMIN_PASSWORD` estén en variables de entorno
2. Verifica que el usuario exista en Supabase staging
3. Verifica que `NODE_ENV !== 'production'` en dev.wallie.pro
4. Revisa logs en Vercel → Deployments → Logs

---

## 📞 Contacto

Si algo no funciona, revisa:

1. Logs de Vercel
2. Consola del navegador (F12)
3. Supabase logs

---

**Última actualización:** 16 Dic 2024
