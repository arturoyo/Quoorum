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

#### 4. ~~Flash Debate Mode~~ ❌ ELIMINADO
**Por qué eliminado:**
- ❌ **Contradice value proposition:** Quoorum = profundidad y calidad, no velocidad
- ❌ **Si quieren velocidad:** Ya existe ChatGPT y perplexity.ai
- ❌ **Quick Analysis ya existe:** Toggle 1 pregunta vs 3-5 (suficiente)
- ❌ **Prioridad incorrecta:** Mejor pulir core experience que añadir modo rápido

**Decisión:**
- ✅ Mantener SOLO Quick Analysis (1 pregunta) vs Deep Analysis (3-5 preguntas)
- ✅ Mejorar calidad de análisis profundo en lugar de speed

---

#### 5. Decision-Making Frameworks Library 🧠
**Inspirado en:** Untools.co + Análisis crítico de 36 frameworks

**⚠️ REALITY CHECK APLICADO:**
Después de análisis crítico, SOLO implementamos frameworks que:
1. ✅ Tienen search intent de "herramienta" (no solo "qué es")
2. ✅ Fit natural con multi-agent debates
3. ✅ Son fáciles de implementar (< 2 semanas)
4. ✅ Conversión realista estimada

**Por qué SOLO 3 frameworks (no 11+):**
- **Focus:** 3 frameworks bien hechos > 11 a medias
- **SEO realista:** 199K búsquedas es SUFICIENTE para validar
- **Conversión:** Mejor optimizar 3 que tener 11 mediocres
- **Velocidad:** 6 semanas para 3 frameworks + features críticas

**Frameworks P0 (ÚNICOS 3):**

1. **Pros and Cons** (Semana 2-3) 🔥🔥🔥
   - ✅ Pros → Optimizer (ventajas, beneficios, upside)
   - ❌ Cons → Critic (desventajas, riesgos, downside)
   - ⚖️ Balance → Synthesizer (weighted decision)
   - Landing: `/frameworks/pros-and-cons`
   - **SEO:** "pros and cons template" (60K búsquedas/mes)
   - **Target:** Everyone (framework más universal - 100% de personas lo conoce)
   - **Por qué P0:** Search intent = "tool/maker/calculator", conversión ALTA, fit perfecto con 2 agentes
   - **Esfuerzo:** 2 semanas

2. **SWOT Analysis** (Semana 4-5) 🔥🔥🔥
   - 📊 Strengths → Optimizer (qué hacemos bien)
   - ⚠️ Weaknesses → Critic (qué debemos mejorar)
   - 🎯 Opportunities → Analyst (qué podemos aprovechar)
   - 🚨 Threats → Synthesizer (qué nos amenaza)
   - Landing: `/frameworks/swot-analysis`
   - **SEO:** "swot analysis template/generator" (90K búsquedas/mes)
   - **Target:** Strategy consultants, business owners, students, MBAs
   - **Por qué P0:** SEO traffic más alto, fit perfecto con 4 cuadrantes = 4 agentes, template descargable
   - **Esfuerzo:** 2 semanas

3. **Eisenhower Matrix** (Semana 6) 🔥🔥
   - ⚡ Urgente + Importante → Hacer ahora (Critic identifica)
   - 📅 No urgente + Importante → Planificar (Analyst prioriza)
   - 👥 Urgente + No importante → Delegar (Optimizer sugiere)
   - 🗑️ No urgente + No importante → Eliminar (Synthesizer recomienda)
   - Landing: `/frameworks/eisenhower-matrix`
   - **SEO:** "eisenhower matrix template" (49K búsquedas/mes)
   - **Target:** Productividad, time management, GTD community
   - **Por qué P0:** Framework muy conocido, simple (4 cuadrantes), audiencia amplia
   - **Esfuerzo:** 1 semana

**Total SEO P0:** 199K búsquedas/mes (realista y suficiente para validar)
**Conversión estimada:** 5,000-7,000 visitas orgánicas/mes (2.5% CTR conservative)

**❌ FRAMEWORKS ELIMINADOS (y por qué):**

