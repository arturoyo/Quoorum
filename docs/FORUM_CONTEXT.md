# 🧠 CONTEXTO BASE DE WALLIE PARA FORUM

**Última actualización:** 31 Diciembre 2025  
**Versión:** 1.0  
**Fuentes:** Código fuente, documentación, respuestas del founder

---

## 🎯 RESUMEN EJECUTIVO

Wallie es un sistema de automatización de ventas con IA que actúa como un clon digital del vendedor, gestionando conversaciones en WhatsApp, emails y calendarios de forma autónoma. Actualmente en **Fase 7 (LAUNCH)** al **97% completado**, con **270,000 LOC**, **22 agentes IA**, y **margen del 89%**. Fundado por Arturo (solo founder), bootstrapped, en aceleradora Wayra, con **425 leads inmobiliarias** listos para lanzamiento.

---

## 1️⃣ PRODUCTO

### Definición

**¿Qué es Wallie?**

> Sistema de automatización de ventas con IA que actúa como un clon digital del vendedor, gestionando conversaciones en WhatsApp, emails y calendarios de forma autónoma.

**Problema que resuelve:**

- Vendedores pierden tiempo en conversaciones repetitivas
- Leads se pierden por falta de seguimiento 24/7 (70% del interés se pierde tras 10 min de espera)
- Dificultad para escalar equipo de ventas sin contratar

**Target:**

- **Primario:** Inmobiliarias en España (zonas calientes: Costa del Sol, Madrid, Barcelona)
- **Secundario:** Automoción, consultoría, servicios profesionales
- **Tamaño:** 1-50 empleados (SMB)
- **Canal:** WhatsApp como canal principal de ventas

**Propuesta de Valor:**

> "Tu clon digital que vende 24/7 mientras tú duermes"

**Resultados esperados:**

- 3x más conversaciones atendidas
- 50% menos tiempo en tareas repetitivas
- 24/7 disponibilidad sin contratar

**Time to Value:**

- Onboarding: 15-30 minutos
- Primera conversación automatizada: <1 hora
- ROI positivo: 1-2 semanas

### Features Core (Implementadas ✅)

| Feature                    | Estado | Descripción                                            |
| -------------------------- | ------ | ------------------------------------------------------ |
| **Clon de estilo**         | ✅     | IA que escribe como TÚ (aprende tu tono, vocabulario)  |
| **RAG + Embeddings**       | ✅     | Contexto con documentos (PDFs, URLs, texto)            |
| **Chat con Wallie**        | ✅     | Asistente en timeline para consultas                   |
| **22 Agentes IA**          | ✅     | Supervisor + Orchestrator + 20 agentes especializados  |
| **Gamificación**           | ✅     | Puntos, niveles, 25 logros                             |
| **Métricas Productividad** | ✅     | Activity logging + dashboard                           |
| **Vista Calendario**       | ✅     | Seguimientos visuales                                  |
| **Vista Todos**            | ✅     | Tareas pendientes                                      |
| **Admin Panel**            | ✅     | 12 routers + 17 páginas de administración              |
| **Psychology Engine**      | ✅     | Emotion + DISC + análisis de conversación              |
| **Evolution API Webhook**  | ✅     | Migración WhatsApp (añadido 26 Dic 2025)               |
| **MiniServer Enrichment**  | ✅     | Pipeline de datos con sanitización PII (27 Dic 2025)   |
| **Sistema de Referidos**   | ✅     | Códigos + Email + WhatsApp invites (arreglado 28 Dic)  |
| **Scoring Unificado**      | ✅     | VIP + Temperatura + Urgencia + Filtros (15 procedures) |

### Features Planificadas (FASE 8 ⚪)

| Feature                 | Prioridad  | Estado                                    |
| ----------------------- | ---------- | ----------------------------------------- |
| **Migration Assistant** | 🔴 CRÍTICO | ⚪ Importar historial WhatsApp completo   |
| **Voice Assistant**     | 🟠 ALTO    | ⚪ Stub implementado, pendiente completar |
| **Coaching Router**     | 🟠 ALTO    | ⚪ Deshabilitado (exports rotos)          |
| **CRM Integrations**    | 🟠 ALTO    | ⚪ Salesforce, HubSpot, Pipedrive         |

---

## 2️⃣ TECNOLOGÍA

