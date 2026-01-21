# 🗺️ QUOORUM ROADMAP

> **Última actualización:** 21 Enero 2026
> **Versión actual:** v1.5.0 (Smart Context System completo)

---

## ✅ COMPLETADO (v1.5.0 - Enero 2026)

### Smart Context System (Fases 1-3)
- ✅ **Fase 1**: Multi-question form (3-5 preguntas simultáneas) + Umbral 85%
- ✅ **Fase 2**: Auto-research con IA + Smart templates + AI coaching
- ✅ **Fase 3**: Debate preview + Quality benchmarking + Context snapshots

### Quick Wins (Inspirados en Competencia)
- ✅ Confidence Score visible con badge + tooltip
- ✅ Toggle Análisis Rápido/Profundo (1 pregunta vs 3-5)
- ✅ Badge "Consenso Científico" con tooltip explicativo

**Total implementado hoy:** ~3,500 líneas de código
**Estado:** Funcionando en producción

---

## 🎯 EN DESARROLLO (Semana 1 - 21-27 Ene 2026)

### 1. Backstory del Usuario (3 días) 📋
**Inspirado en:** Rationale ("Backstory")
**Prioridad:** ALTA

**Features:**
- [ ] Onboarding flow (3-4 preguntas)
- [ ] Capturar: empresa, rol, industria, estilo de decisión
- [ ] Almacenar en perfil de usuario
- [ ] Usar para personalizar preguntas y expertos
- [ ] UI: Modal post-registro + settings page para editar

**Impacto:** Alto - Personalización de debates
**Esfuerzo:** 3 días
**Archivos afectados:**
- `packages/db/src/schema/users.ts` (añadir campos)
- `apps/web/src/app/onboarding/page.tsx` (nuevo)
- `packages/api/src/routers/users.ts` (endpoints)
- `apps/web/src/components/onboarding/` (componentes)

---

### 2. Serper API Integration (1 día) 🔍
**Estado actual:** Fallback a AI-only
**Prioridad:** ALTA

**Features:**
- [ ] Configurar SERPER_API_KEY en .env
- [ ] Verificar integración existente en auto-research.ts
- [ ] Testing con búsquedas reales
- [ ] Comparar resultados AI-only vs Serper

**Impacto:** Medio-Alto - Datos reales vs conocimiento de IA
**Esfuerzo:** 1 día
**Archivos afectados:**
- `packages/api/src/lib/auto-research.ts` (ya implementado)
- `.env.example` (documentar variable)

**Nota:** El código ya existe, solo falta API key. Free tier: 100 búsquedas/mes

---

### 3. UI Polish (1 día) 🎨
**Prioridad:** MEDIA

**Features:**
- [ ] Mejorar loading states en Phase 2/3 components
- [ ] Añadir empty states con ilustraciones
- [ ] Mejorar responsive de todos los componentes nuevos
- [ ] Añadir micro-interactions (hover, transitions)
- [ ] Verificar dark mode consistency

**Impacto:** Medio - UX más pulida
**Esfuerzo:** 1 día
**Archivos afectados:**
- `apps/web/src/components/quoorum/research-results.tsx`
- `apps/web/src/components/quoorum/debate-preview.tsx`
- `apps/web/src/components/quoorum/quality-benchmark.tsx`
- `apps/web/src/components/quoorum/context-snapshots.tsx`

---

## 📅 ROADMAP (Por Prioridad)

### PRIORIDAD ALTA (Semana 2-3)

#### 4. Flash Debate Mode ⚡
**Inspirado en:** MindMesh (5 segundos)

**Qué es:**
- Modo ultra-rápido para decisiones simples
- 1 ronda de debate (no 4-5)
- Solo síntesis final, sin iteraciones
- Tiempo objetivo: 10-15 segundos total

**Por qué:**
- Decisiones tácticas diarias no necesitan 2 min de debate
- Casos de uso: "¿Qué email template usar?", "¿Precio de lanzamiento?"
- Complementa modo "Quick Analysis" actual

