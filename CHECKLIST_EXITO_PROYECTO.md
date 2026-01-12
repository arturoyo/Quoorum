# 🎯 Checklist de Éxito 100% - Wallie Project

> **Generado:** 3 Enero 2025
> **Propósito:** Preguntas proactivas para garantizar éxito total del proyecto

---

## 🔴 CRÍTICO - Infraestructura y Base de Datos

### Base de Datos
- [ ] **¿Todas las migraciones están aplicadas en producción?**
  - Verificar: `SELECT * FROM drizzle_migrations ORDER BY id DESC LIMIT 5;`
  - Específicamente: `0034_add_wizard_v2_columns.sql` (onboarding_step, onboarding_version)

- [ ] **¿Las columnas críticas existen en todas las tablas?**
  - `profiles.onboarding_step`, `profiles.onboarding_version`
  - `messages.clientId`, `clients.dealValue`, `client_scores.primaryPersona`

- [ ] **¿RLS (Row Level Security) está habilitado y funcionando?**
  - Verificar políticas en Supabase Dashboard
  - Test: Usuario A no puede ver datos de Usuario B

- [ ] **¿Hay índices en columnas de búsqueda frecuente?**
  - `messages.clientId`, `messages.userId`, `clients.userId`
  - Verificar con `EXPLAIN ANALYZE` en queries lentas

### Variables de Entorno
- [ ] **¿Todas las variables CRÍTICAS están configuradas en Vercel?**
  ```bash
  # CRÍTICAS (sin estas, la app no funciona)
  DATABASE_URL ✅
  NEXT_PUBLIC_SUPABASE_URL ✅
  NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
  SUPABASE_SERVICE_ROLE_KEY ✅
  NEXT_PUBLIC_APP_URL ✅
  ```

- [ ] **¿Las variables IMPORTANTES están configuradas?**
  ```bash
  # IMPORTANTES (features principales)
  GEMINI_API_KEY ✅ (o OPENAI_API_KEY como fallback)
  WHATSAPP_ACCESS_TOKEN ✅
  WHATSAPP_PHONE_NUMBER_ID ✅
  STRIPE_SECRET_KEY ✅
  STRIPE_WEBHOOK_SECRET ✅
  ```

- [ ] **¿Las variables OPCIONALES están documentadas?**
  - `SENTRY_DSN` (monitoreo de errores)
  - `NEXT_PUBLIC_POSTHOG_KEY` (analytics)
  - `COHERE_API_KEY` (reranking RAG)
  - `ELEVENLABS_API_KEY` (voice TTS)

---

## 🟠 ALTA PRIORIDAD - Funcionalidad Core

### Onboarding Wizard
- [ ] **¿El wizard se completa sin errores?**
  - Test: Usuario nuevo → Completar todos los pasos
  - Verificar: `onboarding_completed = true` en DB

- [ ] **¿El wizard se puede cerrar correctamente (admin)?**
  - Test: Admin → Botón "Cerrar" → No debe haber errores de hooks
  - Verificar: Query invalidation funciona

- [ ] **¿El sidebar se oculta cuando el wizard está activo?**
  - Test: Usuario con onboarding incompleto → Solo wizard visible

- [ ] **¿El wizard se puede reanudar si se interrumpe?**
  - Test: Completar paso 5 → Cerrar → Reabrir → Debe continuar en paso 5

### Autenticación y Sesiones
- [ ] **¿El login funciona correctamente?**
  - Test: Email/password, OAuth (Google, etc.)
  - Verificar: Token refresh automático

- [ ] **¿Las sesiones expiran correctamente?**
  - Test: Esperar expiración → Debe redirigir a login

- [ ] **¿El logout limpia todo correctamente?**
  - Test: Logout → Verificar que no hay datos residuales en localStorage

### WhatsApp Integration
- [ ] **¿Los mensajes se envían correctamente?**
  - Test: Enviar mensaje desde dashboard → Verificar en WhatsApp

- [ ] **¿Los mensajes entrantes se reciben?**
  - Test: Enviar mensaje a número de WhatsApp → Verificar en dashboard

- [ ] **¿Los webhooks de WhatsApp están configurados?**
  - URL: `https://app.wallie.com/api/webhooks/whatsapp`
  - Verificar en Meta Developer Console

