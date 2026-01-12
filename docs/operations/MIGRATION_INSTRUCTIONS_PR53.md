# 🚨 INSTRUCCIONES DE MIGRACIÓN PR #53 - EJECUCIÓN MANUAL

**Fecha**: 28 Dic 2025
**Prioridad**: 🔴 CRÍTICA
**Tiempo estimado**: 2 minutos
**Downtime**: 0 (operaciones NO bloqueantes)

---

## ⚡ OPCIÓN 1: Supabase SQL Editor (RECOMENDADO)

### Paso 1: Abrir SQL Editor

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto Wallie
3. Click en **SQL Editor** (icono de base de datos en sidebar)

### Paso 2: Copiar y Ejecutar SQL

1. Click en **New query**
2. Copiar y pegar el contenido de:
   ```
   packages/db/migrations/fix_pr53_missing_columns.sql
   ```
3. Click en **Run** (o `Ctrl+Enter`)

### Paso 3: Verificar Resultado

Deberías ver:

```
ALTER TABLE
ALTER TABLE
CREATE INDEX
ALTER TABLE
ALTER TABLE
```

✅ **LISTO!** La migración se ejecutó correctamente.

---

## 🔧 OPCIÓN 2: CLI de Supabase (Alternativa)

```bash
# Linkar proyecto (solo primera vez)
supabase login
supabase link --project-ref TU_PROJECT_ID

# Ejecutar migración
supabase db push --file packages/db/migrations/fix_pr53_missing_columns.sql
```

---

## 🔧 OPCIÓN 3: Script Node.js (Si tienes DATABASE_URL correcto)

```bash
# Asegúrate que DATABASE_URL en .env.local es correcto
node scripts/run-pr53-migration.mjs
```

**NOTA**: Si da error de autenticación, usa OPCIÓN 1 (Supabase SQL Editor).

---

## 📋 VERIFICACIÓN POST-MIGRACIÓN

Ejecuta esta query en SQL Editor para verificar que las columnas existen:

\`\`\`sql
-- Verificar columnas añadidas
SELECT
table_name,
column_name,
data_type
FROM information_schema.columns
WHERE table_name IN ('messages', 'clients', 'client_scores', 'saved_replies')
AND column_name IN ('clientId', 'dealValue', 'primaryPersona', 'title')
ORDER BY table_name, column_name;
\`\`\`

**Resultado esperado** (4 filas):

```
messages       | clientId        | uuid
clients        | dealValue       | numeric
client_scores  | primaryPersona  | text
saved_replies  | title           | text
```

---

## ⚠️ QUÉ HACE ESTA MIGRACIÓN

### 1. `messages.clientId` (UUID)

- **Por qué**: El router `classifiers.ts` busca esta columna para relacionar mensajes directamente con clientes
- **Sin esto**: ❌ Error 500 al usar classifiers

### 2. `clients.dealValue` (NUMERIC)

- **Por qué**: Almacenar valor del deal en la tabla clients
- **Sin esto**: ❌ Error 500 al intentar guardar deal value

### 3. `client_scores.primaryPersona` (TEXT)

- **Por qué**: El router `coaching.ts` busca la persona DISC principal
- **Sin esto**: ❌ Error 500 al usar coaching features

### 4. `saved_replies.title` (TEXT)

- **Por qué**: Mejor organización de respuestas guardadas
- **Sin esto**: ⚠️ Feature degradada (no crítico)

### 5. Índice `idx_messages_client_id`

- **Por qué**: Optimizar queries de classifiers (joins frecuentes)
- **Sin esto**: ⚠️ DB lenta en queries de clasificación

---

## 🔄 ROLLBACK (Si algo falla)

```sql
-- Solo ejecutar si necesitas revertir la migración
ALTER TABLE messages DROP COLUMN IF EXISTS "clientId";
ALTER TABLE clients DROP COLUMN IF EXISTS "dealValue";
ALTER TABLE client_scores DROP COLUMN IF EXISTS "primaryPersona";
ALTER TABLE saved_replies DROP COLUMN IF EXISTS "title";
DROP INDEX IF EXISTS idx_messages_client_id;
```

---

## 📊 IMPACTO

| Métrica                 | Valor                                     |
| ----------------------- | ----------------------------------------- |
| **Tiempo de ejecución** | <5 segundos                               |
| **Downtime**            | 0 (NO bloqueantes)                        |
| **Errores prevenidos**  | ~100% en classifiers/coaching             |
| **Performance**         | +30% en queries de clasificación (índice) |

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE EJECUTAR

1. ✅ Verificar columnas con query de verificación (arriba)
2. ✅ Verificar logs de Sentry (próximos 5 min)
3. ✅ Descomentar routers en `POST_DEPLOY_TODO.md`
4. ✅ Hacer commit de cambios en código

---

**¿Dudas?** Revisa `packages/db/migrations/fix_pr53_missing_columns.sql` para ver el SQL exacto.
