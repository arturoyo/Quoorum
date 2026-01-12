# ROADMAP.md — Plan de Desarrollo Consolidado

> **Versión:** 1.7.0 | **Fecha:** 06 Dic 2025
> **Estado Actual:** MVP Phase 7 (Launch) - ✅ EN PRODUCCIÓN (~95% completado)
> **Auditoría:** 06 Dic 2025 - Ver `docs/project/PHASES.md` sección AUDIT

---

## 🚀 DEPLOY EN PRODUCCIÓN

**IMPORTANTE: El proyecto YA ESTÁ DESPLEGADO. No proponer configurar deploy.**

| Servicio                 | URL/Detalle                                                 | Estado          |
| ------------------------ | ----------------------------------------------------------- | --------------- |
| **Vercel**               | Proyecto desplegado                                         | ✅ Activo       |
| **Supabase**             | Proyecto producción                                         | ✅ Activo       |
| **Dominio**              | `wallie.pro`                                                | ✅ Configurado  |
| **Emails**               | `hola@wallie.pro`, `legal@wallie.pro`, `privacy@wallie.pro` | ✅ Configurados |
| **Variables de entorno** | Configuradas en Vercel Dashboard                            | ✅ Completo     |
| **SSL**                  | HTTPS via Vercel                                            | ✅ Activo       |
| **Security Headers**     | Configurados en `next.config.js`                            | ✅ Activo       |

### Archivos de configuración

- **`vercel.json`**: Configuración monorepo para Vercel
- **`next.config.js`**: Security headers, transpilation, optimizations
- **`.env.example`**: Template de variables de entorno
- **`docs/operations/DEPLOYMENT.md`**: Guía completa de deploy

---

## 🤖 NOTAS PARA IA (Claude, GPT, Copilot, etc.)

> **LEER PRIMERO** — Contexto crítico para evitar propuestas redundantes

### ✅ Lo que YA ESTÁ HECHO (no proponer de nuevo)

| Área                         | Estado          | Notas                                                       |
| ---------------------------- | --------------- | ----------------------------------------------------------- |
| **Deploy**                   | ✅ COMPLETO     | Vercel + Supabase + dominio `wallie.pro` activo             |
| **Legal/GDPR**               | ✅ COMPLETO     | Privacy, Terms, Cookies, Notice - todo en `/legal/*`        |
| **Email Templates**          | ✅ COMPLETO     | **10 templates** en `packages/email/src/templates/`         |
| **Onboarding Wizard**        | ✅ COMPLETO     | 4 pasos en `/onboarding`                                    |
| **Métricas Productividad**   | ✅ COMPLETO     | Schema + Router + UI en `/productivity`                     |
| **Gamificación**             | ✅ COMPLETO     | Puntos, niveles, 25 logros                                  |
| **Wallie Chat Timeline**     | ✅ COMPLETO     | Chat IA integrado en conversaciones                         |
| **WhatsApp OTP Login**       | ✅ IMPLEMENTADO | `phoneAuthRouter` + `WhatsAppLogin` component               |
| **Magic Link Auth**          | ✅ IMPLEMENTADO | `magicLinkRouter` + `MagicLinkLogin` component              |
| **Facturación España**       | ✅ IMPLEMENTADO | Schema facturas con IVA, router, UI en `/invoices`          |
| **Gestión Sesiones**         | ✅ IMPLEMENTADO | `sessionsRouter` - ver/cerrar sesiones                      |
| **Sentry Error Tracking**    | ✅ CONFIGURADO  | Client, server, edge configs en `apps/web/`                 |
| **2FA/MFA (TOTP)**           | ✅ IMPLEMENTADO | Schema + router + UI en `/settings/security`                |
| **Sistema Agentes IA**       | ✅ IMPLEMENTADO | **22 agentes** + Supervisor + Orchestrator                  |
| **Smart Chat (multi-agent)** | ✅ IMPLEMENTADO | `supervisedChat` + `previewPlan` endpoints                  |
| **Gmail Integration**        | ✅ IMPLEMENTADO | `gmailRouter` + AI analysis + auto-sync                     |
| **Admin Panel**              | ✅ COMPLETO     | **12 routers + 17 páginas** de administración               |
| **Sistema Referidos**        | ⚠️ PARCIAL      | Códigos OK, **invites NO envían** (ver PHASES.md AUDIT)     |
| **Inngest Workers**          | ✅ IMPLEMENTADO | **7 workers** para tareas async                             |
| **Kanban/Funnel Views**      | ✅ COMPLETO     | `/kanban` y `/funnel` páginas                               |

### 📊 INVENTARIO ACTUALIZADO (Auditoría 06 Dic 2025)

| Componente      | Cantidad | Documentación anterior | Real |
|-----------------|----------|------------------------|------|
| Routers tRPC    | **48**   | 36                     | +12  |
| Schemas DB      | **44**   | 34                     | +10  |
| Páginas UI      | **51**   | 41                     | +10  |
| Agentes IA      | **22**   | 15                     | +7   |
| Email Templates | **10**   | 6                      | +4   |
| Workers Inngest | **7**    | -                      | Nuevo |
| Tests           | **44**   | 22                     | +22  |
| Tests E2E       | **6**    | 3                      | +3   |

### ⚠️ Lo que NO funciona (problemas conocidos)

| Problema                      | Descripción                                         | Solución                                    |
| ----------------------------- | --------------------------------------------------- | ------------------------------------------- |
| **OAuth Providers**           | Google, Apple, Microsoft OAuth no funcionan         | WhatsApp OTP login como alternativa         |
| **Migraciones DB**            | Pendiente ejecutar `pnpm db:push`                   | Manual por admin                            |
| **WhatsApp Business**         | Verification con Meta pendiente                     | Proceso manual fuera del código             |
| **🔴 Email Placeholders**     | Si falta `RESEND_API_KEY`, usa `re_placeholder`     | Verificar var env en Vercel                 |
| **🔴 Stripe Placeholders**    | Si falta `STRIPE_SECRET_KEY`, usa placeholder       | Verificar var env en Vercel                 |
| **🔴 Referral Email**         | `referrals.ts:266` - NO envía email realmente       | Implementar `sendInviteEmail()`             |
| **🔴 Referral WhatsApp**      | `referral-invites.ts:68` - Simula éxito sin enviar  | Integrar con `@wallie/whatsapp`             |
| **baileys-worker**            | Dependencia SSH falla `pnpm install`                | Cambiar a HTTPS o excluir                   |
| **5 routers sin tests**       | gmail, integrations, referrals, tools, usage        | Crear tests de validación                   |

### 🔴 PROBLEMAS CRÍTICOS (Auditoría 06 Dic 2025)

> **Ver detalles completos en:** `docs/project/PHASES.md` → Sección AUDIT

