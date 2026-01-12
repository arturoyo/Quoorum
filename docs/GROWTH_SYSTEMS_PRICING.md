# Growth Systems - Permisos y Pricing

## Overview

Todos los sistemas de growth requieren:
1. **Permisos de administrador** - Solo usuarios admin pueden acceder
2. **Plan adecuado** - Cada sistema requiere un plan específico

---

## Sistemas de Growth

### 1. Voice AI Storage + Realtime Voice Agent
**Descripción:** Sistema completo de llamadas de voz con IA, transcripción, comandos y agente en tiempo real

**Requisitos:**
- ✅ Usuario debe ser admin
- ✅ Plan: **PRO o superior**

**Incluye:**
- Voice AI Storage (13 endpoints tRPC)
- Realtime Voice Agent con streaming
- HumanFillerEngine para conversación natural
- <500ms perceived latency
- Hot transfer capability

---

### 2. Cold Calling System
**Descripción:** Sistema de llamadas en frío automatizadas con ICP, campañas y auto-dialer

**Requisitos:**
- ✅ Usuario debe ser admin
- ✅ Plan: **BUSINESS**

**Incluye:**
- ICP (Ideal Customer Profile) management
- Campañas de cold calling
- Auto-dialer con Telnyx
- Humanizer Engine
- Script generation con IA

---

### 3. Prospecting System
**Descripción:** Sistema completo de prospección estilo 11x.ai con LinkedIn, enrichment y sequences

**Requisitos:**
- ✅ Usuario debe ser admin
- ✅ Plan: **BUSINESS**

**Incluye:**
- LinkedIn Auto-Prospector
- Data Enrichment (Hunter.io + Clearbit)
- Multi-Channel Sequences (Email, LinkedIn, Call, WhatsApp)
- 9 triggers condicionales
- Scoring automático (0-100)

---

### 4. W. Allie Bot
**Descripción:** Bot autónomo de LinkedIn para generar contenido y engagement

**Requisitos:**
- ✅ Usuario debe ser admin
- ✅ Plan: **BUSINESS**

**Incluye:**
- Scheduler para posts automáticos
- Content generation con IA
- LinkedIn automation
- Analytics de engagement

---

### 5. LinkedIn Audio Messages
**Descripción:** Sistema para enviar mensajes de audio personalizados en LinkedIn

**Requisitos:**
- ✅ Usuario debe ser admin
- ✅ Plan: **BUSINESS**

**Incluye:**
- ElevenLabs TTS integration
- LinkedIn message automation
- Voice customization
- Batch processing

---

## Tabla de Comparación

| Sistema | FREE | STARTER | PRO | BUSINESS |
|---------|------|---------|-----|----------|
| **Voice AI** | ❌ | ❌ | ✅ | ✅ |
| **Cold Calling** | ❌ | ❌ | ❌ | ✅ |
| **Prospecting** | ❌ | ❌ | ❌ | ✅ |
| **W. Allie Bot** | ❌ | ❌ | ❌ | ✅ |
| **LinkedIn Audio** | ❌ | ❌ | ❌ | ✅ |

---

## Precios

### FREE (0 EUR/mes)
- ❌ Sin acceso a growth systems
- Solo agentes básicos (Pods)

### STARTER (29 EUR/mes)
- ❌ Sin acceso a growth systems
- Agentes Specialists disponibles

### PRO (79 EUR/mes)
- ✅ **Voice AI básico**
- ❌ Resto de growth systems no disponibles
- 2 seats incluidos (+15 EUR/seat adicional)

### BUSINESS (149 EUR/mes)
- ✅ **Todos los growth systems**
- ✅ Voice AI completo + Realtime Agent
- ✅ Cold Calling
- ✅ Prospecting System
- ✅ W. Allie Bot
- ✅ LinkedIn Audio Messages
- 3 seats incluidos (+29 EUR/seat adicional)

---

## Implementación Técnica

### Middleware de Admin

