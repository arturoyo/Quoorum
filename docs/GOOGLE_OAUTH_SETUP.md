# 🔐 Configuración de Google OAuth con Supabase

## 📋 Problema que resuelve

Error 400 Bad Request al intentar login con Google:
```
GET https://[PROJECT].supabase.co/auth/v1/authorize?provider=google&redirect_to=... 400
```

---

## ✅ Solución: Configuración Completa

### **1️⃣ Configurar Supabase Dashboard**

#### A. URL Configuration

1. Ve a tu proyecto de Supabase:
   ```
   https://supabase.com/dashboard/project/[TU_PROJECT_ID]
   ```

2. Navega a: **Authentication → URL Configuration**

3. Configura las siguientes URLs:

   **Site URL:**
   ```
   http://localhost:3000
   ```

   Para producción, cambia a:
   ```
   https://tudominio.com
   ```

   **Redirect URLs (añadir TODAS estas):**
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/callback?*
   http://localhost:3000/**
   ```

   Para producción, añadir también:
   ```
   https://tudominio.com/auth/callback
   https://tudominio.com/auth/callback?*
   https://tudominio.com/**
   ```

4. Click **"Save"** al final de la página

#### B. Habilitar Google Provider

1. En Supabase: **Authentication → Providers**

2. Busca **"Google"** en la lista

3. Click para habilitar (toggle switch)

4. Se abrirá un formulario que requiere:
   - ✅ Google Client ID
   - ✅ Google Client Secret

5. **NO guardes aún** - primero obtén las credenciales de Google

---

### **2️⃣ Crear Credenciales en Google Cloud Console**

#### A. Crear Proyecto (si no tienes uno)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)

2. Click en el selector de proyectos (arriba izquierda)

3. Click **"New Project"**
   - Name: `Quoorum` (o el nombre de tu app)
   - Organization: Dejar por defecto
   - Click **"Create"**

4. Espera a que se cree (30 segundos aprox)

5. Selecciona el proyecto recién creado

#### B. Habilitar Google+ API (OBLIGATORIO)

1. Ve a: **APIs & Services → Library**

2. Busca: **"Google+ API"**

3. Click en "Google+ API"

4. Click **"Enable"**

5. Espera a que se active

#### C. Configurar OAuth Consent Screen

1. Ve a: **APIs & Services → OAuth consent screen**

2. Selecciona **"External"** (para desarrollo)

3. Click **"Create"**

4. Completa el formulario:
   - **App name:** Quoorum
   - **User support email:** tu@email.com
   - **Developer contact email:** tu@email.com
   - **App domain:** (dejar vacío por ahora)

5. Click **"Save and Continue"**

6. **Scopes:** Click "Add or Remove Scopes"
   - Selecciona:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click **"Update"**

7. Click **"Save and Continue"**

8. **Test users:** Añade tu email para testing

9. Click **"Save and Continue"**

10. Revisa y click **"Back to Dashboard"**

#### D. Crear OAuth 2.0 Client ID

1. Ve a: **APIs & Services → Credentials**

2. Click **"+ Create Credentials"** → **"OAuth client ID"**

3. Configuración:
   - **Application type:** Web application
   - **Name:** Quoorum Web Client

4. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```

   Para producción, añadir:
   ```
   https://tudominio.com
   ```

5. **Authorized redirect URIs** (IMPORTANTE):
   ```
   https://ipcbpkbvrftchbmpemlg.supabase.co/auth/v1/callback
   ```

   **⚠️ Reemplaza `ipcbpkbvrftchbmpemlg` con tu Project ID de Supabase**

   Para encontrarlo:
   - Ve a Supabase Dashboard
   - Tu URL es: `https://[PROJECT_ID].supabase.co`
   - Usa: `https://[PROJECT_ID].supabase.co/auth/v1/callback`

6. Click **"Create"**

7. **¡Copia las credenciales!**
   ```
   Client ID: 123456789-abc123.apps.googleusercontent.com
   Client Secret: GOCSPX-xxxxxxxxxxxxx
   ```