```
1. Email Service → Si no hay RESEND_API_KEY, NINGÚN email se envía
2. Stripe → Si no hay STRIPE_SECRET_KEY, pagos pueden fallar silenciosamente
3. Referral Invites → Worker retorna success pero NO envía WhatsApp
4. Email Referidos → Router dice "enviado" pero email nunca sale
```

### 🔴 ANTES de proponer cualquier feature:

1. **Buscar en el código** si ya existe (usar grep/search)
2. **Revisar este ROADMAP** - sección "Estado Actual del Proyecto"
3. **Verificar schema DB** en `packages/db/src/schema/`
4. **Verificar routers** en `packages/api/src/routers/`
5. **Preguntar al usuario** si hay duda sobre el estado de algo

### 📍 Ubicaciones clave del código

```
packages/
├── agents/src/               # ← Sistema de Agentes IA
│   ├── supervisor.ts         # ← Meta-agente coordinador
│   ├── orchestrator.ts       # ← Detección de intención
│   └── agents/               # 12 agentes especializados
│       ├── web-search.ts
│       ├── documents.ts
│       ├── calendar.ts
│       ├── response-generator.ts
│       ├── invoices.ts
│       ├── clients.ts
│       ├── sentiment.ts
│       ├── chat.ts
│       ├── stats.ts
│       ├── summary.ts
│       ├── templates.ts
│       ├── priority.ts
│       └── email-handler.ts  # ← Gmail AI analysis & drafts
├── api/src/routers/          # Todos los endpoints tRPC
│   ├── phone-auth.ts         # ← WhatsApp OTP login
│   ├── magic-link.ts         # ← Magic Link auth
│   ├── invoices.ts           # ← Facturación España
│   ├── sessions.ts           # ← Gestión sesiones
│   ├── two-factor.ts         # ← 2FA/MFA TOTP
│   ├── productivity.ts       # ← Métricas
│   ├── gamification.ts       # ← Puntos/logros
│   ├── wallie.ts             # ← Chat IA + timeline + smartChat + supervisedChat
│   └── gmail.ts              # ← Gmail sync + AI analysis + drafts
├── api/src/lib/
│   └── activity-logger.ts    # ← Logging de eventos de seguridad
├── db/src/schema/            # Schemas Drizzle
│   ├── phone-verifications.ts
│   ├── invoices.ts           # ← Facturas, líneas, perfiles fiscales
│   ├── two-factor.ts         # ← 2FA auth, backup codes, attempts
│   ├── activity-logs.ts      # ← Security logs para auditoría
│   ├── productivity-metrics.ts
│   ├── gamification.ts
│   └── email.ts              # ← Gmail threads + AI analysis
└── auth/                     # Supabase Auth helpers

apps/web/
├── sentry.*.config.ts        # ← Configuración Sentry
└── src/
    ├── app/(dashboard)/
    │   ├── productivity/     # UI métricas
    │   └── invoices/         # UI facturas
    ├── app/api/invoices/[id]/pdf/
    │   └── route.tsx         # ← Generación PDF facturas
    ├── app/settings/
    │   └── security/         # UI 2FA/MFA
    └── components/auth/
        ├── whatsapp-login.tsx    # Login WhatsApp
        └── magic-link-login.tsx  # Login Magic Link
```

### 💡 Próximos pasos prioritarios

1. **Ejecutar migraciones DB** (`pnpm db:push`) - requiere acceso admin
2. **WhatsApp Business Verification** - proceso con Meta
3. **🔴 Migration Assistant MVP** - Diferenciador único, ningún competidor lo tiene
4. ~~**Facturación España**~~ - ✅ IMPLEMENTADO
5. ~~**Gestión sesiones**~~ - ✅ IMPLEMENTADO
6. ~~**2FA/MFA**~~ - ✅ IMPLEMENTADO
7. ~~**PDF facturas**~~ - ✅ IMPLEMENTADO con @react-pdf/renderer

---

## Estado Actual del Proyecto

```
┌─────────────────────────────────────────────────────────────────┐
│  MVP CORE                                                       │
│  ═══════════════════════════════════════════════════════════   │
│  Phase 4 (Polish): ████████████████████████ 100% ✅            │
│  Phase 5 (Deploy): ████████████████████████ 95%  ✅            │
│                                                                 │
│  FEATURES NUEVAS (Productividad + Gamificación)                 │
│  ═══════════════════════════════════════════════════════════   │
│  Métricas Productividad:     ████████████████████████ 100% ✅  │
│  Sistema Gamificación:       ████████████████████████ 100% ✅  │
│  Wallie Chat Timeline:       ████████████████████████ 100% ✅  │
│                                                                 │
│  ✅ DEPLOY COMPLETO:                                            │
│  ═══════════════════════════════════════════════════════════   │
│  ✓ Vercel: Proyecto configurado y desplegado                    │
│  ✓ Supabase: Proyecto producción activo                         │
│  ✓ Dominio: wallie.pro configurado                              │
│  ✓ Variables de entorno: Configuradas en Vercel                 │
│                                                                 │
│  PENDIENTE:                                                     │
│  ═══════════════════════════════════════════════════════════   │
│  - Aplicar migraciones DB (pnpm db:push)                        │
│  - WhatsApp Business Verification                               │
│  ✓ Facturación España (IVA) - IMPLEMENTADO                      │
│  ✓ Login con WhatsApp (OTP) - IMPLEMENTADO                      │
│  ✓ Magic Link Auth - IMPLEMENTADO                               │
│  ✓ Gestión Sesiones - IMPLEMENTADO                              │
│  ✓ Sentry Error Tracking - CONFIGURADO                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estrategia: MVP First, Quick Wins Post-Launch

```
TIMELINE:
═════════════════════════════════════════════════════════════════

AHORA ──────────► 3-4 SEMANAS ──────────► POST-LAUNCH
    │                   │                      │
    ▼                   ▼                      ▼
┌─────────┐       ┌─────────┐           ┌───────────┐
│ Phase 4 │  ───► │ Phase 5 │  ───────► │Quick Wins │
│ (25%)   │       │ Deploy  │           │ Sprints   │
└─────────┘       └─────────┘           └───────────┘
    │                   │                      │
    │                   │                      ├── Sprint 1: TIER 1
    │                   │                      ├── Sprint 2: TIER 2
    │                   │                      └── Sprint N: ...
    │                   │
    │                   └── Vercel + Supabase Prod
    │                       WhatsApp Webhook
    │                       Monitoring
    │
    └── A11y, E2E tests, Security audit
