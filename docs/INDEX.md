# 📚 Wallie Documentation Index

> **Single Source of Truth** | Última actualización: 29 Dic 2025
> **Estado:** FASE 7 - LAUNCH (~96% completado)
> **Commits:** 241+ | **Auditoría:** Ver `../PHASES.md` sección AUDIT

---

## 📋 Estructura de Documentación

```
/                               # Raíz del proyecto
├── CLAUDE.md                   # ⭐ Reglas para IA (obligatorio)
├── SYSTEM.md                   # ⭐ Arquitectura completa
├── PHASES.md                   # ⭐ Fases del proyecto (v3.5.0)
├── STACK.md                    # ⭐ Stack tecnológico
├── STANDARDS.md                # ⭐ Estándares de código
├── README.md                   # Introducción al proyecto
│
docs/
├── INDEX.md                    # ← Estás aquí (índice maestro)
├── API-REFERENCE.md            # ⭐ Registro central de APIs y schemas
├── UI-COMPONENTS.md            # Catálogo de componentes UI
│
├── architecture/               # Diseño adicional
│   └── COEXISTENCE_VALIDATED.md
│
├── development/                # Guías de desarrollo
│   ├── GITFLOW.md             # Flujo de Git
│   ├── RULES.md               # Reglas de desarrollo
│   ├── START.md               # Guía de inicio
│   ├── VALIDACION.md          # Checklist de validación
│   └── LESSONS_LEARNED.md     # Errores comunes
│
├── features/                   # Documentación de funcionalidades
│   ├── COLD_CALLING.md        # Sistema de cold calling
│   ├── DYNAMIC_PLANS_SYSTEM.md # Planes dinámicos
│   ├── HUMANIZER_ENGINE.md    # Motor de humanización
│   ├── PROSPECTING_SYSTEM.md  # Sistema de prospección
│   ├── WALLIE_VOICE.md        # Wallie Voice AI
│   ├── VOICE_AI_STORAGE.md    # Almacenamiento de voz
│   ├── LINKEDIN_AUDIO_MESSAGES.md
│   └── GROWTH_SYSTEMS_PRICING.md
│
├── project/                    # Planificación y estado
│   ├── MASTER_PLAN.md         # Plan maestro
│   ├── ROADMAP.md             # Roadmap completo
│   ├── CHANGELOG.md           # Historial de cambios
│   ├── DEPENDENCY-STRATEGY.md # Gestión de dependencias
│   ├── QUICK_WINS.md          # Quick wins
│   ├── CONTENT_STRATEGY.md    # Estrategia de contenido
│   └── PROMPT_MAESTRO.md      # Prompt para IA
│
├── status/                     # Estado de implementaciones
│   ├── IMPLEMENTATION_STATUS.md
│   ├── PRODUCTION_GAP_ANALYSIS.md
│   ├── PRODUCTION_BLOCKERS_RESOLVED.md
│   ├── DYNAMIC_PLANS_COMPLETE.md
│   ├── PERMISSIONS_COMPLETE.md
│   ├── PROSPECTING_COMPLETE.md
│   └── RESUMEN_IMPLEMENTACION.md
│
├── checklists/                 # Checklists operacionales
│   ├── DEPLOYMENT-CHECKLIST.md
│   ├── INCIDENT-RUNBOOK.md
│   └── PRODUCTION_READINESS_CHECKLIST.md
│
├── compliance/                 # Legal y seguridad
│   ├── SECURITY.md
│   ├── SECURITY_ROADMAP.md
│   └── PRODUCTION_READINESS.md
│
└── operations/                 # Deploy y operaciones
    ├── DEPLOYMENT.md
    ├── RECOVERY.md
    ├── CHECKLIST_PR.md
    └── SENTRY_ALERTS_SETUP.md
```

---

## 🚀 LECTURA OBLIGATORIA (En Orden)

| #   | Documento                            | Propósito                                | Tiempo |
| --- | ------------------------------------ | ---------------------------------------- | ------ |
| 1   | [../CLAUDE.md](../CLAUDE.md)         | Reglas inviolables + Checkpoint Protocol | 10 min |
| 2   | [../SYSTEM.md](../SYSTEM.md)         | Arquitectura completa                    | 10 min |
| 3   | [../PHASES.md](../PHASES.md)         | Fase actual del proyecto (v3.5.0)        | 5 min  |
| 4   | [../STACK.md](../STACK.md)           | Tecnologías permitidas                   | 5 min  |
| 5   | [../STANDARDS.md](../STANDARDS.md)   | Estándares de código                     | 15 min |
| 6   | [API-REFERENCE.md](API-REFERENCE.md) | Routers, schemas, funciones              | 10 min |