### Stack Tecnológico

**Frontend:**

- Next.js 15.1.3
- React 19
- TypeScript 5.7.2
- TailwindCSS
- shadcn/ui

**Backend:**

- tRPC (85 routers, 836 procedures)
- Drizzle ORM
- Supabase (PostgreSQL)
- Inngest (52 workers)

**IA:**

- OpenAI (GPT-4o, GPT-4o-mini, Whisper)
- Anthropic (Claude 3.5 Sonnet)
- Google (Gemini)
- Multi-provider con fallback automático

**Infraestructura:**

- **Hosting:** Vercel (producción en wallie.pro)
- **Database:** Supabase PostgreSQL
- **Redis:** Upstash (rate limiting)
- **Email:** Resend
- **Payments:** Stripe
- **Monitoring:** Sentry (pendiente configurar)
- **Hardware propio:** Acemagic (voice TTS + enrichment = $0 costo)

### Arquitectura

**Monorepo con 14 packages:**

| Package              | LOC     | Descripción                       |
| -------------------- | ------- | --------------------------------- |
| `packages/api/`      | ~45,600 | 85 routers tRPC, 836 procedures   |
| `packages/db/`       | ~10,600 | 69 schemas Drizzle                |
| `packages/ai/`       | ~8,000  | Multi-provider + RAG + embeddings |
| `packages/agents/`   | ~5,000  | 22 agentes IA + Supervisor        |
| `packages/workers/`  | ~6,000  | 52 workers Inngest                |
| `packages/whatsapp/` | ~3,000  | Cloud API + Chakra BSP + Baileys  |
| `packages/email/`    | ~1,000  | 11 templates                      |
| `packages/auth/`     | ~500    | Supabase + helpers                |
| `packages/ui/`       | ~2,000  | shadcn/ui components              |
| `packages/stripe/`   | ~800    | Pagos y suscripciones             |
| `packages/types/`    | ~300    | Tipos compartidos                 |
| `baileys-worker/`    | ~4,000  | WhatsApp QR (miniserver)          |
| `growth-worker/`     | ~2,000  | FastAPI Python (outbound)         |

**Total:** ~270,000 líneas de código en 1,180 archivos

### Agentes IA (22 implementados)

1. **Supervisor:** Orquesta todos los agentes
2. **Orchestrator:** Coordina flujos multi-agente
   3-22. **Agentes especializados:** Sales, support, enrichment, classification, sentiment analysis, coaching, etc.

### Integraciones

**Implementadas ✅:**

- WhatsApp Cloud API
- WhatsApp Chakra BSP (backup)
- WhatsApp Baileys (miniserver, backup)
- Gmail API (email fallback)
- Stripe (pagos)
- Resend (emails transaccionales)
- Supabase (auth + DB)
- Evolution API (webhook, migración WhatsApp)

**Triple Redundancia de Mensajería:**

```
WhatsApp Cloud API → Chakra BSP → Baileys (miniserver) → Email (Gmail API)
```

**Resultado:** Sistema indestructible que nunca se cae

**Planificadas ⚪:**

- Salesforce CRM
- HubSpot CRM
- Pipedrive CRM
- Zapier (API genérica)
- Google Calendar

### Capacidades Técnicas

**Implementadas:**

- ✅ Voice TTS (ElevenLabs, hardware propio Acemagic)
- ✅ Voice STT (OpenAI Whisper)
- ✅ RAG (búsqueda semántica con embeddings)
- ✅ Minería de datos (enrichment pipeline, hardware propio)
- ✅ Análisis de sentimiento (psychology engine)
- ✅ Generación de contenido (sales copy, emails)
- ✅ Clasificación automática (leads, urgencia, VIP)
- ✅ Gamificación (puntos, niveles, 25 logros)
- ✅ Multi-idioma (español primario, inglés soporte)

**Costos de IA:**

- **Estimado:** $2-5 por usuario/mes (uso promedio)
- **Protección:** Rate limiting por costo
  - FREE: $1/mes máximo
  - STARTER: $10/mes máximo
  - PRO: $50/mes máximo

### Calidad del Código (27 Dic 2025)