**Implementación:**
- Modificar `packages/quoorum/src/runner.ts`
- Añadir parámetro `mode: 'flash' | 'standard'`
- Flash mode: 1 ronda → consenso forzado
- UI: Botón "⚡ Flash Debate (15s)" junto a "Comenzar Debate"

**Esfuerzo:** 2 días
**Impacto:** Alto - Diferenciador vs competencia

---

#### 5. Decision-Making Frameworks Library 🧠
**Inspirado en:** Untools.co + SEO masivo

**Qué es:**
- Biblioteca de 20+ frameworks reconocidos (Six Thinking Hats, First Principles, etc.)
- Cada framework se implementa como "modo de debate" estructurado
- Auto-detección del mejor framework según tipo de decisión
- Landing pages SEO para cada framework individual

**Por qué es CRÍTICO:**
- **SEO explosivo:** Gente busca "six thinking hats tool online", "first principles framework"
- **Legitimidad instantánea:** Frameworks con 30-50 años de track record → trust
- **Reduce fricción:** Usuarios YA conocen estos frameworks (vs educar sobre "debate IA")
- **Diferenciación vs ChatGPT:** "6 agentes debatiendo como 6 sombreros" → memorable
- **Multiple entry points:** Cada framework es una puerta de entrada diferente

**Frameworks Prioritarios (P0):**

1. **Six Thinking Hats** (Semana 1-2)
   - ⚪ White Hat → Analyst (datos y hechos)
   - 🔴 Red Hat → Intuitor (emociones, gut feeling) *nuevo agente*
   - ⚫ Black Hat → Critic (riesgos y problemas)
   - 🟡 Yellow Hat → Optimizer (beneficios y oportunidades)
   - 🟢 Green Hat → Innovator (alternativas creativas) *nuevo agente*
   - 🔵 Blue Hat → Synthesizer (proceso y síntesis)
   - Landing: `/frameworks/six-thinking-hats`
   - **SEO:** "six thinking hats online tool" (33K búsquedas/mes)

2. **First Principles Thinking** (Semana 2-3)
   - Phase 1: Descomposición (¿Qué asumimos?)
   - Phase 2: Validación (¿Qué es fundamental?)
   - Phase 3: Reconstrucción (¿Cómo desde cero?)
   - Landing: `/frameworks/first-principles`
   - **SEO:** "first principles thinking framework" (22K búsquedas/mes)

3. **Second-Order Thinking** (Semana 3-4)
   - Primer orden: Impacto inmediato
   - Segundo orden: Reacciones y consecuencias
   - Tercer orden: Cambios sistémicos
   - Landing: `/frameworks/second-order-thinking`
   - **SEO:** "second order thinking examples" (14K búsquedas/mes)

4. **SWOT Analysis** (Semana 4-5)
   - 📊 Strengths → Optimizer (qué hacemos bien)
   - ⚠️ Weaknesses → Critic (qué debemos mejorar)
   - 🎯 Opportunities → Analyst (qué podemos aprovechar)
   - 🚨 Threats → Synthesizer (qué nos amenaza)
   - Landing: `/frameworks/swot-analysis`
   - **SEO:** "swot analysis template" (90K búsquedas/mes) 🔥🔥🔥
   - **Target:** Strategy consultants, business owners, students, MBAs

5. **Pros and Cons** (Semana 5-6)
   - ✅ Pros → Optimizer (ventajas, beneficios, upside)
   - ❌ Cons → Critic (desventajas, riesgos, downside)
   - ⚖️ Balance → Synthesizer (weighted decision)
   - Landing: `/frameworks/pros-and-cons`
   - **SEO:** "pros and cons template" (60K búsquedas/mes) 🔥🔥🔥
   - **Target:** Everyone (framework más universal y conocido)
   - **Nota:** Framework más simple pero más buscado - ideal para first-time users

**Frameworks Fase 2 (P1):**
- **Hedgehog Concept** (Jim Collins - Good to Great bestseller) - Strategy/PMF
  - 3 círculos de Venn: ¿Qué te apasiona? + ¿En qué puedes ser #1? + ¿Qué impulsa tu economía?
  - **SEO:** "hedgehog concept template" (12K búsquedas/mes)
  - Target: Startups, founders, strategy consultants