- ❌ **Six Thinking Hats:** Requiere 2 agentes nuevos (Intuitor, Innovator), search intent = info no tool, demasiado complejo
- ❌ **First Principles:** No es tool, es mentalidad/filosofía, keyword intent = "examples" no "framework"
- ❌ **Second-Order Thinking:** Charlie Munger philosophy, no framework ejecutable, search intent = info
- ❌ **Hedgehog Concept:** Nicho muy pequeño (solo startups), Jim Collins concept específico
- ❌ **GROW Model:** Framework 1-on-1 coaching, fuera de scope de multi-agent debates
- ❌ **Pareto Principle:** No ejecutable como herramienta, search intent = "examples" no "tool"
- ❌ **Cynefin Framework:** Demasiado académico, complejo, audiencia enterprise consultants only
- ❌ **5Ws + How:** No es framework, es periodismo básico, demasiado simple
- ❌ **SMARTER Goals:** No necesitas debate multi-agente para goal setting
- ❌ **Decision Matrix:** Baja prioridad (8K búsquedas), hacer después si hay demanda
- ❌ **OODA Loop:** Baja prioridad (5K búsquedas), nicho militar/crisis

**🎯 Filosofía del recorte:**
> "3 frameworks EXCELENTES que la gente REALMENTE busca como herramienta > 11 frameworks mediocres que buscan como info"

**Implementación Técnica (SIMPLIFICADA):**

```typescript
// Semana 1: Infrastructure básica
packages/db/src/schema/frameworks.ts (SIMPLE)
- Tabla frameworks (id, slug, name, description, is_active)
- NO taxonomy compleja, NO classifier LLM
- Solo metadata básica

// Semana 2-3: Pros and Cons (Framework #1)
packages/quoorum/src/frameworks/pros-and-cons.ts
- runProsAndCons(input)
- 2 agentes existentes: Optimizer (Pros) + Critic (Cons)
- Synthesizer hace balance final
- Visual balance scale simple

apps/web/src/app/frameworks/pros-and-cons/page.tsx
- Landing page mobile-first
- SEO: title, meta, h1 optimizado para "pros and cons template"
- Demo con ejemplo pre-filled ("Should I take this job offer?")
- CTA: "Try it free" → signup

// Semana 4-5: SWOT Analysis (Framework #2)
packages/quoorum/src/frameworks/swot-analysis.ts
- runSWOT(input)
- 4 agentes existentes: Optimizer, Critic, Analyst, Synthesizer
- Mapeo directo a cuadrantes
- Export como imagen/PDF

apps/web/src/app/frameworks/swot-analysis/page.tsx
- Landing educativa con ejemplos business
- Template descargable (opcional - si da tiempo)
- SEO: "swot analysis template", "swot generator"
- Case study: "Startup expansion to LATAM"

// Semana 6: Eisenhower Matrix (Framework #3)
packages/quoorum/src/frameworks/eisenhower-matrix.ts
- runEisenhower(input)
- Categoriza tareas en 4 cuadrantes
- Agentes clasifican según urgencia/importancia
- Output: priorización clara

apps/web/src/app/frameworks/eisenhower-matrix/page.tsx
- Landing productividad-focused
- SEO: "eisenhower matrix template"
- Demo con lista de tareas ejemplo
```

**⚠️ LO QUE NO HACEMOS (por ahora):**
- ❌ NO LLM classifier (overkill para 3 frameworks)
- ❌ NO taxonomía de 7 contextos (innecesario)
- ❌ NO framework auto-selector (el usuario elige del overview)
- ❌ NO nuevos agentes (Intuitor, Innovator) - usamos los 4 existentes

**UI/UX (SIMPLIFICADO):**

```
/frameworks → Overview page (grid de 3 frameworks)

┌─────────────────────────────────────────────────────────┐
│         Choose Your Decision-Making Framework          │
│                                                         │
│  ⚖️ Pros and Cons        📊 SWOT Analysis              │
│  Simple binary decision  Strategic business analysis    │
│  [Try it free]           [Try it free]                 │
│                                                         │
│  ⏰ Eisenhower Matrix                                   │
│  Task prioritization                                    │
│  [Try it free]                                         │
│                                                         │
│  Or start a [Free-form debate] →                       │
└─────────────────────────────────────────────────────────┘

NO auto-selector, NO dropdown complejo, NO recomendaciones IA
= Usuario elige el framework que conoce

Ejemplo visual: Pros and Cons
┌──────────────────────────────────────────────────────┐
│            Should I take this job offer?             │
│                                                      │
│  ✅ PROS (Optimizer)        ❌ CONS (Critic)         │
│  • Higher salary (+30%)    • Longer commute (1h)    │
│  • Better career growth    • Unfamiliar industry    │
│  • Remote work 2 days/wk   • Smaller team           │
│                                                      │
│  Weight: 70%               Weight: 30%               │
│                                                      │
│  ⚖️ RECOMMENDATION: Take the offer (70/30 balance)   │
└──────────────────────────────────────────────────────┘

Ejemplo visual: SWOT Analysis
┌────────────────────────┬────────────────────────┐
│ 📊 STRENGTHS           │ 🎯 OPPORTUNITIES       │
│ • Strong brand         │ • LATAM expansion      │
│ • Tech team (15 devs)  │ • B2B segment untapped │
└────────────────────────┴────────────────────────┘
┌────────────────────────┬────────────────────────┐
│ ⚠️ WEAKNESSES          │ 🚨 THREATS             │
│ • Limited runway (6mo) │ • 3 competitors w/ VC  │
│ • No sales team        │ • Economic downturn    │
└────────────────────────┴────────────────────────┘
```