- ✅ **0 warnings** de lint
- ✅ **0 errores** de TypeScript
- ✅ **TypeScript strict** habilitado
- ✅ **2,463+ tests** implementados
- ✅ **any=0** (eliminados todos)
- ✅ **console.log=0** (eliminados todos)
- ⚠️ **@ts-nocheck=5** (solo en archivos legacy)
- ⭐ **Score:** 9.0/10

---

## 3️⃣ NEGOCIO

### Modelo de Ingresos

**Pricing (según tier-limits.ts):**

| Plan        | Precio/mes | Clientes | Mensajes | IA  | Campaigns | Docs | Límite IA |
| ----------- | ---------- | -------- | -------- | --- | --------- | ---- | --------- |
| **FREE**    | 0€         | 10       | 50       | 20  | 1         | 3    | $1/mes    |
| **STARTER** | **29€**    | 100      | 1,000    | 200 | 5         | 10   | $10/mes   |
| **PRO**     | **49€**    | ∞        | ∞        | ∞   | ∞         | 50   | $50/mes   |

**Modelo:**

- ✅ 100% MRR (modelo SaaS puro)
- ✅ Facturación mensual vía Stripe
- ✅ Renovación automática
- ⚪ Upsells/cross-sells (no implementados todavía)

### Costos

**Costo por Usuario:**

| Concepto            | FREE      | STARTER   | PRO       | Notas                          |
| ------------------- | --------- | --------- | --------- | ------------------------------ |
| **IA (tokens)**     | $0.50     | $2        | $5        | Uso promedio                   |
| **Infraestructura** | $0.10     | $0.20     | $0.50     | Vercel + Supabase              |
| **Voice TTS**       | $0        | $0        | $0        | **Hardware propio (Acemagic)** |
| **Enrichment**      | $0        | $0        | $0        | **Hardware propio**            |
| **Email**           | $0.01     | $0.05     | $0.10     | Resend                         |
| **WhatsApp**        | $0        | $0.10     | $0.20     | Cloud API                      |
| **TOTAL**           | **$0.61** | **$2.35** | **$5.80** | Por usuario/mes                |

**Margen Bruto:**

| Plan    | Precio     | Costo | Margen     | %       |
| ------- | ---------- | ----- | ---------- | ------- |
| FREE    | 0€         | $0.61 | -$0.61     | -       |
| STARTER | 29€ (~$31) | $2.35 | **$28.65** | **92%** |
| PRO     | 49€ (~$53) | $5.80 | **$47.20** | **89%** |

**Burn Rate Mensual:**

- **Cash:** 178€/mes (suscripciones IA) + 30-80€ (infraestructura variable)
- **Total:** ~250-300€/mes
- **Sweat Equity:** ~15,000€/mes (valor de tiempo de Arturo)

**Runway:**

- **Indefinido** (mientras negocio de imprenta sea estable)
- Wallie está financiado por actividad profesional externa
- Transición a full-time solo cuando Wallie sea rentable

### Unit Economics

**LTV (Lifetime Value):**

- **Estimado:** €500-1,500 por usuario
- **Depende de:** Churn rate (esperado 10-15% mensual), tiempo promedio de suscripción (12-24 meses)

**CAC (Customer Acquisition Cost):**

- **Actual:** ~€0 (leads captados por scraping)
- **Futuro:** €50-150 (con marketing de pago)

**Ratio LTV/CAC:**

- **Actual:** ∞ (CAC = 0)
- **Futuro:** 3-10x (saludable para SaaS)

**Payback Period:**

- **Estimado:** 1-3 meses

**Churn Rate:**

- **Esperado:** 10-15% mensual (típico en SMB SaaS)
- **Actual:** N/A (pre-lanzamiento)

### Financiamiento

**Estado:**

- ✅ **Bootstrapped** (100% financiado por actividad profesional externa)
- ✅ **Capital invertido:** ~1,500€ en herramientas + ~50,000€ en valor de horas (5 meses I+D + 1 mes dev intensivo)
- ✅ **En aceleradora Wayra** (acceso a mentores, red, contratos legales validados)
- ⚪ **No buscando inversión** actualmente (validar PMF primero)

---

## 4️⃣ MERCADO

### Target Audience

**ICP (Ideal Customer Profile):**