- [ ] **¿Baileys Worker está corriendo?** (si se usa)
  - Verificar: `http://localhost:3001/health` o endpoint de producción

### AI y Respuestas Automáticas
- [ ] **¿Las respuestas de IA se generan correctamente?**
  - Test: Enviar mensaje que requiere respuesta IA → Verificar calidad

- [ ] **¿El fallback entre providers funciona?**
  - Test: Deshabilitar Gemini → Debe usar OpenAI → Deshabilitar OpenAI → Debe usar Groq

- [ ] **¿El RAG (Retrieval Augmented Generation) funciona?**
  - Test: Subir documento → Hacer pregunta relacionada → Verificar que usa el documento

---

## 🟡 MEDIA PRIORIDAD - Experiencia de Usuario

### Performance
- [ ] **¿El tiempo de carga inicial es < 3 segundos?**
  - Test: Lighthouse Performance Score > 80
  - Verificar: First Contentful Paint, Time to Interactive

- [ ] **¿Las imágenes están optimizadas?**
  - Verificar: Next.js Image component, formato WebP/AVIF

- [ ] **¿Hay lazy loading en componentes pesados?**
  - Verificar: `React.lazy()`, `dynamic import()` en componentes grandes

### Responsive Design
- [ ] **¿La app funciona en móvil?**
  - Test: Chrome DevTools → Mobile view → Navegar por todas las páginas

- [ ] **¿El sidebar se oculta correctamente en móvil?**
  - Test: Mobile → Sidebar debe ser overlay, no siempre visible

### Accesibilidad
- [ ] **¿Hay skip links para navegación por teclado?**
  - Verificar: `SkipLink` component en layout

- [ ] **¿Los colores tienen suficiente contraste?**
  - Test: WCAG AA compliance (contrast ratio > 4.5:1)

- [ ] **¿Los elementos interactivos son accesibles?**
  - Verificar: `aria-label`, `role`, `tabindex`

### Error Handling
- [ ] **¿Los errores se muestran al usuario de forma clara?**
  - Test: Simular error de API → Verificar toast/notificación

- [ ] **¿Hay Error Boundaries en componentes críticos?**
  - Verificar: `ErrorBoundary` en `layout.tsx`

- [ ] **¿Los errores se loguean para debugging?**
  - Verificar: Sentry o sistema de logging configurado

---

## 🟢 BAJA PRIORIDAD - Mejoras y Optimizaciones

### Testing
- [ ] **¿Hay tests unitarios para funciones críticas?**
  - Verificar: `packages/*/src/**/*.test.ts`

- [ ] **¿Hay tests E2E para flujos principales?**
  - Verificar: Playwright tests en `apps/web/tests/e2e/`

- [ ] **¿Los tests se ejecutan en CI/CD?**
  - Verificar: GitHub Actions o similar

### Monitoreo y Analytics
- [ ] **¿Sentry está capturando errores en producción?**
  - Verificar: Dashboard de Sentry → Errores recientes

- [ ] **¿PostHog está trackeando eventos importantes?**
  - Verificar: Dashboard de PostHog → Eventos de onboarding, conversiones

- [ ] **¿Hay alertas configuradas para errores críticos?**
  - Verificar: Email/Slack notifications en Sentry

### Documentación
- [ ] **¿El README está actualizado?**
  - Verificar: Instrucciones de setup, variables de entorno

- [ ] **¿Hay documentación de API?**
  - Verificar: tRPC routes documentadas o Swagger/OpenAPI

- [ ] **¿Los comentarios en código son claros?**
  - Verificar: Funciones complejas tienen explicaciones

### Seguridad
- [ ] **¿Las API keys están en variables de entorno (no hardcodeadas)?**
  - Verificar: `grep -r "sk-" --exclude-dir=node_modules`

- [ ] **¿Hay rate limiting en endpoints públicos?**
  - Verificar: Upstash Redis o similar configurado

- [ ] **¿Los datos sensibles están encriptados?**
  - Verificar: Tokens OAuth, passwords (Supabase Auth)

### Integraciones Externas
- [ ] **¿Stripe webhooks están configurados?**
  - URL: `https://app.wallie.com/api/webhooks/stripe`
  - Verificar en Stripe Dashboard

