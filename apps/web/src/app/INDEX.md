# 📁 INDEX DE ARCHIVOS PRINCIPALES (.tsx)

> **Propósito:** Inventario completo de archivos principales para prevenir duplicaciones.
>
> **Regla:** ANTES de crear cualquier archivo .tsx, CONSULTA este índice primero.
>
> **Última actualización:** 2026-01-15 23:50

---

## 🎯 ARCHIVOS OFICIALES (ÚNICOS)

### 🏠 Root Level
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `layout.tsx` | Layout principal de la app | ✅ Activo |
| `page.tsx` | Landing page (homepage) | ✅ Activo |

### 🔐 Auth (`(auth)/`)
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `layout.tsx` | Layout de autenticación | ✅ Activo |
| `login/page.tsx` | Página de login | ✅ Activo |
| `signup/page.tsx` | Página de registro | ✅ Activo |
| `forgot-password/page.tsx` | Recuperar contraseña | ✅ Activo |
| `reset-password/page.tsx` | Resetear contraseña | ✅ Activo |

### 📊 Dashboard
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `dashboard/layout.tsx` | Layout del dashboard | ✅ Activo |
| `dashboard/page.tsx` | Dashboard principal | ✅ Activo |

### 💬 Debates (Sistema Quoorum)
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `debates/layout.tsx` | Layout de debates | ✅ Activo |
| `debates/page.tsx` | Lista de debates | ✅ Activo |
| `debates/[id]/page.tsx` | Vista de debate individual | ✅ Activo |
| `debates/new/page.tsx` | **Crear nuevo debate (CHAT)** | ✅ Activo |
| `debates/new/DebateForm.tsx` | Componente auxiliar (NO usado actualmente) | ⚠️ Revisar si eliminar |

### 🧠 Deliberations (Legacy/Alias?)
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `deliberations/page.tsx` | Lista de deliberaciones | ⚠️ Revisar si es duplicado de debates |
| `deliberations/new/page.tsx` | Crear deliberación | ⚠️ Revisar si es duplicado de debates/new |

### 👥 Experts
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `experts/page.tsx` | Página de expertos | ✅ Activo |

### ⚙️ Settings
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `settings/page.tsx` | Settings principal | ✅ Activo |
| `settings/api-keys/page.tsx` | Gestión API keys | ✅ Activo |
| `settings/billing/page.tsx` | Facturación | ✅ Activo |
| `settings/notifications/page.tsx` | Notificaciones | ✅ Activo |
| `settings/security/page.tsx` | Seguridad | ✅ Activo |

### 📄 Legal & Info
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `about/page.tsx` | Sobre nosotros | ✅ Activo |
| `blog/page.tsx` | Blog | ✅ Activo |
| `contact/page.tsx` | Contacto | ✅ Activo |
| `pricing/page.tsx` | Precios | ✅ Activo |
| `privacy/page.tsx` | Política de privacidad | ✅ Activo |
| `terms/page.tsx` | Términos de servicio | ✅ Activo |

### 🎓 Onboarding
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `onboarding/page.tsx` | Flujo de onboarding | ✅ Activo |

### 🔧 Admin & Testing
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `admin/logs/page.tsx` | Logs de administración | ✅ Activo |
| `test/logging/page.tsx` | Test de logging | ✅ Activo (dev only) |

---

## ❌ ARCHIVOS A ELIMINAR (Backups innecesarios)

> Git ya tiene el historial completo. Los backups manuales son redundantes y causan confusión.

### Backups Detectados (ELIMINAR):
- ❌ `page-backup.tsx` en: dashboard, debates/new, deliberations/new, deliberations, experts, onboarding, root, privacy, settings/api-keys, settings/billing, settings, terms
- ❌ `page-2027.tsx` en root (archivo misterioso)
- ❌ `DebateForm.tsx` en debates/new (si no se usa como componente importado)

---

## 🚨 REGLAS DE ORO

### ✅ HACER:
1. **CONSULTAR ESTE INDEX** antes de crear cualquier archivo .tsx
2. **UNA SOLA VERSIÓN** por funcionalidad
3. **GIT para historial** - NO crear backups manuales
4. **Documentar aquí** cuando añadas un nuevo archivo principal

### ❌ NO HACER:
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
# - Marca como ✅ Activo
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