- **Industria:** Inmobiliarias (primario)
- **Tamaño:** 1-50 empleados (SMB)
- **Rol:** Dueño, Director Comercial, Vendedor
- **Geografía:** España (zonas calientes: Costa del Sol, Madrid, Barcelona)
- **Pain Points:**
  - Pierden 70% del interés del lead tras 10 min de espera
  - Vendedores saturados con tareas repetitivas
  - No pueden escalar sin contratar
  - WhatsApp es su canal principal pero no lo automatizan

**TAM (Total Addressable Market):**

- **España:** Mercado inmobiliario de **$44.7B** (2024)
- **Crecimiento:** 3.8% anual hasta 2030
- **Tendencia 2026:** Automatización en WhatsApp será "no negociable"

**SAM (Serviceable Addressable Market):**

- **Miles de agencias** en zonas calientes (Costa del Sol, Madrid, Barcelona)
- **Todas usan WhatsApp** pero de forma manual
- **Estimado:** 5,000-10,000 agencias potenciales en España

**SOM (Serviceable Obtainable Market):**

- **Objetivo 1 año:** 100-200 clientes
- **Objetivo 3 años:** 500-1,000 clientes
- **Objetivo 5 años:** 2,000-3,000 clientes

### Segmentos

**Segmento Principal:**

- 🇪🇸 Inmobiliarias en España

**Segmentos Secundarios:**

- Automoción
- Consultoría
- Servicios profesionales

### Geografía

**Mercado Principal:**

- 🇪🇸 **España** (foco inicial)

**Mercados de Expansión:**

- 🇲🇽 México
- 🇦🇷 Argentina
- 🇨🇴 Colombia
- 🇨🇱 Chile

---

## 5️⃣ COMPETENCIA

### Competidores Directos

| Competidor         | Pricing         | Fortalezas                              | Debilidades                                   |
| ------------------ | --------------- | --------------------------------------- | --------------------------------------------- |
| **Intercom**       | $74-500+/mes    | Marca establecida, muchas integraciones | Caro, complejo, no enfocado en WhatsApp       |
| **Reply.io**       | $59/mes/usuario | Email automation fuerte                 | No tiene WhatsApp, no tiene IA conversacional |
| **11x.ai (Alice)** | ~$5,000/mes     | IA conversacional, enfoque Enterprise   | Extremadamente caro, no para SMB              |
| **Artisan AI**     | ❓              | IA para ventas                          | ❓                                            |

### Competidores Indirectos

**Alternativas:**

- **Status quo:** Vendedores manuales
- **Soluciones caseras:** Macros de WhatsApp, respuestas guardadas
- **CRMs genéricos:** Salesforce, HubSpot (sin automatización IA)
- **Chatbots simples:** ManyChat, Chatfuel (sin IA conversacional)

### Posicionamiento Competitivo

**Ventajas de Wallie:**

- ✅ **Precio:** 10x más barato que Intercom (49€ vs $500)
- ✅ **Enfoque WhatsApp:** Competidores no tienen WhatsApp nativo
- ✅ **IA Conversacional:** Aprende tu estilo, no es chatbot genérico
- ✅ **Hardware propio:** Voice + Enrichment a costo $0
- ✅ **Triple redundancia:** WhatsApp → Email (nunca se cae)
- ✅ **Margen alto:** 89% permite pricing agresivo
- ✅ **Vertical:** Enfocado en inmobiliarias (no generalista)

**Desventajas:**

- ⚠️ **Marca nueva:** Sin reconocimiento
- ⚠️ **Sin casos de éxito:** Todavía no hay usuarios de pago
- ⚠️ **Integraciones limitadas:** No tiene Salesforce, HubSpot, etc.
- ⚠️ **Solo founder:** No hay equipo de soporte/ventas

**Defendibilidad:**

- **Corto plazo (1-2 años):** Ventaja técnica (hardware propio, triple redundancia)
- **Medio plazo (3-5 años):** Datos de conversaciones inmobiliarias (RAG especializado)
- **Largo plazo (5+ años):** Red de efectos (referidos, casos de éxito)

---

## 6️⃣ RECURSOS

### Equipo

**Composición:**

- **1 persona:** Arturo (founder)
- **Roles:** Product, Dev, Marketing, Sales, Support (todo)
- **Dedicación:** Full-time (12h/día, 6-7 días/semana = 78h/semana)

**Skills:**