- **GROW Model** (coaching framework más popular)
  - Goal → Reality → Options → Will (4 fases secuenciales)
  - **SEO:** "grow model coaching" (18K búsquedas/mes)
  - Target: Coaches, HR, personal development
- **Pareto Principle** (regla 80/20)
  - Identificar 20% de inputs que generan 80% de outputs
  - **SEO:** "pareto principle examples" (27K búsquedas/mes)
  - Target: Productividad, optimization, resource allocation
- Eisenhower Matrix (urgente vs importante) - 49K búsquedas/mes
- Decision Matrix (scoring cuantitativo) - 8K búsquedas/mes
- OODA Loop (decisiones rápidas con data incompleta) - 5K búsquedas/mes

**Frameworks Fase 3 (P2):**
- **Cynefin Framework** (Dave Snowden) - Clasificación de problemas
  - Clear → Complicated → Complex → Chaotic (4 dominios)
  - **SEO:** "cynefin framework examples" (8K búsquedas/mes)
- **5Ws + How** - Análisis periodístico/investigación
  - Who, What, When, Where, Why, How (6 interrogantes)
  - **SEO:** "5w1h analysis" (6K búsquedas/mes)
- **SMARTER Goals** - Extension de SMART
  - Specific, Measurable, Attainable, Relevant, Time-bound, Evaluate, Re-evaluate
  - **SEO:** "smarter goals template" (11K búsquedas/mes)
- Ishikawa Diagram (fishbone - root cause analysis)
- Iceberg Model (niveles de abstracción - systems thinking)
- Conflict Resolution Diagram
- Zwicky Box (soluciones creativas - morphological analysis)

**Taxonomía de Frameworks por CONTEXTO:**

Basado en análisis de 36 frameworks del artículo de decision-making tools, clasificamos por **situación de uso** en lugar de categoría abstracta:

1. **SIMPLE CHOICES** (decisiones rápidas, baja importancia)
   - Pros and Cons, Coin Flip
   - Triggers: low-stakes, reversible, quick

2. **INFORMATION GATHERING** (falta data para decidir)
   - 5Ws, SWOT Analysis
   - Triggers: uncertainty, multi-factor, complex

3. **STRATEGIC DECISIONS** (decisiones de negocio importantes)
   - SWOT, Hedgehog Concept, Second-Order Thinking
   - Triggers: business-strategy, competitive-analysis, long-term

4. **CREATIVE THINKING** (generar opciones, innovación)
   - Six Thinking Hats, First Principles
   - Triggers: innovation, problem-solving, brainstorming

5. **PRODUCTIVITY & PRIORITIZATION**
   - Eisenhower Matrix, Pareto Principle
   - Triggers: time-management, prioritization, resource-allocation

6. **GOAL SETTING & COACHING**
   - GROW Model, SMARTER Goals
   - Triggers: career-planning, personal-development, coaching

7. **FAST DECISIONS** (velocidad crítica)
   - OODA Loop, Cynefin Framework
   - Triggers: time-pressure, crisis, incomplete-data

**Auto-detection del Framework:**
El `classifier.ts` detectará automáticamente el contexto del usuario y recomendará el framework más apropiado según la taxonomía arriba.

**Implementación Técnica:**

