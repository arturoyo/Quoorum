# 🔌 Configuración de Conexión a Base de Datos

**Fecha:** 31 Dic 2025
**Estado:** ✅ Documentación actualizada

---

## 📋 Resumen

Wallie utiliza **Supabase PostgreSQL** como base de datos principal. Hay dos métodos de conexión disponibles:

1. **Supabase CLI (OAuth)** - ✅ Recomendado para desarrollo local
2. **DATABASE_URL (Connection String)** - Para Drizzle ORM y operaciones directas

---

## 🔐 Método 1: Supabase CLI (OAuth) - Recomendado

### ✅ Ventajas

- ✅ Autenticación automática vía OAuth
- ✅ No requiere credenciales en `.env`
- ✅ Gestión segura de tokens
- ✅ Funciona con MCP (Model Context Protocol)

### 📝 Configuración

1. **Instalar Supabase CLI:**

```bash
npm install -g supabase
# o
pnpm add -g supabase
```

2. **Autenticarse:**

```bash
supabase login
```

Esto abrirá tu navegador para autenticación OAuth. Una vez autenticado, el token se guarda automáticamente.

3. **Verificar conexión:**

```bash
supabase projects list
```

Deberías ver tu proyecto `kcopoxrrnvogcwdwnhjr` en la lista.

### 🔧 Uso con MCP

El servidor MCP de Supabase está configurado en `config/mcp.json`:

```json
{
  "supabase": {
    "type": "http",
    "url": "https://mcp.supabase.com/mcp?project_ref=kcopoxrrnvogcwdwnhjr",
    "notes": "Autenticación OAuth automática"
  }
}
```

**No requiere variables de entorno** - La autenticación se realiza automáticamente cuando se usa.

### 📚 Comandos Útiles

```bash
# Listar proyectos
supabase projects list

# Ver estado de migraciones
supabase db remote commit

# Aplicar migraciones locales
supabase db push

# Abrir Supabase Studio
supabase studio
```

---

## 🔗 Método 2: DATABASE_URL (Connection String)

### ⚠️ Estado Actual

**Nota:** La `DATABASE_URL` en `.env` puede estar expirada. Si ves errores de conexión, actualiza la connection string desde:

**Supabase Dashboard → Settings → Database → Connection string (Pooler)**

### 📝 Configuración

1. **Obtener Connection String:**
   - Ve a [Supabase Dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto
   - Ve a **Settings → Database**
   - Copia el **Connection string (Pooler)** (formato: `postgresql://...`)

2. **Añadir a `.env`:**

```bash
# Connection string para Drizzle ORM
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### 🔧 Uso

La `DATABASE_URL` se usa para:

- **Drizzle ORM** - Operaciones de base de datos en runtime
- **Drizzle Kit** - Generación y aplicación de migraciones
- **Scripts de desarrollo** - Acceso directo a la base de datos

### ⚠️ Limitaciones

- **pgbouncer=true:** Algunas operaciones DDL pueden no funcionar
- **Connection limit:** Limitado a 1 conexión simultánea
- **Expiración:** Las credenciales pueden expirar (actualizar desde Dashboard)

---

## 🎯 Recomendación

### Para Desarrollo Local

**Usa Supabase CLI (OAuth):**

```bash
# Autenticarse una vez
supabase login

# Usar comandos CLI
supabase db push
supabase studio
```

### Para Producción (Vercel)

**Usa DATABASE_URL en variables de entorno:**

1. Obtén connection string actualizada desde Supabase Dashboard
2. Añade a Vercel: **Settings → Environment Variables**
3. Configura para **Production**, **Preview**, y **Development**

---

## 🔄 Migración de Credenciales

Si tu `DATABASE_URL` ha expirado:

1. **Obtener nueva connection string:**
   - Supabase Dashboard → Settings → Database
   - Copiar **Connection string (Pooler)**

2. **Actualizar `.env`:**

   ```bash
   DATABASE_URL=postgresql://postgres.[new-ref]:[new-password]@aws-0-eu-central-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```

3. **Verificar conexión:**
   ```bash
   pnpm db:push
   ```

---

## 📊 Verificación de Estado

### Verificar Supabase CLI

```bash
supabase projects list
# Debería mostrar tu proyecto
```

### Verificar DATABASE_URL

```bash
# Desde packages/db
cd packages/db
pnpm drizzle-kit introspect
# Debería conectarse y mostrar schema
```

---

## 🐛 Troubleshooting

### Error: "Tenant or user not found"

**Causa:** `DATABASE_URL` expirada o incorrecta

**Solución:**

1. Obtén nueva connection string desde Supabase Dashboard
2. Actualiza `.env` con la nueva `DATABASE_URL`

### Error: "Authentication failed" (Supabase CLI)

**Causa:** Token OAuth expirado

**Solución:**

```bash
supabase logout
supabase login
```

### Error: "Connection timeout"

**Causa:** Problemas de red o firewall

**Solución:**

1. Verifica que puedas acceder a `supabase.com`
2. Verifica configuración de firewall/proxy
3. Intenta desde otra red

---

## 📚 Referencias

- **Supabase CLI Docs:** https://supabase.com/docs/reference/cli
- **Connection Strings:** https://supabase.com/docs/guides/database/connecting-to-postgres
- **MCP Setup:** `docs/mcp/SETUP.md`
- **Database Verification:** `DATABASE_VERIFICATION_REPORT.md`

---

**Estado:** ✅ **Documentación actualizada** - Usa Supabase CLI para desarrollo, DATABASE_URL para producción