- ✅ **Desarrollo:** TypeScript, React, Next.js, tRPC, IA
- ✅ **Infraestructura:** Vercel, Supabase, Inngest, Docker
- ✅ **IA:** OpenAI, Anthropic, Google, RAG, embeddings, agentes
- ✅ **Negocio:** Ventas, imprenta, rotulación, merchandising (experiencia previa)
- ⚠️ **Skills faltantes:** Go-to-Market (el reto principal)

### Tiempo

**Dedicación:**

- **Full-time en Wallie:** 12h/día, 6-7 días/semana
- **Otras responsabilidades:** Negocio de imprenta (sustenta Wallie)

### Capital

**Disponible:**

- **Runway indefinido** (mientras negocio de imprenta sea estable)
- **Inversión hasta ahora:** ~1,500€ cash + ~50,000€ sweat equity

**Necesitamos:**

- **Marketing:** €1,000-5,000 para ads (cuando validemos PMF)
- **Contratación:** €30,000-50,000/año para primer empleado (cuando lleguemos a 50-100 usuarios)

### Assets

**Código (IP):**

- ✅ **270,000 LOC** de código propietario
- ✅ **22 agentes IA** especializados
- ✅ **85 routers tRPC** con 836 procedures
- ✅ **2,463+ tests** (alta calidad)
- ✅ **Score 9.0/10** (deuda técnica mínima)

**Hardware:**

- ✅ **Acemagic:** Servidor local para voice TTS + enrichment (ventaja competitiva, $0 costo)

**Datos:**

- ✅ **425 leads inmobiliarias** identificadas y listas
- ⚪ Sin datos de usuarios todavía (pre-lanzamiento)

**Marca:**

- ✅ **wallie.pro** (dominio registrado, producción activa)
- ⚪ Sin reconocimiento de marca todavía

**Legal:**

- ✅ **Contratos validados por Wayra** (Términos de Servicio, Política de Privacidad)
- ✅ **GDPR compliance** implementado en código

### Network

**Conexiones:**

- ✅ **Wayra (aceleradora):** Acceso a mentores, expertos, red de inversores
- ✅ **Experto legal de Wayra:** Contratos validados
- ⚪ **Advisors:** ❓
- ⚪ **Inversores:** ❓ (no buscando activamente)
- ✅ **Clientes potenciales:** 425 leads inmobiliarias

---

## 7️⃣ MÉTRICAS

### Producto (27 Dic 2025)

**Estado:**

- ✅ **97% completado**
- ✅ **Fase 7 (LAUNCH)** al 85%
- ✅ **0 bugs críticos** conocidos
- ✅ **0 warnings** de lint
- ✅ **2,463+ tests** pasando
- ✅ **Producción activa:** wallie.pro

**Features:**

- ✅ **Core:** 100% implementadas
- ⚠️ **Integraciones:** 55% (WhatsApp ✅, CRMs ⚪)
- ⚠️ **Diferenciadores:** 10% (Voice stub, Migration ⚪)

### Usuarios

**Actuales:**

- **Usuarios registrados:** 0 (pre-lanzamiento)
- **Usuarios activos:** 0 (pre-lanzamiento)
- **Usuarios de pago:** 0 (pre-lanzamiento)
- **Churn rate:** N/A (pre-lanzamiento)

**Primera venta histórica:**

- ✅ **100€** con Notebook LLM (validación temprana)

### Ingresos

**Actuales:**

- **MRR:** 0€ (pre-lanzamiento)
- **ARR:** 0€ (pre-lanzamiento)

**Objetivo 2025:**

- **Q1:** Primeros 10-20 clientes de pago
- **Q2-Q4:** Escalar a 50-100 clientes

### Marketing

**Leads:**

- ✅ **425 inmobiliarias** identificadas y listas para funnel
- **Canal:** Captación directa + scraping especializado (sector inmobiliario)
- **Filtro:** Solo empresas con número de móvil

**Tráfico Web:**

- **Actual:** Mínimo (pre-lanzamiento)
- **Objetivo:** ❓

**Redes Sociales:**

- **Seguidores:** ❓

### Operaciones

**Soporte:**

- **Tickets:** 0 (pre-lanzamiento)
- **Estrategia:** Meta-Wallie como L1 + Arturo como L2

**Uptime:**