---

### **3️⃣ Conectar Google con Supabase**

1. Vuelve a **Supabase Dashboard**

2. Ve a: **Authentication → Providers → Google**

3. Pega las credenciales:
   - **Client ID:** (el que copiaste de Google)
   - **Client Secret:** (el que copiaste de Google)

4. Click **"Save"**

5. Verifica que el toggle esté en **"Enabled"** (verde)

---

### **4️⃣ Verificar Configuración Local**

Asegúrate de que tu `.env.local` tiene:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ipcbpkbvrftchbmpemlg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Site URL (para OAuth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

### **5️⃣ Reiniciar Servidor**

```bash
# Mata el servidor actual
Ctrl + C (en la terminal donde corre pnpm dev)

# Reinicia
pnpm dev
```

---

### **6️⃣ Probar OAuth**

1. Ve a: `http://localhost:3000/signup`

2. Click en **"Continuar con Google"**

3. Deberías ver:
   - ✅ Redirect a Google OAuth consent screen
   - ✅ Seleccionar tu cuenta de Google
   - ✅ Autorizar permisos
   - ✅ Redirect de vuelta a `http://localhost:3000/auth/callback`
   - ✅ Redirect final a `/dashboard`

4. Si funciona → ✅ **Configuración correcta**

---

## 🚨 Troubleshooting

### Error: "redirect_uri_mismatch"

**Causa:** La URI de redirect en Google no coincide

**Solución:**
1. Ve a Google Cloud Console → Credentials
2. Edita tu OAuth Client ID
3. Verifica que la URI de redirect sea EXACTAMENTE:
   ```
   https://[TU_PROJECT_ID].supabase.co/auth/v1/callback
   ```
4. Guarda cambios
5. Espera 5 minutos (propagación de cambios)
6. Intenta de nuevo

### Error: "access_denied"

**Causa:** Usuario no está en la lista de test users

**Solución:**
1. Ve a Google Cloud Console → OAuth consent screen
2. Click "Edit App"
3. Ve a la sección "Test users"
4. Añade tu email
5. Guarda
6. Intenta de nuevo

### Error: 400 Bad Request (sin más detalles)

**Causa:** Google+ API no habilitada

**Solución:**
1. Ve a Google Cloud Console → APIs & Services → Library
2. Busca "Google+ API"
3. Click "Enable"
4. Espera 2-3 minutos
5. Intenta de nuevo

### Error: "Email not confirmed"

**Causa:** Supabase requiere confirmación de email

**Solución:**
1. Ve a Supabase → Authentication → Providers → Email
2. Deshabilita "Confirm email"
3. O revisa tu email para el link de confirmación

---

## 📝 Checklist de Configuración

- [ ] Supabase: Site URL configurada (`http://localhost:3000`)
- [ ] Supabase: Redirect URLs añadidas (con `/auth/callback`)
- [ ] Google Cloud: Proyecto creado
- [ ] Google Cloud: Google+ API habilitada
- [ ] Google Cloud: OAuth consent screen configurado
- [ ] Google Cloud: Test users añadidos
- [ ] Google Cloud: OAuth Client ID creado
- [ ] Google Cloud: Redirect URI correcta (`https://[PROJECT].supabase.co/auth/v1/callback`)
- [ ] Supabase: Google provider habilitado
- [ ] Supabase: Client ID y Secret configurados
- [ ] `.env.local`: Variables de Supabase presentes
- [ ] Servidor reiniciado después de cambios

---

## 🎯 Para Producción

Cuando vayas a producción, actualiza:

### Supabase:
- Site URL: `https://tudominio.com`
- Redirect URLs: `https://tudominio.com/auth/callback*`

### Google Cloud:
- Authorized JavaScript origins: `https://tudominio.com`
- OAuth consent screen: Cambiar de "Testing" a "In production"
- Remover restricción de test users

### Variables de entorno:
```bash
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

---

**Última actualización:** 2026-01-13
**Versión Supabase:** v2
**Versión OAuth:** 2.0