```

---

## Índice de Documentación

### Documentos Principales (Raíz)

| Archivo          | Descripción                         | Prioridad            |
| ---------------- | ----------------------------------- | -------------------- |
| `CLAUDE.md`      | Reglas para IA, convenciones código | Leer primero         |
| `SYSTEM.md`      | Arquitectura técnica completa       | Referencia           |
| `PHASES.md`      | Template de fases (5 fases MVP)     | Referencia           |
| **`ROADMAP.md`** | **Este archivo - fuente única**     | **Punto de entrada** |

### Quick Wins (docs/quickwins/)

| Archivo                     | Descripción                 | Contenido      |
| --------------------------- | --------------------------- | -------------- |
| `FEATURES_CONSOLIDADAS.csv` | 192 features con scores     | Lista maestra  |
| `MATRIZ_PRIORIZACION.md`    | Impact vs Effort visual     | Priorización   |
| `ROADMAP_FEATURES.md`       | Features mapeadas a fases   | Planificación  |
| `ESTADO_ACTUAL.md`          | Código vs Features análisis | Diagnóstico    |
| `ESTRATEGIA_LANZAMIENTO.md` | MVP → Launch → Quick Wins   | Estrategia     |
| `ANALISIS_COMPETITIVO.md`   | 10 competidores analizados  | Competencia    |
| `DIFERENCIACION_REAL.md`    | 54 features únicas          | Diferenciación |

### Features Nuevas (docs/features/)

| Archivo                             | Descripción                                    | Prioridad                      |
| ----------------------------------- | ---------------------------------------------- | ------------------------------ |
| `MIGRATION_ASSISTANT.md`            | Importar historial WhatsApp completo           | ALTA - Diferenciador único     |
| `COEXISTENCE_STRATEGY.md`           | Recordatorios 14 días, deeplinks, pricing      | ALTA - Optimización costes     |
| `ONBOARDING_VERIFICATION_WIZARD.md` | Wizard onboarding + guía Business Verification | 🔴 CRÍTICA - Adopción usuarios |
| `PRODUCTIVITY_METRICS.md`           | Métricas de productividad y ventas multi-canal | ✅ IMPLEMENTADO                |
| `GAMIFICATION_SYSTEM.md`            | Sistema de puntos, niveles y logros            | ✅ IMPLEMENTADO                |
| `WALLIE_CHAT_TIMELINE.md`           | Chat con Wallie integrado en conversaciones    | ✅ IMPLEMENTADO                |

---

## ✅ Phase 4 - COMPLETADO

### Estado Real (verificado en código 3 Dic 2025)

```
PHASE 4 - COMPLETADO:
────────────────────────────────────────────────────────────────

[x] 4.1 Accesibilidad (a11y) - Commit 7e7cc31
    [x] Mejoras de accesibilidad en componentes

[x] 4.2 Testing E2E - 3 specs en apps/web/e2e/
    [x] auth.spec.ts - Login/Register
    [x] navigation.spec.ts - Navegación
    [x] ui-components.spec.ts - Componentes UI

[x] 4.3 Validation Tests - 22 archivos, 473 tests en packages/api/src/__tests__/
    [x] clients, conversations, reminders, settings
    [x] wallie, ai, knowledge, profiles, stats
    [x] tags, subscriptions, email
    [x] invoices, two-factor, sessions (3 Dic 2025)
    [x] consents, gamification, productivity, phone-auth, magic-link, whatsapp (4 Dic 2025)
    [x] limits (4 Dic 2025) - 19 tests para plan limits enforcement

[x] 4.4 Performance - Commit b35be67
    [x] Optimizaciones de rendering con React.memo

[x] 4.5 UX Crítico
    [x] error.tsx - Página de error 500
    [x] not-found.tsx - Página 404
    [x] global-error.tsx - Error boundary global
```

---

## ✅ Phase 5 - EN PRODUCCIÓN

### Estado Real (verificado en código 3 Dic 2025)

```
PHASE 5 - DEPLOY:
────────────────────────────────────────────────────────────────

[x] 5.1 Infraestructura ✅ DESPLEGADO
    [x] Vercel proyecto producción - ACTIVO
    [x] Supabase proyecto producción - ACTIVO
    [x] Variables de entorno producción - CONFIGURADAS
    [x] Dominio configurado - wallie.pro

[x] 5.2 Legal/GDPR - Commits 7ea29f4, 1f21fc3, ed0b697
    [x] Política de privacidad (RGPD compliant) - /legal/privacy
    [x] Términos de servicio - /legal/terms
    [x] Banner de cookies + gestión consentimiento - cookie-banner.tsx
    [x] Aviso legal - /legal/notice
    [x] Cookies policy - /legal/cookies
    [x] Data export (portabilidad) - Implementado

[⚠️] 5.3 Auth Providers - oauth-buttons.tsx
    [⚠️] Google OAuth - IMPLEMENTADO pero NO FUNCIONA
    [⚠️] Apple Sign-In - IMPLEMENTADO pero NO FUNCIONA
    [⚠️] Microsoft OAuth - IMPLEMENTADO pero NO FUNCIONA
    [x] ⭐ Magic Link (passwordless via email) - INTEGRADO en login page
    [x] ⭐ Login con WhatsApp OTP - IMPLEMENTADO (phoneAuthRouter + WhatsAppLogin)

[x] 5.4 Email Transaccional - packages/email/src/templates/
    [x] email-verification.ts
    [x] password-reset.ts
    [x] welcome.ts
    [x] new-message.ts
    [x] payment-failed.ts
    [x] subscription-confirmed.ts

[x] 5.5 Seguridad Avanzada ✅ COMPLETO
    [x] 2FA/MFA opcional (TOTP) - twoFactorRouter + /settings/security
    [x] Gestión de sesiones (ver/cerrar sesiones) - sessionsRouter
    [x] Logs de actividad de cuenta - securityLogs + activity-logger

[x] 5.6 Facturación España ✅ COMPLETO
    [x] Facturas con IVA (21%) - invoices schema con vatType
    [x] Número de factura secuencial - WALLIE-YYYY-NNNNN
    [x] Datos fiscales del cliente (NIF/CIF) - fiscalProfiles
    [x] PDF de factura descargable - @react-pdf/renderer + /api/invoices/[id]/pdf

[x] 5.7 Onboarding Wizard - /onboarding/page.tsx
    [x] Step 1: Personal Info (nombre)
    [x] Step 2: Business Info (nombre negocio, sector)
    [x] Step 3: Communication Style (tono, emojis, longitud)
    [x] Step 4: Dashboard tour
    [ ] Fase 2: WhatsApp Verification Assistant (PENDIENTE)

