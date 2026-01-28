# Aplicar Migración de Pricing Configuration

## Contexto

Esta migración añade el sistema completo de configuración de pricing al admin panel, permitiendo:

- Editar CREDIT_MULTIPLIER y USD_PER_CREDIT desde la UI
- Configurar precios y créditos por tier
- Ver análisis de profit margin en tiempo real
- Historial completo de cambios con audit trail

## Archivos Creados

### Backend
- `packages/db/src/schema/pricing-config.ts` - Schema de 3 tablas
- `packages/db/drizzle/0037_add_pricing_config.sql` - Migración SQL
- `packages/quoorum/src/pricing/helpers.ts` - Helpers de cálculo
- `packages/api/src/routers/admin-pricing.ts` - Router tRPC

### Frontend
- `apps/web/src/app/admin/billing/page.tsx` - UI completa con 4 tabs

## Pasos para Aplicar la Migración

### Opción 1: Aplicar con Drizzle (Recomendado)

```bash
# 1. Generar y aplicar migraciones
cd packages/db
pnpm db:push

# 2. Verificar que las tablas existen
pnpm db:studio
# Buscar: pricing_global_config, tier_pricing_config, pricing_change_history
```

### Opción 2: Aplicar Manualmente con psql

```bash
# 1. Conectar a PostgreSQL
psql -h localhost -p 5433 -U postgres -d quoorum

# 2. Ejecutar la migración
\i packages/db/drizzle/0037_add_pricing_config.sql

# 3. Verificar que se crearon las tablas
\dt pricing*

# 4. Verificar que se insertaron los datos seed
SELECT * FROM pricing_global_config;
SELECT * FROM tier_pricing_config ORDER BY tier;
```

### Opción 3: Copiar/Pegar SQL (Si no funciona psql)

1. Abrir `packages/db/drizzle/0037_add_pricing_config.sql`
2. Copiar TODO el contenido
3. Ejecutar en tu cliente de PostgreSQL (pgAdmin, DBeaver, etc.)

## Verificación Post-Migración

### 1. Verificar Tablas Creadas

```sql
-- Debe retornar 3 filas
SELECT tablename FROM pg_tables
WHERE tablename LIKE 'pricing%'
ORDER BY tablename;
```

### 2. Verificar Configuración Global

```sql
SELECT
  credit_multiplier,
  usd_per_credit,
  is_active,
  effective_from,
  change_reason
FROM pricing_global_config
WHERE is_active = true;
```

Resultado esperado:
- credit_multiplier: 1.75
- usd_per_credit: 0.01
- is_active: true
- change_reason: "Initial configuration - current system values"

### 3. Verificar Configuración de Tiers

```sql
SELECT
  tier,
  tier_name,
  monthly_price_usd / 100.0 as monthly_price_dollars,
  monthly_credits,
  change_reason
FROM tier_pricing_config
WHERE is_active = true
ORDER BY tier;
```

Resultado esperado:
| tier     | tier_name | monthly_price_dollars | monthly_credits | change_reason                                                                              |
|----------|-----------|----------------------|-----------------|-------------------------------------------------------------------------------------------|
| free     | Free      | 0.00                 | 1000            | Initial configuration - existing free tier                                                |
| starter  | Starter   | 29.00                | 5000            | Initial configuration - existing pricing                                                  |
| pro      | Pro       | 49.00                | 10000           | Initial configuration - existing pricing                                                  |
| business | Business  | 130.00               | 20000           | Fixed pricing to prevent losses - reduced credits from 30k to 20k, increased price $99→$130 |

### 4. Verificar Historial de Cambios

```sql
SELECT COUNT(*) FROM pricing_change_history;
-- Debe retornar al menos 5 (1 global + 4 tiers)
```

## Análisis Financiero (Nuevo Sistema)

### Profit Margin por Tier (con nueva configuración)

| Tier     | Precio Mensual | Créditos | Breakeven | Profit al 100% | ¿Rentable? |
|----------|----------------|----------|-----------|----------------|------------|
| Free     | $0             | 1,000    | N/A       | -$5.71         | ❌ (es free) |
| Starter  | $29            | 5,000    | 5,078     | $0.55          | ✅         |
| Pro      | $49            | 10,000   | 8,580     | $6.00          | ✅         |
| Business | $130           | 20,000   | 22,767    | $15.71         | ✅         |

**Nota:** Business plan fue arreglado de $99/30k créditos → $130/20k créditos para ser rentable.

## Acceder al Admin Panel

1. Iniciar el servidor:
```bash
pnpm dev
```

2. Ir a: http://localhost:3000/admin/billing

3. Tabs disponibles:
   - **User Management** - Gestionar créditos de usuarios
   - **Pricing Configuration** - Editar CREDIT_MULTIPLIER, USD_PER_CREDIT y tiers
   - **Profit Analysis** - Ver análisis de profit margin en tiempo real
   - **Change History** - Audit trail completo de cambios

## Funcionalidades del Admin Panel

### Global Configuration
- Editar CREDIT_MULTIPLIER (actualmente 1.75x)
- Editar USD_PER_CREDIT (actualmente $0.01)
- Preview en tiempo real del impacto en API cost coverage
- Validación de business logic antes de guardar

### Tier Configuration
- Editar precio mensual (en USD)
- Editar créditos mensuales
- Inline editing con botón Save/Cancel
- Reason obligatorio para cada cambio

### Profit Analysis
- Breakeven credits por tier
- Breakeven percentage (% del allocation)
- Profit margin al 100% de uso
- Profit margin percentage
- Warnings automáticos para tiers no rentables

### Change History
- Log completo de todos los cambios
- Old values vs New values (JSON)
- Reason for change
- Timestamp y usuario que hizo el cambio
- Impact summary

## Troubleshooting

### Error: "relation 'pricing_global_config' does not exist"
**Solución:** La migración no se aplicó. Ejecutar `pnpm db:push` o aplicar manualmente el SQL.

### Error: "violates foreign key constraint"
**Solución:** Verificar que la tabla `users` existe y tiene el ID del admin.

### No aparece data en el admin panel
**Solución:** Verificar que `is_active = true` en las configuraciones:
```sql
SELECT * FROM pricing_global_config WHERE is_active = true;
SELECT * FROM tier_pricing_config WHERE is_active = true;
```

### Error: "adminPricing is not defined"
**Solución:** Verificar que el router está montado en `packages/api/src/index.ts`:
```typescript
export const appRouter = router({
  // ... otros routers
  adminPricing: adminPricingRouter,
})
```

## Próximos Pasos

1. ✅ Aplicar migración
2. ✅ Verificar que las tablas existen
3. ✅ Acceder al admin panel
4. ✅ Probar editar configuración global
5. ✅ Probar editar tier configuration
6. ✅ Verificar profit analysis
7. ✅ Verificar change history

## Notas Importantes

- **Backup recomendado:** Hacer backup de la DB antes de aplicar la migración
- **Testing:** Probar en desarrollo antes de aplicar en producción
- **Audit trail:** Todos los cambios quedan registrados en `pricing_change_history`
- **Validación:** El sistema valida que los tiers sean rentables antes de guardar
- **Rollback:** Si algo falla, puedes revertir la migración eliminando las 3 tablas

## Contacto

Si hay problemas con la migración, revisar:
1. Logs de PostgreSQL
2. Logs del servidor Next.js
3. Network tab del navegador (para errores de tRPC)