```typescript
// Fase 1: Infrastructure (Semana 1)
packages/db/src/schema/frameworks.ts
- Tabla frameworks (slug, name, category, agent_mapping, phases, seo_keywords)
- Relación debates_frameworks (many-to-many)

packages/quoorum/src/frameworks/taxonomy.ts (NEW)
- FRAMEWORK_TAXONOMY object con 7 contextos
- Mapeo de triggers → frameworks recomendados
- Framework metadata (SEO keywords, target audience, complexity)

packages/quoorum/src/frameworks/classifier.ts
- classifyDecision(input) → FrameworkRecommendation
- LLM call para detectar: context, complexity, timeframe, stakeholders, reversibility
- Auto-select best framework desde taxonomy
- Return: framework + reason + alternatives + confidence

packages/quoorum/src/frameworks/selector.ts
- selectFramework(classification) → match con taxonomía
- Explain why this framework fits the context
- Provide 2-3 alternatives del mismo contexto

// Fase 2: Six Thinking Hats Implementation (Semana 1-2)
packages/quoorum/src/frameworks/six-thinking-hats.ts
- runSixThinkingHats(input)
- 6 phases con agentes específicos
- Visual con colores de sombreros

apps/web/src/app/frameworks/six-thinking-hats/page.tsx
- Landing page educativa + demo
- SEO optimizado
- Case study real

// Fase 3: First Principles (Semana 2-3)
packages/quoorum/src/frameworks/first-principles.ts
- Decomposition phase
- Validation phase
- Reconstruction phase

// Fase 4: Second-Order Thinking (Semana 3-4)
packages/quoorum/src/frameworks/second-order-thinking.ts
- First order effects
- Second order consequences
- Third order systemic changes

// Fase 5: SWOT Analysis (Semana 4-5)
packages/quoorum/src/frameworks/swot-analysis.ts
- runSWOT(input)
- 4 agentes = 4 cuadrantes (Strengths, Weaknesses, Opportunities, Threats)
- Visual 2x2 matrix con color coding

apps/web/src/app/frameworks/swot-analysis/page.tsx
- Landing educativa + interactive demo
- Template descargable (PDF/Excel)
- Real business case study

// Fase 6: Pros and Cons (Semana 5-6)
packages/quoorum/src/frameworks/pros-and-cons.ts
- runProsAndCons(input)
- 2 agentes: Optimizer (Pros) + Critic (Cons)
- Weighted scoring opcional
- Visual balance scale

apps/web/src/app/frameworks/pros-and-cons/page.tsx
- Landing más simple (framework universal)
- Examples para diferentes decisiones (job offer, relocation, purchase)
- Mobile-first design (framework más usado en mobile)
```

**UI/UX:**

```
Nuevo Debate → Framework Selector
┌──────────────────────────────────────────────────────┐
│ 🔮 Recomendamos: Second-Order Thinking               │
│                                                      │
│ Para decisiones estratégicas con consecuencias      │
│ a largo plazo. Analizaremos:                        │
│ • Impacto inmediato (primer orden)                  │
│ • Reacciones competitivas (segundo orden)           │
│ • Cambios en la industria (tercer orden)            │
│                                                      │
│ [✓ Usar este framework]  [Elegir otro ▼]           │
└──────────────────────────────────────────────────────┘

Dropdown "Elegir otro":
- 🎩 Six Thinking Hats (multi-perspectiva)
- 💡 First Principles (innovación radical)
- 📊 SWOT Analysis (análisis estratégico)
- ⚖️ Pros and Cons (decisión simple)
- 🎯 Decision Matrix (scoring múltiple)
- ⏰ Eisenhower Matrix (priorización)
- 🔄 OODA Loop (velocidad con incertidumbre)
- [Ver todos los frameworks...]

Ejemplo visual SWOT Analysis:
┌────────────────────────┬────────────────────────┐
│ 📊 STRENGTHS           │ 🎯 OPPORTUNITIES       │
│ (Qué hacemos bien)     │ (Qué podemos hacer)    │
│                        │                        │
│ Optimizer analiza...   │ Analyst identifica...  │
└────────────────────────┴────────────────────────┘
┌────────────────────────┬────────────────────────┐
│ ⚠️ WEAKNESSES          │ 🚨 THREATS             │
│ (Qué debemos mejorar)  │ (Qué nos amenaza)      │
│                        │                        │
│ Critic evalúa...       │ Synthesizer detecta... │
└────────────────────────┴────────────────────────┘

Ejemplo visual Pros and Cons:
┌──────────────────────────────────────────────────────┐
│                  BALANCE SCALE                       │
│                                                      │
│  ✅ PROS (Ventajas)        ❌ CONS (Desventajas)     │
│  ────────────────          ────────────────          │
│  Optimizer:                Critic:                   │
│  • Benefit 1               • Risk 1                  │
│  • Benefit 2               • Risk 2                  │
│  • Benefit 3               • Risk 3                  │
│                                                      │
│  Peso total: 70%           Peso total: 30%           │
│                                                      │
│  ⚖️ RECOMENDACIÓN: ADELANTE (weighted 70/30)        │
└──────────────────────────────────────────────────────┘
```

