# 📊 Análisis Exhaustivo de Endpoints Infrautilizados

**Fecha:** 8 de Enero 2026
**Total Routers:** 139
**Total Procedures:** 910

---

## 🎯 Resumen Ejecutivo

### Categorías de Infrautilización

1. **Routers Admin (Solo Backend)** - 25 routers
   - Estos routers están diseñados para uso interno/admin y NO deben estar en el frontend público
   - ✅ **Correcto:** No se usan en frontend

2. **Routers Completamente Sin Usar** - 79 routers
   - Funcionalidades implementadas pero sin UI
   - Oportunidades de mejora del producto

3. **Routers Infrautilizados (<50% uso)** - 12 routers
   - Funcionalidades parcialmente expuestas
   - Potencial de expansión

4. **Routers Bien Utilizados** - 23 routers
   - Funcionalidades core del producto

---

## ❌ ROUTERS COMPLETAMENTE SIN USAR (79)

### 🔴 Alta Prioridad - Funcionalidades Core Sin UI

#### 1. **Client Management Avanzado**

- `clients-360` - Vista 360° del cliente (1 procedure)
- `clients-profile-full` - Perfil completo del cliente (1 procedure)
- `clients-profile-basic` - Perfil básico del cliente (1 procedure)
- `clients-pipeline` - Gestión de pipeline de clientes (2 procedures)
- `client-groups` - Grupos de clientes (11 procedures)
- `client-enrichment` - Enriquecimiento de datos de clientes (7 procedures)

**Impacto:** Funcionalidades avanzadas de CRM sin exponer

#### 2. **Psychology Engine Completo**

- `psychology-engine` - Motor de psicología (5 procedures)
- `psychology-metrics` - Métricas de psicología (4 procedures)
- `emotional-intelligence` - Inteligencia emocional (4 procedures)
- `persona-detection` - Detección de personalidad (4 procedures)
- `conversation-psychology` - Psicología de conversación (4 procedures)
- `reciprocity` - Sistema de reciprocidad (8 procedures)
- `behavior-dna` - ADN de comportamiento (8 procedures)

**Impacto:** Sistema completo de psicología implementado pero no visible en UI

#### 3. **Sales & Deals Avanzado**

- `sales-insights` - Insights de ventas (6 procedures)
- `coaching` - Coaching de ventas (3 procedures, solo 1 usado)
- `prospecting` - Prospección (18 procedures, solo 3 usados)
- `cold-calling` - Llamadas en frío (0 procedures - router vacío)

**Impacto:** Herramientas de ventas avanzadas sin UI

#### 4. **Knowledge Base Completo**

- `knowledge-base` - Base de conocimiento (4 procedures)
- `knowledge-context` - Contexto por cliente (2 procedures)
- `knowledge-faqs` - FAQs (2 procedures)
- `knowledge-import` - Importación WhatsApp (3 procedures)
- `knowledge-parse` - Parseo de historial (4 procedures)
- `knowledge-scrape` - Scraping web (2 procedures)
- `knowledge-search` - Búsqueda avanzada (2 procedures)

**Impacto:** Sistema completo de knowledge base sin UI completa

#### 5. **Campaigns & Marketing**

- `campaigns` - Campañas (12 procedures)
- `marketing-calendar` - Calendario de marketing (10 procedures)

**Impacto:** Sistema de marketing sin UI

#### 6. **Integraciones Avanzadas**

- `linkedin` - Integración LinkedIn (10 procedures)
- `email-onboarding` - Onboarding de email (7 procedures)
- `whatsapp-templates` - Plantillas WhatsApp (10 procedures)

**Impacto:** Integraciones implementadas pero sin UI completa

#### 7. **Forum System (Fase Avanzada)**

- `forum-deals` - Integración Forum con Deals (10 procedures)
- `forum-feedback` - Feedback de expertos (6 procedures)
- `forum-notifications` - Notificaciones Forum (10 procedures)
- `forum-reports` - Reportes Forum (13 procedures)
- `forum-public-api` - API pública Forum (12 procedures)

**Impacto:** Sistema Forum completo pero solo insights básicos en UI

#### 8. **Analytics & Reporting**

- `analytics` - Analytics avanzado (10 procedures, solo 4 usados)
- `classifiers` - Clasificadores IA (9 procedures)
- `scoring` - Sistema de scoring (15 procedures, solo 3 usados)