[ ] 5.8 WhatsApp Business Verification (🔴 PENDIENTE - Meta)
    [ ] Facebook Business Manager configurado
    [ ] Business Verification completada:
        [ ] Documentos empresa (escrituras, CIF)
        [ ] Verificación dominio web (DNS TXT record)
        [ ] Dirección fiscal verificada
    [ ] Número WhatsApp dedicado (no puede estar en uso)
    [ ] Display Name aprobado por Meta
    [ ] WhatsApp Business API acceso concedido
    [ ] BSP seleccionado (360dialog, Twilio, etc.)
    [ ] Webhook URL producción configurado
    [ ] Templates de mensaje aprobados por Meta:
        [ ] Template de bienvenida
        [ ] Template de recordatorio
        [ ] Template de seguimiento
    [ ] Límite de mensajes inicial (1K/día → solicitar aumento)

[⚠️] 5.9 Monitoring
    [x] Sentry configurado - sentry.*.config.ts en apps/web/
    [ ] Uptime monitoring (externo - ej: BetterStack, Checkly)
    [ ] Alertas configuradas en Sentry Dashboard

[ ] 5.10 Beta Launch
    [ ] 10-20 usuarios beta seleccionados
    [ ] Canal de feedback (Slack/Discord)
    [ ] Proceso de bug reporting
```

---

## 🤖 Sistema de Agentes IA — IMPLEMENTADO (4 Dic 2025)

### Arquitectura Multi-Agente

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE AGENTES WALLIE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐     ┌─────────────────────────────────────────┐ │
│  │  SUPERVISOR │────▶│  Coordina múltiples agentes para tareas │ │
│  │  (meta)     │     │  complejas. Crea planes de ejecución.   │ │
│  └─────────────┘     └─────────────────────────────────────────┘ │
│         │                                                         │
│         ▼                                                         │
│  ┌─────────────┐     ┌─────────────────────────────────────────┐ │
│  │ ORCHESTRATOR│────▶│  Detecta intención y enruta al agente   │ │
│  │  (routing)  │     │  apropiado. 13 tipos de intención.      │ │
│  └─────────────┘     └─────────────────────────────────────────┘ │
│         │                                                         │
│         ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    13 AGENTES ESPECIALIZADOS                 │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ web-search      │ documents       │ calendar                │ │
│  │ response-gen    │ invoices        │ clients                 │ │
│  │ sentiment       │ chat            │ stats                   │ │
│  │ summary         │ templates       │ priority                │ │
│  │ email-handler   │                 │                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Agentes Disponibles

| Agente               | Descripción             | Casos de Uso                            |
| -------------------- | ----------------------- | --------------------------------------- |
| `web-search`         | Búsqueda en internet    | "Busca información sobre React"         |
| `documents`          | RAG sobre documentos    | "¿Qué dice mi knowledge base?"          |
| `calendar`           | Eventos y recordatorios | "Crea un recordatorio para mañana"      |
| `response-generator` | Genera respuestas       | "Sugiere una respuesta para Juan"       |
| `invoices`           | Consulta facturas       | "¿Cuánto facturé este mes?"             |
| `clients`            | Info de clientes        | "Dame info del cliente X"               |
| `sentiment-analyzer` | Análisis emocional      | "Analiza el tono de este mensaje"       |
| `chat`               | Conversación general    | "¿Qué puedes hacer?"                    |
| `stats`              | Métricas y KPIs         | "¿Cuántos mensajes envié hoy?"          |
| `summary`            | Resume conversaciones   | "Resume esta conversación"              |
| `templates`          | Plantillas de mensajes  | "Plantilla de seguimiento"              |
| `priority`           | Prioriza clientes       | "¿A quién debo contactar?"              |
| `email-handler`      | Analiza emails          | "Resume este email y sugiere respuesta" |

### Nuevos Endpoints API

| Endpoint                | Descripción                                       |
| ----------------------- | ------------------------------------------------- |
| `wallie.smartChat`      | Chat inteligente con routing automático a agentes |
| `wallie.supervisedChat` | Chat supervisado para tareas multi-agente         |
| `wallie.previewPlan`    | Vista previa del plan de ejecución                |
| `wallie.detectIntent`   | Detecta intención sin ejecutar                    |

### Ejemplo de Uso Supervisado

```
Usuario: "Analiza el sentimiento de los mensajes de Juan y sugiéreme una respuesta"

Supervisor Plan:
  Step 1: sentiment-analyzer → Analizar mensajes (parallel: true)
  Step 2: clients → Obtener contexto del cliente (parallel: true)
  Step 3: response-generator → Generar respuesta (dependsOn: [0, 1])

