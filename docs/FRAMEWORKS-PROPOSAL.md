# Propuesta: Frameworks de Decisión + Quoorum

> **Fecha:** 23 Ene 2026
> **Estado:** Propuesta para evaluación

---

## 🎯 Concepto

Integrar frameworks de pensamiento reconocidos (Six Thinking Hats, First Principles, etc.) con el sistema de debate multi-agente de Quoorum.

**Propuesta de valor:** "Frameworks probados + Debate AI = Decisiones superiores"

---

## 📋 Frameworks Candidatos

### Decision Making
| Framework | Descripción | Fit con Quoorum |
|-----------|-------------|-----------------|
| Six Thinking Hats | Mirar decisión desde diferentes perspectivas | 95% |
| Decision Matrix | Elegir mejor opción considerando múltiples factores | 85% |
| Eisenhower Matrix | Priorizar por importancia y urgencia | 70% |
| Second-Order Thinking | Considerar consecuencias a largo plazo | 90% |
| Ladder of Inference | Evitar saltar a conclusiones | 75% |
| Hard Choice Model | Entender qué tipo de decisión estás tomando | 80% |
| OODA Loop | Decidir rápido con data incompleta | 80% |
| Cynefin Framework | Elegir respuesta según tipo de situación | 85% |
| Impact-Effort Matrix | Priorizar por impacto vs esfuerzo | 75% |
| Confidence Speed vs Quality | Trade-off velocidad/calidad en productos | 70% |

### Problem Solving
| Framework | Descripción | Fit con Quoorum |
|-----------|-------------|-----------------|
| First Principles | Descomponer problemas en elementos básicos | 90% |
| Ishikawa Diagram | Identificar causas raíz | 75% |
| Abstraction Laddering | Enmarcar problema en diferentes niveles | 80% |
| Conflict Resolution | Encontrar soluciones win-win | 80% |
| Zwicky Box | Generar soluciones únicas a problemas complejos | 70% |
| Productive Thinking Model | Resolver problemas creativamente | 75% |
| Inversion | Abordar problema desde punto de vista opuesto | 85% |
| Issue Trees | Estructurar problemas sistemáticamente | 80% |

### Systems Thinking
| Framework | Descripción | Fit con Quoorum |
|-----------|-------------|-----------------|
| Iceberg Model | Descubrir causas ocultas de eventos | 85% |
| Connection Circles | Entender relaciones y feedback loops | 75% |
| Concept Map | Entender relaciones entre entidades | 70% |
| Balancing Feedback Loop | Mecanismo de estabilidad | 70% |
| Reinforcing Feedback Loop | Fuerza detrás de cambios exponenciales | 70% |

### Communication
| Framework | Descripción | Fit con Quoorum |
|-----------|-------------|-----------------|
| Situation-Behavior-Impact | Dar feedback claro sin juicio | 60% |
| Minto Pyramid | Comunicación eficiente y clara | 60% |

---

## 🚀 Implementación Propuesta

### Opción A: Frameworks como Modos de Debate

```
┌─────────────────────────────────────────────────────────────┐
│  ¿Cómo quieres analizar tu decisión?                        │
│                                                             │
│  🎩 Six Thinking Hats    ⚖️ Decision Matrix    🧊 Iceberg   │
│  🎯 Eisenhower Matrix    🔄 OODA Loop          🌳 Issue Tree │
│  💡 First Principles     🔮 Second-Order       🆚 Pro/Con    │
│                                                             │
│  [O deja que Quoorum elija el mejor framework]              │
└─────────────────────────────────────────────────────────────┘
```

### Opción B: Frameworks como "Lentes" Post-Debate

```
Debate completado ✅

Ahora, ¿quieres analizarlo con un framework?

→ 🎯 Eisenhower Matrix: ¿Es urgente o importante?
→ 🔮 Second-Order Thinking: ¿Consecuencias a largo plazo?
→ 🧊 Iceberg Model: ¿Qué está debajo de la superficie?
→ 📊 Decision Matrix: Scoring cuantitativo
```

### Opción C: Framework Selector Inteligente

| Tipo de Decisión | Framework Recomendado |
|------------------|----------------------|
| Priorización de tareas | Eisenhower Matrix |
| Problema complejo sin causa clara | Ishikawa / Iceberg |
| Múltiples opciones con criterios | Decision Matrix |
| Conflicto entre stakeholders | Conflict Resolution Diagram |
| Decisión rápida con data incompleta | OODA Loop |
| Decisión estratégica largo plazo | Second-Order Thinking |
| Generar soluciones creativas | First Principles / Zwicky Box |
| Comunicar decisión a equipo | Minto Pyramid |

---

## 🎩 Ejemplo: Six Thinking Hats Mode

**Mapeo de sombreros a agentes:**