**Impacto:** Analytics avanzados sin exponer completamente

#### 9. **Compliance & Privacy**

- `compliance` - Compliance avanzado (12 procedures)
- `gdpr` - GDPR completo (6 procedures)

**Impacto:** Funcionalidades de compliance sin UI

#### 10. **AI & Models**

- `ai-models` - Configuración de modelos IA (8 procedures)
- `ai-config` - Config global IA (2 procedures)
- `agent-config` - Configuración de agente (2 procedures)

**Impacto:** Configuración avanzada de IA sin UI

#### 11. **Sessions & Security**

- `sessions` - Gestión de sesiones (5 procedures)
- `sessions-single` - Sesiones individuales (6 procedures)
- `two-factor` - Autenticación 2FA (6 procedures)

**Impacto:** Seguridad avanzada sin UI

#### 12. **Voice & Communication**

- `wallie-voice` - Comandos de voz (5 procedures)
- `voice` - Asistente de voz (procedures variables)

**Impacto:** Funcionalidades de voz sin UI completa

#### 13. **Mining & Leads**

- `mining` - Lead mining (8 procedures, solo 2 usados)
- `leads` - Gestión de leads (procedures variables)

**Impacto:** Sistema de mining implementado pero poco usado

#### 14. **Goals & Productivity**

- `goals` - Objetivos (10 procedures, solo 2 usados)
- `productivity` - Productividad (9 procedures, solo 2 usados)

**Impacto:** Sistema de objetivos/productividad sin UI completa

#### 15. **Wallie Advanced Features**

- `wallie-actions` - Acciones de Wallie (6 procedures)
- `wallie-advanced` - Chat supervisado (1 procedure)
- `wallie-analysis-daily` - Resumen diario (1 procedure)
- `wallie-analysis-suggestions` - Sugerencias (1 procedure)
- `wallie-interactions` - Interacciones (5 procedures)
- `wallie-management` - Gestión Wallie (3 procedures)
- `wallie-annotations-actions` - Acciones de anotaciones (6 procedures)
- `wallie-annotations-queries` - Queries de anotaciones (5 procedures)

**Impacto:** Funcionalidades avanzadas de Wallie sin exponer

#### 16. **Business Profile**

- `business-profile` - Perfil de negocio (11 procedures)

**Impacto:** Gestión completa de perfil de negocio sin UI

#### 17. **Case Studies**

- `case-studies` - Casos de éxito (7 procedures)

**Impacto:** Sistema de casos de éxito sin UI

#### 18. **Feature Flags**

- `feature-flags` - Feature flags (8 procedures)

**Impacto:** Sistema de feature flags sin UI admin

#### 19. **Saved Replies Avanzado**

- `saved-replies` - Respuestas guardadas (10 procedures, parcialmente usado)

**Impacto:** Sistema completo pero UI básica

#### 20. **WhatsApp Avanzado**

- `whatsapp-connections` - Conexiones WhatsApp (9 procedures)
- `whatsapp-magic-login` - Login mágico WhatsApp (6 procedures)

**Impacto:** Funcionalidades WhatsApp avanzadas sin UI completa

---

## ⚠️ ROUTERS INFRAUTILIZADOS (<50% uso)

### 1. **addons** - 33.3% uso (3/9)

**Sin usar:**

- `listAvailable` - Listar addons disponibles
- `getActive` - Obtener addons activos
- `getDetails` - Detalles de addon
- `unsubscribe` - Cancelar suscripción
- `updateConfig` - Actualizar configuración
- `previewPrice` - Preview de precio

**Oportunidad:** UI completa de gestión de addons

### 2. **ai** - 40.0% uso (4/10)

**Sin usar:**

- `quickResponse` - Respuesta rápida
- `analyzeMessage` - Análisis de mensaje
- `detectIntent` - Detección de intención
- `detectLanguage` - Detección de idioma
- `getIntentTypes` - Tipos de intención
- `updateStyleCustomInstructions` - Actualizar instrucciones personalizadas

**Oportunidad:** Panel completo de configuración de IA

### 3. **analytics** - 40.0% uso (4/10)

**Sin usar:**

- `trackEvent` - Tracking de eventos
- `trackDraft` - Tracking de borradores
- `getActivityChart` - Gráfico de actividad
- `getConversionFunnel` - Embudo de conversión
- `getIntentBreakdown` - Desglose de intenciones
- `getActiveWorkers` - Workers activos