Todos los routers de growth tienen este middleware:

```typescript
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const [adminUser] = await db
    .select({
      id: adminUsers.id,
      userId: adminUsers.userId,
      roleId: adminUsers.roleId,
      roleSlug: adminRoles.slug,
      rolePermissions: adminRoles.permissions,
    })
    .from(adminUsers)
    .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
    .where(and(eq(adminUsers.userId, ctx.userId), eq(adminUsers.isActive, true)))

  if (!adminUser) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No tienes permisos de administrador' })
  }

  return next({ ctx: { ...ctx, adminUser } })
})
```

### Feature Flag Check

Cada sistema verifica su feature flag:

```typescript
const systemProcedure = adminProcedure.use(async ({ ctx, next }) => {
  const profile = await db.query.profiles.findFirst({
    where: eq(db.profiles.userId, ctx.userId),
  })

  const planId = profile?.planId || 'free'
  
  if (!hasFeature(planId as any, 'systemName')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Este sistema requiere plan X o superior',
    })
  }

  return next({ ctx })
})
```

---

## Feature Flags en plan-config.ts

```typescript
features: {
  // Core features
  hallucinationChecker: boolean
  supervisorAccess: boolean
  proactiveWorkers: boolean
  gamificationMode: 'game' | 'kpi' | 'roi'
  contextMemory: 'conversation' | '30days' | 'infinite'
  webScraping: boolean
  
  // Growth Systems
  voiceAI: boolean // Voice AI Storage + Realtime Voice Agent
  coldCalling: boolean // Cold Calling System
  prospectingSystem: boolean // LinkedIn Auto-Prospector + Enrichment + Sequences
  wallieBot: boolean // W. Allie Bot (LinkedIn influencer)
  linkedinAudio: boolean // LinkedIn Audio Messages
}
```

---

## Routers Protegidos

| Router | Middleware | Feature Flag | Plan Requerido |
|--------|-----------|--------------|----------------|
| `voice.ts` | ✅ adminProcedure | ✅ voiceAI | PRO+ |
| `cold-calling.ts` | ✅ adminProcedure | ✅ coldCalling | BUSINESS |
| `prospecting.ts` | ✅ adminProcedure | ✅ prospectingSystem | BUSINESS |
| `admin-growth.ts` | ✅ adminProcedure | ✅ wallieBot | BUSINESS |

---

## Cómo Dar Acceso a un Usuario

### 1. Hacer al usuario Admin

```sql
-- Crear usuario admin
INSERT INTO admin_users (user_id, role_id, is_active)
VALUES ('user-uuid', 'role-uuid', true);
```

### 2. Asignar Plan Adecuado

```sql
-- Actualizar plan del usuario
UPDATE profiles
SET plan_id = 'business'
WHERE user_id = 'user-uuid';
```

### 3. Verificar Acceso

El sistema verificará automáticamente:
1. ¿Es admin? → Middleware `adminProcedure`
2. ¿Tiene el plan correcto? → Feature flag check

---

## Errores Comunes

### "No tienes permisos de administrador"
**Causa:** Usuario no está en tabla `admin_users`
**Solución:** Agregar usuario a admin_users con rol activo

### "Este sistema requiere plan X o superior"
**Causa:** Plan del usuario no tiene acceso al feature
**Solución:** Upgrade del plan del usuario

### "FORBIDDEN"
**Causa:** Usuario no autenticado o sesión expirada
**Solución:** Re-login

---

## Testing

Para testing, puedes mockear el plan:

```typescript
// Mock user con plan BUSINESS
const mockUser = {
  id: "test-user-123",
  email: "test@wallie.com",
  planId: "business",
};

// Mock admin user
const mockAdminUser = {
  id: "admin-123",
  userId: "test-user-123",
  roleId: "role-123",
  roleSlug: "super-admin",
  rolePermissions: ["*"],
};
```

---

**Todos los sistemas de growth están protegidos y requieren permisos + plan adecuado** 🔒
