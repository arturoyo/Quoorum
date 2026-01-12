# 📊 Estadísticas y Métricas - Guía Completa

**Aprende a interpretar tus datos y tomar decisiones basadas en métricas reales.**

---

## 🎯 Introducción

Wallie registra automáticamente todas tus interacciones y las convierte en métricas accionables. Esta guía te enseña a interpretar tus estadísticas para mejorar tu proceso de ventas.

---

## 📈 Panel Principal de Estadísticas

**Ubicación:** Dashboard → Estadísticas

### Vista General (Quick Stats)

```
┌─────────────────────────────────────────────────────┐
│  📊 RESUMEN ÚLTIMO MES                              │
├─────────────────┬─────────────────┬─────────────────┤
│ 👥 Clientes     │ 💬 Conversaciones│ 📤 Mensajes    │
│ 127 (+12%)      │ 89 (+8%)        │ 1,234 (+15%)   │
├─────────────────┼─────────────────┼─────────────────┤
│ 💰 Ingresos     │ ⏱️ T. Respuesta │ 🤖 IA vs Manual│
│ €12,450 (+22%) │ 8 min (-30%)    │ 75% / 25%      │
└─────────────────┴─────────────────┴─────────────────┘
```

**Interpretación:**

- **Número con %:** Comparación con mes anterior
- **Verde:** Mejora
- **Rojo:** Bajada
- **Gris:** Sin cambios significativos

---

## 📊 Métricas Clave por Categoría

### 1. Clientes

#### Total de Clientes

**Qué mide:** Número total de contactos en tu base de datos

**Cómo se calcula:**

```
Total Clientes = Contactos con al menos 1 conversación activa
```

**Valores saludables:**

- Crecimiento mensual: +5% a +15%
- Si crece más del 30%: Posible spam o leads de baja calidad
- Si baja: Estás eliminando contactos inactivos (normal)

**Ejemplo:**

```
Enero: 100 clientes
Febrero: 112 clientes (+12%)
✅ Crecimiento saludable
```

#### Clientes Nuevos

**Qué mide:** Contactos que te escribieron por primera vez este mes

**Segmentación:**

- 🟢 **Calientes:** Respondieron en <24h
- 🟡 **Tibios:** Respondieron en 1-7 días
- 🔴 **Fríos:** No respondieron aún

**Acción recomendada:**

- Si >50% son fríos → Revisar calidad de leads
- Si >70% son calientes → Tu marketing funciona

#### Churn Rate (Tasa de Abandono)

**Qué mide:** % de clientes que dejaron de responderte

**Cómo se calcula:**

```
Churn = (Clientes que no responden en 30 días / Total) × 100
```

**Valores saludables:**

- E-commerce: 5-10% mensual
- B2B: 2-5% mensual
- Servicios recurrentes: <3% mensual

**Cómo mejorar:**

- Si churn >10%: Activar campañas de re-engagement
- Wallie puede automatizar seguimientos

---

### 2. Conversaciones

#### Total Conversaciones

**Qué mide:** Hilos de conversación activos

**Estados:**

- ✅ **Activas:** Respuesta en últimos 7 días
- ⏸️ **Pausadas:** 7-30 días sin respuesta
- 🗃️ **Archivadas:** >30 días sin respuesta

**Distribución saludable:**

```
Activas: 60-70%
Pausadas: 20-30%
Archivadas: 10-20%
```

**Si tienes >50% pausadas:**

1. Crea campaña de reactivación
2. Wallie puede enviar mensajes automáticos
3. Ejemplo: "Hola [Nombre], ¿seguimos adelante con tu proyecto?"

#### Conversaciones Ganadas vs Perdidas

**Qué mide:** Cierre del pipeline

**Cómo se marca:**

- **Ganada:** Cliente compró o contrató
- **Perdida:** Cliente rechazó o dejó de responder

**Ratio saludable:**

```
Ganadas / Total = Tasa de Conversión
```

**Por industria:**

- E-commerce: 10-20%
- B2B: 5-15%
- Servicios profesionales: 15-30%

**Ejemplo:**

```
100 conversaciones iniciadas
15 ganadas → 15% conversión ✅ (B2B)
```

---

### 3. Mensajes

#### Mensajes Enviados vs Recibidos

**Qué mide:** Quién lleva la iniciativa en la conversación

**Ratio ideal:**

```
Enviados / Recibidos = 1.2 - 1.5
```

**Interpretación:**

- **Ratio < 1:** Clientes te escriben más de lo que respondes (❌ mal)
- **Ratio 1-1.5:** Equilibrio saludable (✅ ideal)
- **Ratio > 2:** Estás persiguiendo demasiado (⚠️ revisar)

**Ejemplo:**