- [ ] **¿Google OAuth está configurado?**
  - Verificar: Redirect URIs en Google Cloud Console

- [ ] **¿Resend (emails) está funcionando?**
  - Test: Enviar email de prueba → Verificar recepción

---

## 🔵 ESTRATÉGICO - Escalabilidad y Negocio

### Escalabilidad
- [ ] **¿La base de datos puede manejar 10x más usuarios?**
  - Verificar: Connection pooling, índices, queries optimizadas

- [ ] **¿Los workers (Inngest) están escalando correctamente?**
  - Verificar: Queue processing, retry logic

- [ ] **¿Hay caching donde es necesario?**
  - Verificar: Redis para queries frecuentes, React Query cache

### Negocio
- [ ] **¿El flujo de pago funciona end-to-end?**
  - Test: Crear suscripción → Verificar en Stripe → Verificar en app

- [ ] **¿Los planes de suscripción están correctamente configurados?**
  - Verificar: `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`

- [ ] **¿Las métricas de negocio se están trackeando?**
  - Verificar: Conversiones, MRR, churn rate en PostHog/analytics

### Compliance y Legal
- [ ] **¿GDPR está implementado?**
  - Verificar: Consentimiento, política de privacidad, derecho al olvido

- [ ] **¿Los términos de servicio están publicados?**
  - Verificar: Link en footer, aceptación en registro

- [ ] **¿Hay política de cookies?**
  - Verificar: Banner de cookies, configuración de tracking

---

## 🎯 PREGUNTAS PROACTIVAS ESPECÍFICAS

### Para el Equipo de Desarrollo
1. **¿Qué pasa si la base de datos se cae?**
   - Respuesta esperada: Error handling, retry logic, fallback UI

2. **¿Qué pasa si una API externa falla?**
   - Respuesta esperada: Fallback providers, graceful degradation

3. **¿Cómo se maneja un pico de tráfico inesperado?**
   - Respuesta esperada: Auto-scaling, rate limiting, queue system

4. **¿Cómo se revierte un deployment que rompe producción?**
   - Respuesta esperada: Rollback plan, feature flags, blue-green deployment

### Para el Equipo de Producto
1. **¿Los usuarios pueden completar el onboarding sin ayuda?**
   - Test: Usuario nuevo sin documentación → ¿Completa wizard?

2. **¿Las funcionalidades principales son descubribles?**
   - Test: Usuario nuevo → ¿Encuentra cómo enviar mensaje, crear cliente?

3. **¿Hay feedback loop con usuarios?**
   - Verificar: Encuestas, analytics de abandono, support tickets

### Para el Equipo de Operaciones
1. **¿Hay backups automáticos de la base de datos?**
   - Verificar: Supabase backups, frecuencia, retención

2. **¿Hay monitoring de uptime?**
   - Verificar: UptimeRobot, Pingdom, o similar

3. **¿Hay plan de disaster recovery?**
   - Verificar: Documentación, procedimientos, contactos

---

## ✅ CHECKLIST RÁPIDO PRE-DEPLOYMENT

Antes de cada deployment a producción:

- [ ] Build local funciona: `pnpm build`
- [ ] Tests pasan: `pnpm test`
- [ ] Linter sin errores: `pnpm lint`
- [ ] Migraciones aplicadas: Verificar `drizzle_migrations`
- [ ] Variables de entorno verificadas: Comparar con `.env.example`
- [ ] Error boundaries funcionando: Test de error forzado
- [ ] Webhooks configurados: Stripe, WhatsApp
- [ ] Analytics funcionando: PostHog, Sentry
- [ ] Performance aceptable: Lighthouse > 80
- [ ] Mobile responsive: Test en varios dispositivos

---

## 📊 MÉTRICAS DE ÉXITO

### Técnicas
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%
- **Response Time**: P95 < 500ms
- **Build Time**: < 5 minutos

### Negocio
- **Onboarding Completion**: > 70%
- **Time to First Value**: < 10 minutos
- **User Retention (D7)**: > 40%
- **Support Tickets**: < 5% de usuarios activos

---

**Última actualización:** 3 Enero 2025
**Próxima revisión:** Después de cada deployment mayor