**Oportunidad:** Dashboard de analytics completo

### 4. **coaching** - 33.3% uso (1/3)

**Sin usar:**

- `getClientCoaching` - Coaching por cliente
- `getPersonaDetails` - Detalles de personalidad

**Oportunidad:** Panel de coaching completo

### 5. **goals** - 20.0% uso (2/10)

**Sin usar:**

- `getConfig` - Configuración
- `list` - Listar objetivos
- `getCurrent` - Objetivo actual
- `getById` - Obtener por ID
- `updateProgress` - Actualizar progreso
- `update` - Actualizar objetivo
- `cancel` - Cancelar objetivo
- `delete` - Eliminar objetivo

**Oportunidad:** UI completa de gestión de objetivos

### 6. **invoices** - 12.5% uso (1/8)

**Sin usar:**

- `list` - Listar facturas
- `getById` - Obtener factura
- `create` - Crear factura
- `markAsPaid` - Marcar como pagada
- `getFiscalProfile` - Perfil fiscal
- `updateFiscalProfile` - Actualizar perfil fiscal
- `getSummary` - Resumen

**Oportunidad:** Gestión completa de facturas

### 7. **mining** - 25.0% uso (2/8)

**Sin usar:**

- `listQualified` - Listar leads calificados
- `getLeads` - Obtener leads
- `processBatch` - Procesar batch
- `overallStats` - Estadísticas generales
- `triggerAutoDiscovery` - Trigger auto-descubrimiento
- `startMining` - Iniciar mining

**Oportunidad:** UI completa de lead mining

### 8. **productivity** - 22.2% uso (2/9)

**Sin usar:**

- `logActivity` - Registrar actividad
- `getRecentActivity` - Actividad reciente
- `getDailyMetrics` - Métricas diarias
- `calculateDailyMetrics` - Calcular métricas
- `createGoal` - Crear objetivo
- `getActiveGoals` - Objetivos activos
- `updateGoalProgress` - Actualizar progreso

**Oportunidad:** Dashboard de productividad completo

### 9. **prospecting** - 16.7% uso (3/18)

**Sin usar:**

- `getProspect` - Obtener prospecto
- `createProspect` - Crear prospecto
- `updateProspect` - Actualizar prospecto
- `deleteProspect` - Eliminar prospecto
- `getSequence` - Obtener secuencia
- `createSequence` - Crear secuencia
- `updateSequence` - Actualizar secuencia
- `deleteSequence` - Eliminar secuencia
- `enrollProspect` - Inscribir prospecto
- `unenrollProspect` - Desinscribir prospecto
- `listEnrollments` - Listar inscripciones
- `listEnrichmentJobs` - Listar jobs de enriquecimiento
- `createEnrichmentJob` - Crear job de enriquecimiento
- `bulkCreateProspects` - Crear prospectos en bulk
- `bulkEnrollProspects` - Inscribir prospectos en bulk

**Oportunidad:** UI completa de prospección

### 10. **scoring** - 20.0% uso (3/15)

**Sin usar:**

- `recalculate` - Recalcular score
- `getLeaderboard` - Leaderboard
- `getHotLeads` - Leads calientes
- `getNeedingAttention` - Necesitan atención
- `getStats` - Estadísticas
- `filterClients` - Filtrar clientes
- `getVipClients` - Clientes VIP
- `getUrgentClients` - Clientes urgentes
- `getRecurringClients` - Clientes recurrentes
- `setRecurringStatus` - Establecer status recurrente
- `onMessageReceived` - Al recibir mensaje
- `getExtendedStats` - Estadísticas extendidas

**Oportunidad:** Dashboard completo de scoring

### 11. **usage** - 42.9% uso (3/7)

**Sin usar:**

- `record` - Registrar uso
- `getBreakdownByReason` - Desglose por razón
- `getDailyTrend` - Tendencia diaria
- `checkLimits` - Verificar límites

**Oportunidad:** Panel de uso completo

### 12. **whatsapp** - 14.3% uso (1/7)

**Sin usar:**

- `getConversations` - Obtener conversaciones
- `getConversation` - Obtener conversación
- `getMessages` - Obtener mensajes
- `sendButtons` - Enviar botones
- `archiveConversation` - Archivar conversación
- `reopenConversation` - Reabrir conversación