**Landing Pages (SEO SIMPLIFICADO - solo 4 páginas):**

```
/frameworks                    → Overview grid de 3 frameworks + CTA free-form
/frameworks/pros-and-cons      → Mobile-first, ejemplos variados
/frameworks/swot-analysis      → Business-focused, template opcional
/frameworks/eisenhower-matrix  → Productivity-focused, task list demo

Cada landing (SIMPLE):
✅ H1 optimizado para SEO ("Free Pros and Cons Template - AI Powered")
✅ What + When + How (3 secciones breves)
✅ Demo con ejemplo pre-filled (1-click para probar)
✅ CTA: "Try it free" → signup o guest mode
✅ Basic SEO: title, meta description, OG tags
✅ "Powered by Quoorum" footer

❌ NO case studies complejos (por ahora)
❌ NO schema markup rich snippets (nice to have, no crítico)
❌ NO "related frameworks" (solo son 3)
❌ NO autor/historia larga (brevedad)
```

**Consideraciones Legales:**
- ✅ Los 3 frameworks elegidos NO tienen trademark issues
- Pros and Cons: método universal, dominio público
- SWOT Analysis: Albert Humphrey (1960s), dominio público
- Eisenhower Matrix: Dwight Eisenhower, dominio público
- Disclaimer: "Powered by Quoorum AI. Templates inspired by proven methodologies."

**Esfuerzo Total:** 6 semanas (SIMPLIFICADO y REALISTA)
- **Week 1:** Backstory del Usuario + Serper API integration
- **Week 2-3:** Pros and Cons framework (P0) + Landing page SEO
- **Week 4-5:** SWOT Analysis (P0) + Landing page SEO
- **Week 6:** Eisenhower Matrix (P0) + Export PDF + Polish final
- **Total:** 3 frameworks bien hechos + features críticas completadas

**Impacto:** ALTO (realista y validable)
- **SEO traffic:** 199K búsquedas/mes → **5,000-7,000 visitas orgánicas/mes** (2.5% CTR conservative)
  - SWOT Analysis: 90K búsquedas/mes → 3,000 visitas
  - Pros and Cons: 60K búsquedas/mes → 2,000 visitas
  - Eisenhower Matrix: 49K búsquedas/mes → 1,500 visitas
- **Conversion:** 3 frameworks EXCELENTES = 3 entry points con alta conversión
- **Nuevos usuarios:** 150-200/mes (5% signup rate realista, no 500+)
- **Diferenciación:** ChatGPT no tiene frameworks estructurados con multi-agent debates
- **Legitimidad:** "Quoorum = SWOT con 4 IAs expertas" / "Pros/Cons con debate real" > "Debate IA abstracto"
- **Viral potential:** SWOT y Pros and Cons son frameworks universales, alta probabilidad de share

**Archivos afectados (SIMPLIFICADO):**
```
packages/db/src/schema/
└── frameworks.ts (NEW - tabla simple: id, slug, name, description, is_active)

packages/quoorum/src/
└── frameworks/
    ├── pros-and-cons.ts (NEW - P0)
    ├── swot-analysis.ts (NEW - P0)
    ├── eisenhower-matrix.ts (NEW - P0)
    └── index.ts (NEW - exports)

apps/web/src/app/
├── frameworks/
│   ├── page.tsx (NEW - overview grid con 3 frameworks + CTA free-form)
│   ├── pros-and-cons/page.tsx (NEW - Landing SEO mobile-first)
│   ├── swot-analysis/page.tsx (NEW - Landing SEO business-focused)
│   └── eisenhower-matrix/page.tsx (NEW - Landing SEO productivity)
└── debates/new/page.tsx (MODIFY - add framework selector simple)

packages/api/src/routers/
└── frameworks.ts (NEW - CRUD básico + analytics)

❌ NO CREAMOS:
- taxonomy.ts, classifier.ts, selector.ts (overkill)
- intuitor.ts, innovator.ts (nuevos agentes innecesarios)
- 8+ landing pages para frameworks eliminados
```