- ✅ **wallie.pro** funcional en producción
- ⚠️ **Monitoreo:** Sentry pendiente configurar

---

## 8️⃣ ESTRATEGIA

### Visión

**Visión a 5 años:**

> Wallie como el aliado definitivo en ventas omnicanal para negocios de servicios en España y LATAM.

**Éxito se ve como:**

- 2,000-3,000 clientes activos
- €1M ARR
- Líder en automatización de ventas para inmobiliarias en España
- Expansión a LATAM (México, Argentina, Colombia)

### Misión

**Misión:**

> Permitir que negocios de servicios escalen sus ventas sin contratar, mediante IA que aprende su estilo y automatiza conversaciones 24/7.

**A quién servimos:**

- Inmobiliarias, automoción, consultoría, servicios profesionales

**Cómo los servimos:**

- IA conversacional que aprende tu estilo
- Automatización de WhatsApp + Email
- Triple redundancia (nunca se cae)

**Valor que creamos:**

- 3x más conversaciones atendidas
- 50% menos tiempo en tareas repetitivas
- 24/7 disponibilidad sin contratar

### Objetivos 2025

**Q1 2025:**

- ✅ Lanzar Wizard V2
- ✅ Validar A/B Testing
- ✅ Convertir primeros leads de las 425 inmobiliarias
- ✅ Pulir sistema de "Casos de Éxito"
- ✅ Cerrar brecha de tipos en frontend
- 🎯 **Meta:** 10-20 clientes de pago

**Q2-Q4 2025:**

- ⚪ Escalar a 50-100 clientes
- ⚪ Implementar Migration Assistant (FASE 8)
- ⚪ Completar Voice Assistant
- ⚪ Integraciones CRM (Salesforce, HubSpot)
- ⚪ Primeros casos de éxito documentados

### Roadmap

**Post-Launch (FASE 8):**

- ⚪ Migration Assistant (importar historial WhatsApp completo)
- ⚪ Voice Assistant (implementación completa)
- ⚪ Coaching Router (arreglar exports)
- ⚪ Integraciones CRM (Salesforce, HubSpot, Pipedrive)

**Q1 2025:**

- Wizard V2
- A/B Testing
- Casos de Éxito
- Primeros 10-20 clientes

**Q2-Q4 2025:**

- Escalar a 50-100 clientes
- FASE 8 completa
- Primeros casos de éxito documentados
- Preparar expansión LATAM

### Go-to-Market

**Lanzamiento:**

- **Tipo:** Beta privada
- **Tamaño:** 10-20 usuarios iniciales
- **Fecha:** Enero 2025 (próximas semanas)
- **Criterios de selección:** De las 425 inmobiliarias, seleccionar las más activas y con mayor potencial

**Adquisición:**

- **Fase 1 (Actual):** Outreach directo a 425 leads captados
- **Fase 2 (Q2):** LinkedIn ads + content marketing
- **Fase 3 (Q3-Q4):** Google Ads + SEO + partnerships

**Retención:**

- **Estrategia:** Utilidad crítica - Si el bot de WhatsApp cierra citas, la inmobiliaria no puede apagarlo
- **Onboarding:** 15-30 min asistido
- **Soporte:** Meta-Wallie (L1) + Arturo (L2)
- **Feedback:** Llamadas semanales con beta users

---

## 9️⃣ RESTRICCIONES

### Técnicas

**Limitaciones:**

- ⚠️ **Voice Assistant:** Stub, no completamente implementado
- ⚠️ **Coaching Router:** Deshabilitado (exports rotos)
- ⚠️ **CRM Integrations:** No implementadas todavía
- ⚠️ **Escalabilidad:** No testeada con >100 usuarios concurrentes

**Dependencias Críticas:**

- ⚠️ **WhatsApp Business API:** Pendiente verificación Meta
- ✅ **Mitigado:** Backup con miniserver + email

**Single Points of Failure:**

- ⚠️ **Vercel:** Si cae, el sitio cae (uptime típico >99.9%)
- ⚠️ **Supabase:** Si cae, la DB cae (uptime típico >99.9%)

### Recursos

**Limitaciones:**

- ⚠️ **Tiempo:** Ancho de banda de una sola persona (78h/semana)
- ⚠️ **Dinero:** Sin presupuesto para marketing agresivo (hasta validar PMF)
- ⚠️ **Personas:** Solo founder (no hay equipo de soporte/ventas)
- ✅ **Skills:** Ninguna técnica faltante, el reto es Go-to-Market