**Oportunidad:** UI completa de gestión WhatsApp

---

## ✅ ROUTERS BIEN UTILIZADOS (23)

Estos routers están correctamente integrados en el frontend:

1. `clients` - Gestión de clientes
2. `conversations` - Conversaciones
3. `tags` - Etiquetas
4. `stats` - Estadísticas
5. `settings` - Configuración
6. `subscriptions` - Suscripciones
7. `profiles` - Perfiles
8. `feedback` - Feedback
9. `wallie` (sub-routers) - Wallie chat
10. `reminders` - Recordatorios
11. `gamification` - Gamificación
12. `rewards` - Recompensas
13. `referrals` - Referidos
14. `deals` - Oportunidades
15. `inbox` - Bandeja de entrada
16. `gmail` - Gmail
17. `knowledge` (básico) - Base de conocimiento básica
18. `forum-insights` - Insights de Forum
19. `integrations` - Integraciones
20. `tools` - Herramientas
21. `support` - Soporte
22. `wizard` - Wizard de onboarding
23. `health` - Health check

---

## 🎯 Recomendaciones Prioritarias

### Prioridad ALTA - ROI Inmediato

1. **Dashboard de Analytics Completo**
   - Exponer `analytics` completo
   - Gráficos de actividad, embudos, breakdowns
   - **Impacto:** Mejor visibilidad para usuarios

2. **UI de Goals Completa**
   - Exponer todos los endpoints de `goals`
   - Tracking de progreso, gestión completa
   - **Impacto:** Feature completa sin usar

3. **Panel de Scoring Avanzado**
   - Exponer `scoring` completo
   - Leaderboards, hot leads, VIP clients
   - **Impacto:** Diferenciador competitivo

4. **Vista 360° del Cliente**
   - Exponer `clients-360` y `clients-profile-full`
   - **Impacto:** Mejor experiencia de usuario

5. **Sistema de Psychology Engine**
   - Exponer todos los routers de psicología
   - Dashboard de métricas, recomendaciones
   - **Impacto:** Feature premium sin exponer

### Prioridad MEDIA - Expansión de Features

6. **UI de Prospecting Completa**
   - Exponer todos los endpoints de `prospecting`
   - Secuencias, enrollments, bulk operations
   - **Impacto:** Feature completa de outbound

7. **Gestión de Campañas**
   - Exponer `campaigns` completo
   - **Impacto:** Marketing automation

8. **Knowledge Base Completa**
   - Exponer todos los routers de knowledge
   - Import, parse, scrape, FAQs
   - **Impacto:** Mejor gestión de conocimiento

9. **Forum System Completo**
   - Exponer Forum deals, feedback, reports, API
   - **Impacto:** Feature completa de Forum

10. **Gestión de Addons**
    - Exponer `addons` completo
    - **Impacto:** Mejor gestión de suscripciones

### Prioridad BAJA - Nice to Have

11. **Compliance & GDPR UI**
12. **Sessions & Security UI**
13. **Voice Features UI**
14. **Case Studies UI**
15. **Feature Flags Admin UI**

---

## 📈 Métricas de Infrautilización

- **Total Procedures:** 910
- **Procedures Usados:** ~150 (16.5%)
- **Procedures Sin Usar:** ~760 (83.5%)
- **Routers Sin Usar:** 79 (56.8%)
- **Routers Infrautilizados:** 12 (8.6%)
- **Routers Bien Utilizados:** 23 (16.5%)

---

## 🔍 Notas Importantes

1. **Routers Admin:** Los 25 routers admin están correctamente sin usar en frontend público (solo admin panel)

2. **Routers Vacíos:** Algunos routers como `clients`, `wallie`, `cold-calling` tienen 0 procedures porque son wrappers o están en desarrollo

3. **Sub-routers:** Algunos routers como `wallie-*` son sub-routers que se mergean en el router principal

4. **Legacy:** Algunos routers como `invoices` están marcados como legacy pero aún tienen funcionalidad

---

## 📝 Próximos Pasos

1. ✅ Revisar este análisis con el equipo
2. ✅ Priorizar features según roadmap
3. ✅ Crear tickets para UI de features prioritarias
4. ✅ Documentar APIs disponibles para futuras integraciones
5. ✅ Considerar deprecar features sin uso si no están en roadmap