Complejidad: moderate
Agentes: 3
```

---

## 🚀 Evolución: De CRM con IA a Asistente Proactivo

**Estado:** 🟢 IMPLEMENTADO | **Fecha:** 4 Dic 2025

### Visión

Wallie evoluciona de un CRM con IA a un **asistente proactivo** que avisa, propone, resume y actúa por ti.

### Componentes Implementados

| Componente                                  | Estado | Descripción                                                            |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| **Sistema de Workers (Inngest)**            | ✅     | Motor de tareas en background para proactividad                        |
| **CalendarAgent conectado a DB**            | ✅     | Agente de calendario conectado a tabla `reminders`                     |
| **DocumentsAgent con RAG**                  | ✅     | Agente de documentos conectado a embeddings/pgvector                   |
| **StatsAgent con métricas reales**          | ✅     | Agente de estadísticas conectado a DB                                  |
| **Worker de análisis post-conversación**    | ✅     | Analiza conversaciones, extrae entidades, crea recordatorios sugeridos |
| **Worker de resumen diario**                | ✅     | Cron job a las 8 AM con resumen para cada usuario                      |
| **Worker de verificación de recordatorios** | ✅     | Cron job cada hora para notificar recordatorios próximos               |
| **UI de recordatorios sugeridos**           | ✅     | Dashboard con sugerencias IA para aceptar/rechazar                     |

### Arquitectura de Proactividad

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOTOR DE PROACTIVIDAD                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    INNGEST WORKERS                           │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ dailySummary     │ Cron 8:00 AM → Resumen diario por email  │ │
│  │ reminderCheck    │ Cron cada hora → Notifica recordatorios  │ │
│  │ conversationAnalysis │ Evento → Analiza y crea sugerencias  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 AGENTES CONECTADOS A DB                      │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ CalendarAgent   → reminders table                           │ │
│  │ DocumentsAgent  → embeddings table (pgvector RAG)           │ │
│  │ StatsAgent      → clients, messages, activityLogs           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    UI DASHBOARD                              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ SuggestedReminders → Acepta/Rechaza sugerencias IA          │ │
│  │ reminders.getSuggested → Endpoint para sugerencias          │ │
│  │ reminders.acceptSuggested / rejectSuggested → Acciones      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Nuevos Archivos Creados

| Archivo                                                     | Propósito                               |
| ----------------------------------------------------------- | --------------------------------------- |
| `packages/workers/src/client.ts`                            | Cliente Inngest con tipos de eventos    |
| `packages/workers/src/functions/daily-summary.ts`           | Worker de resumen diario                |
| `packages/workers/src/functions/conversation-analysis.ts`   | Worker de análisis de conversación      |
| `packages/workers/src/functions/reminder-check.ts`          | Worker de verificación de recordatorios |
| `apps/web/src/app/api/inngest/route.ts`                     | API route para Inngest                  |
| `apps/web/src/components/dashboard/suggested-reminders.tsx` | Componente UI para sugerencias          |

### Próximos Pasos

| Paso                    | Descripción                               | Prioridad |
| ----------------------- | ----------------------------------------- | --------- |
| Integrar con email real | Conectar workers con `@wallie/email`      | Alta      |
| Notificaciones push     | Canal de comunicación proactiva en la app | Media     |
| Google Calendar sync    | Sincronizar con `gcalTokens` del perfil   | ✅ HECHO  |
| WhatsApp Business       | Resolución bloqueo con Meta               | Alta      |

---

## 🚀 SPRINT A: Integraciones & Automatización (5 Dic 2025)

**Estado:** ✅ IMPLEMENTADO

### Google Calendar OAuth Integration

| Componente                  | Estado | Descripción                                        |
| --------------------------- | ------ | -------------------------------------------------- |
| `connected_accounts` table  | ✅     | Schema para tokens OAuth (access, refresh, expiry) |
| `integrationsRouter`        | ✅     | OAuth flow + token refresh + disponibilidad        |
| `CalendarAgent` actualizado | ✅     | Tools: `checkAvailability`, `bookMeeting`          |
| OAuth callback route        | ✅     | `/api/auth/google/callback`                        |
| UI `/settings/integrations` | ✅     | Conexión/desconexión Google Calendar               |

### Auto-Pilot System

| Componente           | Estado | Descripción                                           |
| -------------------- | ------ | ----------------------------------------------------- |
| Campos en `profiles` | ✅     | `autoPilotEnabled`, `autoPilotThreshold`, `Hours`     |
| Lógica en webhook    | ✅     | Score + horario + confianza → auto-envío o sugerencia |
| UI Auto-Pilot        | ✅     | Toggle + slider umbral + selector horario             |

### Nuevos Archivos

```
packages/db/src/schema/connected-accounts.ts  # OAuth tokens
packages/api/src/routers/integrations.ts      # OAuth flow + Auto-Pilot
apps/web/src/app/api/auth/google/callback/route.ts
apps/web/src/app/settings/integrations/page.tsx
```

### 🛑 STOP TÉCNICO: Configuración Google Cloud

> **IMPORTANTE:** Antes de probar el login con Google, completar estos pasos:

#### Checklist Google Cloud Console

- [ ] **1. Crear Proyecto** en [Google Cloud Console](https://console.cloud.google.com/)
- [ ] **2. Habilitar APIs:**
  - [ ] Google Calendar API
  - [ ] Gmail API (preparado para futuro)
- [ ] **3. Pantalla de Consentimiento OAuth:**
  - [ ] Configurar como "External" (o "Internal" si es test)
  - [ ] Añadir email de prueba en "Test users"
  - [ ] Scopes: `calendar.events`, `calendar.readonly`, `gmail.readonly`, `gmail.send`, `userinfo.email`, `userinfo.profile`
- [ ] **4. Credenciales → OAuth 2.0 Client ID:**
  - [ ] Tipo: Web application
  - [ ] Authorized redirect URIs:
    - `http://localhost:3000/api/auth/google/callback` (dev)
    - `https://wallie.pro/api/auth/google/callback` (prod)
- [ ] **5. Copiar a `.env`:**
  ```bash
  GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=GOCSPX-xxx
  GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
  ```

#### Verificación

```bash
# Probar OAuth flow
1. Ir a /settings/integrations
2. Click "Conectar con Google"
3. Autorizar acceso en Google
4. Verificar redirección con success=true
```

---

## 🛠️ SPRINT B: OPS, Monitoring & Deployment (5 Dic 2025)

**Estado:** ✅ IMPLEMENTADO

### Error Tracking (Sentry)

| Componente    | Estado | Descripción                           |
| ------------- | ------ | ------------------------------------- |
| Client config | ✅     | `sentry.client.config.ts` en apps/web |
| Server config | ✅     | `sentry.server.config.ts` en apps/web |
| Edge config   | ✅     | `sentry.edge.config.ts` en apps/web   |

### Product Analytics (PostHog)

| Componente         | Estado | Descripción                                                                                                                      |
| ------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| PostHogProvider    | ✅     | Lazy-load provider con require() pattern                                                                                         |
| Tracking functions | ✅     | `trackEvent`, `identifyUser`, `resetUser`, `getFeatureFlag`                                                                      |
| Pre-defined events | ✅     | `trackIntegrationConnected`, `trackAutoPilotTriggered`, `trackReferralConverted`, `trackOnboardingCompleted`, `trackFeatureUsed` |

### Baileys Worker Deployment

| Componente          | Estado | Descripción                                      |
| ------------------- | ------ | ------------------------------------------------ |
| Dockerfile          | ✅     | Multi-stage build, node:20-alpine, non-root user |
| railway.json        | ✅     | Railway.app config con healthcheck               |
| render.yaml         | ✅     | Render.com config con disk persistence           |
| Session persistence | ✅     | `/app/sessions` volume mount                     |

### Cron Maintenance Endpoint

| Componente              | Estado | Descripción                                 |
| ----------------------- | ------ | ------------------------------------------- |
| `/api/cron/maintenance` | ✅     | Protected endpoint (CRON_SECRET)            |
| Jobs supported          | ✅     | `daily-summary`, `reminder-check`, `all`    |
| Inngest integration     | ✅     | Triggers Inngest events for background jobs |

### Database Sync Script

| Componente                      | Estado | Descripción                               |
| ------------------------------- | ------ | ----------------------------------------- |
| `scripts/db-sync-production.sh` | ✅     | Safe production db:push with confirmation |
| Double confirmation             | ✅     | Type "SYNC" to proceed                    |
| Verification steps              | ✅     | Post-sync verification instructions       |

