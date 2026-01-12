# 🔴 Incidente: RLS Circular Query Timeout

**Fecha:** 19 Diciembre 2024
**Severidad:** CRÍTICA (P0)
**Duración:** ~30 minutos
**Impacto:** Toda la base de datos inaccesible
**Estado:** Resuelto

---

## 📋 Resumen Ejecutivo

Una migración de Row Level Security (RLS) mal implementada causó queries circulares que bloquearon completamente el acceso a la base de datos de Supabase, dejando la aplicación Wallie completamente no funcional.

---

## 🔍 Cronología

| Hora  | Evento |
|-------|--------|
| 19:XX | Migración `0014_enable_rls_security_hardening.sql` aplicada a Supabase |
| 19:XX | Migración `0015_optimize_rls_policies_performance.sql` aplicada a Supabase |
| 19:XX | Usuario reporta: "No veo datos en Wallie" |
| 19:XX | Diagnóstico: Todas las queries a Supabase retornan TIMEOUT |
| 19:XX | Identificación de causa raíz: Query circular en política RLS de `magic_tokens` |
| 19:XX | Rollback: Deshabilitar RLS en todas las tablas afectadas |
| 19:XX | Verificación: Base de datos accesible nuevamente |
| 19:XX | Documentación: Creación de guía RLS-SAFETY-GUIDE.md |

---

## 🐛 Causa Raíz

### Problema Principal: Query Circular

La política RLS en `magic_tokens` hacía un subquery a `profiles`, que también tenía RLS habilitado:

```sql
-- ❌ POLÍTICA PROBLEMÁTICA
CREATE POLICY "Users can read own unexpired magic tokens"
  ON magic_tokens
  FOR SELECT
  TO authenticated
  USING (
    phone = (SELECT phone FROM profiles WHERE id = (SELECT auth.uid()))
    --      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    --      SUBQUERY a tabla con RLS → LOOP INFINITO
    AND NOT used
    AND expires_at > now()
  );
```

### Flujo del Error:

```
1. Usuario hace: SELECT * FROM magic_tokens
   ↓
2. Postgres evalúa política RLS: phone = (SELECT phone FROM profiles WHERE ...)
   ↓
3. Para obtener phone, ejecuta: SELECT phone FROM profiles WHERE id = auth.uid()
   ↓
4. Profiles tiene RLS, evalúa: id = (SELECT auth.uid())
   ↓
5. Postgres vuelve a verificar RLS de profiles... LOOP INFINITO
   ↓
6. Timeout después de 30 segundos
```

### Impacto en Cascada:

- Todas las queries a tablas con RLS afectadas
- MCP Supabase tool inaccesible (timeout)
- PostgreSQL directo inaccesible (credenciales incorrectas)
- API REST de Supabase no puede ejecutar DDL
- **Resultado:** Imposible arreglar automáticamente

---

## 🔧 Solución Aplicada

### 1. Rollback Manual (SQL Editor de Supabase)

```sql
-- Deshabilitar RLS en todas las tablas afectadas
ALTER TABLE magic_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_ai_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE points_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings DISABLE ROW LEVEL SECURITY;

-- También tablas principales (afectadas por migración 0015)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
-- (y el resto...)
```

### 2. Borrar Políticas Problemáticas

```sql
-- Eliminar todas las políticas creadas
DROP POLICY IF EXISTS "Service role has full access to magic tokens" ON magic_tokens;
DROP POLICY IF EXISTS "Users can read own unexpired magic tokens" ON magic_tokens;
-- (resto de políticas...)
```

### 3. Verificación

```sql
-- Confirmar que hay datos
SELECT
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM clients) as clients,
  (SELECT COUNT(*) FROM conversations) as conversations,
  (SELECT COUNT(*) FROM messages) as messages;

-- Resultado: 12 profiles, 29 clients, 25 conversations, 104 messages ✅
```

---

## 📊 Métricas del Incidente