---

## 🗺️ Guía de Navegación Rápida

### ¿Necesitas saber qué funciones/routers existen?

→ [API-REFERENCE.md](API-REFERENCE.md)

### ¿Vas a crear un nuevo router o schema?

→ [API-REFERENCE.md](API-REFERENCE.md) → sección "Checklist"

### ¿Tienes un error de TypeScript?

→ [../CLAUDE.md](../CLAUDE.md) → sección "Problemas Recurrentes"

### ¿Vas a hacer deploy?

→ [checklists/DEPLOYMENT-CHECKLIST.md](checklists/DEPLOYMENT-CHECKLIST.md)

### ¿Quieres entender una feature?

→ [features/](features/) → documento correspondiente

### ¿Necesitas información sobre CI/CD?

→ [../CLAUDE.md](../CLAUDE.md) → sección "CI/CD - GitHub Actions"
→ [../.github/workflows/ci.yml](../.github/workflows/ci.yml) → workflow completo

---

## 📄 Catálogo Completo

### 📌 Root (Documentación Principal)

| Documento                       | Descripción                                         | Actualizado     |
| ------------------------------- | --------------------------------------------------- | --------------- |
| [CLAUDE.md](../CLAUDE.md)       | Instrucciones para IA + Checkpoint Protocol + CI/CD | 29 Dic 2025     |
| [SYSTEM.md](../SYSTEM.md)       | Arquitectura completa del sistema                   | 15 Dic 2025     |
| [PHASES.md](../PHASES.md)       | Fases del proyecto (v3.5.0)                         | **18 Dic 2025** |
| [STACK.md](../STACK.md)         | Stack tecnológico aprobado                          | 17 Dic 2025     |
| [STANDARDS.md](../STANDARDS.md) | Estándares de código                                | 17 Dic 2025     |
| [README.md](../README.md)       | Introducción al proyecto                            | Nov 2025        |

### 🔌 API y Arquitectura

| Documento                            | Descripción                                  | Actualizado |
| ------------------------------------ | -------------------------------------------- | ----------- |
| [API-REFERENCE.md](API-REFERENCE.md) | **66 routers + 60 schemas + relaciones**     | 10 Dic 2025 |
| [UI-COMPONENTS.md](UI-COMPONENTS.md) | Catálogo de componentes UI + errores comunes | 10 Dic 2025 |

### 🩺 Health Check Endpoint

```bash
# Verificar estado de todos los servicios
curl https://wallie.pro/api/health | jq

# Response ejemplo:
{
  "status": "healthy",
  "services": {
    "database": { "status": "healthy", "latency": 12 },
    "supabase": { "status": "healthy", "latency": 45 },
    "ai": { "status": "healthy" },
    "whatsapp": { "status": "healthy" },
    "stripe": { "status": "healthy", "message": "Using test mode" }
  }
}
```

### 💻 Desarrollo

| Documento                                                        | Descripción                      | Actualizado |
| ---------------------------------------------------------------- | -------------------------------- | ----------- |
| [development/GITFLOW.md](development/GITFLOW.md)                 | Flujo de Git                     | Nov 2025    |
| [development/RULES.md](development/RULES.md)                     | Reglas obligatorias              | Nov 2025    |
| [development/START.md](development/START.md)                     | Setup local                      | Nov 2025    |
| [development/LESSONS_LEARNED.md](development/LESSONS_LEARNED.md) | Errores comunes                  | Dic 2025    |
| [../.github/workflows/ci.yml](../.github/workflows/ci.yml)       | GitHub Actions CI/CD Pipeline    | 29 Dic 2025 |
| [QA_AND_TESTING.md](QA_AND_TESTING.md)                           | Testing y QA (tests, Playwright) | 26 Dic 2025 |

### 🎯 Features

| Documento                                                            | Descripción             | Actualizado |
| -------------------------------------------------------------------- | ----------------------- | ----------- |
| [features/COLD_CALLING.md](features/COLD_CALLING.md)                 | Sistema de cold calling | Nov 2025    |
| [features/HUMANIZER_ENGINE.md](features/HUMANIZER_ENGINE.md)         | Motor de humanización   | Nov 2025    |
| [features/WALLIE_VOICE.md](features/WALLIE_VOICE.md)                 | Wallie Voice AI         | Nov 2025    |
| [features/PROSPECTING_SYSTEM.md](features/PROSPECTING_SYSTEM.md)     | Sistema de prospección  | Nov 2025    |
| [features/DYNAMIC_PLANS_SYSTEM.md](features/DYNAMIC_PLANS_SYSTEM.md) | Planes dinámicos        | Nov 2025    |