### Environment Variables Added

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx        # PostHog project key
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
CRON_SECRET=your-cron-secret-here      # For cron endpoint auth
```

---

## 📧 SPRINT C: Gmail Integration & Email AI (5 Dic 2025)

**Estado:** ✅ IMPLEMENTADO

### Gmail API Integration

| Componente                  | Estado | Descripción                                              |
| --------------------------- | ------ | -------------------------------------------------------- |
| `email_threads` table       | ✅     | Schema for email threads with AI analysis fields         |
| `google-gmail.ts` lib       | ✅     | Gmail API wrapper with auto token refresh                |
| `gmail-sync` Inngest worker | ✅     | Cron job every 15 min for all users with Gmail connected |
| `email-handler` agent       | ✅     | AI agent for email analysis and draft generation         |
| `gmailRouter`               | ✅     | Full tRPC router with 11 endpoints                       |

### Email Handler Agent Capabilities

| Action          | Description                                          |
| --------------- | ---------------------------------------------------- |
| `analyze`       | AI-powered email analysis (sentiment, urgency, lead) |
| `generateDraft` | Create professional draft response                   |

### Gmail Router Endpoints

| Endpoint           | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `connectionStatus` | Check Gmail connection status                         |
| `listThreads`      | List threads with filters (status, category, urgency) |
| `getThread`        | Get single thread details                             |
| `analyzeThread`    | Trigger AI analysis for a thread                      |
| `generateDraft`    | Generate AI draft response                            |
| `approveDraft`     | Send approved draft via Gmail                         |
| `discardDraft`     | Delete draft from Gmail and DB                        |
| `archiveThread`    | Archive single thread                                 |
| `bulkArchive`      | Archive multiple threads                              |
| `triggerSync`      | Manual sync trigger                                   |
| `getStats`         | Get email statistics                                  |

### Email AI Analysis Output

```typescript
interface EmailAIAnalysis {
  summary: string          // 1-sentence summary
  sentiment: 'positive' | 'neutral' | 'negative'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  category: 'lead' | 'inquiry' | 'support' | 'complaint' | ...
  isLead: boolean
  leadScore?: number       // 0-100 if is_lead
  keyTopics: string[]
  suggestedAction?: string
  confidence: number       // 0-1
}
```

### New Files Created

```
packages/db/src/schema/email.ts           # Email threads schema
packages/api/src/lib/google-gmail.ts      # Gmail API wrapper
packages/api/src/routers/gmail.ts         # tRPC router
packages/workers/src/functions/gmail-sync.ts  # Inngest worker
packages/agents/src/agents/email-handler.ts   # Email AI agent
```

### Prerequisites for Gmail

> Same Google Cloud setup as Calendar (Sprint A):
>
> - Gmail API enabled in Google Cloud Console
> - OAuth scopes: `gmail.readonly`, `gmail.send`, `gmail.compose`

---

## Quick Wins Post-Launch: Por Dónde Empezar

### TIER 1 — Estado Actual

| ID     | Feature                                 | Impacto | Dificultad | Estado                             |
| ------ | --------------------------------------- | ------- | ---------- | ---------------------------------- |
| QW-001 | Recordatorio inteligente de seguimiento | 10      | 3          | ✅ Via `calendar` agent            |
| QW-002 | Detección de oportunidad de venta       | 10      | 4          | 🔄 En `sentiment-analyzer`         |
| QW-003 | Análisis de sentimiento en tiempo real  | 9       | 4          | ✅ `sentiment-analyzer` agent      |
| QW-004 | Sugerencia de respuesta contextual      | 10      | 5          | ✅ `response-generator` agent      |
| QW-005 | Dashboard de métricas de ventas         | 9       | 3          | ✅ `/productivity` + `stats` agent |

### 🔴 TIER 1 — PRÓXIMA PRIORIDAD

| ID         | Feature                            | Impacto | Dificultad | Estado                | Notas                                         |
| ---------- | ---------------------------------- | ------- | ---------- | --------------------- | --------------------------------------------- |
| **QW-009** | **Sistema de Scoring Unificado**   | **10**  | **3**      | 🟡 EN DESARROLLO      | **VIP + Temperatura + Urgencia + Recurrente** |
| **QW-008** | **Migration Assistant MVP**        | **10**  | **5**      | 🟡 Planificada FASE 8 | **Diferenciador único - ningún competidor**   |
| QW-006     | Integrar agents en UI de chat      | 9       | 3          | 🟡 Pendiente          | Mejorar UX del chat multi-agente              |
| QW-007     | Feedback loop para mejorar agentes | 8       | 4          | 🟡 Pendiente          | Aprovechar feedback del usuario para IA       |

#### Sistema de Scoring Unificado — Detalle (QW-009)

- **Problema:** El scoring existe pero no está expuesto en UI ni tiene filtros avanzados
- **Solución:** Unificar scoring de engagement + VIP + urgencia + recurrencia
- **Valor:** Filtrar clientes por temperatura (🔥 hot, warm, cold), VIP, urgentes, recurrentes
- **Campos nuevos:** `vipScore`, `isVip`, `isRecurring`, `urgencyScore`, `temperature`
- **Esfuerzo:** ~8-10 horas (schema + endpoints + UI básica)

#### Migration Assistant — Detalle

- **Especificación:** `docs/features/MIGRATION_ASSISTANT.md` (1000 líneas)
- **Problema:** Meta API solo sincroniza 6 meses de historial
- **Solución:** Importar exports `.txt` de WhatsApp para tener historial completo
- **Valor:** La IA conoce TODA la historia con cada cliente → mejores sugerencias
- **Competidores:** NINGUNO ofrece esto
- **Esfuerzo:** ~5 días MVP (parser + UI + integración IA)
- **Ver:** PHASES.md → FASE 8: DIFERENCIADORES ÚNICOS

> Ver lista completa: `docs/quickwins/FEATURES_CONSOLIDADAS.csv`

### TIER 2-4 — Sprints Posteriores

Ver priorización completa en:

- `docs/quickwins/MATRIZ_PRIORIZACION.md` - Visual Impact vs Effort
- `docs/quickwins/ROADMAP_FEATURES.md` - Mapping a fases

---

## Features Planificadas: Productividad, Gamificación y Chat IA

### 🎯 Visión General

Tres sistemas interconectados que potencian la productividad y engagement del usuario:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ECOSISTEMA DE VALOR                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │  MÉTRICAS   │────▶│ GAMIFICACIÓN│────▶│  RETENCIÓN  │        │
│  │PRODUCTIVIDAD│     │   PUNTOS    │     │  USUARIOS   │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   WALLIE    │────▶│  INSIGHTS   │────▶│    MÁS      │        │
│  │ CHAT EN     │     │ ACCIONABLES │     │   VENTAS    │        │
│  │ TIMELINE    │     │             │     │             │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 📊 1. Métricas de Productividad y Ventas

**Estado:** 🟢 IMPLEMENTADO | **Prioridad:** 🟠 ALTA | **Esfuerzo:** Medio

#### ✅ Implementado (3 Dic 2025)

- Schema DB: `activityLogs`, `dailyMetrics`, `productivityGoals`
- Router: `productivityRouter` con endpoints completos
- Activity Logger integrado en routers: `clients`, `whatsapp`, `reminders`, `wallie`
- Página UI: `/productivity` con dashboard completo

#### Descripción

Sistema completo de métricas orientadas a ventas, inicialmente para WhatsApp y extensible a otros canales (Email, Instagram, etc.).

#### Métricas por Canal

| Canal        | Fase    | Métricas Clave                                                           |
| ------------ | ------- | ------------------------------------------------------------------------ |
| WhatsApp     | 1 (MVP) | Tiempo respuesta, mensajes/hora, tasa respuesta, conversaciones cerradas |
| Email        | 2       | Open rate, click rate, threads resueltos, tiempo primera respuesta       |
| Instagram/FB | 3       | Engagement, mensajes directos, conversiones                              |
| Unificadas   | 3       | Cross-channel journey, atribución multi-touch                            |

#### Métricas de Ventas

```
FUNNEL DE CONVERSIÓN:
Leads → Contactados → Propuesta → Negociación → Cerrados