| Métrica | Valor |
|---------|-------|
| **Tablas afectadas** | 45/45 (100%) |
| **Usuarios impactados** | Todos |
| **Downtime total** | ~30 minutos |
| **Data loss** | 0 (sin pérdida de datos) |
| **Queries afectadas** | Todas (100% timeout) |
| **Intentos de fix automático** | 5+ (todos fallaron) |
| **Tiempo hasta identificación** | ~10 minutos |
| **Tiempo hasta fix** | ~20 minutos |

---

## 🎓 Lecciones Aprendidas

### ❌ Qué NO hacer:

1. **NUNCA** hacer subqueries a tablas con RLS en políticas RLS
2. **NUNCA** aplicar migraciones RLS masivas sin testear primero
3. **NUNCA** asumir que "service_role" bypass funcionará para fixes
4. **NUNCA** aplicar RLS en producción directamente (usar rama dev primero)
5. **NUNCA** ignorar warnings de Supabase Advisor sobre RLS performance

### ✅ Qué hacer en su lugar:

1. **SIEMPRE** testear políticas RLS en rama de desarrollo primero
2. **SIEMPRE** usar `(SELECT auth.uid())` en lugar de `auth.uid()`
3. **SIEMPRE** crear índices en columnas usadas en RLS
4. **SIEMPRE** incluir política para `service_role` primero
5. **SIEMPRE** ejecutar `EXPLAIN ANALYZE` antes de aplicar políticas
6. **SIEMPRE** tener un rollback plan antes de aplicar
7. **SIEMPRE** aplicar RLS tabla por tabla, no masivamente

---

## 📚 Documentación Creada

Como resultado de este incidente, se crearon:

1. **`docs/guides/RLS-SAFETY-GUIDE.md`**
   Guía completa de 400+ líneas sobre cómo implementar RLS de forma segura

2. **`packages/db/src/migrations/TEMPLATE_enable_rls_safe.sql`**
   Template SQL reutilizable con todos los pasos y verificaciones

3. **`scripts/validate-rls-policies.sql`**
   Script de validación para detectar problemas ANTES de aplicar

4. **Este documento** (`docs/incidents/2024-12-19-rls-incident.md`)
   Post-mortem del incidente

---

## 🔄 Acciones de Seguimiento

### Corto plazo (24-48h):

- [ ] Revisar todas las migraciones RLS pendientes
- [ ] Aplicar RLS tabla por tabla con testing riguroso
- [ ] Crear script de test E2E para RLS
- [ ] Documentar proceso de rollback en CLAUDE.md

### Medio plazo (1 semana):

- [ ] Implementar monitoreo de query performance en Supabase
- [ ] Crear alertas para queries > 1s
- [ ] Revisar Supabase Advisor semanalmente
- [ ] Training sobre RLS para todo el equipo

### Largo plazo (1 mes):

- [ ] Implementar CI check para validar migraciones RLS
- [ ] Crear environment de staging con copia de prod
- [ ] Automatizar testing de RLS policies
- [ ] Revisar arquitectura de seguridad completa

---

## 👥 Equipo Involucrado

- **Detección:** Usuario
- **Diagnóstico:** Claude (IA)
- **Resolución:** Usuario + Claude
- **Documentación:** Claude

---

## 🔗 Referencias

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Performance](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [InitPlan Optimization](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)

---

## ✅ Verificación de Resolución

- [x] Base de datos accesible
- [x] Queries retornan < 1s
- [x] Aplicación funcionando normalmente
- [x] Usuarios pueden ver sus datos
- [x] Workers funcionando correctamente
- [x] Documentación creada
- [x] Rollback completado
- [x] Cause raíz identificada

---

**Revisado por:** Usuario
**Aprobado para cierre:** Pendiente
**Próxima revisión:** Al implementar RLS correctamente

---

_"Un buen incidente no es el que nunca pasó, sino del que aprendimos lo suficiente para que nunca vuelva a pasar."_
