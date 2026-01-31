# 📚 ÍNDICE DE DOCUMENTACIÓN - QUOORUM

> **Central hub** para toda la documentación del proyecto

---

## 🎨 DESIGN SYSTEM & STYLES

### 📖 Guías Principales

| Documento | Propósito | Cuándo Leer |
|-----------|-----------|-------------|
| **[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** | Guía visual completa (colores, tipografía, componentes) | Cuando necesites saber qué estilo usar |
| **[STYLE-MIGRATION-GUIDE.md](./STYLE-MIGRATION-GUIDE.md)** | Cómo migrar de hardcoded → centralizado | Cuando estés refactorizando componentes |
| **[STYLES-CENTRALIZATION-SUMMARY.md](./STYLES-CENTRALIZATION-SUMMARY.md)** | Resumen ejecutivo del sistema | Para entender qué hemos hecho |

### 💻 Implementación

| Archivo | Descripción |
|---------|-------------|
| `apps/web/src/lib/styles.ts` | Sistema de estilos centralizado (300+ líneas) |
| `scripts/check-style-migration.ps1` | Script checker de migración |

### ⚡ Comandos

```bash
# Ver progreso de migración de estilos
pnpm style:check
```

---

## 🧩 COMPONENTES

### 📖 Guías de Componentes

| Documento | Propósito |
|-----------|-----------|
| **[COMPONENT-CENTRALIZATION-FINAL-REPORT.md](./COMPONENT-CENTRALIZATION-FINAL-REPORT.md)** | Reporte completo de centralización de componentes |
| **[BEFORE-AFTER-VISUALIZATION.md](./BEFORE-AFTER-VISUALIZATION.md)** | Comparaciones visuales antes/después |
| **[COMPONENT-IMPORTS-QUICK-REFERENCE.md](./COMPONENT-IMPORTS-QUICK-REFERENCE.md)** | Guía rápida de imports |
| **[EXECUTIVE-SUMMARY.md](./EXECUTIVE-SUMMARY.md)** | Resumen ejecutivo de la arquitectura |
| **[COMPLETION-CHECKLIST.md](./COMPLETION-CHECKLIST.md)** | Checklist de validación |
| **[NEXT-STEPS.md](./NEXT-STEPS.md)** | Próximos pasos recomendados |

### 💻 Estructura

```
apps/web/src/components/
├── ui/           ✅ Primitivos (buttons, inputs, cards...)
├── layout/       ✅ Layout components (AppShell, Header, Footer)
├── theme/        ✅ Theme switcher
├── admin/        ✅ Admin panel components
├── quoorum/      ✅ Business logic components
├── debates/      ✅ Debate-specific components
├── dashboard/    ✅ Dashboard components
└── settings/     ⚠️ Settings components (partial)
```

---

## 📏 ESTÁNDARES & PATRONES

### 📖 Guías de Código

| Documento | Propósito |
|-----------|-----------|
| **[STANDARDS.md](./STANDARDS.md)** | Estándares de código (naming, structure, patterns) |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Cómo contribuir al proyecto |
| **[LICENSE](./LICENSE)** | Licencia del proyecto |

---

## 🚀 DEPLOYMENT & PRODUCCIÓN

### 📖 Checklists

| Documento | Propósito |
|-----------|-----------|
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | Checklist para deploy |
| **[DEPLOYMENT_CHECKLIST_FINAL.md](./DEPLOYMENT_CHECKLIST_FINAL.md)** | Checklist final de deploy |
| **[FINAL_READY_FOR_PROD.md](./FINAL_READY_FOR_PROD.md)** | Confirmación de readiness |

---

## 🔍 AUDITORÍAS

### 📖 Reportes de Auditoría

| Documento | Propósito |
|-----------|-----------|
| **[AUDIT-SUMMARY-2026-01-16.md](./AUDIT-SUMMARY-2026-01-16.md)** | Resumen de auditoría |
| **[FINAL_AUDIT_SUMMARY.md](./FINAL_AUDIT_SUMMARY.md)** | Auditoría final |
| **[FINAL_SECURITY_REPORT.md](./FINAL_SECURITY_REPORT.md)** | Reporte de seguridad |

---

## 🎯 FEATURES & SPECS

### 📖 Especificaciones

| Documento | Propósito |
|-----------|-----------|
| **[AI-RATE-LIMITING-SPEC.md](./AI-RATE-LIMITING-SPEC.md)** | Rate limiting para AI |
| **[AI-COST-TRACKING-COMPLETE.md](./AI-COST-TRACKING-COMPLETE.md)** | Tracking de costos AI |
| **[BACKUP-STRATEGY.md](./BACKUP-STRATEGY.md)** | Estrategia de backups |
| **[CREDIT-SYSTEM-FIX.md](./CREDIT-SYSTEM-FIX.md)** | Sistema de créditos |

---

## 🛠️ DESARROLLO

### 📖 Guías Técnicas

| Documento | Propósito |
|-----------|-----------|
| **[README.md](./README.md)** | Getting started general |
| **[LISTO-PARA-TRABAJAR.md](./LISTO-PARA-TRABAJAR.md)** | Setup inicial |
| **[INSTRUCCIONES-INICIO.md](./INSTRUCCIONES-INICIO.md)** | Instrucciones de inicio |
| **[PHASES.md](./PHASES.md)** | Fases del proyecto |

---

## 🎨 UI/UX

### 📖 Guías de UI

| Documento | Propósito |
|-----------|-----------|
| **[LIGHT-MODE-AUDIT.md](./LIGHT-MODE-AUDIT.md)** | Auditoría de light mode |
| **[LIGHT-MODE-FIX-SUMMARY.md](./LIGHT-MODE-FIX-SUMMARY.md)** | Fixes de light mode |
| **[RESPONSIVE-FIXES-COMPLETED.md](./RESPONSIVE-FIXES-COMPLETED.md)** | Fixes responsive |
| **[ADMIN-PANEL-COMPLETE.md](./ADMIN-PANEL-COMPLETE.md)** | Panel admin |

---

## 📝 LOGS & ERRORES

### 📖 Documentación de Errores

| Documento | Propósito |
|-----------|-----------|
| **[ERRORES-COMETIDOS.md](./ERRORES-COMETIDOS.md)** | Errores comunes y soluciones |
| **[ERRORES-LOGS-SOLUCIONADOS.md](./ERRORES-LOGS-SOLUCIONADOS.md)** | Log de errores resueltos |
| **[LOGGING_COMPLETE.md](./LOGGING_COMPLETE.md)** | Sistema de logging |

---

## 🎓 REFERENCIAS RÁPIDAS

### Para Desarrolladores

**Necesito saber...**

| Qué | Dónde Buscar |
|-----|--------------|
| ¿Qué color/estilo usar? | [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) |
| ¿Cómo importar un componente? | [COMPONENT-IMPORTS-QUICK-REFERENCE.md](./COMPONENT-IMPORTS-QUICK-REFERENCE.md) |
| ¿Cómo migrar estilos? | [STYLE-MIGRATION-GUIDE.md](./STYLE-MIGRATION-GUIDE.md) |
| ¿Estándares de código? | [STANDARDS.md](./STANDARDS.md) |
| ¿Cómo contribuir? | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| ¿Ver progreso de migración? | `pnpm style:check` |

### Para Project Managers

**Necesito saber...**

| Qué | Dónde Buscar |
|-----|--------------|
| ¿Estado del proyecto? | [EXECUTIVE-SUMMARY.md](./EXECUTIVE-SUMMARY.md) |
| ¿Qué falta hacer? | [NEXT-STEPS.md](./NEXT-STEPS.md) |
| ¿Ready para producción? | [FINAL_READY_FOR_PROD.md](./FINAL_READY_FOR_PROD.md) |
| ¿Checklist de deploy? | [DEPLOYMENT_CHECKLIST_FINAL.md](./DEPLOYMENT_CHECKLIST_FINAL.md) |

---

## 🆕 ÚLTIMAS ACTUALIZACIONES

### 30 Enero 2026 - Sistema de Estilos Centralizado

- ✅ Creado `apps/web/src/lib/styles.ts` (300+ líneas)
- ✅ Documentación completa ([DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md), [STYLE-MIGRATION-GUIDE.md](./STYLE-MIGRATION-GUIDE.md))
- ✅ Script de migración (`pnpm style:check`)
- ✅ 6 componentes migrados
- ⚠️ 135 archivos pendientes (957 instancias de hardcoded colors)

### Estado Actual

```
Componentes: 100% centralizados ✅
Estilos: 12% migrados ⚡ (en progreso)
Documentación: Completa ✅
```

---

## 📞 SOPORTE

**¿Tienes dudas?**

1. **Busca en este índice** el documento relevante
2. **Lee la documentación** específica
3. **Consulta los ejemplos** en las guías
4. **Ejecuta los comandos** de verificación

**Comandos útiles:**

```bash
# Ver progreso de migración
pnpm style:check

# Validar código
pnpm typecheck
pnpm lint

# Dev server
pnpm dev
```

---

**Mantenido por:** Equipo Quoorum  
**Última actualización:** 30 Enero 2026