**Landing Pages (SEO Critical):**

```
/frameworks                         → Overview + grid de todos (11+ frameworks)
/frameworks/six-thinking-hats      → Educativo + demo interactivo
/frameworks/first-principles       → Case study + CTA
/frameworks/second-order-thinking  → Comparación con ChatGPT
/frameworks/swot-analysis          → Template descargable + business case
/frameworks/pros-and-cons          → Examples múltiples + mobile-first

Cada landing incluye:
✅ ¿Qué es el framework? (definición + historia + autor)
✅ ¿Cuándo usarlo? (casos de uso específicos + triggers)
✅ ¿Cómo funciona? (diagrama visual + agent mapping)
✅ Demo interactivo ("Try it now" con ejemplo pre-filled)
✅ Case study real (startup/business ejemplo)
✅ Related frameworks (internal links + "If you like X, try Y")
✅ Schema markup (Rich snippets en Google)
✅ SEO metadata (keywords, description, OG tags)
✅ "Powered by AI Debates" footer con link a homepage

Prioridad de landing pages por SEO traffic:
1. SWOT Analysis (90K búsquedas/mes) - MÁXIMA PRIORIDAD
2. Pros and Cons (60K búsquedas/mes) - ALTA PRIORIDAD
3. Eisenhower Matrix (49K búsquedas/mes) - P1
4. Six Thinking Hats (33K búsquedas/mes) - P0
5. Pareto Principle (27K búsquedas/mes) - P1
```

**Consideraciones Legales:**
- ⚠️ Algunos frameworks son marcas registradas (Six Thinking Hats®)
- Disclaimer: "Based on [Author]'s method. Not affiliated."
- Dar crédito al autor original
- No vender el framework, sino la "implementación con IA"

**Esfuerzo Total:** 6 semanas (8 horas/día) - ACTUALIZADO
- Week 1: Infrastructure + Taxonomy + Six Thinking Hats
- Week 2: First Principles + Landing pages SEO
- Week 3: Second-Order Thinking + Classifier implementation
- Week 4: SWOT Analysis (PRIORIDAD SEO MÁXIMA - 90K búsquedas/mes)
- Week 5: Pros and Cons + Mobile-first optimization
- Week 6: Polish + A/B testing + Analytics setup

**Impacto:** ALTO+++ (actualizado con SWOT y Pros and Cons)
- **SEO traffic:** Proyectado **380K+ visitas orgánicas/mes** (suma de 11+ frameworks)
  - SWOT Analysis: 90K/mes
  - Pros and Cons: 60K/mes
  - Eisenhower Matrix: 49K/mes
  - Six Thinking Hats: 33K/mes
  - Pareto Principle: 27K/mes
  - First Principles: 22K/mes
  - GROW Model: 18K/mes
  - Second-Order: 14K/mes
  - Hedgehog Concept: 12K/mes
  - SMARTER Goals: 11K/mes
  - Resto: ~44K/mes
- **Conversion:** Frameworks = 11 entry points diferentes con trust preexistente
- **Diferenciación:** ChatGPT no tiene frameworks estructurados ni taxonomía contextual
- **Legitimidad:** "Quoorum = SWOT con IA" / "Six Thinking Hats con IA" > "Debate IA abstracto"
- **Viral potential:** SWOT y Pros and Cons son los frameworks más compartidos en redes sociales