```
Enviados: 600
Recibidos: 500
Ratio: 1.2 ✅ Perfecto
```

#### Tiempo Medio de Respuesta

**Qué mide:** Cuánto tardas en contestar desde que el cliente escribe

**Cómo se calcula:**

```
Suma de (Timestamp respuesta - Timestamp mensaje cliente) / Total mensajes
```

**Valores por industria:**

- E-commerce: <2 horas
- B2B: <4 horas
- Servicios urgentes: <30 min

**Impacto en conversión:**

```
<1 hora → Conversión: 18%
1-4 horas → Conversión: 12%
>24 horas → Conversión: 3%
```

**Cómo mejorarlo:**

- Activar modo automático de Wallie
- Configurar respuestas rápidas
- Notificaciones push activadas

#### Mensajes por IA vs Manual

**Qué mide:** Qué % de mensajes envía Wallie vs tú

**Fases recomendadas:**

**Semana 1 (Aprendizaje):**

```
IA: 20%
Manual: 80%
```

**Mes 1 (Confianza):**

```
IA: 50%
Manual: 50%
```

**Mes 3+ (Optimización):**

```
IA: 75%
Manual: 25%
```

**Ahorro de tiempo esperado:**

- 50% IA → 10h/semana ahorradas
- 75% IA → 20h/semana ahorradas

---

### 4. Ingresos y Ventas

#### Ingresos Cerrados

**Qué mide:** Dinero facturado de clientes gestionados en Wallie

**Cómo registrarlo:**

1. Al cerrar venta, marca conversación como "Ganada"
2. Ingresa monto en campo "Valor del trato"
3. Wallie suma automáticamente

**Métricas derivadas:**

**Ingresos por canal:**

```
WhatsApp: €8,000 (64%)
Email: €3,000 (24%)
LinkedIn: €1,500 (12%)
```

**Ingresos por categoría de cliente:**

```
Nuevos: €6,000 (48%)
Recurrentes: €6,450 (52%)
```

#### Valor Promedio por Cliente (ARPC)

**Qué mide:** Cuánto ganas en promedio por cliente

**Cómo se calcula:**

```
ARPC = Ingresos Totales / Clientes que compraron
```

**Ejemplo:**

```
€12,450 ingresos / 15 clientes = €830 ARPC
```

**Cómo aumentarlo:**

- Upsell productos complementarios
- Wallie puede sugerir en momento adecuado

#### Pipeline de Oportunidades

**Qué mide:** Ingresos potenciales en proceso

**Fases del pipeline:**

```
1. Contacto inicial → 100 leads → €50,000 potencial
2. Calificado → 40 leads → €30,000 potencial
3. Propuesta enviada → 20 leads → €18,000 potencial
4. Negociación → 10 leads → €10,000 potencial
5. Cerrado → 5 leads → €5,000 REAL
```

**Conversión por fase:**

- Contacto → Calificado: 40%
- Calificado → Propuesta: 50%
- Propuesta → Negociación: 50%
- Negociación → Cierre: 50%

**Tasa de conversión total:** 5%

---

### 5. Eficiencia y Productividad

#### Pods vs Brains (Uso de IA)

**Qué mide:** Coste de operaciones de IA

**Diferencia:**

- **Pod (barato):** Respuestas simples, FAQ, follow-ups
- **Brain (caro):** Análisis complejos, estrategia, personalización

**Ratio ideal:**

```
Pods: 80%
Brains: 20%
```

**Ahorro estimado:**

```
80% Pods → €0.001/mensaje
20% Brains → €0.05/mensaje

1,000 mensajes/mes:
- Todo Brains: €50
- 80% Pods: €14 ✅ Ahorro 72%
```

**Cómo optimizar:**

- Wallie aprende qué mensajes son simples
- Automáticamente usa Pods cuando es posible

#### Tasa de Automatización

**Qué mide:** % de tareas que Wallie hace solo

**Tareas automatizables:**

- ✅ Respuestas a FAQs
- ✅ Confirmaciones de citas
- ✅ Recordatorios de seguimiento
- ✅ Actualización de etiquetas
- ✅ Creación de tareas

**Progresión esperada:**

```
Semana 1: 10% automatización
Mes 1: 40% automatización
Mes 3: 70% automatización
Mes 6: 85% automatización
```

---

## 🎯 Scoring de Clientes

### Qué es el Score

**Definición:** Puntuación 0-100 que predice la probabilidad de que un cliente compre

**Cómo se calcula:**

```
Score = (Engagement × 30%) +
        (Velocidad respuesta × 25%) +
        (Palabras clave × 20%) +
        (Interacción contenido × 15%) +
        (Tiempo en pipeline × 10%)
```

### Interpretación del Score

**🔴 0-40: Cliente Frío**