| Sombrero | Color | Agente Quoorum | Rol |
|----------|-------|----------------|-----|
| Blanco | ⚪ | **Analyst** | Datos y hechos puros |
| Rojo | 🔴 | **Intuitor** (nuevo) | Emociones, gut feeling |
| Negro | ⚫ | **Critic** | Riesgos, problemas |
| Amarillo | 🟡 | **Optimizer** | Beneficios, oportunidades |
| Verde | 🟢 | **Innovator** (nuevo) | Alternativas creativas |
| Azul | 🔵 | **Synthesizer** | Proceso, síntesis final |

**Ejemplo de output:**

```
Usuario: "¿Deberíamos pivotar de B2C a B2B?"

Quoorum: Activando Six Thinking Hats...

⚪ DATOS: El B2B tiene CAC 3x mayor pero LTV 10x...
🔴 INTUICIÓN: El equipo está emocionalmente invertido en B2C...
⚫ RIESGOS: Perdemos 2 años de marca B2C construida...
🟡 OPORTUNIDADES: B2B tiene márgenes del 70% vs 20%...
🟢 ALTERNATIVAS: ¿Y si hacemos B2B2C? ¿O PLG?...
🔵 SÍNTESIS: El consenso es... [con reasoning de cada hat]
```

---

## 💡 Ejemplo: First Principles Mode

```
Usuario: "¿Cómo reducimos el churn?"

Quoorum: Activando First Principles...

🔬 DESCOMPOSICIÓN:
- ¿Qué es "churn" realmente? → Cliente deja de pagar
- ¿Por qué deja de pagar? → No percibe valor
- ¿Qué es "valor"? → Outcome > Esfuerzo + Costo
- ¿Qué determina "outcome"? → ...

💡 RECONSTRUCCIÓN:
Desde estos principios básicos, las opciones son...
[Debate entre agentes sobre cada reconstrucción]
```

---

## 🔮 Ejemplo: Second-Order Thinking Mode

```
Usuario: "¿Deberíamos bajar precios para competir?"

Quoorum: Activando Second-Order Thinking...

📍 PRIMER ORDEN:
- Más ventas a corto plazo ✓

📍 SEGUNDO ORDEN:
- Competidores también bajan → guerra de precios
- Márgenes se erosionan → menos inversión en producto
- Clientes acostumbrados a precio bajo → difícil subir

📍 TERCER ORDEN:
- Industria completa devaluada
- Solo sobreviven los que tienen VC funding
- ...

🎯 CONCLUSIÓN: [Debate sobre si vale la pena]
```

---

## 📊 Priorización de Frameworks

| Framework | Fit | Dificultad | SEO Value | Prioridad |
|-----------|-----|------------|-----------|-----------|
| **Six Thinking Hats** | 95% | Media | 🔥🔥🔥 | **P0** |
| **First Principles** | 90% | Baja | 🔥🔥🔥 | **P0** |
| **Second-Order Thinking** | 90% | Baja | 🔥🔥🔥 | **P0** |
| **Decision Matrix** | 85% | Baja | 🔥🔥 | **P1** |
| **OODA Loop** | 80% | Media | 🔥🔥 | **P1** |
| **Eisenhower Matrix** | 70% | Baja | 🔥🔥🔥 | **P1** |
| **Iceberg Model** | 85% | Media | 🔥🔥 | **P2** |
| **Ishikawa Diagram** | 75% | Alta | 🔥🔥 | **P2** |
| **Cynefin Framework** | 85% | Alta | 🔥 | **P2** |
| **Conflict Resolution** | 80% | Media | 🔥 | **P2** |

---

## 💰 Monetización con Frameworks

| Tier | Frameworks Incluidos |
|------|---------------------|
| **Free** | 1 framework (Six Hats) + 3 debates/mes |
| **Pro €29** | Todos los frameworks + 50 debates/mes |
| **Team €79** | + Colaboración + Custom frameworks |

---

## 🌐 SEO Play

Cada framework = landing page optimizada:
- quoorum.com/frameworks/six-thinking-hats
- quoorum.com/frameworks/first-principles
- quoorum.com/frameworks/decision-matrix
- quoorum.com/frameworks/second-order-thinking
- etc.

---

## ✅ Beneficios

| Dimensión | Impacto |
|-----------|---------|
| **Diferenciación** | Nadie hace "Frameworks + Multi-Agent Debate" |
| **SEO** | "Six thinking hats tool" tiene búsquedas reales |
| **Educación** | Usuarios aprenden frameworks mientras deciden |
| **Confianza** | "Uso metodología probada, no solo AI" |

---

## 📅 Roadmap Sugerido

### Fase 1 (P0) - MVP
- Six Thinking Hats mode
- First Principles mode
- Second-Order Thinking mode

### Fase 2 (P1) - Expansion
- Decision Matrix
- OODA Loop
- Eisenhower Matrix
- Framework selector inteligente

### Fase 3 (P2) - Library
- Landing pages SEO por framework
- Todos los frameworks restantes
- Custom frameworks para enterprise
