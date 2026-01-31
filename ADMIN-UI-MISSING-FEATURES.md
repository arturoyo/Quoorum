# 🎯 FUNCIONALIDADES FALTANTES EN ADMIN PANEL UI

## Resumen
El backend tiene **9 operaciones** implementadas, pero la UI solo expone **1**.
Aquí está lo que debería estar en la interfaz pero no está:

---

## 📊 COMPARATIVA BACKEND vs UI

| Funcionalidad | Backend | UI | Prioridad |
|--------------|---------|----|---------  |
| Añadir Créditos | ✅ | ✅ | HECHO |
| **Deducir Créditos** | ✅ | ❌ | ALTA |
| **Establecer Créditos (valor exacto)** | ✅ | ❌ | MEDIA |
| **Cambiar Tier** | ✅ | ❌ | MEDIA |
| **Cambiar Rol** | ✅ | ❌ | BAJA |
| **Crear Usuario** | ✅ | ❌ | BAJA |
| **Ver Historial de Cambios** | ✅ | ❌ | MEDIA |
| **Filtrar por Tier** | ✅ | ❌ | MEDIA |
| **Filtrar por Rol** | ✅ | ❌ | BAJA |
| **Ordenar Resultados** | ✅ | ❌ | BAJA |

---

## 1. 🔴 DEDUCIR CRÉDITOS - ALTA PRIORIDAD

**¿Por qué falta?** Uso común para "castigos" o reversiones de errores.

**Dónde debería estar:**
- Botón "Deducir" junto al botón "Añadir Créditos" en cada fila
- O un dropdown "Acciones" con ambas opciones

**Especificación:**
```typescript
// Endpoint existe:
api.admin.deductCredits.useMutation({
  userId: string,
  credits: number,
  reason: string (REQUERIDO para auditoría)
})
```

**Modal similar a "Añadir Créditos":**
- Campo cantidad (número positivo)
- Campo razón (OBLIGATORIO)
- Preview de nuevo saldo
- Validación: no permitir deducir más de lo que tiene

---

## 2. 🟡 ESTABLECER CRÉDITOS (VALOR EXACTO) - MEDIA PRIORIDAD

**¿Por qué falta?** Útil para resetear o testing.

**Dónde debería estar:**
- En el modal de créditos como opción
- O un botón "Editar Créditos" separado

**Diferencia con "Añadir Créditos":**
- Añadir: suma al saldo actual
- Establecer: fuerza un valor exacto

**Ejemplo de uso:**
```
Usuario tiene: 500 créditos
Añadir 100 → Usuario tiene 600
Establecer 1000 → Usuario tiene exactamente 1000
```

---

## 3. 🟡 CAMBIAR TIER - MEDIA PRIORIDAD

**¿Por qué falta?** Cambios de plan del usuario.

**Dónde debería estar:**
- Click en el badge de "Tier" para editar
- O dropdown en el header de búsqueda

**Opciones:** free → starter → pro → business

**Efecto:**
- Cambia créditos diarios que recibe (10/25/50/100)
- Toma efecto en próximo refresh automático

**UI Sugerida:**
```
Badge clickable [pro] → Dialog con radio buttons:
○ free
○ starter
● pro
○ business
```

---

## 4. 🟢 CAMBIAR ROL - BAJA PRIORIDAD

**¿Por qué es baja?** Menos común que cambiar tier o créditos.

**Dónde debería estar:**
- Click en el badge de "Rol" 
- O en modal expandido del usuario

**Opciones:** member → admin → super_admin

**Validación:**
- Solo super_admin puede cambiar roles
- Confirmar antes de convertir a admin

---

## 5. 🟢 CREAR USUARIO - BAJA PRIORIDAD

**¿Por qué es baja?** Los usuarios normalmente se crean via Supabase Auth.

**Cuándo usar:**
- Crear usuarios de test
- Migraciones especiales
- Usuarios sin email (casos edge)

**UI Sugerida:**
- Botón "Crear Usuario" en header
- Formulario con campos:
  - Email (requerido, único)
  - Nombre (requerido)
  - Tier (dropdown, default: free)
  - Créditos iniciales (número, default: 1000)
  - Rol (dropdown, default: member)

---

## 6. 🟡 HISTORIAL DE CAMBIOS - MEDIA PRIORIDAD

**¿Por qué falta?** Auditoría y transparencia.

**Dónde debería estar:**
- Click en el usuario para ver detalles
- Pestaña "Historial" o "Auditoría"
- O tabla expandible en cada fila

**Información a mostrar:**
```
Cambio | Fecha | Admin | Detalles
--------|-------|-------|----------
Añadir Créditos | 27/01/2026 10:23 | admin@quoorum.pro | +500 (Bienvenida)
Cambiar Tier | 26/01/2026 15:12 | admin@quoorum.pro | free → pro
Deducir Créditos | 25/01/2026 09:45 | admin@quoorum.pro | -100 (Error)
```