**Archivos afectados:**
```
packages/db/src/schema/
├── frameworks.ts (NEW - tabla principal)
└── debate_frameworks.ts (NEW - relación many-to-many)

packages/quoorum/src/
├── frameworks/
│   ├── taxonomy.ts (NEW - 7 contextos + triggers)
│   ├── classifier.ts (NEW - LLM-based classification)
│   ├── selector.ts (NEW - framework recommendation)
│   ├── six-thinking-hats.ts (NEW)
│   ├── first-principles.ts (NEW)
│   ├── second-order-thinking.ts (NEW)
│   ├── swot-analysis.ts (NEW - P0 PRIORITY)
│   ├── pros-and-cons.ts (NEW - P0 PRIORITY)
│   └── index.ts (NEW - exports)
└── agents/
    ├── intuitor.ts (NEW - Red Hat, emotional intelligence)
    └── innovator.ts (NEW - Green Hat, creative alternatives)

apps/web/src/app/
├── frameworks/
│   ├── page.tsx (NEW - overview grid con 11+ frameworks)
│   ├── six-thinking-hats/page.tsx (NEW)
│   ├── first-principles/page.tsx (NEW)
│   ├── second-order-thinking/page.tsx (NEW)
│   ├── swot-analysis/page.tsx (NEW - MÁXIMA PRIORIDAD SEO)
│   ├── pros-and-cons/page.tsx (NEW - ALTA PRIORIDAD SEO)
│   ├── hedgehog-concept/page.tsx (NEW - P1)
│   ├── grow-model/page.tsx (NEW - P1)
│   └── pareto-principle/page.tsx (NEW - P1)
└── debates/new/page.tsx (MODIFY - add framework auto-selector)

packages/api/src/routers/
└── frameworks.ts (NEW - CRUD + recommendations + analytics)
```

**Métricas de Éxito:**
- [ ] **5 frameworks P0 implementados** y funcionando (Six Hats, First Principles, Second-Order, SWOT, Pros/Cons)
- [ ] **5 landing pages con SEO optimizado** (Lighthouse score 90+)
- [ ] **10,000+ visitas orgánicas/mes** desde frameworks searches (conservative estimate)
  - SWOT Analysis: 5,000+/mes
  - Pros and Cons: 3,000+/mes
  - Six Thinking Hats: 1,500+/mes
  - Resto: 500+/mes
- [ ] **30%+ de debates usan framework mode** (vs free-form)
- [ ] **2 nuevos agentes** (Intuitor, Innovator) con temperature correcta
- [ ] **Taxonomía de contextos** implementada con 90%+ accuracy en clasificación
- [ ] **Framework auto-selector** con user satisfaction > 80%
- [ ] **3+ frameworks P1** implementados (Hedgehog, GROW, Pareto)
- [ ] **Schema markup** en todas las landing pages (Rich snippets enabled)
- [ ] **Conversion rate landing → signup: 5%+** (benchmark: 2-3% industry average)