```
Características:
- Responde cada 3+ días
- Mensajes cortos ("ok", "vale")
- No hace preguntas
- No abre archivos enviados

Acción:
- Enviar contenido de valor
- Wallie puede enviar caso de éxito relevante
- Si no responde en 7 días, pausar
```

**🟡 41-70: Cliente Tibio**

```
Características:
- Responde en 24-48h
- Hace preguntas puntuales
- Abre algunos archivos
- Muestra interés moderado

Acción:
- Programar llamada
- Enviar propuesta personalizada
- Follow-up cada 3 días
```

**🟢 71-100: Cliente Caliente**

```
Características:
- Responde en <2 horas
- Hace múltiples preguntas
- Menciona "precio", "cuándo", "cómo empezamos"
- Abre todos los archivos

Acción:
- ¡PRIORIDAD MÁXIMA!
- Llamar hoy mismo
- Enviar propuesta en 24h
- Wallie te notifica urgentemente
```

### Cambios en Score

**Wallie te alerta cuando:**

- Cliente pasa de frío (30) a caliente (75): "🔥 Juan García está muy interesado"
- Cliente cae de caliente (80) a tibio (55): "⚠️ María López perdiendo interés"

---

## 📉 Gráficos y Visualizaciones

### Gráfico de Conversiones (Funnel)

```
100% - 200 Contactos iniciales
 ↓
60% - 120 Respondieron
 ↓
30% - 60 Calificados
 ↓
15% - 30 Propuesta enviada
 ↓
5% - 10 Compraron ✅
```

**Cómo usarlo:**

1. Identifica dónde pierdes más clientes
2. Si 100% → 60% es el mayor drop → Mejorar mensaje inicial
3. Si 30% → 15% → Mejorar propuestas

### Gráfico de Actividad Semanal

```
Lun: ████████████ 120 mensajes
Mar: ████████████ 115 mensajes
Mié: ██████████   95 mensajes
Jue: ████████████ 110 mensajes
Vie: ████████     75 mensajes
Sáb: ██           15 mensajes
Dom: █            8 mensajes
```

**Insight:**

- Viernes baja actividad → Los clientes B2B desconectan
- Acción: Programar mensajes importantes Lun-Jue

### Gráfico de Horario Óptimo

```
6-9h:   ██          (10 respuestas)
9-12h:  ████████    (80 respuestas) ← Mejor horario
12-14h: ████        (40 respuestas)
14-17h: ██████      (60 respuestas)
17-20h: ████        (35 respuestas)
20-23h: █           (5 respuestas)
```

**Acción:**

- Envía mensajes importantes entre 9-12h
- Wallie puede programar envíos automáticamente

---

## 📊 Comparativas y Benchmarks

### Por Industria

| Métrica                | E-commerce | B2B  | Servicios |
| ---------------------- | ---------- | ---- | --------- |
| Tasa conversión        | 15%        | 8%   | 25%       |
| Tiempo respuesta ideal | <2h        | <4h  | <1h       |
| Mensajes/cliente/mes   | 8          | 15   | 20        |
| ARPC                   | €80        | €500 | €200      |
| Churn mensual          | 8%         | 3%   | 5%        |

### Tus Números vs Promedio del Sector

```
📊 TU RENDIMIENTO vs PROMEDIO (B2B)

Conversión:        12% ✅ (Promedio: 8%)
Tiempo respuesta:  6h  ✅ (Promedio: 4h)
ARPC:              €350 ❌ (Promedio: €500)
Churn:             4%  ⚠️ (Promedio: 3%)

💡 Recomendación:
- Aumentar ARPC → Upsell servicios adicionales
- Reducir churn → Activar follow-ups automáticos
```

---

## 🎯 KPIs por Objetivo

### Si tu objetivo es: Aumentar Ingresos

**Métricas a vigilar:**

1. **ARPC** (Valor promedio por cliente)
2. **Tasa de conversión** (% que compran)
3. **Pipeline de oportunidades** (ingresos potenciales)

**Acciones:**

- Si ARPC bajo → Vender packs más grandes
- Si conversión baja → Mejorar propuestas
- Si pipeline bajo → Aumentar marketing

### Si tu objetivo es: Mejorar Eficiencia

**Métricas a vigilar:**

1. **% automatización** (cuánto hace Wallie)
2. **Tiempo medio respuesta** (velocidad)
3. **Pods vs Brains** (coste IA)

**Acciones:**

- Si automatización <60% → Activar más respuestas automáticas
- Si respuesta >4h → Activar modo automático
- Si Brains >30% → Optimizar uso de IA

### Si tu objetivo es: Retener Clientes

**Métricas a vigilar:**