**Métricas de Éxito (REALISTAS):**
- [ ] **3 frameworks P0 implementados** y funcionando (Pros/Cons, SWOT, Eisenhower)
- [ ] **4 landing pages con SEO optimizado** (Lighthouse score 90+)
  - /frameworks (overview)
  - /frameworks/pros-and-cons
  - /frameworks/swot-analysis
  - /frameworks/eisenhower-matrix
- [ ] **5,000-7,000 visitas orgánicas/mes** desde frameworks searches (realista)
  - SWOT Analysis: 3,000/mes
  - Pros and Cons: 2,000/mes
  - Eisenhower Matrix: 1,500/mes
- [ ] **20%+ de debates usan framework mode** (vs free-form)
- [ ] **NO nuevos agentes** - usamos los 4 existentes eficientemente
- [ ] **Export PDF** funcionando correctamente
- [ ] **Conversion rate landing → signup: 5%+** (benchmark: 2-3% industry average)
- [ ] **150-200 nuevos usuarios/mes** desde SEO de frameworks (5% signup rate)

**Referencias:**
- [Untools.co](https://untools.co) - Biblioteca de frameworks (inspiración UX)
- [SWOT Analysis Guide](https://www.mindtools.com/swot-analysis) - Template reference
- [Eisenhower Matrix Template](https://todoist.com/productivity-methods/eisenhower-matrix) - Productivity reference
- [Decision-Making Tools Research](https://www.leadershipexpert.co.uk/decision-making-tools/) - Análisis de search intent

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

#### 7. ~~Vector Search Real~~ ❌ ELIMINADO (por ahora)
**Por qué eliminado:**
- ❌ **Costo prematuro:** Pinecone = $70/mo sin validar PMF primero
- ❌ **Complejidad innecesaria:** Mock data funciona suficientemente bien
- ❌ **Prioridad baja:** Mejor frameworks library que similar debates avanzado
- ❌ **ROI incierto:** No sabemos si usuarios realmente usan "debates similares"

**Decisión:**
- ✅ Mantener similar debates con mock data (suficiente para validar)
- ✅ Re-evaluar después de 500+ debates reales en producción
- ✅ Implementar SOLO si usuarios piden explícitamente esta feature

---

#### 8. Team Collaboration 👥 → **MOVIDO A BACKLOG**
**Por qué postponed:**
- ⚠️ **Complejidad alta:** 1-2 semanas = 25% del tiempo disponible Q1
- ⚠️ **Requiere multi-tenancy:** Arquitectura compleja, nuevo sistema de billing
- ⚠️ **Validar individual primero:** Necesitamos usuarios solos antes que equipos
- ⚠️ **WebSockets cost:** Pusher/Ably = $49/mo extra sin validar

**Decisión:**
- ✅ **Q1:** Focus en individual user experience (frameworks, backstory, export PDF)
- ✅ **Q2:** Re-evaluar Team Collaboration después de tener 100+ usuarios activos
- ✅ **Alternativa temporal:** Usuarios pueden compartir PDF/link público del debate (export feature)

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
| **Velocidad (5-15s)** | ❌ | ✅ | ❌ | ❌ Eliminado |
| **Confidence Score** | ❌ | ✅ | ❌ | ✅ Mejorado |
| **Científicamente Válido** | ❌ | ❌ | ✅ | ✅ Badge |
| **Team Collaboration** | ❌ | ❌ | ❌ | 🔄 Q2 (postponed) |
| **Multi-Agent IA** | ❌ | ❌ | ❌ | ✅ 4 expertos |
| **Context Auto-Research** | ❌ | ❌ | ❌ | ✅ Phase 2 |
| **Quality Benchmarking** | ❌ | ❌ | ❌ | ✅ Phase 3 |
| **Context Snapshots** | ❌ | ❌ | ❌ | ✅ Phase 3 |
| **Decision Frameworks** | ❌ | ❌ | ❌ | 🔄 3 frameworks (Sem 2-6) |

**Ventaja competitiva actual:**
- ✅ Único con multi-agent consensus real (4 IAs independientes)
- ✅ Único con auto-research automático
- ✅ Único con sistema de snapshots para iterar
- 🔄 Por implementar: Backstory (1 sem) + Frameworks library (5 sem)
- 🚀 **GAME CHANGER:** 3 frameworks EXCELENTES con search intent correcto (SEO validable)

---

## 🎯 OKRs Q1 2026

### Objetivo 1: Product Market Fit (REALISTA)
- [ ] 100 usuarios activos semanales
- [ ] 500+ debates completados
- [ ] NPS score > 50
- [ ] 20% de usuarios retornan en 7 días
- [ ] **5,000-7,000 visitas orgánicas/mes** desde frameworks SEO (realista)
  - SWOT Analysis (90K búsquedas/mes) → 3,000 visitas/mes
  - Pros and Cons (60K búsquedas/mes) → 2,000 visitas/mes
  - Eisenhower Matrix (49K búsquedas/mes) → 1,500 visitas/mes
- [ ] **150-200 nuevos usuarios/mes** desde frameworks (5% signup rate)

### Objetivo 2: Feature Completeness (SIMPLIFICADO)
- [ ] Backstory del Usuario implementado
- [ ] ~~Flash Debate Mode~~ ❌ ELIMINADO (contradice value prop)
- [ ] Serper API integrado (datos reales)
- [ ] Export PDF operativo
- [ ] **3 frameworks P0 implementados** (Pros/Cons, SWOT, Eisenhower)
- [ ] **4 landing pages SEO** para frameworks activas (overview + 3 frameworks)
- [ ] ~~Framework auto-selector~~ ❌ ELIMINADO (overkill, usuario elige)
- [ ] ~~2 nuevos agentes~~ ❌ ELIMINADO (usamos los 4 existentes)

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

**Q1 (6 semanas):**
- ~~Pinecone (vector search)~~ ❌ ELIMINADO - innecesario hasta validar PMF
- ~~Pusher/Ably (real-time collab)~~ ❌ POSTPONED a Q2 - Team Collaboration movido
- Resend (email notifications): Free tier OK - solo para export PDF notifications

### Métricas de Éxito

**Backstory:**
- 80%+ usuarios completan onboarding
- Debates con backstory tienen +15% success rate

**Frameworks Library:**
- 20%+ de debates usan framework mode (vs free-form)
- 5,000-7,000 visitas orgánicas/mes desde frameworks SEO
- 5% signup rate desde landing pages de frameworks
- 150-200 nuevos usuarios/mes atribuibles a frameworks

**Serper API:**
- Auto-research con Serper tiene +20% confidence vs AI-only
- 0 errores de API rate limiting

**Export PDF:**
- 30%+ de debates completados se exportan a PDF
- 0 errores de generación PDF

---

## 🚀 DEPLOYMENT STRATEGY

### Semana 1 (21-27 Ene)
- Feature flags para Backstory (gradual rollout)
- Serper API con fallback a AI-only
- UI Polish: Deploy continuo

### Semana 2-3 (28 Ene - 10 Feb)
- Pros and Cons framework: Beta test con 10 usuarios
- Landing page /frameworks/pros-and-cons: SEO optimizada
- A/B test: Framework mode vs Free-form

### Semana 4-5 (11-24 Feb)
- SWOT Analysis framework: Public beta
- Landing page /frameworks/swot-analysis: SEO optimizada
- Metrics collection de conversión frameworks → signup

### Semana 6 (25 Feb - 3 Mar)
- Eisenhower Matrix framework: Public beta
- Export PDF: Production ready
- Landing pages polish + analytics setup

---

## 📞 CONTACTO

**Product Owner:** [Tu nombre]
**Last Review:** 21 Enero 2026
**Next Review:** 28 Enero 2026

---

## 📚 REFERENCIAS

- [Rationale.com](https://rationale.com) - Backstory inspiration
- [1000minds.com](https://1000minds.com) - Scientific credibility benchmark
- [Untools.co](https://untools.co) - Decision-making frameworks library (UX inspiration)
- [MindTools SWOT](https://www.mindtools.com/swot-analysis) - SWOT Analysis template reference
- [Todoist Eisenhower](https://todoist.com/productivity-methods/eisenhower-matrix) - Eisenhower Matrix productivity reference

---

*Este roadmap es un documento vivo. Se actualiza semanalmente con progreso y ajustes de prioridad.*