**Referencias:**
- [Untools.co](https://untools.co) - Biblioteca de frameworks (inspiración UX)
- [36 Proven Decision-Making Tools](https://www.leadershipexpert.co.uk/decision-making-tools/) - Taxonomía por contexto
- [Six Thinking Hats® by Edward de Bono](https://www.debono.com) - Licensing info
- [First Principles: The Building Blocks of True Knowledge](https://fs.blog/first-principles/)
- [Second-Order Thinking: What Smart People Use](https://fs.blog/second-order-thinking/)
- [SWOT Analysis Guide](https://www.mindtools.com/swot-analysis) - Template reference
- [Good to Great - Jim Collins](https://www.jimcollins.com/concepts/the-hedgehog-concept.html) - Hedgehog Concept

---

### PRIORIDAD MEDIA (Febrero 2026)

#### 6. Export & Share 📤

**Features:**
- PDF export del debate completo
- Link público compartible (read-only)
- Embed widget para blogs
- Email digest con consenso

**Casos de uso:**
- Compartir insights con stakeholders externos
- Documentación de decisiones
- Portfolio de análisis

**Esfuerzo:** 3-4 días
**Impacto:** Medio

---

#### 7. Vector Search Real 🔎
**Estado actual:** Placeholder con mock data

**Features:**
- Pinecone integration real
- Embeddings de debates históricos
- Similar debates con similarity score real
- Clustering automático por temas

**Por qué:**
- Smart templates serían realmente inteligentes
- Aprendizaje de debates pasados
- Recomendaciones basadas en contexto

**Esfuerzo:** 2-3 días
**Impacto:** Medio - Nice to have

---

#### 8. Team Collaboration 👥
**Inspirado en:** Team-GPT

**Features:**
- Invite co-founder / team members
- Roles (owner, viewer, editor, commenter)
- Comentarios en tiempo real
- Notifications (email + in-app)
- Activity feed por debate
- Voting system (cada miembro puede votar opciones)

**Por qué:**
- Decisiones importantes se toman en equipo
- Validación de consenso con humanos
- Async collaboration

**Esfuerzo:** 1-2 semanas (complejo)
**Impacto:** Alto - Pero requiere multi-tenancy

**Arquitectura:**
- Tabla `debate_collaborators` (debate_id, user_id, role)
- Tabla `debate_comments` (debate_id, user_id, comment, timestamp)
- WebSocket server para real-time
- Notificaciones con Inngest workers

---

### PRIORIDAD BAJA (Backlog)

#### 9. Analytics Dashboard 📊

**Features:**
- Success rate real vs estimado
- Dimensiones más problemáticas
- Tiempos promedio por fase
- A/B testing de modos (Quick vs Deep vs Flash)
- User retention metrics
- Most used templates

**Esfuerzo:** 1 semana
**Impacto:** Bajo - Internal only

---

#### 10. Integrations 🔌

**Slack:**
- Bot para iniciar debates desde Slack
- Notificaciones de consenso
- Command `/debate <question>`

**Linear/Jira:**
- Crear tasks desde consenso
- Sync debate decisions como issues

**Notion:**
- Export debate como página de Notion
- Template con estructura rica

**Zapier:**
- Webhooks en eventos (consenso alcanzado, debate creado)
- Triggers custom

**Esfuerzo:** 2-3 semanas (todos)
**Impacto:** Medio - Workflow integration

---

#### 11. Advanced Features 🚀

**Custom Expert Creation:**
- UI para definir expertos personalizados
- Configurar: nombre, expertise, estilo, temperatura
- Library compartida de expertos custom

**Domain-Specific Templates:**
- Templates por industria (SaaS, E-commerce, Healthcare)
- Templates por role (Founder, PM, Investor)
- Community templates (voting system)

**Multi-Language Support:**
- i18n para ES, EN, PT
- Debates en múltiples idiomas
- Auto-translate de consenso

**Voice Input:**
- Speech-to-text para contexto
- "Explicar el problema en voz"
- Mobile-first UX

**Esfuerzo:** 3-4 semanas (todos)
**Impacto:** Bajo-Medio - Nice to have

---

## 📊 ANÁLISIS COMPETITIVO

### Comparativa Features

| Feature | Rationale | MindMesh | 1000minds | **Quoorum** |
|---------|-----------|----------|-----------|-------------|
| **UX Simple (1 input)** | ✅ | ❌ | ❌ | ✅ Quick mode |
| **Backstory Usuario** | ✅ | ❌ | ❌ | 🔄 Semana 1 |
| **Velocidad (5-15s)** | ❌ | ✅ | ❌ | 🔄 Flash mode |
| **Confidence Score** | ❌ | ✅ | ❌ | ✅ Mejorado |
| **Científicamente Válido** | ❌ | ❌ | ✅ | ✅ Badge |
| **Team Collaboration** | ❌ | ❌ | ❌ | 🔄 Roadmap |
| **Multi-Agent IA** | ❌ | ❌ | ❌ | ✅ 4 expertos |
| **Context Auto-Research** | ❌ | ❌ | ❌ | ✅ Phase 2 |
| **Quality Benchmarking** | ❌ | ❌ | ❌ | ✅ Phase 3 |
| **Context Snapshots** | ❌ | ❌ | ❌ | ✅ Phase 3 |
| **Decision Frameworks** | ❌ | ❌ | ❌ | 🔄 Roadmap (20+ frameworks) |

**Ventaja competitiva actual:**
- ✅ Único con multi-agent consensus real (4 IAs independientes)
- ✅ Único con auto-research automático
- ✅ Único con sistema de snapshots para iterar
- 🔄 Por implementar: Flash mode + Backstory + Team collab + Frameworks library
- 🚀 **GAME CHANGER:** 20+ frameworks reconocidos (SEO masivo + legitimidad instantánea)

---

## 🎯 OKRs Q1 2026

### Objetivo 1: Product Market Fit
- [ ] 100 usuarios activos semanales
- [ ] 500+ debates completados
- [ ] NPS score > 50
- [ ] 20% de usuarios retornan en 7 días
- [ ] 10,000+ visitas orgánicas/mes desde frameworks SEO (conservative estimate)
  - SWOT Analysis (90K búsquedas/mes) → 5,000 visitas/mes
  - Pros and Cons (60K búsquedas/mes) → 3,000 visitas/mes
  - Resto de frameworks → 2,000 visitas/mes

### Objetivo 2: Feature Completeness
- [ ] Backstory del Usuario implementado
- [ ] Flash Debate Mode funcionando
- [ ] Serper API integrado (datos reales)
- [ ] Export PDF operativo
- [ ] **5 frameworks P0 implementados** (Six Hats, First Principles, Second-Order, SWOT, Pros/Cons)
- [ ] **8+ landing pages SEO** para frameworks activas (P0 + P1)
- [ ] Framework auto-selector con taxonomía de 7 contextos
- [ ] 2 nuevos agentes (Intuitor, Innovator)

### Objetivo 3: Technical Excellence
- [ ] Uptime 99.5%+
- [ ] P95 latency < 3s
- [ ] Test coverage > 80%
- [ ] Zero critical bugs en producción

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### Tecnologías Nuevas Requeridas

**Semana 1:**
- Serper API (free tier 100 búsquedas/mes)
  - Website: https://serper.dev
  - Pricing: $50/mo para 1000 búsquedas (opcional)

**Futuro:**
- Pinecone (vector search): $70/mo starter
- Pusher/Ably (real-time collab): $49/mo
- Resend (email notifications): Free tier OK

### Métricas de Éxito

**Backstory:**
- 80%+ usuarios completan onboarding
- Debates con backstory tienen +15% success rate

**Flash Mode:**
- P95 latency < 15 segundos
- 30%+ de debates usan flash mode

**Serper API:**
- Auto-research con Serper tiene +20% confidence vs AI-only
- 0 errores de API rate limiting

---

## 🚀 DEPLOYMENT STRATEGY

### Semana 1 (21-27 Ene)
- Feature flags para Backstory (gradual rollout)
- Serper API con fallback a AI-only
- UI Polish: Deploy continuo

### Semana 2-3 (28 Ene - 10 Feb)
- Flash Debate Mode: Beta test con 10 usuarios
- A/B test: Flash vs Standard mode
- Metrics collection

### Febrero
- Team Collaboration: Alpha privada
- Export PDF: Public beta
- Vector Search: Background migration

---

## 📞 CONTACTO

**Product Owner:** [Tu nombre]
**Last Review:** 21 Enero 2026
**Next Review:** 28 Enero 2026

---

## 📚 REFERENCIAS

- [Rationale.com](https://rationale.com) - Backstory inspiration
- [MindMesh.ai](https://mindmesh.ai) - Speed benchmark
- [1000minds.com](https://1000minds.com) - Scientific credibility
- [Team-GPT](https://team-gpt.com) - Collaboration patterns
- [Untools.co](https://untools.co) - Decision-making frameworks library (UX inspiration)
- [FS.blog](https://fs.blog) - First Principles & Second-Order Thinking (content reference)

---

*Este roadmap es un documento vivo. Se actualiza semanalmente con progreso y ajustes de prioridad.*