1. **Churn rate** (% que abandonan)
2. **Clientes recurrentes** (% que repiten)
3. **NPS** (Net Promoter Score - satisfacción)

**Acciones:**

- Si churn >5% → Campaña de re-engagement
- Si recurrentes <40% → Programa de fidelización
- Si NPS <7 → Encuesta de satisfacción

---

## 📅 Informes Automáticos

### Informe Semanal

**Se envía cada lunes a las 9:00 AM**

**Contenido:**

```
📊 RESUMEN SEMANAL - 15-21 Enero

🎯 HIGHLIGHTS:
- 12 nuevos clientes (+20% vs semana anterior)
- 3 ventas cerradas (€2,400)
- Tiempo respuesta: 7 min (mejoró 2 min)

⚠️ ALERTAS:
- 5 clientes sin responder en 7+ días
- 2 oportunidades en riesgo (score bajando)

📈 TOP PERFORMERS:
1. Juan García (score 95) - Listo para cerrar
2. María López (score 88) - Propuesta enviada
3. Carlos Ruiz (score 82) - Negociando precio
```

**Configuración:**

- Activar en **Configuración** → **Notificaciones** → **Informes**

### Informe Mensual

**Se envía el día 1 de cada mes**

**Contenido:**

```
📊 RESUMEN MENSUAL - Enero 2025

💰 INGRESOS:
- Total: €12,450
- Variación: +22% vs Diciembre
- ARPC: €830

👥 CLIENTES:
- Total: 127
- Nuevos: 15
- Churn: 4%

🤖 EFICIENCIA:
- Automatización: 68%
- Ahorro tiempo: 18h/semana
- Ahorro IA: €127 (vs usar solo Brains)

🎯 CONVERSIÓN:
- Tasa: 12%
- Mejor canal: WhatsApp (75%)
- Mejor horario: 10-12h

📈 OBJETIVOS:
✅ Ingresos >€10k (Logrado)
✅ Automatización >60% (Logrado)
⏳ Churn <3% (4% - Falta poco)
```

---

## 🔔 Alertas Inteligentes

Wallie te notifica automáticamente cuando detecta:

### Alertas de Oportunidad (🟢 Positivas)

```
🔥 Cliente caliente detectado
   "Juan García pasó de score 45 a 82 en 2 días"
   → Acción: Llamar hoy

💰 Oportunidad grande
   "María López mencionó presupuesto de €5,000"
   → Acción: Priorizar

📈 Tendencia positiva
   "Tus conversiones subieron 15% esta semana"
   → Acción: Replicar lo que estás haciendo
```

### Alertas de Riesgo (🔴 Negativas)

```
⚠️ Cliente perdiendo interés
   "Carlos Ruiz (score 75 → 45) no responde en 5 días"
   → Acción: Enviar follow-up

📉 Bajada en conversión
   "Tu conversión bajó de 15% a 9% esta semana"
   → Acción: Revisar calidad de leads

🚨 Oportunidad en riesgo
   "Ana Torres tiene propuesta de €3k y no responde en 7 días"
   → Acción: Llamar urgente
```

### Configurar Alertas

1. **Configuración** → **Notificaciones** → **Alertas**
2. Activa las que quieres recibir
3. Elige canal: Push, Email, WhatsApp

---

## 🎓 Mejores Prácticas

### Revisar Stats: Cuándo y Cómo

**Rutina recomendada:**

**Cada mañana (5 min):**

- Ver resumen del dashboard
- Revisar alertas de clientes calientes
- Priorizar 3 conversaciones top

**Cada semana (30 min):**

- Analizar informe semanal
- Identificar 1 métrica para mejorar
- Ajustar estrategia según resultados

**Cada mes (2h):**

- Revisión profunda de tendencias
- Comparar con objetivos
- Planificar próximo mes

### Tomar Decisiones Basadas en Datos

**❌ MAL (Basado en sensación):**

> "Creo que WhatsApp funciona mejor que email"

**✅ BIEN (Basado en datos):**

> "WhatsApp convierte al 18% vs email al 8%. Voy a priorizar WhatsApp."

**Ejemplo real:**

```
Análisis:
- Mensajes enviados 9-12h: Conversión 22%
- Mensajes enviados 14-17h: Conversión 11%

Decisión:
→ Programar todos los mensajes importantes para 9-12h
→ Wallie puede automatizar esto
```

---

## 📞 Soporte

¿Dudas sobre tus estadísticas?

**Análisis personalizado (Plan Pro):**

- Llama a soporte para revisión de tus métricas
- Te ayudamos a interpretar y optimizar

**Recursos:**

- 📖 FAQ: docs/public/FAQ_USUARIO.md
- 📧 Email: soporte@wallie.pro

---

¡Usa tus datos para vender más y trabajar menos! 📊✨