### 📊 Estado del Proyecto

| Documento                                    | Descripción                           | Actualizado     |
| -------------------------------------------- | ------------------------------------- | --------------- |
| [../PHASES.md](../PHASES.md)                 | **Fases del proyecto (fuente única)** | **18 Dic 2025** |
| [project/ROADMAP.md](project/ROADMAP.md)     | Roadmap completo                      | Nov 2025        |
| [project/CHANGELOG.md](project/CHANGELOG.md) | Historial de cambios                  | Dic 2025        |
| [status/](status/)                           | Estados de implementación             | Dic 2025        |

### ✅ Checklists & Operaciones

| Documento                                                                                    | Descripción                      | Uso                |
| -------------------------------------------------------------------------------------------- | -------------------------------- | ------------------ |
| [checklists/DEPLOYMENT-CHECKLIST.md](checklists/DEPLOYMENT-CHECKLIST.md)                     | Pre-deploy + rollback            | Antes de deploy    |
| [checklists/INCIDENT-RUNBOOK.md](checklists/INCIDENT-RUNBOOK.md)                             | Guía de resolución de incidentes | Durante incidentes |
| [checklists/PRODUCTION_READINESS_CHECKLIST.md](checklists/PRODUCTION_READINESS_CHECKLIST.md) | Pre-producción                   | Antes de launch    |
| [project/DEPENDENCY-STRATEGY.md](project/DEPENDENCY-STRATEGY.md)                             | Gestión de dependencias          | Semanal/Mensual    |
| [operations/CHECKLIST_PR.md](operations/CHECKLIST_PR.md)                                     | Pre-PR                           | Antes de PR        |

---

## 🔄 Estado del Proyecto

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE ACTUAL: 7 - LAUNCH (en producción)                        │
│  PROGRESO: ~96%                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  INVENTARIO ACTUALIZADO (27 Dic 2025):                          │
│  • 86 routers tRPC    • 71 schemas DB    • 95+ páginas          │
│  • 22 agentes IA      • 850+ procedures  • 310+ componentes     │
│  • 239 commits        • 2,463+ tests     • ~270K LOC            │
│  ─────────────────────────────────────────────────────────────  │
│  COMMITS RECIENTES:                                             │
│  • 80a3882: feat(miniserver): enrichment endpoint + admin       │
│  • 92d11c5: feat(webhooks): Evolution API for WhatsApp          │
│  • 5aca923: feat(psychology): Psychology Engine fixes           │
│  ─────────────────────────────────────────────────────────────  │
│  DOCUMENTACIÓN CONSOLIDADA:                                     │
│  • Archivos principales en RAÍZ (CLAUDE, SYSTEM, PHASES, etc.)  │
│  • docs/ contiene referencias y documentación adicional         │
│  • API-REFERENCE.md como referencia de routers y schemas        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Reglas de Documentación

### Al Modificar Código

| Si cambias...     | Actualiza...                                         |
| ----------------- | ---------------------------------------------------- |
| Router tRPC       | [API-REFERENCE.md](API-REFERENCE.md)                 |
| Schema DB         | [API-REFERENCE.md](API-REFERENCE.md)                 |
| Tipos compartidos | [API-REFERENCE.md](API-REFERENCE.md)                 |
| Arquitectura      | [../SYSTEM.md](../SYSTEM.md)                         |
| Stack             | [../STACK.md](../STACK.md)                           |
| Deploy            | [operations/DEPLOYMENT.md](operations/DEPLOYMENT.md) |
| Fase del proyecto | [../PHASES.md](../PHASES.md)                         |

### Al Encontrar Errores Recurrentes

1. Documentar en [../CLAUDE.md](../CLAUDE.md) → sección "Problemas Recurrentes"
2. Añadir ejemplo del error
3. Añadir solución con código
4. Añadir checklist de prevención

---

## ⚠️ Nota sobre Consolidación (18 Dic 2025)

La documentación principal ha sido consolidada en la **raíz del proyecto**:

| Archivo      | Ubicación       | Versión    |
| ------------ | --------------- | ---------- |
| CLAUDE.md    | `/CLAUDE.md`    | v1.9.0     |
| SYSTEM.md    | `/SYSTEM.md`    | v1.0.0     |
| PHASES.md    | `/PHASES.md`    | **v3.5.0** |
| STACK.md     | `/STACK.md`     | v1.0.0     |
| STANDARDS.md | `/STANDARDS.md` | v1.0.0     |

Los archivos duplicados en `docs/` han sido eliminados para evitar inconsistencias.

---

_Última actualización: 29 Dic 2025_