MÉTRICAS:
├── Valor del pipeline por etapa
├── Tiempo promedio en cada etapa
├── Win rate por canal/origen
├── Ticket promedio
└── Predicción de cierre (IA) ← Diferenciador
```

#### Métricas de Productividad Personal

- **Horas más productivas:** Análisis de cuándo el usuario cierra más ventas
- **Clientes atendidos/día:** Tracking de volumen de trabajo
- **Score de seguimiento:** Penalización por clientes "fríos" (sin contacto 7+ días)
- **Comparativa temporal:** vs semana anterior, vs mes anterior

#### Schema DB Propuesto

```typescript
// packages/db/src/schema/productivity-metrics.ts

// Log de actividades (granular)
activityLogs: {
  id, userlId, clientId, conversationId,
  channel: 'whatsapp' | 'email' | 'manual',
  actionType: 'message_sent' | 'call_made' | 'deal_moved' | ...,
  metadata: jsonb,
  createdAt
}

// Métricas diarias (agregadas)
dailyMetrics: {
  id, userId, date, channel,
  messagesSent, messagesReceived,
  avgResponseTimeMinutes,
  newLeads, dealsClosed, revenueGenerated,
  productivityScore  // Calculado
}
```

---

### 🏆 2. Sistema de Gamificación (Calificación)

**Estado:** 🟢 IMPLEMENTADO | **Prioridad:** 🟡 MEDIA | **Esfuerzo:** Alto

#### ✅ Implementado (3 Dic 2025)

- Schema DB: `userScores`, `achievements`, `userAchievements`, `pointsHistory`
- Router: `gamificationRouter` con endpoints completos
- Seed: 25 logros base en 6 categorías
- UI: Panel de logros y niveles en `/productivity`

#### Descripción

Sistema de puntos, niveles y logros para incentivar el uso correcto de la plataforma y mejorar los hábitos de venta.

#### Niveles del Usuario

| Nivel | Nombre         | Puntos    | Beneficios                          |
| ----- | -------------- | --------- | ----------------------------------- |
| 1     | Novato         | 0-100     | Acceso básico                       |
| 2     | Aprendiz       | 100-500   | Badge visible en perfil             |
| 3     | Profesional    | 500-2000  | Sugerencias IA prioritarias         |
| 4     | Experto        | 2000-5000 | Análisis avanzados                  |
| 5     | Maestro Wallie | 5000+     | Beta features + Soporte prioritario |

#### Sistema de Puntos

```
ACCIONES Y PUNTOS:
├── +5   Responder mensaje < 5 minutos
├── +10  Cerrar un deal
├── +3   Completar un recordatorio
├── +2   Usar sugerencia de Wallie
├── +15  Conseguir un nuevo lead
├── +1   Cada interacción registrada
└── x1.5 Multiplicador por racha activa
```

#### Logros (Badges)

| Badge | Nombre           | Requisito                    |
| ----- | ---------------- | ---------------------------- |
| ⚡    | Respuesta Rápida | 50 respuestas en < 5 min     |
| 🎯    | Cerrador Serial  | 10 deals en un mes           |
| 🔥    | Sin Cliente Frío | 30 días sin leads ignorados  |
| 🤖    | Wallie's Friend  | 100 sugerencias de IA usadas |
| 🌐    | Multicanal       | Activo en 3+ canales         |
| 📈    | Racha Imparable  | 30 días consecutivos activo  |

#### Rachas (Streaks)

- **Días consecutivos activo:** Incrementa multiplicador de puntos
- **Semanas sin clientes ignorados:** Logro especial
- **Pérdida de racha:** Notificación motivacional + oportunidad de recuperar

#### Schema DB Propuesto

```typescript
// packages/db/src/schema/gamification.ts

userScores: {
  userId (PK), totalPoints, level,
  currentStreak, longestStreak, lastActivityDate
}

achievements: {
  id: 'fast_responder' | 'deal_closer' | ...,
  name, description, iconUrl,
  pointsRequired, criteria: jsonb
}

userAchievements: {
  id, userId, achievementId, unlockedAt
}
```

---

### 💬 3. Chat con Wallie Integrado en Timeline

**Estado:** 🟢 IMPLEMENTADO | **Prioridad:** 🔴 CRÍTICA | **Esfuerzo:** Medio

#### ✅ Implementado (3 Dic 2025)

- Schema DB: `wallieInteractions` con posición temporal y mensajes
- Router: Endpoints `chatInConversation`, `continueInteraction`, `getInteractions`, `toggleCollapsed`, `deleteInteraction`
- UI: Componente `WallieChatInline` colapsable integrado en conversaciones
- Botón "Pregunta a Wallie" en timeline de conversación

#### Descripción

Integrar las conversaciones con Wallie directamente en el timeline de cada chat con cliente, como "globos" colapsables que muestran cuándo el usuario consultó a la IA.

#### Flujo Visual

```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Conversación con: Juan Pérez                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─ 10:30 ──────────────────────────────────────────────────┐   │
│  │ 👤 Cliente: Hola, quisiera info sobre el producto X       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ 10:32 ── 🤖 WALLIE ─────────────────────── [▼ Expandir] ┐   │
│  │ ┌─────────────────────────────────────────────────────┐   │   │
│  │ │ Tú: ¿Qué sabes de este cliente?                     │   │   │
│  │ │ Wallie: Juan es un lead desde hace 2 semanas.       │   │   │
│  │ │         Mostró interés en productos similares...    │   │   │
│  │ │ Tú: Sugiere una respuesta                           │   │   │
│  │ │ Wallie: "¡Hola Juan! El producto X tiene..."        │   │   │
│  │ └─────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ 10:35 ──────────────────────────────────────────────────┐   │
│  │ 📤 Tú: ¡Hola Juan! El producto X tiene las siguientes... │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ 11:00 ── 🤖 WALLIE ── [▶ Colapsado] ────────────────────┐   │
│  │ Preview: "Analicé el precio y creo que..."               │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 💬 Escribe un mensaje...          [🤖 Preguntar a Wallie] │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Características Clave