**Backend:** Ya existe tabla `creditsActivity` con toda esta info.

---

## 7. 🟡 FILTROS AVANZADOS - MEDIA PRIORIDAD

**Tier Filter**
- Dropdown: "Todos", "free", "starter", "pro", "business"
- Reduce resultados a solo ese tier

**Rol Filter**
- Dropdown: "Todos", "member", "admin", "super_admin"
- Reduce resultados a solo ese rol

**UI Sugerida:**
```
[Buscar por email] [Tier ▼] [Rol ▼] [Ordenar ▼]
```

---

## 8. 🟢 ORDENAMIENTO - BAJA PRIORIDAD

**Backend soporta:**
- Por created_at (defecto)
- Por email
- Por credits
- Por tier
- Ascendente/descendente

**UI Sugerida:**
- Clicky en header de columnas
- O dropdown "Ordenar por..."

---

## 9. 📊 VER ESTADÍSTICAS DEL USUARIO - MEDIA PRIORIDAD

**Backend retorna pero UI no muestra:**
- Total debates creados
- Total costo USD (de debates)
- Total créditos usados
- Info de suscripción

**UI Sugerida:**
- Click en usuario → Dialog "Detalles Completos"
- Mostrar:
  - Info básica (email, nombre, tier, rol)
  - Estadísticas de uso
  - Saldo de créditos
  - Última actividad
  - Historial de cambios

---

## 🎨 MOCKUP PROPUESTO (UI MEJORADA)

```
┌─ ADMIN PANEL ────────────────────────────────────────┐
│                                                       │
│ Buscar: [user@domain.com_____] [Tier ▼] [Rol ▼]   │
│                                                       │
│ ┌─────────────────────────────────────────────────┐  │
│ │ Email │ Nombre │ Tier │ Créditos │ Rol │ Acciones│
│ ├─────────────────────────────────────────────────┤  │
│ │ user1@│ Juan   │ pro  │ 1,500    │ mem │ [...] ▼ │
│ │ user2@│ María  │ free │ 500      │ mem │ [...] ▼ │
│ └─────────────────────────────────────────────────┘  │
│                                                       │
│ Botón "Crear Usuario" en esquina                     │
│                                                       │
└─────────────────────────────────────────────────────┘

[...] ▼ menú desplegable con:
├ Añadir Créditos
├ Deducir Créditos
├ Establecer Créditos
├ Cambiar Tier
├ Cambiar Rol
├ Ver Detalles
└ Ver Historial
```

---

## ✅ IMPLEMENTACIÓN RECOMENDADA (Por Orden)

### Fase 1 (AHORA):
1. ✅ Añadir Créditos (ya está)

### Fase 2 (INMEDIATO):
2. ➕ Deducir Créditos
3. 📊 Ver Detalles/Estadísticas

### Fase 3 (PRONTO):
4. 🔢 Establecer Créditos (valor exacto)
5. 📋 Cambiar Tier
6. 🔍 Filtros por Tier/Rol

### Fase 4 (OPCIONAL):
7. 👤 Cambiar Rol
8. ⏱️ Ordenamiento
9. 🆕 Crear Usuario
10. 📜 Historial de Cambios

---

## 💡 CASOS DE USO NO CUBIERTOS ACTUALMENTE

```javascript
// 1. Soporte técnico cancela error de usuario
Necesita: Deducir créditos + Razón
Ahora: No puede hacerlo desde UI

// 2. Admin quiere resetear cuenta de test a 100 créditos
Necesita: Establecer valor exacto
Ahora: Debe añadir/deducir manualmente

// 3. Auditoría: "¿Quién cambió qué y cuándo?"
Necesita: Historial completo
Ahora: No hay forma de verlo

// 4. Reportes por tier
Necesita: Filtrar usuarios por tier
Ahora: Debe buscar manualmente uno por uno

// 5. Upgrade de usuario a plan pro
Necesita: Cambiar tier de free → pro
Ahora: No hay opción
```

---

## 🎯 CONCLUSIÓN

**¿Está completo el admin?** 
- Funcionalidad: SÍ (backend tiene todo)
- UI: NO (solo muestra 1 de 9 operaciones)

**Para soporte técnico básico:**
- Necesita al menos: Deducir créditos + Ver detalles

**Para gestión completa:**
- Necesita todas las opciones del menú propuesto

**Impacto de agregar UI:**
- Bajo riesgo (backend ya existe y está probado)
- Alto beneficio (más opciones sin escribir código)
- Tiempo estimado: 2-4 horas para implementar todo
