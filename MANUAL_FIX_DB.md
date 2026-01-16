# 🔧 Solución Manual - Problemas de Conexión Base de Datos

## Problema Detectado
- Error: `getaddrinfo ENOTFOUND db.ipcbpkbvrftchbmpemlg.supabase.co`
- Causa: Base de datos PostgreSQL pausada o inaccesible

## Solución 1: Reactivar Base de Datos (MÁS COMÚN)

### Paso 1.1: Dashboard Web
1. Ve a: https://supabase.com/dashboard/project/ipcbpkbvrftchbmpemlg
2. Si ves "Database Paused" → Click "Resume/Restore"
3. Espera 2-3 minutos
4. Verifica en Settings → Database que el estado sea "Healthy"

### Paso 1.2: Verificar desde Terminal
```bash
# Ver variables de entorno
Get-Content .env.local | Select-String DATABASE_URL

# Probar conexión (requiere psql instalado)
# Si no tienes psql, salta este paso
psql $env:DATABASE_URL -c "SELECT NOW();"
```

## Solución 2: Usar Connection Pooler (MÁS ESTABLE)

La conexión directa puede pausarse. El Connection Pooler es más estable.

### Paso 2.1: Obtener Connection Pooler URL
1. Dashboard Supabase → Settings → Database
2. Copia "Connection Pooler" (no "Direct connection")
3. Debería verse así:
   ```
   postgresql://postgres.ipcbpkbvrftchbmpemlg:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true
   ```

### Paso 2.2: Actualizar .env.local
```bash
# apps/web/.env.local
DATABASE_URL="postgresql://postgres.ipcbpkbvrftchbmpemlg:[TU-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true"

# Reinicia el servidor dev
pnpm dev
```

## Solución 3: Modo REST API Only (ÚLTIMA OPCIÓN)

Si nada funciona, modificar el código para usar REST API en lugar de conexión directa.

### Paso 3.1: Verificar que REST API funciona
El auth ya usa REST API y funciona:
```
[tRPC Context] Authenticated user: b88193ab-1c38-49a0-a86b-cf12a96f66a9
[tRPC Context] Profile found: f198d53b-9524-45b9-87cf-a810a857a616
```

### Paso 3.2: Modificar debates.ts router
Reemplazar queries Drizzle por llamadas REST API de Supabase.

**ANTES (Drizzle - falla):**
```typescript
const debates = await db
  .select()
  .from(quoorumDebates)
  .where(and(...conditions))
  .orderBy(desc(quoorumDebates.createdAt))
```

**DESPUÉS (REST API - funciona):**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const { data: debates, error } = await supabase
  .from('quoorum_debates')
  .select('*')
  .eq('user_id', ctx.user.id)
  .order('created_at', { ascending: false })
  .limit(input.limit)
```

## Solución 4: Verificar que Supabase no está en Mantenimiento

```bash
# Verificar status
curl -s https://status.supabase.com/api/v2/status.json | jq
```

El incidente del 16 enero es mantenimiento PROGRAMADO (02:30-03:00 UTC), NO afecta ahora.

## Pasos para Debugging

### 1. Ver logs del servidor
```bash
# En otra terminal
tail -f C:\Users\Usuario\AppData\Local\Temp\claude\C--Quoorum\tasks\b8cb1a3.output
```

### 2. Ver logs en browser console
1. Abre F12 → Console
2. Filtra por "tRPC" o "DEBUG"
3. Busca errores rojos

### 3. Test de conexión individual
```bash
# Crear archivo test-db.js
node test-db.js
```

```javascript
// test-db.js
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  connect_timeout: 10,
  idle_timeout: 20,
});

console.log('Testing connection...');

sql`SELECT NOW() as time, version() as version`
  .then(result => {
    console.log('✅ Connection SUCCESS');
    console.log('Time:', result[0].time);
    console.log('Version:', result[0].version);
  })
  .catch(err => {
    console.error('❌ Connection FAILED');
    console.error('Error:', err.message);
  })
  .finally(() => {
    sql.end();
    process.exit();
  });
```

## Verificación Final

Después de aplicar la solución, verifica:

1. ✅ Servidor dev reiniciado sin errores
2. ✅ `GET /api/trpc/debates.list` retorna 200 (no 500)
3. ✅ No hay errores `ENOTFOUND` en los logs
4. ✅ Puedes ver la página `/debates` sin errores

## ¿Cuál Solución Usar?

- **Problema: "Database paused"** → Solución 1 (Reactivar)
- **Problema: Conexión inestable** → Solución 2 (Connection Pooler)
- **Problema: Nada funciona** → Solución 3 (REST API)
- **Problema: "Service unavailable"** → Solución 4 (Esperar mantenimiento)

## Contacto de Emergencia

Si NADA funciona:
1. Revisa Supabase Status: https://status.supabase.com
2. Revisa Dashboard: https://supabase.com/dashboard
3. Contacta soporte Supabase: https://supabase.com/dashboard/support/new
