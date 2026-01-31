# 🚨 Estrategia de Backup y Prevención de Pérdida de Datos

## ❌ LO QUE PASÓ

El comando `pnpm db:push` ejecutó un `TRUNCATE CASCADE` que borró todos los debates porque había un conflicto con el enum `debate_status`.

## ✅ CÓMO PREVENIR EN EL FUTURO

### 1. **NUNCA aceptar db:push si dice "WILL CAUSE DATA LOSS"**

```bash
# ❌ MAL - Si ves este warning, DETENTE:
Warning: Found data-loss statements
THIS ACTION WILL CAUSE DATA LOSS AND CANNOT BE REVERTED
Do you still want to push changes? 

# ✅ BIEN - Usa migraciones en su lugar:
pnpm db:generate  # Genera SQL migration
pnpm db:migrate   # Aplica migration de forma controlada
```

### 2. **Backup automático antes de cambios destructivos**

Crear script `backup-before-push.ps1`:

```powershell
# Backup automático
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "backup_$timestamp.sql"

Write-Host "Creating backup: $backupFile"
pg_dump $env:DATABASE_URL > "backups/$backupFile"

Write-Host "Backup created. Now you can run: pnpm db:push"
```

### 3. **Usar Supabase Backups**

Si usas Supabase:
1. Ve a Dashboard → Database → Backups
2. Activa "Daily Backups" (automático en plan Pro)
3. Antes de cambios grandes: hacer backup manual

### 4. **Git hooks para protección**

Crear `.husky/pre-push`:

```bash
#!/bin/sh
if git diff --cached --name-only | grep -q "packages/db/src/schema"; then
  echo "⚠️  Schema changes detected!"
  echo "Remember to:"
  echo "  1. Create backup: pnpm db:backup"
  echo "  2. Use migrations: pnpm db:generate && pnpm db:migrate"
  echo "  3. Never use db:push in production"
  read -p "Continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

## 🔄 RECUPERACIÓN DE DATOS

### Opción 1: Backup de Supabase
```bash
# Restaurar desde Supabase dashboard
# Database → Backups → Restore
```

### Opción 2: Datos de prueba
```bash
# Ejecutar script de restauración
psql $DATABASE_URL -f restore-debates.sql
```

### Opción 3: Seed desde código
```bash
pnpm db:seed
```

## 📋 CHECKLIST ANTES DE CAMBIOS DE SCHEMA

- [ ] Crear backup manual
- [ ] Revisar cambios en schema con `pnpm db:generate`
- [ ] Probar en base de datos de desarrollo primero
- [ ] Usar migraciones, NO `db:push` en producción
- [ ] Verificar que no hay `TRUNCATE` o `DROP` no deseados
- [ ] Tener plan de rollback

## 🆘 EN CASO DE EMERGENCIA

1. **STOP** - No ejecutar más comandos
2. Verificar Supabase backups
3. Restaurar desde backup más reciente
4. Si no hay backup, usar `restore-debates.sql`
5. Documentar lo ocurrido
6. Implementar prevenciones arriba

## 📞 CONTACTOS

- Supabase Support: support@supabase.io
- Database backups location: `/backups/`
- Recovery scripts: `restore-*.sql`
