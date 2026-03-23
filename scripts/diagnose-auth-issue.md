# 🔍 Diagnóstico de Error 500 en Supabase Auth

## Error Actual
```
POST https://ipcbpkbvrftchbmpemlg.supabase.co/auth/v1/token?grant_type=password
500 (Internal Server Error)
```

## [OK] Checklist de Diagnóstico

### 1. Verificar Variables de Entorno
```bash
# Verificar que las variables están configuradas
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Valores esperados:**
- `NEXT_PUBLIC_SUPABASE_URL`: `https://ipcbpkbvrftchbmpemlg.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_t0jliC3rkZ-FBelL1iETmw_FhhLCIbK`

### 2. Verificar Configuración en Supabase Dashboard

**A. URL Configuration:**
1. Ve a: [Supabase Dashboard](https://supabase.com/dashboard) → Tu proyecto
2. **Authentication → URL Configuration**
3. Verifica que esté configurado:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** Debe incluir `http://localhost:3000/**`

**B. Verificar que los usuarios existen:**
1. **Authentication → Users**
2. Verifica que los usuarios estén listados:
   - tier1@quoorum.pro
   - tier2@quoorum.pro
   - tier3@quoorum.pro
   - info@imprent.es

### 3. Probar Login Directamente en Supabase

Ejecuta este query en Supabase SQL Editor para verificar que las contraseñas están correctas:

```sql
-- Verificar usuarios y sus contraseñas (no se pueden ver, pero podemos verificar que existen)
SELECT 
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users
WHERE email IN (
  'tier1@quoorum.pro',
  'tier2@quoorum.pro',
  'tier3@quoorum.pro'
)
ORDER BY email;
```

### 4. Verificar Logs de Supabase

1. Ve a: **Supabase Dashboard → Logs → API Logs**
2. Busca errores relacionados con `/auth/v1/token`
3. Revisa el mensaje de error específico

### 5. Probar con curl (desde terminal)

```bash
curl -X POST "https://ipcbpkbvrftchbmpemlg.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: sb_publishable_t0jliC3rkZ-FBelL1iETmw_FhhLCIbK" \
  -H "Content-Type: application/json" \
  -d '{"email":"tier1@quoorum.pro","password":"Tier1Test2026!"}'
```

Si esto también da 500, el problema está en Supabase, no en tu código.

## 🔧 Soluciones Comunes

### Solución 1: Verificar Site URL en Supabase
- **Authentication → URL Configuration → Site URL**
- Debe ser: `http://localhost:3000` (o tu dominio de producción)

### Solución 2: Verificar que el usuario tiene email confirmado
- Los usuarios creados con SQL deben tener `email_confirmed_at` establecido
- Si no, el login puede fallar

### Solución 3: Verificar Rate Limits
- Supabase puede estar bloqueando requests si hay demasiados intentos
- Espera unos minutos y vuelve a intentar

### Solución 4: Verificar que las contraseñas están correctamente hasheadas
- Las contraseñas deben usar `crypt()` con `gen_salt('bf')`
- Si usaste otro método, puede fallar
