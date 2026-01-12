# 🧬 Humanizer Engine - Documentación Completa

**El "ADN Humano" de Wallie**

El Humanizer Engine es el sistema que permite a los agentes de IA de Wallie (tanto en el CRM como en W. Allie Bot) detectar y adaptarse al contexto del mundo real, mostrando empatía con la situación actual del cliente o audiencia.

---

## 📖 Índice

1. [Concepto](#concepto)
2. [Arquitectura](#arquitectura)
3. [Componentes](#componentes)
4. [Configuración](#configuración)
5. [Uso](#uso)
6. [Ejemplos](#ejemplos)
7. [API Reference](#api-reference)
8. [Tests](#tests)
9. [Deployment](#deployment)

---

## 🧠 Concepto

### El Problema

Los agentes de IA tradicionales generan respuestas genéricas sin considerar:
- ¿Es lunes por la mañana o viernes por la tarde?
- ¿El cliente está pagando el IVA esta semana?
- ¿Llueve en su ciudad?
- ¿Hubo un partido importante ayer?

**Resultado:** Mensajes que parecen escritos por un bot.

### La Solución

El Humanizer Engine inyecta **contexto del mundo real** en los prompts de IA:

```
CONTEXTO DEL MUNDO REAL:

- Hora del día: afternoon
- Saludo recomendado: "Buenas tardes"

- ⚠️ FISCAL: Semana de pago de IVA trimestral (día 18 de Abril)
  Consejo: Baja la agresividad comercial. El cliente está estresado financieramente.

- 📅 CALENDARIO: Viernes (FINISH)
  Energía: MEDIUM
  Ángulo de post: "Viernes. Si no cerraste esta semana, el lunes empiezas desde cero."

- 🏆 DEPORTES: Real Madrid vs Barcelona
  Resultado: Real Madrid 2-1 Barcelona
  Metáfora: "Como el Real Madrid ayer, tu equipo necesita una estrategia ganadora"

---

Usa este contexto para adaptar tu respuesta y mostrar empatía con la situación real del cliente.
```

**Resultado:** Mensajes que parecen escritos por un humano que vive en el mundo real.

---

## 🏗️ Arquitectura

### Dos Implementaciones

El Humanizer Engine tiene **dos implementaciones** para dos sistemas diferentes:

#### 1. **Wallie CRM (TypeScript/Next.js)**

**Objetivo:** Que el usuario final active/desactive estos "Poderes Humanos" con Toggles.

**Stack:**
- `packages/db/src/schema/agent-configs.ts` - Schema de BD
- `apps/web/src/app/dashboard/settings/ai/humanizer/page.tsx` - UI
- `packages/ai/src/context-builder.ts` - Lógica de contexto

**Flujo:**
1. Usuario activa toggles en `/settings/ai/humanizer`
2. Se guarda en `humanizerSettings` (JSONB)
3. Al generar respuesta, `context-builder.ts` inyecta contexto
4. GPT-4 recibe prompt con contexto real

#### 2. **W. Allie Bot (Python)**

**Objetivo:** Que el bot de LinkedIn parezca que vive en el mundo real, no en un servidor.

**Stack:**
- `packages/growth-worker/sense_environment.py` - Detección de contexto
- `packages/growth-worker/w_allie_bot.py` - Generación de posts
- `packages/growth-worker/w_allie_scheduler.py` - Rutinas automáticas

**Flujo:**
1. Scheduler ejecuta rutina (e.g., Morning Routine)
2. `w_allie_bot.py` llama a `sense_environment()`
3. Se inyecta contexto en el prompt
4. GPT-4 genera post con contexto real
5. Se publica en LinkedIn

---

## 🔧 Componentes

### 1. Schema de BD (`agent-configs.ts`)

```typescript
humanizerSettings: jsonb('humanizer_settings')
  .$type<{
    strictGreeting?: boolean        // Saludos según hora local
    weatherAwareness?: boolean      // Mencionar clima de la ciudad
    fiscalRadar?: boolean           // Detectar semanas de impuestos
    sportsRadar?: boolean           // Detectar eventos deportivos
    paydayLogic?: boolean           // Detectar día de cobro de nómina
    vacationMode?: boolean          // Detectar vacaciones
  }>()
  .default({
    strictGreeting: true,
    weatherAwareness: false,
    fiscalRadar: true,
    sportsRadar: false,
    paydayLogic: false,
    vacationMode: true,
  })
```

### 2. UI de Configuración (`page.tsx`)

**Ruta:** `/dashboard/settings/ai/humanizer`

**6 Cards con Toggles:**

| Toggle | Descripción | Ideal para |
|--------|-------------|------------|
| **Saludos Estrictos** | "Buenos días" vs "Hola" | Todos |
| **Weather Awareness** | Mencionar clima local | Logística, Inmobiliaria |
| **Fiscal Radar** | Detectar IVA/IRPF | B2B (autónomos, pymes) |
| **Sports Radar** | Usar eventos deportivos | Audiencia deportiva |
| **Payday Logic** | Detectar fin de mes | B2C, ticket bajo |
| **Vacation Mode** | Detectar Agosto/Navidad | Todos |

### 3. Context Builder (TypeScript)

**Archivo:** `packages/ai/src/context-builder.ts`

**Función principal:**
```typescript
async function buildHumanContext(
  config: AgentConfig,
  clientLocation?: string
): Promise<HumanContext>
```

**Retorna:**
```typescript
interface HumanContext {
  greeting: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  weather?: { condition, temperature, city, description }
  fiscal?: { isStressWeek, reason, advice }
  sports?: { lastBigMatch, result, metaphor }
  payday?: { isPaydayWeek, daysUntilPayday }
  vacation?: { isVacationPeriod, period, advice }
  injectionPrompt: string
}
```

### 4. Sense Environment (Python)

**Archivo:** `packages/growth-worker/sense_environment.py`

**Funciones principales:**

```python
def get_fiscal_mood() -> Dict
def get_calendar_vibe() -> Dict
def get_sports_context() -> Optional[Dict]
def get_weather_context(city: str) -> Optional[Dict]
def sense_environment() -> Dict
```

**Retorna:**
```python
{
    "fiscal": {
        "mood": "STRESSED" | "NORMAL",
        "reason": str,
        "advice": str,
        "post_angle": str,
        "hashtags": List[str]
    },
    "calendar": {
        "day_of_week": str,
        "vibe": "START" | "GRIND" | "FINISH" | "REFLECT" | "SLOW",
        "energy": "HIGH" | "MEDIUM" | "LOW",
        "post_angle": str,
        "hashtags": List[str]
    },
    "sports": Optional[Dict],
    "weather": Optional[Dict],
    "injection_prompt": str
}
```

---

## ⚙️ Configuración

### Variables de Entorno

```bash
# OpenWeather API (opcional, para clima)
OPENWEATHER_API_KEY=your_api_key_here

# TheSportsDB API (opcional, para deportes)
THESPORTSDB_API_KEY=your_api_key_here
```

### Defaults

Si no hay API keys, el sistema funciona con **mock data** o simplemente omite ese contexto.

---

## 🚀 Uso

### En LinkedIn Audio Messages (Python)

#### Generar audio con contexto

```python
from linkedin_audio import AudioMessageGenerator

generator = AudioMessageGenerator()

lead = {
    'company': 'Acme Corp',
    'role': 'CEO',
    'city': 'Madrid'
}

pitch_text = 'Quiero hablarte sobre cómo Wallie puede ayudarte a automatizar tu prospección'

# Generar audio con contexto (inject_reality=True por defecto)
audio_path = await generator.generate_pitch_audio(
    lead=lead,
    pitch_text=pitch_text,
    personality='expert',
    gender='male',
    inject_reality=True  # <-- Activa Humanizer Engine
)
```

**Resultado en semana de IVA:**
> "Hola, sé que esta semana es complicada con el tema de impuestos, así que seré breve. Quiero hablarte sobre cómo Wallie puede ayudarte a automatizar tu prospección"

**Resultado en Agosto:**
> "Hola, entiendo que estamos en Agosto y puede que estés de vacaciones. Quiero hablarte sobre cómo Wallie puede ayudarte a automatizar tu prospección. Sin prisa, cuando tengas un momento."

### En Voice AI (TypeScript)

#### 1. Generar mensaje de seguimiento post-llamada

```typescript
import { api } from '@/lib/api'

const followUp = await api.voice.generateFollowUp.mutate({
  callId: 'uuid-de-la-llamada',
  callSummary: 'Hablamos sobre automatización de ventas y le interesó la demo'
})

console.log(followUp.subject) // "Seguimiento de nuestra llamada"
console.log(followUp.body)    // Mensaje con contexto empático
console.log(followUp.channel) // "email" | "whatsapp" | "sms"
```

**Resultado en semana de IVA:**
```
Buenas tardes Juan,

Sé que esta semana es complicada con el tema de impuestos, así que seré breve.

Gracias por la llamada de hoy. Hablamos sobre automatización de ventas y le interesó la demo.

Te propongo que hablemos la semana que viene, cuando las cosas estén más tranquilas.

Saludos,
Wallie
```

#### 2. Generar script de llamada adaptativo

```typescript
const script = await api.voice.generateCallScript.mutate({
  callPurpose: 'sales',
  callDirection: 'outbound',
  clientId: 'uuid-del-cliente' // opcional
})

console.log(script.greeting)      // "Buenos días"
console.log(script.introduction)  // "Soy [Nombre] de Wallie..."
console.log(script.mainMessage)   // Mensaje adaptado al contexto
console.log(script.callToAction)  // CTA adaptado
console.log(script.closing)       // Cierre
console.log(script.fullScript)    // Script completo
```

**Resultado en fin de mes:**
```
Buenos días. Soy [Nombre] de Wallie. ¿Te pillo en buen momento? 
Te llamo porque creo que Wallie puede ayudarte a automatizar tu prospección y cerrar más ventas. 
Es buen momento para avanzar. ¿Cerramos los detalles ahora? 
Perfecto. Gracias por tu tiempo. Hablamos pronto.
```

#### 3. Generar respuesta del asistente de voz

```typescript
const { response } = await api.voice.generateAssistantResponse.mutate({
  callId: 'uuid-de-la-llamada',
  userQuery: '¿Cuánto cuesta Wallie?'
})

console.log(response) // Respuesta empática con contexto
```

**Resultado en vacaciones:**
> "Claro, entiendo que estamos en Agosto. Déjame ayudarte con eso."

### En Wallie CRM (TypeScript)

#### 1. Activar en UI

```
1. Ir a /dashboard/settings/ai/humanizer
2. Activar toggles deseados
3. Guardar configuración
```

#### 2. Usar en código

```typescript
import { buildHumanContext, extractClientLocation } from '@wallie/ai/context-builder'
import { getAgentConfig } from '@wallie/db'

// Obtener config del usuario
const config = await getAgentConfig(userId)

// Extraer ubicación del cliente
const location = extractClientLocation(clientData)

// Construir contexto
const context = await buildHumanContext(config, location)

// Inyectar en prompt
const prompt = `
${userMessage}

${context.injectionPrompt}
`

// Enviar a GPT-4
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ]
})
```

### En W. Allie Bot (Python)

#### 1. Generar post con contexto

```python
from w_allie_bot import WAllieBot

bot = WAllieBot(
    linkedin_email="your_email",
    linkedin_password="your_password"
)

# Generar post (inject_reality=True por defecto)
post = bot.generate_post(
    topic="Pipeline Management",
    context="",
    post_type="general",
    inject_reality=True  # <-- Activa Humanizer Engine
)

print(post)
```

#### 2. Usar sense_environment directamente

```python
from sense_environment import sense_environment

# Obtener contexto completo
env = sense_environment()

print(env["injection_prompt"])
print(f"Fiscal Mood: {env['fiscal']['mood']}")
print(f"Calendar Vibe: {env['calendar']['vibe']}")
```

#### 3. Ejecutar con scheduler

```python
from w_allie_scheduler import WAllieScheduler

scheduler = WAllieScheduler(
    linkedin_email="your_email",
    linkedin_password="your_password"
)

# Iniciar scheduler (rutinas automáticas)
scheduler.start()

# Las rutinas ya usan inject_reality=True automáticamente
```

---

## 📝 Ejemplos

### Ejemplo 1: Semana de IVA (18 de Abril)

**Sin Humanizer Engine:**
```
Hola Juan,

¿Tienes 10 minutos para hablar sobre cómo Wallie puede ayudarte a automatizar tu prospección?

Saludos,
Wallie
```

**Con Humanizer Engine:**
```
Buenas tardes Juan,

Sé que esta semana toca pagar el IVA trimestral (Modelo 303), así que no voy a robarte mucho tiempo.

Solo quería comentarte que Wallie puede ayudarte a automatizar tu prospección para que cierres más ventas el próximo trimestre y el IVA no duela tanto.

¿Te va bien una llamada rápida la semana que viene?

Saludos,
Wallie
```

### Ejemplo 2: Lunes por la mañana

**Sin Humanizer Engine:**
```
Hola María,

¿Cómo va todo?
```

**Con Humanizer Engine:**
```
Buenos días María,

Lunes. El día que separa a los que hablan de los que hacen.

¿Cuántas llamadas vas a hacer hoy?
```

### Ejemplo 3: Post de W. Allie en semana de Champions

**Sin Humanizer Engine:**
```
El pipeline no se gestiona solo.

Necesitas un sistema.
```

**Con Humanizer Engine:**
```
Anoche vi al Real Madrid ganar la Champions.

¿Sabéis qué tienen en común con los mejores equipos de ventas?

Un sistema. No improvisan. Tienen un playbook.

¿Tú tienes uno?

#Champions #RealMadrid #Ventas
```

---

## 📚 API Reference

### TypeScript

#### `buildHumanContext(config, clientLocation?)`

Construye contexto humano completo.

**Parámetros:**
- `config: AgentConfig` - Configuración del agente
- `clientLocation?: string` - Ciudad del cliente (opcional)

**Retorna:** `Promise<HumanContext>`

#### `extractClientLocation(clientData)`

Extrae ubicación del cliente desde diferentes campos.

**Parámetros:**
- `clientData: any` - Datos del cliente

**Retorna:** `string | undefined`

### Python

#### `sense_environment()`

Combina todo el contexto del mundo real.

**Retorna:** `Dict[str, any]`

#### `get_fiscal_mood()`

Detecta si estamos en semana de impuestos.

**Retorna:**
```python
{
    "mood": "STRESSED" | "NORMAL",
    "reason": str,
    "advice": str,
    "post_angle": str,
    "hashtags": List[str]
}
```

#### `get_calendar_vibe()`

Detecta el "vibe" del calendario.

**Retorna:**
```python
{
    "day_of_week": str,
    "vibe": "START" | "GRIND" | "FINISH" | "REFLECT" | "SLOW",
    "energy": "HIGH" | "MEDIUM" | "LOW",
    "post_angle": str,
    "hashtags": List[str]
}
```

#### `get_sports_context()`

Consulta resultados deportivos recientes.

**Retorna:** `Optional[Dict]`

#### `get_weather_context(city)`

Consulta el clima actual de una ciudad.

**Parámetros:**
- `city: str` - Ciudad a consultar (default: "Madrid")

**Retorna:** `Optional[Dict]`

---

## 🧪 Tests

### Ejecutar tests (Python)

```bash
cd packages/growth-worker
pytest test_humanizer.py -v
```

**30 tests** que cubren:
- Fiscal Context (3 tests)
- Calendar Context (3 tests)
- Sports Context (2 tests)
- Weather Context (3 tests)
- Sense Environment (4 tests)
- Helper Functions (3 tests)
- Integration (2 tests)
- Edge Cases (3 tests)

### Ejecutar tests (TypeScript)

```bash
cd packages/ai
pnpm test context-builder
```

---

## 🚀 Deployment

### 1. Base de Datos

```bash
cd packages/db
pnpm drizzle-kit push:pg
```

Esto creará la columna `humanizer_settings` en `agent_configs`.

### 2. Frontend

```bash
cd apps/web
vercel --prod
```

La UI estará disponible en `/dashboard/settings/ai/humanizer`.

### 3. Growth Worker

```bash
cd packages/growth-worker
railway up
```

**Variables de entorno:**
```bash
OPENWEATHER_API_KEY=your_key  # Opcional
THESPORTSDB_API_KEY=your_key  # Opcional
```

### 4. Verificar

#### Wallie CRM:
```bash
curl https://wallie.app/dashboard/settings/ai/humanizer
```

#### W. Allie Bot:
```bash
python -c "from sense_environment import sense_environment; print(sense_environment()['injection_prompt'])"
```

---

## 🎯 Casos de Uso

### 1. B2B SaaS

**Toggles recomendados:**
- ✅ Fiscal Radar (detectar IVA/IRPF)
- ✅ Vacation Mode (Agosto/Navidad)
- ✅ Strict Greeting (profesionalismo)

**Resultado:** No molestas en semanas de impuestos, bajas expectativas en vacaciones.

### 2. Logística/Inmobiliaria

**Toggles recomendados:**
- ✅ Weather Awareness (mencionar clima)
- ✅ Strict Greeting
- ✅ Vacation Mode

**Resultado:** "Veo que en Barcelona llueve hoy, ¿afecta a tus entregas?"

### 3. B2C (Ticket Bajo)

**Toggles recomendados:**
- ✅ Payday Logic (detectar fin de mes)
- ✅ Vacation Mode
- ❌ Fiscal Radar (no aplica)

**Resultado:** Aumenta agresividad comercial los días 25-31 (cobro de nóminas).

### 4. Audiencia Deportiva

**Toggles recomendados:**
- ✅ Sports Radar (usar eventos deportivos)
- ✅ Strict Greeting
- ✅ Vacation Mode

**Resultado:** Posts de W. Allie con metáforas de Champions, Clásicos, etc.

---

## 🔍 Troubleshooting

### Problema: No se inyecta contexto

**Solución:**
1. Verificar que `humanizerSettings` esté guardado en BD
2. Verificar que `inject_reality=True` en `generate_post()`
3. Revisar logs para errores de importación

### Problema: Weather no funciona

**Solución:**
1. Verificar que `OPENWEATHER_API_KEY` esté configurada
2. Verificar que la ciudad del cliente esté en formato correcto
3. Si no hay API key, el sistema omite el clima (no es crítico)

### Problema: Sports no aparece

**Solución:**
1. Por defecto usa mock data (Real Madrid vs Barcelona)
2. Para datos reales, integrar con TheSportsDB API
3. Si no hay partido reciente, el sistema omite deportes (no es crítico)

---

## 📈 Métricas

### KPIs a Medir

1. **Tasa de respuesta:**
   - Con Humanizer Engine vs Sin Humanizer Engine

2. **Engagement en LinkedIn:**
   - Posts de W. Allie con contexto vs sin contexto

3. **Conversión:**
   - Mensajes con Fiscal Radar vs sin Fiscal Radar

4. **Tiempo de respuesta:**
   - Clientes responden más rápido con contexto empático

---

## 🎓 Best Practices

### 1. No abuses del contexto

❌ **Malo:**
```
Buenos días Juan,

Veo que en Madrid llueve, es lunes, estás pagando el IVA, y ayer ganó el Real Madrid.
```

✅ **Bueno:**
```
Buenos días Juan,

Sé que esta semana toca pagar el IVA, así que seré breve.
```

### 2. Usa el contexto solo si es relevante

- **Fiscal Radar:** Solo si vendes a autónomos/pymes
- **Sports Radar:** Solo si tu audiencia es deportiva
- **Weather Awareness:** Solo si el clima afecta al negocio

### 3. Testea con tu audiencia

- A/B test con y sin Humanizer Engine
- Mide engagement, conversión, respuesta

### 4. Actualiza el contexto

- Agrega nuevos eventos fiscales (Modelo 347, etc.)
- Agrega nuevos deportes (NBA, NFL, etc.)
- Agrega nuevos eventos (Black Friday, Rebajas, etc.)

---

## 🚀 Roadmap

### v1.1 (Q1 2025)

- [ ] Integración con OpenWeather API (real)
- [ ] Integración con TheSportsDB API (real)
- [ ] Detección de Black Friday, Rebajas
- [ ] Detección de eventos locales (ferias, congresos)

### v1.2 (Q2 2025)

- [ ] Detección de noticias relevantes (RSS)
- [ ] Detección de tendencias en LinkedIn
- [ ] Personalización por industria
- [ ] Machine Learning para predecir mejor momento de contacto

---

## 📞 Soporte

¿Preguntas? Contacta al equipo de Wallie:
- Email: support@wallie.app
- LinkedIn: @WAllieBot
- Docs: https://docs.wallie.app/humanizer-engine

---

**Última actualización:** 8 de Diciembre, 2024  
**Versión:** 1.0  
**Autor:** Wallie Team
