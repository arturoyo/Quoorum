# 📁 INDEX DE ARCHIVOS PRINCIPALES (.tsx)

> **Propósito:** Inventario completo de archivos principales para prevenir duplicaciones.
>
> **Regla:** ANTES de crear cualquier archivo .tsx, CONSULTA este índice primero.
>
> **Última actualización:** 2026-01-15 23:50

---

## [INFO] ARCHIVOS OFICIALES (ÚNICOS)

### 🏠 Root Level
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `layout.tsx` | Layout principal de la app | [OK] Activo |
| `page.tsx` | Landing page (homepage) | [OK] Activo |

### 🔐 Auth (`(auth)/`)
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `layout.tsx` | Layout de autenticación | [OK] Activo |
| `login/page.tsx` | Página de login | [OK] Activo |
| `signup/page.tsx` | Página de registro | [OK] Activo |
| `forgot-password/page.tsx` | Recuperar contraseña | [OK] Activo |
| `reset-password/page.tsx` | Resetear contraseña | [OK] Activo |

### 📊 Dashboard
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `dashboard/layout.tsx` | Layout del dashboard | [OK] Activo |
| `dashboard/page.tsx` | Dashboard principal | [OK] Activo |

### 💬 Debates (Sistema Quoorum)
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `debates/layout.tsx` | Layout de debates | [OK] Activo |
| `debates/page.tsx` | Lista de debates | [OK] Activo |
| `debates/[id]/page.tsx` | Vista de debate individual | [OK] Activo |
| `debates/new/page.tsx` | **Crear nuevo debate (CHAT)** | [OK] Activo |
| `debates/new/DebateForm.tsx` | Componente auxiliar (NO usado actualmente) | [WARN] Revisar si eliminar |

### 🧠 Deliberations (Legacy/Alias?)
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `deliberations/page.tsx` | Lista de deliberaciones | [WARN] Revisar si es duplicado de debates |
| `deliberations/new/page.tsx` | Crear deliberación | [WARN] Revisar si es duplicado de debates/new |

### 👥 Experts
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `experts/page.tsx` | Página de expertos | [OK] Activo |

### ⚙️ Settings
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `settings/page.tsx` | Settings principal | [OK] Activo |
| `settings/api-keys/page.tsx` | Gestión API keys | [OK] Activo |
| `settings/billing/page.tsx` | Facturación | [OK] Activo |
| `settings/notifications/page.tsx` | Notificaciones | [OK] Activo |
| `settings/security/page.tsx` | Seguridad | [OK] Activo |

### 📄 Legal & Info
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `about/page.tsx` | Sobre nosotros | [OK] Activo |
| `blog/page.tsx` | Blog | [OK] Activo |
| `contact/page.tsx` | Contacto | [OK] Activo |
| `pricing/page.tsx` | Precios | [OK] Activo |
| `privacy/page.tsx` | Política de privacidad | [OK] Activo |
| `terms/page.tsx` | Términos de servicio | [OK] Activo |

### 🎓 Onboarding
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `onboarding/page.tsx` | Flujo de onboarding | [OK] Activo |

### 🔧 Admin & Testing
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `admin/logs/page.tsx` | Logs de administración | [OK] Activo |
| `test/logging/page.tsx` | Test de logging | [OK] Activo (dev only) |

---

## [ERROR] ARCHIVOS A ELIMINAR (Backups innecesarios)

> Git ya tiene el historial completo. Los backups manuales son redundantes y causan confusión.

### Backups Detectados (ELIMINAR):
- [ERROR] `page-backup.tsx` en: dashboard, debates/new, deliberations/new, deliberations, experts, onboarding, root, privacy, settings/api-keys, settings/billing, settings, terms
- [ERROR] `page-2027.tsx` en root (archivo misterioso)
- [ERROR] `DebateForm.tsx` en debates/new (si no se usa como componente importado)

---

## 🚨 REGLAS DE ORO

### [OK] HACER:
1. **CONSULTAR ESTE INDEX** antes de crear cualquier archivo .tsx
2. **UNA SOLA VERSIÓN** por funcionalidad
3. **GIT para historial** - NO crear backups manuales
4. **Documentar aquí** cuando añadas un nuevo archivo principal

### [ERROR] NO HACER:
1. **NO crear** `page-backup.tsx`, `page-old.tsx`, `page-v2.tsx`, etc.
2. **NO duplicar** funcionalidad en archivos diferentes
3. **NO dejar** archivos "por si acaso" - git los tiene
4. **NO importar** componentes de archivos backup

---

## 📝 CHECKLIST ANTES DE CREAR ARCHIVO

```bash
# 1. ¿Ya existe este archivo?
cat apps/web/src/app/INDEX.md | grep "mi-archivo"

# 2. ¿Hay algo similar?
find apps/web/src/app -name "*similar*.tsx"

# 3. ¿Puedo reutilizar uno existente?
# Consultar este INDEX primero

# 4. Si necesitas crear uno nuevo:
# - Añádelo a este INDEX
# - Documenta su propósito
# - Marca como [OK] Activo
```

---

## 🔄 MANTENIMIENTO

**Frecuencia:** Revisar mensualmente para detectar duplicados

**Comando de auditoría:**
```bash
# Encontrar posibles duplicados
find apps/web/src/app -name "*backup*.tsx" -o -name "*old*.tsx" -o -name "*v2*.tsx"

# Encontrar archivos huérfanos (no importados en ningún lugar)
# TODO: Script de análisis de imports
```

---

_Este índice previene el caos de tener 15 versiones de la misma página._
