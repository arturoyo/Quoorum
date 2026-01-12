# 🧪 TESTING_CHECKLIST.md — Guía de Testing de Wallie

> **Versión:** 1.0.0 | **Última actualización:** 25 Dic 2025
> **Propósito:** Checklist completo para verificar funcionalidad del proyecto

---

## 📊 Estado Actual del Testing

| Área | Coverage | Archivos Test | Estado |
|------|----------|---------------|--------|
| **tRPC Routers** | 69% (59/85) | 59 validation tests | 🟡 En progreso |
| **Psychology Engine** | 100% (6/6) | 6 tests dedicados | ✅ Completo |
| **E2E Flujos** | 80% (8/10) | 8 Playwright specs | 🟡 En progreso |
| **Workers Inngest** | 4% (1/24) | 1 test | 🔴 Crítico |
| **Componentes UI** | 0% | 0 tests | 🟠 Pendiente |

---

## 🔧 Cómo Ejecutar Tests

### Prerrequisitos
```bash
# Instalar dependencias
pnpm install

# Asegurar que la base de datos está disponible
# (Solo necesario para tests de integración)
```

### Comandos Principales

```bash
# Verificación rápida (TypeScript + Lint)
pnpm typecheck && pnpm lint

# Tests unitarios (Vitest)
pnpm test

# Tests en modo watch (desarrollo)
pnpm test:watch

# Tests con coverage
pnpm test:coverage

# Solo smoke tests (rápido)
pnpm test -- smoke

# E2E con Playwright
pnpm test:e2e

# E2E con UI visual
pnpm test:e2e:ui

# Health check de routers
pnpm test -- router-health
```

---

## 📋 Áreas de Testing

### 1. 🔐 Autenticación
| Flujo | Test | Prioridad |
|-------|------|-----------|
| Login email/password | `auth.spec.ts` | Alta |
| Magic link | `magic-link-validation.test.ts` | Alta |
| Phone OTP | `phone-auth-validation.test.ts` | Alta |
| Two Factor (2FA) | `two-factor-validation.test.ts` | Alta |
| Logout | `auth.spec.ts` | Media |
| Session management | `sessions-validation.test.ts` | Media |

### 2. 📊 Dashboard
| Flujo | Test | Prioridad |
|-------|------|-----------|
| Carga inicial | `dashboard.spec.ts` | Alta |
| Widgets de stats | `stats-validation.test.ts` | Alta |
| Quick actions | `dashboard.spec.ts` | Media |
| Gamification widget | `gamification-validation.test.ts` | Media |

### 3. 👥 Clientes
| Flujo | Test | Prioridad |
|-------|------|-----------|
| Listar clientes | `clients-validation.test.ts` | Alta |
| Crear cliente | `clients-validation.test.ts` | Alta |
| Editar cliente | `clients-validation.test.ts` | Alta |
| Eliminar cliente | `clients-validation.test.ts` | Alta |
| Pipeline view | `clients.spec.ts` | Media |
| Tags de cliente | `tags-validation.test.ts` | Media |
| Grupos de clientes | `client-groups-validation.test.ts` | Media |

### 4. 💬 Conversaciones
| Flujo | Test | Prioridad |
|-------|------|-----------|
| Listar conversaciones | `conversations-validation.test.ts` | Alta |
| Ver conversación | `conversations.spec.ts` | Alta |
| Enviar mensaje | `whatsapp-validation.test.ts` | Alta |
| WhatsApp sync | `whatsapp-validation.test.ts` | Alta |
| Email sync | `gmail-validation.test.ts` | Media |
| Inbox unificado | ⚠️ `inbox` (pendiente) | Alta |

### 5. 🤖 IA y Automatización
| Flujo | Test | Prioridad |
|-------|------|-----------|
| Generar respuesta IA | `ai-validation.test.ts` | Alta |
| Clasificación mensajes | ⚠️ `classifiers` (pendiente) | Alta |
| Scoring de clientes | `scoring-validation.test.ts` | Alta |
| Wallie chat | `wallie-validation.test.ts` | Media |
| Knowledge base | `knowledge-validation.test.ts` | Media |

