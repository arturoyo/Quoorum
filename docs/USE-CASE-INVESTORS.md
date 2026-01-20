# 🎯 Quoorum para Inversores

> **Versión:** 1.0.0 | **Última actualización:** 20 Ene 2026
> **Vertical:** Venture Capital & Angel Investing

---

## 📋 RESUMEN EJECUTIVO

Quoorum ofrece a inversores (VCs, angels, family offices) un sistema de deliberación multi-agente para tomar decisiones de inversión más informadas. En lugar de depender de una sola perspectiva (la propia o la de un chatbot genérico), los inversores pueden obtener un debate estructurado entre 4 agentes IA especializados que analizan deals desde múltiples ángulos.

### Propuesta de Valor

```
"Tu Investment Committee de IA.
4 analistas debaten cada deal.
Tú tomas la decisión final."
```

### Problema que Resuelve

| Problema Actual | Solución Quoorum |
|-----------------|------------------|
| Decisiones de inversión en soledad | 4 perspectivas especializadas |
| Bias de confirmación | Agente Crítico que challenge assumptions |
| Due diligence lenta y cara | Análisis estructurado en minutos |
| Falta de documentación | Investment memo auto-generado |
| Perspectiva única de ChatGPT | Debate multi-agente con consenso |

---

## 🏗️ RECORRIDO DEL INVERSOR

### Fase 1: Screening Inicial (Deal Flow)

**Objetivo:** Decidir si vale la pena tomar la primera call

```
TEMPLATE: deal-evaluation
CONTEXTO REQUERIDO:
- One-pager o pitch deck recibido
- Sector y vertical
- Stage (pre-seed, seed, Series A, B+)
- Ask y valoración
- Intro source (warm/cold)

OUTPUT:
- ✅ TOMAR CALL / ❌ PASS / ⚠️ PEDIR MÁS INFO
- 3 preguntas clave para la call inicial
- Red flags identificados
```

### Fase 2: Due Diligence Pre-Inversión

**Objetivo:** Evaluar si invertir después de conocer la startup

```
TEMPLATE: deal-evaluation (profundo)
CONTEXTO REQUERIDO:
- Métricas: MRR, growth rate, churn, CAC/LTV, runway
- Equipo: Background founders, equity split, vesting
- Mercado: TAM/SAM/SOM, competencia, timing
- Términos: Valoración, dilución, derechos
- Referencias: Feedback de otros inversores/clientes

OUTPUT:
- Investment Memo de 1 página
- Recomendación: INVEST / PASS / CONDITIONAL
- Conviction Level (1-10)
- Condiciones requeridas si es conditional
- Próximos pasos de DD
```

### Fase 3: Negociación de Términos

**Objetivo:** Evaluar y negociar deal terms

```
TEMPLATE: deal-terms
CONTEXTO REQUERIDO:
- Term sheet recibido
- Comparables de mercado
- Posición de negociación
- Otros inversores en la ronda

OUTPUT:
- Análisis de cada término vs mercado
- Términos a negociar (priorizado)
- Red flags de governance
- Sugerencia de contra-propuesta
```

### Fase 4: Portfolio Management

**4.1 Follow-on Decisions**

```
TEMPLATE: follow-on-decision
CONTEXTO:
- Performance vs plan original
- Nuevos términos
- Reservas disponibles

OUTPUT:
- Ejercer pro-rata: SÍ/NO
- Super pro-rata: SÍ/NO (con justificación)
- Nuevas condiciones a pedir
```

**4.2 Exit Timing**

```
TEMPLATE: exit-timing
CONTEXTO:
- Oferta actual
- Alternativas (IPO, M&A, secondary)
- LP expectations

OUTPUT:
- HOLD / SELL / PARTIAL
- Timing recomendado
- Precio mínimo aceptable
```

**4.3 Portfolio Prioritization**

```
TEMPLATE: portfolio-prioritization
CONTEXTO:
- Estado de cada portfolio company
- Ownership y potential upside
- Donde podemos añadir valor

OUTPUT:
- Ranking de prioridades
- Acciones específicas por company
- Tiempo sugerido por semana
```

---

## 🤖 AGENTES ESPECIALIZADOS

### Configuración Base (4 agentes)

| Agente | Rol en Inversión | Perspectiva |
|--------|------------------|-------------|
| **Optimizer** | Bull Case Analyst | "¿Por qué puede ser un 100x?" |
| **Critic** | Risk Analyst | "¿Por qué va a fallar?" |
| **Analyst** | Due Diligence Lead | "¿Qué dicen los números?" |
| **Synthesizer** | Investment Committee | "¿Cuál es la recomendación?" |

### Expertos de Inversión Disponibles

| Experto | Especialidad | Mejor Para |
|---------|--------------|------------|
| Marc Andreessen | Visión tecnológica | Platform shifts, moonshots |
| Bill Gurley | Unit economics | Marketplaces, moats |
| Brad Feld | Term sheets | Governance, founder relations |
| Chamath Palihapitiya | Market sizing | Growth stage, category creation |
| Naval Ravikant | Founder DNA | Angel investing, early stage |
| Tomasz Tunguz | SaaS metrics | B2B SaaS, efficiency |
| Jason Lemkin | SaaS operations | ARR milestones, scaling |
| Christoph Janz | Unit economics | CAC/LTV, pricing |
| Boris Wertz | Marketplaces | Network effects, expansion |

---

## 📊 OUTPUT: INVESTMENT MEMO