**Qué nos impide escalar más rápido:**

- Ancho de banda de una sola persona
- Falta de presupuesto para marketing agresivo
- Sin casos de éxito todavía (credibilidad)

### Legales/Regulatorias

**Compliance:**

- ✅ **GDPR:** Implementado (router gdpr.ts, 7 procedures)
- ✅ **LOPD:** Implementado (España)
- ✅ **Términos de Servicio:** Validados por Wayra
- ✅ **Política de Privacidad:** Validados por Wayra

**Riesgos:**

- ⚠️ **WhatsApp ToS:** Riesgo de ban si se abusa
- ⚠️ **IA Content:** Riesgo de generar contenido inapropiado
- ✅ **Mitigación:** Moderación + rate limiting

### Mercado

**Barreras de Entrada:**

- ⚠️ **Marca:** Sin reconocimiento
- ⚠️ **Casos de éxito:** Sin usuarios de pago todavía
- ⚠️ **Integraciones:** Competidores tienen más

**Barreras de Salida:**

- ✅ **Baja:** Usuarios pueden exportar datos

---

## 🔟 HISTORIA

### Origen

**Inicio:**

- **Fecha:** Hace 6 meses (Jun-Jul 2025)
- **Fases:** 5 meses de aprendizaje + 1 mes de construcción intensiva

**Motivación:**

- Dominar la IA para resolver problemas de negocio reales (inmobiliario)
- Periodo de formación intensiva en IA, LLMs, agentes
- Experiencia previa en negocio de imprenta, rotulación, merchandising (visión pragmática de ventas)

**Problema Personal:**

- Dificultad para escalar ventas sin contratar
- Necesidad de automatización inteligente, no solo chatbots

### Evolución

**Pivots:**

- ❓ (necesita documentar)

**Qué funcionó:**

- ✅ **Integración técnica:** Brave MCP, Docker en Miniserver, TypeScript limpio
- ✅ **Arquitectura sólida:** Monorepo, tRPC, Drizzle, multi-provider IA
- ✅ **Velocidad:** Iterar a velocidad de equipo grande (apalancado con IA)

**Qué no funcionó:**

- ❓ (necesita documentar)

### Hitos

**Principales:**

- ✅ **Jun-Jul 2025:** Inicio del proyecto
- ✅ **Nov 2025:** 5 meses de aprendizaje completados
- ✅ **Dic 2025:** 1 mes de construcción intensiva
- ✅ **26 Dic 2025:** Evolution API webhook añadido
- ✅ **27 Dic 2025:** Auditoría completa, 97% completado, MiniServer enrichment pipeline
- ✅ **28 Dic 2025:** Sistema de referidos arreglado
- ✅ **Dic 2025:** Primera venta de 100€ (validación temprana con Notebook LLM)
- ✅ **239 commits** totales

### Decisiones Clave

**Decisiones:**

- ✅ **Monorepo:** Facilita mantenimiento y compartir código
- ✅ **tRPC:** Type-safety end-to-end
- ✅ **Multi-provider IA:** No depender de un solo proveedor
- ✅ **Hardware propio:** Acemagic para voice + enrichment (ventaja competitiva)
- ✅ **Triple redundancia:** WhatsApp → Email (nunca se cae)
- ✅ **Bootstrapped:** Validar PMF antes de buscar inversión
- ✅ **Wayra:** Acceso a mentores y contratos legales

**Fueron correctas:**

- ✅ Todas las decisiones técnicas han resultado en un producto sólido (score 9.0/10)

**Qué haríamos diferente:**

- ❓ (necesita reflexionar)

### Contexto Personal (Arturo)

**Background:**

- Negocio de imprenta, rotulación y merchandising
- Visión pragmática de ventas y trato con cliente real
- 5 meses de formación intensiva en IA
- 1 mes de desarrollo intensivo de Wallie

**Por qué es la persona correcta:**

- ✅ **Experiencia en ventas:** Entiende el pain point real
- ✅ **Skills técnicas:** Domina TypeScript, React, IA, infraestructura
- ✅ **Apalancamiento con IA:** Construye a velocidad de equipo grande
- ✅ **Resiliencia:** 78h/semana, 6-7 días/semana
- ✅ **Wayra:** Acceso a mentores y red