### 6. 💰 Pagos y Suscripciones
| Flujo | Test | Prioridad |
|-------|------|-----------|
| Ver plan actual | `subscriptions-validation.test.ts` | Alta |
| Upgrade plan | `payment.spec.ts` | Alta |
| Facturas | `invoices-validation.test.ts` | Alta |
| Addons | `addons-validation.test.ts` | Media |
| Uso y límites | `usage-validation.test.ts` | Media |

### 7. 🎮 Gamificación
| Flujo | Test | Prioridad |
|-------|------|-----------|
| Puntos y nivel | `gamification-validation.test.ts` | Media |
| Logros | `gamification-validation.test.ts` | Media |
| Referidos | `referrals-validation.test.ts` | Media |
| Rewards store | ⚠️ `rewards` (pendiente) | Baja |

### 8. 📈 Analytics
| Flujo | Test | Prioridad |
|-------|------|-----------|
| Stats overview | `stats-validation.test.ts` | Alta |
| Analytics detallado | `analytics-validation.test.ts` | Media |
| Productivity | `productivity-validation.test.ts` | Media |

### 9. ⚙️ Configuración
| Flujo | Test | Prioridad |
|-------|------|-----------|
| Perfil usuario | `profiles-validation.test.ts` | Alta |
| Settings | `settings-validation.test.ts` | Alta |
| Business profile | `business-profile-validation.test.ts` | Media |
| Integraciones | `integrations-validation.test.ts` | Media |
| AI config | ⚠️ `ai-config` (pendiente) | Media |

### 10. 🛡️ Admin Panel
| Flujo | Test | Prioridad |
|-------|------|-----------|
| Users management | `admin-users-validation.test.ts` | Alta |
| Analytics admin | `admin-analytics-validation.test.ts` | Alta |
| Plans management | `admin-plans-validation.test.ts` | Media |
| System health | `admin-system-validation.test.ts` | Media |
| Subscriptions | `admin-subscriptions-validation.test.ts` | Media |

---

## 🚨 Flujos Críticos (Must Pass)

### Onboarding Flow
```
1. Usuario llega a landing → /
2. Click "Empezar gratis" → /register
3. Completa registro → redirect /onboarding
4. Conecta WhatsApp → /onboarding/whatsapp
5. Configura negocio → /onboarding/business
6. Ve dashboard → /dashboard
```

### WhatsApp Flow
```
1. Usuario en /inbox
2. Selecciona conversación
3. Ve historial de mensajes
4. Escribe mensaje o usa sugerencia IA
5. Envía mensaje
6. Mensaje aparece en timeline
```

### Payment Flow
```
1. Usuario en plan Free
2. Va a /settings/billing
3. Selecciona plan Pro
4. Redirect a Stripe Checkout
5. Completa pago
6. Redirect a /dashboard con plan activo
```

### Referral Flow
```
1. Usuario genera código de referido
2. Comparte link
3. Nuevo usuario se registra con código
4. Ambos reciben puntos/beneficios
```

---

## ✅ Checklist Pre-Deploy

### Verificaciones Obligatorias
- [ ] `pnpm typecheck` → Sin errores
- [ ] `pnpm lint` → Sin errores críticos
- [ ] `pnpm test` → Todos los tests pasan
- [ ] `pnpm build` → Build exitoso

### Verificaciones E2E (si hay cambios UI)
- [ ] Auth flow funciona
- [ ] Dashboard carga correctamente
- [ ] Crear/editar cliente funciona
- [ ] Enviar mensaje WhatsApp funciona

### Verificaciones Manuales (antes de release major)
- [ ] Login con Google OAuth
- [ ] Conectar WhatsApp real
- [ ] Procesar pago en Stripe
- [ ] Recibir email transaccional

---

## 🛠️ Troubleshooting

### Tests fallan por timeout
```bash
# Aumentar timeout en vitest.config.ts
testTimeout: 30000

# O ejecutar test individual
pnpm test -- nombre-del-test
```

### E2E fallan por elementos no encontrados
```bash
# Ejecutar con headed mode para debug
pnpm test:e2e -- --headed

# O usar UI mode
pnpm test:e2e:ui
```

### Tests de DB fallan
```bash
# Verificar DATABASE_URL en .env
# Verificar que Supabase está accesible
pnpm db:studio
```

---

*Última actualización: 25 Dic 2025*
