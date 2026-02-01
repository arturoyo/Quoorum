# 🗄️ Base de Datos: PostgreSQL Local

> **REGLA CRÍTICA:** PostgreSQL local (Docker) EXCLUSIVAMENTE. NUNCA uses Supabase cloud para datos.

---

## 📌 Configuración Actual

| Variable | Valor | Propósito |
|----------|-------|-----------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5433/quoorum` | **PostgreSQL LOCAL** (Drizzle) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ipcbpkbvrftchbmpemlg.supabase.co` | Solo para Auth |

**⚠️ IMPORTANTE:**
- Supabase = Solo autenticación (`ctx.user`)
- PostgreSQL local = TODOS los datos

---

## 🏗️ Arquitectura Híbrida

### 1️⃣ Supabase Cloud (Auth ÚNICAMENTE)

```
📍 URL: https://ipcbpkbvrftchbmpemlg.supabase.co
🔑 Tabla: auth.users (gestionada por Supabase Auth)
```

**Responsabilidades:**
- ✅ Registro (`signUp()`)
- ✅ Login/Logout (`signIn()`, `signOut()`)
- ✅ Gestión de sesiones (JWT)
- ✅ Recuperación de contraseña
- ✅ OAuth providers

**NO almacena:**
- ❌ Perfiles de usuario
- ❌ Ningún dato de aplicación

### 2️⃣ PostgreSQL Local (TODOS LOS DATOS)

```
📍 URL: postgresql://postgres:postgres@localhost:5433/quoorum
🗄️ Tablas: 27 schemas (profiles, debates, clients, messages, etc.)
```

**Responsabilidades:**
- ✅ Todos los datos de aplicación
- ✅ Perfiles de usuario (tabla `profiles`)
- ✅ Relaciones entre entidades
- ✅ Queries con Drizzle ORM

---

## 🔗 Flujo de Autenticación

```
1. Usuario se registra
   ↓
2. Supabase Auth crea registro en auth.users
   ↓
3. Supabase Auth retorna user.id (UUID)
   ↓
4. Aplicación DEBE crear perfil en PostgreSQL local:
   INSERT INTO profiles (id, user_id, ...)
   VALUES (uuid_generate_v4(), user.id, ...)
   ↓
5. Todas las entidades referencian profiles.id:
   clients.user_id → profiles.id ✅
   debates.creator_id → profiles.id ✅
```

---

## 🚨 Error Común: Foreign Key Violations

**Error típico:**
```
insert or update on table "clients" violates foreign key constraint
"clients_user_id_profiles_id_fk"
```

**Causa raíz:**
- Usuario existe en Supabase Auth (`auth.users`)
- Perfil NO existe en PostgreSQL local (`profiles`)
- Aplicación intenta crear cliente con `user_id` inexistente

**Solución INMEDIATA:**

```bash
# 1. Verificar si el perfil existe
docker exec quoorum-postgres psql -U postgres -d quoorum -c \
  "SELECT id, user_id, email FROM profiles WHERE user_id = 'AUTH_USER_ID';"

# 2. Si NO existe, crear perfil
docker exec quoorum-postgres psql -U postgres -d quoorum -c "
  INSERT INTO profiles (id, user_id, email, name, role, is_active)
  VALUES ('PROFILE_ID', 'AUTH_USER_ID', 'email@example.com', 'Nombre Usuario', 'user', true)
  ON CONFLICT (id) DO NOTHING;
"
```

**Donde obtener los IDs:**
- `AUTH_USER_ID`: Logs del servidor → `[tRPC Context] Authenticated user: XXXX`
- `PROFILE_ID`: Logs del servidor → `[tRPC Context] Profile found: XXXX`

---

## 🚨 Reglas de Oro

### 1. NUNCA queries a Supabase para datos de aplicación

```typescript
// ❌ MAL
const { data } = await supabase.from('clients').select('*')

// ✅ BIEN
const clients = await db.select().from(clientsTable)
```

### 2. SIEMPRE verificar que el perfil existe

```typescript
// En routers tRPC, ctx.userId viene de Supabase Auth
// Pero DEBE existir en profiles de PostgreSQL local
const profile = await db.query.profiles.findFirst({
  where: eq(profiles.userId, ctx.userId)
})

if (!profile) {
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: 'Profile not found. Please complete onboarding.'
  })
}
```

### 3. Sincronización de perfiles es responsabilidad de la aplicación

- NO hay trigger automático Supabase → PostgreSQL
- El endpoint de registro DEBE crear el perfil
- Script `scripts/sync-profiles.sh` es para casos excepcionales

### 4. PostgreSQL local puede resetearse en desarrollo

```bash
docker-compose down -v  # ⚠️ Borra TODO PostgreSQL local
docker-compose up -d    # Recrear contenedor
pnpm db:push            # Aplicar schemas
pnpm db:seed            # Seed data inicial

# Resultado: auth.users en Supabase siguen existiendo
#            profiles en PostgreSQL local NO
# Solución: Re-crear perfiles con sync-profiles.sh
```

---

## 📋 Checklist de Debugging

Si ves errores de foreign key:

- [ ] ¿El usuario está autenticado? (`ctx.userId` existe)
- [ ] ¿El perfil existe en PostgreSQL local? (query a `profiles`)
- [ ] ¿PostgreSQL local se reseteó recientemente?
- [ ] ¿El endpoint de registro crea el perfil correctamente?
- [ ] ¿Hay otros perfiles huérfanos? (auth.users sin profiles)

**Comando de auditoría:**
```bash
# Ver cuántos perfiles hay
docker exec quoorum-postgres psql -U postgres -d quoorum -c \
  "SELECT COUNT(*) FROM profiles;"

# Ver todos los perfiles
docker exec quoorum-postgres psql -U postgres -d quoorum -c \
  "SELECT id, user_id, email, name FROM profiles;"
```

---

## ✅ Checklist ANTES de Migrar Router a PostgreSQL Local

Cuando migres un router de Supabase REST API (`ctx.supabase`) a Drizzle ORM (`db`), SIEMPRE:

1. ✅ **Verificar que el usuario tiene perfil en PostgreSQL local**
   ```bash
   docker exec quoorum-postgres psql -U postgres -d quoorum -c \
     "SELECT COUNT(*) FROM profiles;"
   ```
   - Si retorna `0` → **CREAR PERFIL PRIMERO**

2. ✅ **Verificar foreign keys necesarias**
   - Revisa qué tablas referencia la tabla que vas a insertar
   - Asegúrate de que esas filas existen en PostgreSQL local

3. ✅ **Usar Drizzle ORM, NO Supabase client**
   ```typescript
   // ❌ INCORRECTO
   const { data } = await ctx.supabase.from('table').select('*')

   // ✅ CORRECTO
   const data = await db.select().from(table)
   ```

---

_Ver [CLAUDE.md](../../CLAUDE.md#base-de-datos-postgresql-local-únicamente) para detalles completos_