**Motivación principal:**

- Dominar la IA para resolver problemas de negocio reales
- Construir herramienta que él mismo necesitaba
- Escalar ventas sin contratar

**Otras responsabilidades:**

- Negocio de imprenta (sustenta Wallie)
- Transición a full-time en Wallie cuando sea rentable

---

## 📊 DATOS CLAVE PARA FORUM

### Métricas Críticas

| Métrica               | Valor        | Notas                                         |
| --------------------- | ------------ | --------------------------------------------- |
| **Progreso producto** | 97%          | Fase 7 (LAUNCH) al 85%                        |
| **LOC**               | 270,000      | En 1,180 archivos                             |
| **Agentes IA**        | 22           | Supervisor + Orchestrator + 20 especializados |
| **Routers tRPC**      | 85           | Con 836 procedures                            |
| **Tests**             | 2,463+       | Score 9.0/10                                  |
| **Margen bruto**      | 89%          | Con plan PRO (49€)                            |
| **Burn rate**         | 250-300€/mes | Cash, runway indefinido                       |
| **Leads**             | 425          | Inmobiliarias listas para funnel              |
| **MRR**               | 0€           | Pre-lanzamiento                               |
| **Equipo**            | 1            | Solo founder (Arturo)                         |
| **Dedicación**        | 78h/semana   | Full-time                                     |

### Ventajas Competitivas

1. **Precio:** 10x más barato que Intercom (49€ vs $500)
2. **Margen:** 89% permite pricing agresivo y experimentación
3. **Hardware propio:** Voice + Enrichment a costo $0
4. **Triple redundancia:** WhatsApp → Email (nunca se cae)
5. **Vertical:** Enfocado en inmobiliarias (no generalista)
6. **Calidad:** Score 9.0/10, 2,463+ tests, 0 warnings
7. **Wayra:** Acceso a mentores y contratos legales validados

### Riesgos Críticos

1. **Solo founder:** Ancho de banda limitado (78h/semana)
2. **Sin casos de éxito:** Credibilidad limitada
3. **Marca nueva:** Sin reconocimiento
4. **WhatsApp API:** Pendiente verificación Meta (mitigado con backup)
5. **Go-to-Market:** Principal reto (skills técnicas están cubiertas)

---

## 🎯 CÓMO USAR ESTE CONTEXTO EN FORUM

### Cuando Forum Debate Sobre:

**Pricing:**

- Usa: Costos reales ($2.35 STARTER, $5.80 PRO), margen 89%, competencia ($74-500/mes)
- Considera: Willingness to pay de inmobiliarias españolas, posicionamiento premium vs low-cost

**Lanzamiento:**

- Usa: 425 leads listos, producto al 97%, solo founder (78h/semana)
- Considera: Capacidad de dar soporte, velocidad de validación de PMF

**Producto:**

- Usa: Features implementadas vs planificadas, score 9.0/10, FASE 8 pendiente
- Considera: Qué es crítico vs nice-to-have, esfuerzo de implementación

**Go-to-Market:**

- Usa: 425 leads, canal de captación (scraping), sin presupuesto marketing
- Considera: CAC, LTV, canales orgánicos vs pagos

**Competencia:**

- Usa: Intercom ($74-500), Reply.io ($59), 11x.ai ($5,000), ventajas/desventajas
- Considera: Defendibilidad, diferenciación real, barreras de entrada

**Recursos:**

- Usa: Solo founder, 78h/semana, runway indefinido, Wayra
- Considera: Qué se puede hacer solo vs qué requiere contratar

---

## 📝 NOTAS FINALES

**Última actualización:** 31 Diciembre 2025  
**Próxima actualización:** Semanal (métricas), Mensual (producto, competencia), Trimestral (estrategia)

**Fuentes:**

- Código fuente de Wallie (PHASES.md, CLAUDE.md, SYSTEM.md, STACK.md, tier-limits.ts)
- Respuestas del founder (Arturo)
- Conversaciones previas

**Contacto:**

- Founder: Arturo
- Aceleradora: Wayra

---

**Este documento es el conocimiento base que Forum usará para tomar decisiones informadas sobre Wallie.**