| Feature                 | Descripción                                                   |
| ----------------------- | ------------------------------------------------------------- |
| **Posición temporal**   | El chat con Wallie aparece en el momento exacto que ocurrió   |
| **Colapsable**          | Por defecto colapsado con preview, expandible al hacer clic   |
| **Contexto preservado** | Wallie tiene contexto de toda la conversación hasta ese punto |
| **Acceso rápido**       | Botón "Preguntar a Wallie" siempre visible en el chat         |
| **Historial completo**  | Todas las consultas a Wallie quedan registradas               |

#### Beneficios

1. **Contexto histórico:** Ver qué preguntaste a Wallie cuando escribiste ese mensaje
2. **Aprendizaje:** Revisar cómo Wallie te ayudó a cerrar una venta
3. **Auditoría:** Entender el proceso de toma de decisiones
4. **UX natural:** La IA es parte de la conversación, no una herramienta separada

#### Schema DB Propuesto

```typescript
// packages/db/src/schema/wallie-interactions.ts

wallieInteractions: {
  id, userId, conversationId,
  afterMessageId,  // Posición en timeline (después de qué mensaje)
  timestampInConversation,
  messages: jsonb,  // Array de {role, content, timestamp}
  isCollapsed: boolean,
  createdAt, updatedAt
}
```

#### Extensión del Router Existente

```typescript
// Añadir a packages/api/src/routers/wallie.ts

chatInConversation: protectedProcedure
  .input(
    z.object({
      conversationId: z.string().uuid(),
      message: z.string(),
      afterMessageId: z.string().uuid().optional(),
    })
  )
  .mutation(/* Guardar interacción posicionada en timeline */)

getWallieInteractions: protectedProcedure
  .input(z.object({ conversationId: z.string().uuid() }))
  .query(/* Retornar interacciones para merge con mensajes */)
```

---

### 📅 Estado de Implementación

| Orden | Feature                             | Estado                                        |
| ----- | ----------------------------------- | --------------------------------------------- |
| 1º    | Chat Wallie en Timeline             | ✅ COMPLETADO (3 Dic 2025)                    |
| 2º    | Métricas de Productividad (básicas) | ✅ COMPLETADO (3 Dic 2025)                    |
| 3º    | Sistema de Gamificación             | ✅ COMPLETADO (3 Dic 2025)                    |
| 4º    | Métricas multi-canal                | 🟡 Pendiente - Cuando se integren más canales |

> **Nota:** Para activar completamente estas features, ejecutar:
>
> 1. `pnpm db:push` - Aplicar migraciones
> 2. `pnpm db:seed` - Cargar logros base

---

## Diferenciadores Competitivos (54 Features Únicas)

Wallie tiene **54 features que NINGÚN competidor ofrece**:

| Categoría           | Features | Ejemplos                                     |
| ------------------- | -------- | -------------------------------------------- |
| IA Predictiva       | 7        | Predicción de churn, momento óptimo contacto |
| Style AI            | 6        | Clonación de estilo, adaptación por cliente  |
| Detección Emocional | 10       | Frustración, urgencia, intención de compra   |
| Ventas Avanzadas    | 11       | Objeciones automáticas, upsell inteligente   |
| Protección/Riesgo   | 7        | Detección fraude, alertas legales            |
| Automatización      | 6        | Workflows condicionales, triggers por evento |
| Copiloto Personal   | 7        | Briefing matutino, resumen de ausencia       |

> Ver detalle: `docs/quickwins/DIFERENCIACION_REAL.md`

### Diferenciador #1: Migration Assistant

**El problema:** WhatsApp Coexistence solo sincroniza 6 meses de historial.

**Nuestra solución:** Importar TODO el historial para que la IA aprenda de años de relación con clientes.

**Competidores que lo tienen:** NINGUNO

> Ver especificación técnica: `docs/features/MIGRATION_ASSISTANT.md`

---

## Competencia Principal

| Competidor       | Amenaza                        | Nuestro Diferenciador               |
| ---------------- | ------------------------------ | ----------------------------------- |
| **Clientify**    | Alta - España, mismo target    | IA predictiva + Migration Assistant |
| **Keybe AI**     | Alta - Mismo claim "4x ventas" | Style AI + 54 features únicas       |
| **AISyr**        | Media - Tier FREE              | Funcionalidad superior, no precio   |
| **ManyContacts** | Media - Baratos                | IA avanzada vs CRM básico           |

> Ver análisis completo: `docs/quickwins/ANALISIS_COMPETITIVO.md`

---

## Resumen de Archivos y Qué Contiene Cada Uno

```
Wallie/
├── CLAUDE.md                    # Reglas para IA (leer primero)
├── SYSTEM.md                    # Arquitectura técnica
├── PHASES.md                    # Template 5 fases MVP
├── ROADMAP.md                   # ★ ESTE ARCHIVO - punto de entrada
│
├── docs/
│   ├── quickwins/
│   │   ├── FEATURES_CONSOLIDADAS.csv    # 192 features con scores
│   │   ├── MATRIZ_PRIORIZACION.md       # Impact vs Effort
│   │   ├── ROADMAP_FEATURES.md          # Features → Fases
│   │   ├── ESTADO_ACTUAL.md             # Código actual vs features
│   │   ├── ESTRATEGIA_LANZAMIENTO.md    # MVP → Launch strategy
│   │   ├── ANALISIS_COMPETITIVO.md      # 10 competidores
│   │   └── DIFERENCIACION_REAL.md       # 54 features únicas
│   │
│   └── features/
│       ├── MIGRATION_ASSISTANT.md       # ★ Importar historial completo
│       ├── COEXISTENCE_STRATEGY.md      # ★ 14 días, deeplinks, pricing
│       └── ONBOARDING_VERIFICATION_WIZARD.md # ★ Wizard + Business Verification
│
└── [código fuente...]
```

---

## Proceso de Actualización

### Cuándo Actualizar Este Documento

1. **Al completar Phase 4** → Actualizar estado, pasar a Phase 5
2. **Al hacer deploy** → Marcar Phase 5 completa
3. **Al implementar Quick Win** → Actualizar contador
4. **Al añadir nueva feature** → Añadir a docs/features/

### Archivos a Mantener Actualizados

| Archivo                     | Frecuencia             | Responsable |
| --------------------------- | ---------------------- | ----------- |
| `ROADMAP.md`                | Cada milestone         | Lead        |
| `FEATURES_CONSOLIDADAS.csv` | Al implementar feature | Dev         |
| `ESTADO_ACTUAL.md`          | Semanal                | Dev         |

---

_Última actualización: 5 Dic 2025_