Cada debate genera un memo estructurado:

```markdown
# Investment Memo: [Startup]
Generado por Quoorum | [Fecha]

## Recomendación
🟢 INVEST | 🟡 CONDITIONAL | 🔴 PASS

**Conviction Level:** X/10
**Consenso alcanzado en:** Y rondas

## Resumen Ejecutivo
[2-3 párrafos del Synthesizer con la tesis de inversión]

## Bull Case (Optimizer)
- Oportunidad 1: [descripción]
- Oportunidad 2: [descripción]
- Escenario upside: [10x path]

## Risks & Red Flags (Critic)
- Riesgo 1: [descripción + mitigación]
- Riesgo 2: [descripción + mitigación]
- Deal-breaker potencial: [si existe]

## Análisis de Métricas (Analyst)
| Métrica | Startup | Benchmark | Evaluación |
|---------|---------|-----------|------------|
| Growth MoM | 15% | 10-20% | ✅ |
| Net Churn | 5% | <5% | ⚠️ |
| CAC/LTV | 1:2 | >1:3 | ❌ |

## Términos Propuestos
- Valoración: $X pre-money
- Términos: [estándar / no estándar]
- Comparables: [lista]

## Condiciones para Invertir
1. [Condición 1]
2. [Condición 2]

## Próximos Pasos de DD
- [ ] [Paso 1]
- [ ] [Paso 2]

---
*Este memo fue generado por debate de 4 agentes IA.
La decisión final es responsabilidad del inversor.*
```

---

## 💰 PRICING PARA INVERSORES

| Plan | Precio | Incluye |
|------|--------|---------|
| **Scout** | $0/mes | 3 debates/mes, templates básicos |
| **Associate** | $49/mes | 20 debates, todos templates, PDF export |
| **Partner** | $149/mes | Ilimitado, expertos custom, API, portfolio dashboard |
| **Fund** | Custom | Multi-seat, white-label, integraciones |

### Cálculo de ROI

```
Costo de NO usar Quoorum:
- 1 bad investment de $500K = $500K perdido
- 1 missed deal que hace 10x = $5M opportunity cost
- Consultores de DD = $5K-50K por deal

Costo de Quoorum:
- Plan Partner = $149/mes = $1,788/año
- ROI si evita 1 error = 280x+
```

---

## 🔗 INTEGRACIONES FUTURAS

| Herramienta | Integración | Estado |
|-------------|-------------|--------|
| Affinity | Sync deals, trigger debates | 📋 Planificado |
| Carta | Cap table analysis | 📋 Planificado |
| DocSend | Auto-import pitch decks | 📋 Planificado |
| Notion | Export memos | 📋 Planificado |
| Slack | Notifications, quick debates | 📋 Planificado |

---

## 📈 MÉTRICAS DE ÉXITO

Para validar el producto con inversores:

| Métrica | Target | Cómo Medir |
|---------|--------|------------|
| Debates completados / usuario | >5/mes | Analytics |
| % debates que llevan a decisión | >60% | Survey post-debate |
| NPS de inversores | >50 | Survey trimestral |
| Time to investment memo | <15 min | Analytics |
| Renewal rate (paid) | >85% | Billing |

---

## 🚀 ROADMAP

### Q1 2026 - MVP Inversores
- [x] Templates de deal evaluation
- [x] Templates de follow-on
- [x] Templates de exit
- [x] 5 expertos de inversión
- [ ] Investment memo PDF export
- [ ] Portfolio dashboard básico

### Q2 2026 - Producto Completo
- [ ] Integración Affinity
- [ ] Deal comparison (side-by-side)
- [ ] Historical performance tracking
- [ ] Custom expert fine-tuning

### Q3 2026 - Fund-level Features
- [ ] Multi-seat con roles
- [ ] Investment committee workflows
- [ ] LP reporting integration
- [ ] White-label option

---

## 🎯 COPY PARA LANDING (VERTICAL INVERSORES)

### Headlines Testeables

```
A) "Tu Investment Committee de IA"
B) "4 Analistas Debaten Cada Deal"
C) "De Pitch Deck a Investment Memo en 10 Minutos"
D) "Due Diligence sin el Bias de Querer que Funcione"
```

### Value Props Principales

1. **Múltiples perspectivas** → No más decisiones con una sola opinión
2. **Velocidad** → Análisis en minutos, no semanas
3. **Documentación** → Investment memo auto-generado
4. **Consistencia** → Mismo framework para cada deal
5. **Objectividad** → IA no tiene bias emocional

### Objeciones y Respuestas

| Objeción | Respuesta |
|----------|-----------|
| "La IA no puede evaluar founders" | "No reemplaza tu judgment, lo complementa con datos y perspectivas que podrías pasar por alto" |
| "Mis deals son confidenciales" | "Tus datos no se usan para entrenar modelos. Encriptación end-to-end." |
| "Ya tengo ChatGPT" | "ChatGPT te da 1 opinión. Quoorum te da un debate estructurado con 4 perspectivas especializadas." |
| "No confío en IA para inversiones" | "Tampoco nosotros. Por eso el output es un memo para TU decisión, no una recomendación automática." |

---

## 📞 SIGUIENTE PASO

Para validar este vertical:

1. **Crear 3 debates de prueba** con deals reales (anonimizados)
2. **Compartir con 5 inversores** para feedback
3. **Iterar templates** basado en feedback
4. **Lanzar beta cerrada** con 20 inversores

---

*Última actualización: 20 Ene 2026*
