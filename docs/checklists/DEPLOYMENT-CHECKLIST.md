# Deployment Checklist

> **Versión:** 1.0.0 | **Última actualización:** 10 Dic 2025

---

## Pre-Deploy Checklist

### 1. Código

- [ ] `pnpm typecheck` pasa sin errores
- [ ] `pnpm lint` pasa sin errores críticos
- [ ] `pnpm build` compila exitosamente
- [ ] `pnpm test` todos los tests pasan
- [ ] No hay `console.log` en código de producción
- [ ] No hay secrets hardcodeados
- [ ] No hay `// TODO` críticos sin resolver

### 2. Base de Datos

- [ ] Migraciones generadas: `pnpm db:generate`
- [ ] Migraciones aplicadas en staging primero
- [ ] Backup de producción antes de migrar
- [ ] Verificar que no hay breaking changes en schema

### 3. Variables de Entorno

- [ ] Todas las variables requeridas están en Vercel
- [ ] Variables nuevas añadidas a `.env.example`
- [ ] Verificar valores de producción vs staging

| Variable | Staging | Production |
|----------|---------|------------|
| `DATABASE_URL` | ✅ | ✅ |
| `GEMINI_API_KEY` | ✅ | ✅ |
| `STRIPE_SECRET_KEY` | Test key | Live key |
| `WHATSAPP_*` | Sandbox | Production |

### 4. Dependencias

- [ ] `pnpm install --frozen-lockfile` sin errores
- [ ] No hay vulnerabilidades críticas: `pnpm audit`
- [ ] Versiones de dependencias son estables (no alpha/beta)

### 5. Features Flags

- [ ] Nuevas features deshabilitadas por defecto
- [ ] Gradual rollout configurado si aplica

---

## Deploy Process

### Staging Deploy

```bash
# 1. Merge a develop
git checkout develop
git merge feature/mi-feature

# 2. Push (auto-deploy a staging)
git push origin develop

# 3. Verificar en staging
# - Funcionalidad nueva
# - No regresiones
# - Performance OK
```

### Production Deploy

```bash
# 1. Crear PR: develop → main
gh pr create --base main --head develop --title "Release vX.Y.Z"

# 2. Review + Approve

# 3. Merge (auto-deploy a production)
gh pr merge --squash

# 4. Tag release
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

---

## Post-Deploy Verification

### Inmediato (0-5 min)

- [ ] App carga correctamente
- [ ] Login funciona
- [ ] Health check: `curl https://app.wallie.com/api/health`
- [ ] No errores en Sentry

### Corto plazo (5-30 min)

- [ ] Flujo principal funciona (crear cliente, enviar mensaje)
- [ ] WhatsApp webhook recibe mensajes
- [ ] Stripe checkout funciona
- [ ] AI responses funcionan

### Monitoreo continuo

- [ ] Revisar métricas en Vercel Analytics
- [ ] Revisar errores en Sentry
- [ ] Revisar logs de WhatsApp

---

## Rollback Process

### Si algo falla:

```bash
# Opción 1: Revert en Vercel
# Dashboard → Deployments → Seleccionar deploy anterior → Redeploy

# Opción 2: Git revert
git revert HEAD
git push origin main

# Opción 3: Hotfix
git checkout -b hotfix/fix-critical-bug
# ... fix ...
git push origin hotfix/fix-critical-bug
# PR directo a main (saltar develop)
```

### Rollback de Base de Datos

```bash
# 1. Identificar migración problemática
# 2. Restaurar backup
# 3. Aplicar migración inversa si existe

# IMPORTANTE: Coordinar con equipo antes de rollback de DB
```

---

## Contactos de Emergencia

| Rol | Contacto | Responsabilidad |
|-----|----------|-----------------|
| Lead Dev | @arturo | Decisiones técnicas |
| DevOps | @arturo | Infraestructura |
| Product | @arturo | Comunicación usuarios |

---

## Checklist por Tipo de Deploy

### Feature Release

- [ ] Documentación actualizada
- [ ] Changelog actualizado
- [ ] Tests E2E para nueva feature
- [ ] Feature flag si es experimental

### Hotfix

- [ ] Root cause identificado
- [ ] Fix mínimo (no refactors)
- [ ] Test específico para el bug
- [ ] Post-mortem después

### Database Migration

- [ ] Backup ANTES de migrar
- [ ] Migración probada en staging
- [ ] Plan de rollback documentado
- [ ] Ventana de mantenimiento si es breaking

### Dependency Update

- [ ] Changelog de dependencia revisado
- [ ] Breaking changes identificados
- [ ] Tests pasan con nueva versión
- [ ] Bundle size no aumentó significativamente

---

_Última actualización: 10 Dic 2025_
