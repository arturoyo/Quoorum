# 🧠 QUOORUM - Contexto Completo del Producto

> **Propósito:** Documento maestro de contexto para usar en debates estratégicos (dogfooding)
> **Versión:** 1.0.0 | **Última actualización:** 20 Ene 2026
> **Uso:** Copiar secciones relevantes como contexto en debates de Quoorum sobre Quoorum

---

## 📋 ÍNDICE DE CONTEXTOS

1. [Qué es Quoorum](#1-qué-es-quoorum)
2. [Capacidades Técnicas](#2-capacidades-técnicas)
3. [Expertos y Templates](#3-expertos-y-templates)
4. [Diferenciadores vs Competencia](#4-diferenciadores-vs-competencia)
5. [Estado Actual del Producto](#5-estado-actual-del-producto)
6. [Audiencia y Casos de Uso](#6-audiencia-y-casos-de-uso)
7. [Modelo de Negocio](#7-modelo-de-negocio)
8. [Stack Tecnológico](#8-stack-tecnológico)

---

## 1. QUÉ ES QUOORUM

### Descripción en Una Línea
Sistema de debates multi-agente con IA que ayuda a tomar decisiones complejas mediante la deliberación de múltiples expertos virtuales hasta alcanzar consenso.

### Descripción Completa
Quoorum es una plataforma de toma de decisiones asistida por IA que simula un "board of advisors" virtual. En lugar de obtener una única respuesta de un chatbot genérico, Quoorum organiza un debate estructurado entre 4+ agentes IA especializados (Optimista, Crítico, Analista, Sintetizador) que representan diferentes perspectivas sobre una decisión.

Los agentes debaten en rondas sucesivas hasta alcanzar consenso mediante un algoritmo que detecta cuando hay acuerdo suficiente (≥70% en la opción top con ≥30% de gap sobre la segunda).

### Problema que Resuelve

| Problema Actual | Cómo lo Resuelve Quoorum |
|-----------------|--------------------------|
| Decisiones importantes tomadas en soledad | 4+ perspectivas especializadas debaten |
| Bias de confirmación (solo buscas lo que quieres oír) | Agente Crítico challenge sistemáticamente |
| ChatGPT da una sola opinión (la que cree correcta) | Debate estructurado con múltiples posiciones |
| Consultores son caros ($500+/hora) y lentos (semanas) | Respuesta en minutos por $0-50/mes |
| Falta de documentación de decisiones | Investment memo auto-generado con PDF |
| No hay consistencia en el framework de decisión | Mismo proceso para cada decisión |

### Analogías para Explicar el Producto

```
"Es como tener un board of advisors en tu bolsillo"
"ChatGPT te da una opinión. Quoorum te da un debate."
"Es el Superhuman de la toma de decisiones"
"Un investment committee de IA que trabaja 24/7"
"McKinsey meets AI, pero accesible"
```

---

## 2. CAPACIDADES TÉCNICAS

### 2.1 Motor de Debates (Core)

| Capacidad | Descripción | Beneficio Usuario |
|-----------|-------------|-------------------|
| **4 Agentes Base** | Optimizer, Critic, Analyst, Synthesizer | Perspectivas complementarias garantizadas |
| **50+ Expertos** | Perfiles de expertos reales (April Dunford, Patrick Campbell, Marc Andreessen, etc.) | Debates con "personalidades" reconocibles |
| **Matching Inteligente** | IA selecciona 4-10 expertos más relevantes para cada pregunta | Sin selección manual, siempre los correctos |
| **Algoritmo de Consenso** | Detecta acuerdo cuando top ≥70% + gap ≥30% + min 3 rondas | Sabe cuándo parar |
| **Meta-Moderador** | IA interviene si calidad baja (argumentos superficiales, consenso prematuro) | Calidad garantizada |
| **Quality Monitor** | Scores de profundidad, diversidad, originalidad (0-100) | Métricas objetivas de calidad |

### 2.2 Análisis de Preguntas

| Capacidad | Descripción | Beneficio Usuario |
|-----------|-------------|-------------------|
| **Complejidad 1-10** | Evalúa variables, impacto, reversibilidad | Saber qué tan difícil es la decisión |
| **Clasificación** | Estratégica / Táctica / Operacional | Nivel de profundidad apropiado |
| **Áreas de Conocimiento** | Detecta pricing, marketing, tech, legal, etc. | Expertos correctos seleccionados |
| **Estimación de Rondas** | Predice cuántas rondas necesitará | Expectativas claras |

### 2.3 Carga de Contexto

| Capacidad | Descripción | Beneficio Usuario |
|-----------|-------------|-------------------|
| **Input Manual** | Usuario proporciona contexto estructurado | Control total |
| **Web Search** | Integración Serper para datos de mercado en tiempo real | Información actualizada |
| **Análisis de Código** | Puede leer repositorios para decisiones técnicas | Contexto técnico automático |
| **Tracking de Fuentes** | Registra de dónde viene cada dato | Trazabilidad |

### 2.4 Orquestación Avanzada

| Capacidad | Descripción | Beneficio Usuario |
|-----------|-------------|-------------------|
| **Patrones de Debate** | Consensus-building, Devil's advocate, Deep dive, Rapid fire | Estructura correcta para cada decisión |
| **Selección Automática** | IA elige el patrón según la pregunta | Sin configuración manual |
| **Executive Summaries** | Síntesis nivel CEO con scores de confianza | Listo para presentar |
| **Board Simulation** | Simula deliberación de C-suite | "¿Qué pensaría el board?" |
| **Decision Scorecard** | Evaluación multi-dimensional (confianza, factibilidad, impacto, riesgo) | Framework consistente |

### 2.5 Multi-Provider IA

| Capacidad | Descripción | Beneficio Usuario |
|-----------|-------------|-------------------|
| **5 Providers** | OpenAI, Anthropic, Google, Deepseek, Groq | Sin vendor lock-in |
| **Fallback Automático** | Cambia de provider si uno falla | Debates nunca fallan |
| **Optimización de Costos** | Default a Gemini 2.0 Flash (gratis) | $0 en free tier |
| **Configuración por Agente** | Cada experto puede usar diferente modelo | Optimización granular |

### 2.6 Real-Time & Persistencia

| Capacidad | Descripción | Beneficio Usuario |
|-----------|-------------|-------------------|
| **WebSocket Server** | Actualizaciones en tiempo real | Ver debate en vivo |
| **27 Schemas DB** | Persistencia completa en PostgreSQL | Historial, búsqueda, analytics |
| **Búsqueda Vectorial** | Pinecone para encontrar debates similares | "Ya debatiste esto antes" |
| **Redis Cache** | Respuestas frecuentes cacheadas | Velocidad mejorada |

### 2.7 Outputs y Exportación

| Capacidad | Descripción | Beneficio Usuario |
|-----------|-------------|-------------------|
| **PDF Profesional** | Transcripción + resumen + métricas | Documento compartible |
| **Shareable Cards** | One-pager con takeaways | Social/email friendly |
| **Markdown** | Formato documentation-ready | Para devs |
| **Investment Memo** | Formato estructurado para decisiones de inversión | Listo para VC |

### 2.8 Gamification ("OMG" Features)

| Capacidad | Descripción | Beneficio Usuario |
|-----------|-------------|-------------------|
| **Auto-Summaries** | Emoji + recomendación + pros/cons | Comprensión instantánea |
| **Predictive Analytics** | Probabilidad de éxito, risk scoring | Saber si funcionará |
| **Follow-Up Questions** | IA genera 3-5 debates de seguimiento | Próximos pasos claros |
| **Debate Highlights** | Quotes clave, turning points | Momentos memorables |
| **Expert Chemistry** | Qué expertos trabajan bien juntos | Mejores combinaciones |
| **Debate Narration** | Resúmenes estilo comentarista deportivo | Entretenido y sustantivo |

---

## 3. EXPERTOS Y TEMPLATES

### 3.1 Base de Datos de Expertos (50+)

#### Por Categoría

| Categoría | Expertos | Especialidad |
|-----------|----------|--------------|
| **Positioning & GTM** | April Dunford, Peep Laja, Steli Efti | Posicionamiento, conversión, ventas |
| **Pricing** | Patrick Campbell, Alex Hormozi | Estrategia de precios, monetización |
| **Product & PMF** | Rahul Vohra, Sean Ellis, Lenny Rachitsky | Product-market fit, growth |
| **Growth** | Brian Balfour, Julian Shapiro, Rand Fishkin | Acquisition, retention |
| **SaaS Operations** | Jason Lemkin, Des Traynor, David Skok | Métricas, scaling, CS |
| **Venture Capital** | Marc Andreessen, Bill Gurley, Brad Feld, Naval Ravikant, Chamath | Inversión, términos, exits |
| **Technical/AI** | Andrej Karpathy, Simon Willison, Shreya Shankar | IA, ML, sistemas |
| **Marketplaces** | Boris Wertz | Network effects, expansion |
| **Creator Economy** | Sahil Lavingia | Community, monetización |

### 3.2 Templates Pre-Construidos (40+)

| Industria | Templates | Ejemplos |
|-----------|-----------|----------|
| **SaaS** | 5 | Pricing, Positioning, Roadmap, GTM, Vertical |
| **Startup** | 2 | Fundraising Timing, Amount |
| **Investment** | 8 | Deal Eval, Terms, Follow-on, Exit, Portfolio, Market Timing, Fund Strategy, DD Focus |
| **E-commerce** | 1 | Channel Strategy |
| **Marketplace** | 1 | Side Priority |
| **Creator Economy** | 1 | Monetization |

### 3.3 Categorías de Templates

- **Deal Flow**: Evaluación de oportunidades
- **Portfolio**: Gestión de inversiones/productos
- **Strategy**: Decisiones de alto nivel
- **Pricing**: Estrategia de precios
- **Product**: Roadmap, features
- **GTM**: Go-to-market
- **Growth**: Acquisition, retention
- **Monetization**: Modelos de negocio

---

## 4. DIFERENCIADORES VS COMPETENCIA

### 4.1 vs ChatGPT/Claude (Chat IA Genérico)

| Aspecto | ChatGPT/Claude | Quoorum |
|---------|----------------|---------|
| Perspectivas | 1 (la "correcta") | 4+ (debate estructurado) |
| Challenge | Rara vez contradice | Agente Crítico siempre challenge |
| Estructura | Conversación libre | Debate con rondas y consenso |
| Expertos | Genérico | 50+ perfiles específicos |
| Output | Texto | Memo estructurado + PDF |
| Historial | Por chat | Base de datos con búsqueda |
| Precio | $20/mes | $0-49/mes |

### 4.2 vs Consultores (McKinsey, Bain, etc.)

| Aspecto | Consultores | Quoorum |
|---------|-------------|---------|
| Costo | $500-2000/hora | $0-49/mes |
| Tiempo | Semanas-meses | Minutos |
| Disponibilidad | Horario laboral | 24/7 |
| Escalabilidad | Limitada | Ilimitados debates |
| Documentación | Variable | Siempre PDF/memo |
| Bias | Pueden tener | Configurable |

### 4.3 vs Decision Frameworks (Notion templates, etc.)

| Aspecto | Frameworks Estáticos | Quoorum |
|---------|---------------------|---------|
| Interactividad | Ninguna | Debate dinámico |
| Perspectivas | Las que tú aportes | IA genera múltiples |
| Adaptabilidad | Manual | Automática por pregunta |
| Análisis | Tú lo haces | IA analiza |

### 4.4 Diferenciadores Únicos de Quoorum

1. **50+ Expert Personas** - No agentes genéricos, expertos reales con conocimiento específico
2. **Quality Assurance Automático** - Meta-moderador interviene si calidad baja
3. **Zero Vendor Lock** - 5 providers IA con fallback automático
4. **Orquestación Compleja** - Debates multi-fase, no solo ida y vuelta
5. **Sales Integration** - Conecta debates a deals/oportunidades
6. **Machine Learning** - Aprende qué expertos funcionan mejor juntos
7. **Real-Time** - WebSocket para ver debates en vivo
8. **Template Marketplace** - 40+ pre-built + builder custom

---

## 5. ESTADO ACTUAL DEL PRODUCTO

### 5.1 Métricas del Codebase

| Métrica | Valor |
|---------|-------|
| **Líneas de Código** | ~270,000 |
| **Packages** | 7 (quoorum, api, db, ai, ui, core, workers) |
| **Routers tRPC** | 24 con 100+ endpoints |
| **Schemas DB** | 27 |
| **Tests** | 234 casos en 92 suites |
| **Expertos** | 50+ |
| **Templates** | 40+ |

### 5.2 Madurez por Área

| Área | Estado | Notas |
|------|--------|-------|
| **Core Debate Engine** | ✅ Producción | Funcional y probado |
| **Expert Database** | ✅ Producción | 50+ expertos configurados |
| **Templates** | ✅ Producción | 40+ templates activos |
| **Real-Time (WebSocket)** | ✅ Producción | Funcional |
| **PDF Export** | ✅ Producción | 594 líneas, completo |
| **API** | ✅ Producción | 24 routers |
| **UI Web** | ✅ Producción | Next.js 14, App Router |
| **Rate Limiting** | ✅ Producción | Token bucket implementado |
| **Analytics** | ⚠️ Básico | Métricas core, falta dashboard |
| **Billing/Payments** | ⚠️ Pendiente | Stripe configurado, no activo |
| **Mobile** | ❌ No existe | Solo web responsive |

### 5.3 Lo que Funciona Hoy

- Crear debates con pregunta + contexto
- Selección automática de expertos
- Debate multi-ronda hasta consenso
- Exportar a PDF
- Ver debates anteriores
- Templates por industria
- Real-time updates

### 5.4 Lo que Falta para Launch

- [ ] Onboarding guiado
- [ ] Billing/subscriptions activo
- [ ] Landing page optimizada
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Mobile optimization

---

## 6. AUDIENCIA Y CASOS DE USO

### 6.1 Audiencia Primaria

| Segmento | Descripción | Dolor Principal |
|----------|-------------|-----------------|
| **Founders** | Startups early-stage, solopreneurs | Decisiones en soledad, sin board |
| **Product Managers** | PMs en empresas tech | Priorización de roadmap |
| **Ejecutivos** | C-suite, VPs | Decisiones estratégicas de alto impacto |
| **Inversores** | VCs, angels, family offices | Due diligence, portfolio decisions |

### 6.2 Casos de Uso Validados

| Caso de Uso | Pregunta Típica | Template |
|-------------|-----------------|----------|
| **Pricing** | "¿Debería lanzar a $29, $49 o $99?" | saas-pricing |
| **Positioning** | "¿Cómo posicionar vs competencia?" | saas-positioning |
| **Fundraising** | "¿Cuándo y cuánto levantar?" | fundraising-timing |
| **Roadmap** | "¿Qué feature priorizar?" | saas-roadmap |
| **GTM** | "¿PLG, sales-led o hybrid?" | saas-gtm |
| **Deal Evaluation** | "¿Invertir en esta startup?" | deal-evaluation |
| **Exit Timing** | "¿Cuándo vender?" | exit-timing |
| **Hiring** | "¿Contratar senior o 2 juniors?" | (custom) |
| **Pivoting** | "¿Pivotar o perseverar?" | (custom) |

### 6.3 Jobs-to-be-Done

1. **Cuando** tengo una decisión importante y no tengo con quién consultarla
2. **Quiero** obtener múltiples perspectivas expertas rápidamente
3. **Para** tomar una decisión más informada y con más confianza

---

## 7. MODELO DE NEGOCIO

### 7.1 Pricing Propuesto

| Plan | Precio | Límites | Target |
|------|--------|---------|--------|
| **Free** | $0/mes | 3 debates/mes | Prueba |
| **Starter** | $29/mes | 20 debates/mes | Indie hackers |
| **Pro** | $49/mes | 50 debates/mes | Founders, PMs |
| **Team** | $149/mes | Ilimitado, 5 seats | Equipos |
| **Enterprise** | Custom | Ilimitado, SSO, API | Empresas |

### 7.2 Métricas de Negocio Target

| Métrica | Target 12 meses |
|---------|-----------------|
| **MRR** | $50K |
| **Usuarios Pagos** | 500 |
| **Free → Paid** | 5% |
| **Churn** | <5% |
| **NPS** | >50 |

### 7.3 Costos Estimados

| Concepto | Costo/mes |
|----------|-----------|
| **AI (Gemini free tier)** | $0-100 |
| **AI (si usamos OpenAI)** | $500-2000 |
| **Infra (Vercel, DB)** | $100-300 |
| **Total burn** | $500-2500 |

---

## 8. STACK TECNOLÓGICO

### 8.1 Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand + TanStack Query
- **Real-time:** WebSocket

### 8.2 Backend
- **API:** tRPC v11
- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle
- **Auth:** Supabase Auth
- **Background Jobs:** Inngest

### 8.3 AI/ML
- **Providers:** OpenAI, Anthropic, Google AI, Groq, Deepseek
- **Embeddings:** OpenAI text-embedding-3-small
- **Vector Store:** Pinecone
- **Search:** Serper API

### 8.4 Infraestructura
- **Hosting:** Vercel
- **CDN:** Vercel Edge
- **Monitoring:** Sentry
- **Analytics:** PostHog

---

## 📝 CÓMO USAR ESTE DOCUMENTO EN DEBATES

### Para debates de Landing/Messaging

Copiar secciones:
- [1. Qué es Quoorum](#1-qué-es-quoorum)
- [4. Diferenciadores](#4-diferenciadores-vs-competencia)
- [6. Audiencia](#6-audiencia-y-casos-de-uso)

### Para debates de Pricing

Copiar secciones:
- [2. Capacidades Técnicas](#2-capacidades-técnicas) (resumen)
- [5. Estado Actual](#5-estado-actual-del-producto)
- [7. Modelo de Negocio](#7-modelo-de-negocio)

### Para debates de GTM

Copiar secciones:
- [3. Expertos y Templates](#3-expertos-y-templates)
- [4. Diferenciadores](#4-diferenciadores-vs-competencia)
- [6. Audiencia](#6-audiencia-y-casos-de-uso)

### Para debates de Product/Roadmap

Copiar secciones:
- [2. Capacidades Técnicas](#2-capacidades-técnicas) (completo)
- [5. Estado Actual](#5-estado-actual-del-producto)

---

*Última actualización: 20 Ene 2026*
*Para usar en debates de Quoorum sobre Quoorum (dogfooding)*
