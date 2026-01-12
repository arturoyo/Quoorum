# 📞 Cold Calling System - Documentación Completa

## 🎯 Descripción

Sistema completo de llamadas frías con ICP (Ideal Customer Profile), auto-dialer, scripts dinámicos con Humanizer Engine, y secuencias de seguimiento.

---

## 🏗️ Arquitectura

### Componentes

1. **Base de Datos** (4 tablas)
   - `ideal_customer_profiles` - Perfiles de cliente ideal
   - `cold_call_campaigns` - Campañas de llamadas
   - `cold_call_prospects` - Prospectos a llamar
   - `cold_call_logs` - Logs de llamadas

2. **Backend Python** (`cold_calling_dialer.py`)
   - `ColdCallingDialer` - Auto-dialer con Telnyx
   - `ScriptGenerator` - Scripts dinámicos con Humanizer Engine
   - `VoiceGenerator` - TTS con ElevenLabs

3. **Router tRPC** (`cold-calling.ts`)
   - 9 endpoints para gestión completa

4. **UI Admin** (`/admin/cold-calling`)
   - Panel de control completo

---

## 📊 Base de Datos

### Tablas

#### 1. `ideal_customer_profiles`

Perfil del cliente ideal para targeting preciso.

```sql
CREATE TABLE ideal_customer_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  industry icp_industry,
  company_size icp_company_size,
  revenue TEXT,
  location TEXT,
  pain_points JSONB DEFAULT '[]',
  goals JSONB DEFAULT '[]',
  challenges JSONB DEFAULT '[]',
  decision_maker_role TEXT,
  decision_maker_seniority TEXT,
  value_proposition TEXT,
  key_benefits JSONB DEFAULT '[]',
  call_script TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Ejemplo:**
```json
{
  "name": "Director Comercial B2B SaaS",
  "industry": "technology",
  "company_size": "small",
  "pain_points": ["Prospección manual", "Bajo conversion rate"],
  "decision_maker_role": "Director Comercial",
  "value_proposition": "Automatiza prospección y aumenta conversión 3x"
}
```

#### 2. `cold_call_campaigns`

Campañas de llamadas frías con configuración y stats.

```sql
CREATE TABLE cold_call_campaigns (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  icp_id UUID REFERENCES ideal_customer_profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  status campaign_status DEFAULT 'draft',
  max_calls_per_day INTEGER DEFAULT 50,
  call_window_start INTEGER DEFAULT 9,
  call_window_end INTEGER DEFAULT 18,
  timezone TEXT DEFAULT 'Europe/Madrid',
  script_template TEXT,
  objection_handling JSONB DEFAULT '{}',
  follow_up_sequence JSONB DEFAULT '[]',
  total_calls INTEGER DEFAULT 0,
  calls_completed INTEGER DEFAULT 0,
  calls_answered INTEGER DEFAULT 0,
  calls_interested INTEGER DEFAULT 0,
  conversion_rate INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Estados:**
- `draft` - Borrador
- `active` - Activa (llamando)
- `paused` - Pausada
- `completed` - Completada
- `archived` - Archivada

#### 3. `cold_call_prospects`

Prospectos a llamar con estado y tracking.

```sql
CREATE TABLE cold_call_prospects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  campaign_id UUID REFERENCES cold_call_campaigns(id),
  client_id UUID REFERENCES clients(id),
  full_name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  phone_number TEXT NOT NULL,
  email TEXT,
  linkedin_url TEXT,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  status call_sequence_status DEFAULT 'pending',
  current_step INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  last_call_outcome call_outcome,
  last_call_at TIMESTAMPTZ,
  next_call_at TIMESTAMPTZ,
  is_qualified BOOLEAN DEFAULT false,
  is_converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Outcomes:**
- `answered` - Respondió
- `no_answer` - No respondió
- `voicemail` - Buzón de voz
- `busy` - Ocupado
- `failed` - Fallo técnico
- `interested` - Interesado
- `not_interested` - No interesado
- `callback` - Pedir callback
- `wrong_number` - Número equivocado

#### 4. `cold_call_logs`

Logs detallados de cada llamada.

```sql
CREATE TABLE cold_call_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  campaign_id UUID REFERENCES cold_call_campaigns(id),
  prospect_id UUID REFERENCES cold_call_prospects(id),
  call_sid TEXT,
  from_number TEXT,
  to_number TEXT,
  duration INTEGER,
  outcome call_outcome,
  transcription TEXT,
  recording_url TEXT,
  sentiment TEXT,
  notes TEXT,
  next_steps TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🐍 Backend Python

### 1. Auto-Dialer (`ColdCallingDialer`)

```python
from cold_calling_dialer import ColdCallingDialer

dialer = ColdCallingDialer()

# Iniciar llamada
result = dialer.initiate_call(
    to_number="+34612345678",
    from_number="+34900000000",
    script="Hola, soy Juan de Wallie..."
)
```

### 2. Script Generator con Humanizer Engine

```python
from cold_calling_dialer import ScriptGenerator

script = ScriptGenerator.generate_script(
    icp={
        "pain_points": ["Prospección manual"],
        "value_proposition": "Automatiza prospección"
    },
    prospect={
        "full_name": "María López",
        "company": "TechCorp",
        "role": "Directora Comercial"
    },
    campaign={
        "script_template": "Hola {{first_name}}, soy Juan de Wallie. Vi que en {{company}} {{pain_point}}..."
    },
    inject_reality=True  # 🔥 HUMANIZER ENGINE
)

print(script)
# Output (si es semana de IVA):
# "Sé que esta semana es complicada con el tema de impuestos. Seré breve. 
#  Hola María, soy Juan de Wallie. Vi que en TechCorp tienen prospección manual..."
```

### 3. Voice Generator (ElevenLabs)

```python
from cold_calling_dialer import VoiceGenerator

voice_gen = VoiceGenerator()

audio_bytes = voice_gen.generate_voice(
    text="Hola, soy Juan de Wallie...",
    voice_type="male_professional",  # o female_professional, male_friendly, female_friendly
    stability=0.5,
    similarity_boost=0.75
)

# Guardar audio
with open("call_script.mp3", "wb") as f:
    f.write(audio_bytes)
```

---

## 🔌 API tRPC

### Endpoints

#### 1. ICP Management

```typescript
// Listar ICPs
const icps = await api.coldCalling.listICPs.useQuery()

// Crear ICP
const icp = await api.coldCalling.createICP.mutate({
  name: "Director Comercial B2B SaaS",
  industry: "technology",
  companySize: "small",
  painPoints: ["Prospección manual", "Bajo conversion rate"],
  decisionMakerRole: "Director Comercial",
  valueProposition: "Automatiza prospección y aumenta conversión 3x"
})
```

#### 2. Campaign Management

```typescript
// Listar campañas
const campaigns = await api.coldCalling.listCampaigns.useQuery()

// Crear campaña
const campaign = await api.coldCalling.createCampaign.mutate({
  name: "Q1 2025 Outbound",
  icpId: "uuid-del-icp",
  maxCallsPerDay: 50,
  scriptTemplate: "Hola {{first_name}}, soy Juan de Wallie..."
})

// Actualizar estado
await api.coldCalling.updateCampaignStatus.mutate({
  campaignId: "uuid",
  status: "active"  // draft, active, paused, completed, archived
})
```

#### 3. Prospect Management

```typescript
// Listar prospectos
const prospects = await api.coldCalling.listProspects.useQuery({
  campaignId: "uuid"
})

// Agregar prospecto
const prospect = await api.coldCalling.addProspect.mutate({
  campaignId: "uuid",
  fullName: "María López",
  company: "TechCorp",
  role: "Directora Comercial",
  phoneNumber: "+34612345678",
  email: "maria@techcorp.com",
  linkedinUrl: "https://linkedin.com/in/marialopez"
})
```

#### 4. Call Logs & Stats

```typescript
// Listar logs
const logs = await api.coldCalling.listCallLogs.useQuery({
  prospectId: "uuid"
})

// Stats de campaña
const stats = await api.coldCalling.getCampaignStats.useQuery({
  campaignId: "uuid"
})
// Output: { totalCalls: 100, callsAnswered: 45, conversionRate: 12 }
```

---

## 🎨 UI Admin

### Acceso

```
/admin/cold-calling
```

### Features

1. **Dashboard**
   - 4 stats cards (Campañas, ICPs, Llamadas, Conversión)
   - Vista rápida del estado

2. **Tab: Campañas**
   - Lista de campañas
   - Play/Pause buttons
   - Estados visuales

3. **Tab: ICPs**
   - Lista de ICPs definidos
   - Tags de industria y tamaño

4. **Tab: Prospectos**
   - Lista de prospectos por campaña
   - Estado de cada prospecto

---

## 🔥 Humanizer Engine Integration

El Humanizer Engine adapta automáticamente los scripts según el contexto del mundo real:

### Contextos Detectados

1. **Fiscal** (IVA, IRPF)
   ```
   "Sé que esta semana es complicada con el tema de impuestos. Seré breve..."
   ```

2. **Vacaciones** (Agosto, Navidad)
   ```
   "Sé que estamos en Agosto, pero quería comentarte brevemente..."
   ```

3. **Día de la semana**
   - Lunes: "Buen inicio de semana..."
   - Viernes: "Feliz viernes. ¿Tienes 2 minutos?"

### Configuración

```python
# Activar/desactivar Humanizer Engine
script = ScriptGenerator.generate_script(
    icp=icp,
    prospect=prospect,
    campaign=campaign,
    inject_reality=True  # True por defecto
)
```

---

## 🚀 Deployment

### 1. Migración de BD

```bash
cd packages/db
pnpm drizzle-kit push:pg --migration=0010_cold_calling_system.sql
```

### 2. Variables de Entorno

```env
# Telnyx (para llamadas)
TELNYX_API_KEY=your_telnyx_key

# ElevenLabs (para TTS)
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### 3. Deploy Growth Worker

```bash
cd packages/growth-worker
railway up
```

### 4. Verificar

1. Acceder a `/admin/cold-calling`
2. Crear un ICP
3. Crear una campaña
4. Agregar prospectos
5. Activar campaña

---

## 📈 Métricas

### KPIs a Medir

1. **Tasa de respuesta**: % de llamadas respondidas
2. **Tasa de interés**: % de prospectos interesados
3. **Tasa de conversión**: % de prospectos convertidos
4. **Duración promedio**: Tiempo promedio de llamada
5. **Mejor hora**: Hora con mayor tasa de respuesta

### Queries SQL Útiles

```sql
-- Tasa de respuesta por campaña
SELECT 
  c.name,
  c.calls_completed,
  c.calls_answered,
  ROUND((c.calls_answered::float / NULLIF(c.calls_completed, 0)) * 100, 2) as answer_rate
FROM cold_call_campaigns c
WHERE c.status = 'active';

-- Top prospectos interesados
SELECT 
  p.full_name,
  p.company,
  p.total_attempts,
  p.last_call_outcome
FROM cold_call_prospects p
WHERE p.last_call_outcome = 'interested'
ORDER BY p.last_call_at DESC
LIMIT 10;

-- Mejor hora para llamar
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as total_calls,
  SUM(CASE WHEN outcome = 'answered' THEN 1 ELSE 0 END) as answered,
  ROUND((SUM(CASE WHEN outcome = 'answered' THEN 1 ELSE 0 END)::float / COUNT(*)) * 100, 2) as answer_rate
FROM cold_call_logs
GROUP BY hour
ORDER BY answer_rate DESC;
```

---

## 🎯 Best Practices

### 1. Definir ICPs Precisos

- Ser específico con industria, tamaño, pain points
- Actualizar según resultados

### 2. Scripts Concisos

- Máximo 30 segundos de intro
- Ir al grano rápido
- Terminar con CTA claro

### 3. Timing

- Llamar entre 9-11am y 4-6pm
- Evitar lunes temprano y viernes tarde
- Respetar zonas horarias

### 4. Seguimiento

- Máximo 3 intentos por prospecto
- Espaciar intentos (día 1, día 3, día 7)
- Combinar con email/LinkedIn

### 5. Humanizer Engine

- Dejar activado por defecto
- Especialmente útil en B2B
- Aumenta empatía y tasa de respuesta

---

## 🐛 Troubleshooting

### Error: "TELNYX_API_KEY not found"

```bash
export TELNYX_API_KEY=your_key
```

### Error: "ElevenLabs API rate limit"

- Reducir `max_calls_per_day`
- Usar cache de audios generados

### Llamadas no se inician

1. Verificar número de teléfono (formato E.164)
2. Verificar créditos en Telnyx
3. Verificar horario de llamadas

---

## 📚 Referencias

- [Telnyx API Docs](https://developers.telnyx.com/)
- [ElevenLabs API Docs](https://docs.elevenlabs.io/)
- [Humanizer Engine Docs](./HUMANIZER_ENGINE.md)

---

## ⚡ Realtime Voice Agent (Latencia <500ms)

### Arquitectura de Baja Latencia

Sistema de voz en tiempo real con **latencia percibida <500ms**:

#### 1. Streaming Completo

```python
from realtime_voice_agent import RealtimeVoiceAgent

agent = RealtimeVoiceAgent(
    voice_type="male_professional",
    use_fillers=True  # Activar fillers humanos
)

# Manejar conversación en tiempo real
await agent.handle_conversation(
    audio_stream=audio_stream,
    context={"pain_point": "prospección manual", "company": "TechCorp"},
    on_audio_chunk=play_audio
)
```

#### 2. Filler Sounds Humanos

**Tipos de fillers:**
- **Thinking**: "Ehhh", "Mmm", "Pues", "A ver", "Déjame ver"
- **Agreeing**: "Ajá", "Claro", "Entiendo", "Sí, sí", "Ya veo"
- **Transitioning**: "Vale", "Perfecto", "Bien", "Genial", "De acuerdo"
- **Breathing**: Respiraciones naturales cada 15-20s
- **Micro-pauses**: Silencios de 200-500ms

**Lógica inteligente:**
```python
from realtime_voice_agent import HumanFillerEngine

filler_engine = HumanFillerEngine()

# Selecciona filler según contexto
filler = filler_engine.select_filler(
    context="default",
    user_speech="¿Cuánto cuesta?",  # Pregunta
    sentiment="neutral"
)
# Output: "fillers/ehhh.mp3" (thinking sound)
```

#### 3. Pre-generación de Respuestas Comunes

**6 respuestas pregeneradas** (latencia 0ms):
- `dime_mas` - "Claro, con gusto. Wallie es..."
- `no_gracias` - "Entiendo, sin problema..."
- `cuando` - "Podemos hablar cuando te venga bien..."
- `cuanto_cuesta` - "Tenemos planes desde 149€..."
- `no_entiendo` - "Perdona, déjame explicarlo mejor..."
- `adios` - "Perfecto, un placer hablar contigo..."

**Clasificación de intent:**
```python
intent = agent._classify_intent("Cuánto cuesta Wallie?")
# Output: "cuanto_cuesta"

if intent in agent.pregenerated:
    play_audio(agent.pregenerated[intent])  # 0ms latency
```

#### 4. Hot Transfer a Humano

```python
from realtime_voice_agent import HotTransferManager

transfer_manager = HotTransferManager(telnyx_api_key=TELNYX_API_KEY)

# Transferir si el prospecto está interesado
if outcome == "interested":
    transfer_manager.transfer_call(
        call_control_id="call_abc123",
        to_number="+34900000000",  # Número del vendedor
        reason="interested"
    )
```

### Timing de Latencia

| Componente | Latencia Real | Latencia Percibida |
|------------|---------------|--------------------|
| Whisper Transcription | 300-500ms | 0ms (oculta con filler) |
| GPT Generation (streaming) | 100-200ms | 0ms (streaming) |
| ElevenLabs TTS (streaming) | 200-300ms | 0ms (streaming) |
| Filler Sound | 0ms | 300-500ms (humano pensando) |
| **TOTAL** | **600ms-1s** | **<500ms percibida** |

### Flujo de Conversación

```
Usuario: "¿Cuánto cuesta?"
  ↓ (100ms - detección de fin de frase)
Bot: "Ehhh..." (500ms de filler)
  ↓ (mientras GPT genera - 1.5s)
Bot: "Ajá" (300ms de transición)
  ↓
Bot: "Pues mira, tenemos planes desde..." (respuesta real)

LATENCIA PERCIBIDA: 0ms (parece humano pensando)
LATENCIA REAL: 2.4s (oculta con fillers)
```

### Generación de Fillers

```bash
# Generar todos los fillers y respuestas pregeneradas
cd packages/growth-worker
python generate_fillers.py

# Output:
# ✅ Generated: fillers/ehhh.mp3
# ✅ Generated: fillers/ajam.mp3
# ✅ Generated: pregenerated/cuanto_cuesta.mp3
# ...
```

### Extras Humanos

**1. Respiraciones naturales:**
```python
if time_since_last_breath > 15:
    play_audio("fillers/breath_in.mp3")
```

**2. Micro-pausas entre frases:**
```python
play_audio(response_part_1)
play_audio("fillers/silence_300ms.mp3")  # Pausa natural
play_audio(response_part_2)
```

**3. "Errores" humanos ocasionales (5%):**
```python
if filler_engine.should_add_error():
    play_audio("fillers/ehh_correction.mp3")  # "Perdón, quería decir..."
```

---

**Sistema completo y listo para deployment.** 🚀
