# LinkedIn Audio Messages - Documentación Completa

## 📋 Resumen

Sistema completo para enviar mensajes de voz personalizados por LinkedIn usando Text-to-Speech (ElevenLabs). Permite generar audios con voces naturales, enviar mensajes individuales y ejecutar campañas masivas de outreach con audio.

**Ventaja competitiva:** Los audios tienen **3-5x más engagement** que mensajes de texto en LinkedIn.

---

## 🎯 Características

### ✅ Generación de Audio
- Text-to-Speech con ElevenLabs
- 6 voces disponibles (3 masculinas + 3 femeninas)
- 3 personalidades: Profesional, Amigable, Energética
- Soporte multilingüe (español nativo)
- Calidad de audio profesional

### ✅ Envío de Mensajes
- Upload automático de audio a LinkedIn
- Opción de incluir texto junto al audio
- Tracking de envíos
- Manejo de errores y reintentos

### ✅ Campañas de Outreach
- Envío masivo a múltiples leads
- Templates personalizables con variables
- Rate limiting automático (30-300s entre mensajes)
- Progreso en tiempo real
- Reportes de éxito/fallo

---

## 🏗️ Arquitectura

```
┌─────────────────┐
│   Frontend UI   │ (Growth Ops Dashboard)
│   Next.js       │
└────────┬────────┘
         │ tRPC
         ▼
┌─────────────────┐
│  Backend API    │ (tRPC Router)
│  adminGrowth    │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│ Growth Worker   │ (FastAPI)
│  Python         │
└────────┬────────┘
         │
         ├──────────► ElevenLabs API (TTS)
         │
         └──────────► LinkedIn (Chrome Extension)
```

---

## 🔧 Componentes

### 1. Worker de Python (`linkedin_audio.py`)

#### Clases Principales

##### `VoiceProfile`
Gestiona las voces disponibles en ElevenLabs.

**Voces Masculinas:**
- `MALE_PROFESSIONAL` - Rachel (profesional)
- `MALE_FRIENDLY` - Adam (amigable)
- `MALE_ENERGETIC` - Sam (energético)

**Voces Femeninas:**
- `FEMALE_PROFESSIONAL` - Bella (profesional)
- `FEMALE_FRIENDLY` - Elli (amigable)
- `FEMALE_ENERGETIC` - Freya (energética)

**Método:**
```python
@staticmethod
def get_voice_for_personality(personality: str, gender: str = "male") -> str
```

##### `AudioMessageGenerator`
Genera y guarda audios.

**Métodos:**
- `generate_audio(text, voice_id, stability, similarity_boost)` → bytes
- `save_audio(audio_data, filename)` → str (filepath)
- `generate_pitch_audio(lead, pitch_text, personality, gender)` → str

##### `LinkedInAudioMessenger`
Envía mensajes con audio por LinkedIn.

**Métodos:**
- `send_audio_message(linkedin_url, audio_file, message_text)` → dict
- `send_pitch_with_audio(lead, pitch_text, personality, gender, include_text)` → dict

##### `AudioCampaignManager`
Gestiona campañas masivas.

**Métodos:**
- `run_audio_campaign(campaign_name, leads, pitch_template, personality, gender, include_text, delay_between_messages)` → dict

---

### 2. FastAPI Endpoints

#### `POST /audio/generate`
Genera un audio a partir de texto.

**Request:**
```json
{
  "text": "Hola, soy de Wallie...",
  "personality": "expert",
  "gender": "male"
}
```

**Response:**
```json
{
  "success": true,
  "audio_file": "/path/to/audio.mp3",
  "size_bytes": 45678,
  "duration_seconds": 12.5
}
```

#### `POST /audio/send-message`
Genera y envía un mensaje de audio por LinkedIn.

**Request:**
```json
{
  "linkedin_url": "https://linkedin.com/in/decision-maker",
  "pitch_text": "Hola, soy de Wallie...",
  "personality": "expert",
  "gender": "male",
  "include_text": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audio enviado correctamente",
  "audio_file": "/path/to/audio.mp3",
  "linkedin_url": "https://linkedin.com/in/decision-maker"
}
```

#### `POST /audio/campaign`
Ejecuta una campaña de outreach con audios.

**Request:**
```json
{
  "campaign_name": "SDR Outreach Q1 2024",
  "leads": [
    {
      "company": "TechCorp",
      "role": "SDR Outbound",
      "pain_point": "Necesitan llamadas en frío",
      "decision_maker_url": "https://linkedin.com/in/ceo"
    }
  ],
  "pitch_template": "Hola, soy de Wallie. Vi que {{company}} busca un {{role}}...",
  "personality": "expert",
  "gender": "male",
  "include_text": true,
  "delay_between_messages": 30
}
```

**Response:**
```json
{
  "success": true,
  "campaign_name": "SDR Outreach Q1 2024",
  "total_leads": 50,
  "successful": 48,
  "failed": 2,
  "duration_seconds": 1500
}
```

#### `GET /audio/voices`
Lista todas las voces disponibles.

**Response:**
```json
{
  "male": {
    "professional": "21m00Tcm4TlvDq8ikWAM",
    "friendly": "pNInz6obpgDQGcFmaJgB",
    "energetic": "yoZ06aMxZJJ28mfd3POQ"
  },
  "female": {
    "professional": "EXAVITQu4vr4xnSDxMaL",
    "friendly": "MF3mGyEYCl7XYWbV9V6O",
    "energetic": "jsCqWAovK2LkecY7zXl4"
  }
}
```

---

### 3. tRPC Router (`adminGrowth`)

#### `adminGrowth.generateAudio`
Genera audio desde el frontend.

**Input:**
```typescript
{
  text: string
  personality: 'premium' | 'expert' | 'closer'
  gender: 'male' | 'female'
}
```

**Output:**
```typescript
{
  success: boolean
  audio_file: string
  size_bytes: number
  duration_seconds: number
}
```

#### `adminGrowth.sendAudioMessage`
Envía mensaje con audio.

**Input:**
```typescript
{
  linkedinUrl: string
  pitchText: string
  personality: 'premium' | 'expert' | 'closer'
  gender: 'male' | 'female'
  includeText: boolean
}
```

**Output:**
```typescript
{
  success: boolean
  message: string
  audio_file: string
  linkedin_url: string
}
```

#### `adminGrowth.runAudioCampaign`
Ejecuta campaña masiva.

**Input:**
```typescript
{
  campaignName: string
  leads: Array<any>
  pitchTemplate: string
  personality: 'premium' | 'expert' | 'closer'
  gender: 'male' | 'female'
  includeText: boolean
  delayBetweenMessages: number  // 1-300 segundos
}
```

**Output:**
```typescript
{
  success: boolean
  campaign_name: string
  total_leads: number
  successful: number
  failed: number
  duration_seconds: number
}
```

#### `adminGrowth.listVoices`
Lista voces disponibles.

**Output:**
```typescript
{
  male: {
    professional: string
    friendly: string
    energetic: string
  }
  female: {
    professional: string
    friendly: string
    energetic: string
  }
}
```

---

### 4. Frontend UI

#### Ubicación
`/apps/web/src/app/admin/growth/page.tsx`

Tarjeta "Audio Messages 🎤" en Growth Ops Dashboard.

#### Componentes

**Inputs:**
- URL de LinkedIn (text input)
- Texto del Pitch (textarea, 4 filas)
- Voz (select: Masculina/Femenina)
- Tono (select: Profesional/Amigable/Energético)
- Incluir texto (checkbox)

**Botones:**
- "Preview Audio" - Genera audio sin enviar
- "Enviar Audio" - Genera y envía a LinkedIn

**Estados:**
- Loading states con spinner
- Validación de campos requeridos
- Toasts de éxito/error

#### Ejemplo de Uso

```typescript
'use client'

import { api } from '@/lib/trpc'
import { useState } from 'react'

export default function AudioMessagesDemo() {
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [pitchText, setPitchText] = useState('')
  
  const sendAudioMutation = api.adminGrowth.sendAudioMessage.useMutation({
    onSuccess: () => {
      alert('Audio enviado!')
    },
  })
  
  const handleSend = () => {
    sendAudioMutation.mutate({
      linkedinUrl,
      pitchText,
      personality: 'expert',
      gender: 'male',
      includeText: true,
    })
  }
  
  return (
    <div>
      <input
        value={linkedinUrl}
        onChange={(e) => setLinkedinUrl(e.target.value)}
        placeholder="https://linkedin.com/in/decision-maker"
      />
      <textarea
        value={pitchText}
        onChange={(e) => setPitchText(e.target.value)}
        placeholder="Hola, soy de Wallie..."
      />
      <button onClick={handleSend}>
        Enviar Audio
      </button>
    </div>
  )
}
```

---

## 🚀 Guía de Uso

### Caso 1: Enviar Audio Individual

**Paso 1:** Ir a Growth Ops Dashboard (`/admin/growth`)

**Paso 2:** Scroll hasta la tarjeta "Audio Messages 🎤"

**Paso 3:** Rellenar campos:
- URL: `https://linkedin.com/in/juan-garcia-ceo`
- Pitch: `Hola Juan, vi que TechCorp busca un SDR. Te propongo Wallie, un agente de IA que hace llamadas en frío por 149€/mes en lugar de contratar a alguien por 30k€/año.`
- Voz: Masculina
- Tono: Amigable
- ✅ Incluir texto

**Paso 4:** Click "Enviar Audio"

**Resultado:** Audio generado y enviado a Juan por LinkedIn.

---

### Caso 2: Campaña Masiva

**Paso 1:** Preparar lista de leads:

```json
[
  {
    "company": "TechCorp SL",
    "role": "SDR Outbound",
    "pain_point": "Necesitan llamadas en frío",
    "decision_maker_url": "https://linkedin.com/in/ceo-techcorp"
  },
  {
    "company": "StartupXYZ",
    "role": "BDR",
    "pain_point": "Quieren automatizar prospección",
    "decision_maker_url": "https://linkedin.com/in/founder-xyz"
  }
]
```

**Paso 2:** Crear template con variables:

```
Hola, soy de Wallie. Vi que {{company}} busca un {{role}}.

Te propongo algo mejor: en lugar de contratar a alguien por 30 mil euros al año,
prueba Wallie por 149 euros al mes.

Es un agente de IA que hace llamadas en frío, prospección y seguimiento automático.

Entiendo que {{pain_point}}, y Wallie puede resolverlo.

¿Te interesa una demo?
```

**Paso 3:** Ejecutar campaña via tRPC:

```typescript
const result = await api.adminGrowth.runAudioCampaign.mutate({
  campaignName: 'SDR Outreach Q1 2024',
  leads: leadsArray,
  pitchTemplate: template,
  personality: 'expert',
  gender: 'male',
  includeText: true,
  delayBetweenMessages: 45,  // 45 segundos entre mensajes
})

console.log(`Enviados: ${result.successful}/${result.total_leads}`)
```

**Resultado:** 
- 50 audios generados y enviados
- 45 segundos de delay entre cada uno
- Reporte final con éxitos/fallos

---

## 🔐 Configuración

### Variables de Entorno

**Backend (Growth Worker):**
```bash
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
```

**Obtener API Key:**
1. Ir a [ElevenLabs](https://elevenlabs.io/)
2. Crear cuenta
3. Dashboard → API Keys → Create New Key
4. Copiar y pegar en `.env`

---

## 📊 Mejores Prácticas

### 1. Personalización del Pitch

**❌ Malo:**
```
Hola, somos Wallie. Ofrecemos servicios de IA.
```

**✅ Bueno:**
```
Hola Juan, vi que TechCorp busca un SDR Outbound.

Te propongo Wallie: un agente de IA que hace llamadas en frío
por 149€/mes en lugar de contratar a alguien por 30k€/año.

¿Te interesa una demo?
```

### 2. Longitud del Audio

- **Óptimo:** 30-60 segundos (150-300 palabras)
- **Máximo:** 90 segundos (450 palabras)
- Mensajes más largos pierden atención

### 3. Tono de Voz

| Personalidad | Cuándo Usar | Ejemplo |
|--------------|-------------|---------|
| **Profesional** | CEOs, C-level, empresas grandes | Consultorías, banca, legal |
| **Amigable** | Managers, startups, tech | SaaS, marketing, ventas |
| **Energético** | Founders, sales, growth | Outbound agresivo, eventos |

### 4. Rate Limiting

**Recomendaciones:**
- **Conservador:** 60-120 segundos (30-60 mensajes/hora)
- **Normal:** 30-60 segundos (60-120 mensajes/hora)
- **Agresivo:** 15-30 segundos (120-240 mensajes/hora)

⚠️ **Cuidado:** LinkedIn puede limitar la cuenta si detecta spam.

### 5. Incluir Texto

**Con texto:** Mayor contexto, mejor para pitches largos
**Solo audio:** Más impacto, mejor para mensajes cortos

**Recomendación:** Siempre incluir texto con un CTA claro.

---

## 🧪 Tests

### Archivo de Tests
`packages/api/src/__tests__/linkedin-audio-validation.test.ts`

### Ejecutar Tests
```bash
cd packages/api
pnpm test linkedin-audio-validation
```

### Cobertura
- ✅ 35 tests totales
- ✅ Validación de schemas Zod
- ✅ Personalidades y géneros
- ✅ URLs de LinkedIn
- ✅ Rate limiting
- ✅ Defaults

---

## 🐛 Troubleshooting

### Error: "ELEVENLABS_API_KEY no configurado"

**Solución:**
```bash
export ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
```

### Error: "Error generando audio"

**Causas:**
1. API key inválida
2. Límite de caracteres excedido (5000)
3. Cuota de ElevenLabs agotada

**Solución:**
- Verificar API key
- Reducir longitud del texto
- Revisar límites en ElevenLabs dashboard

### Error: "Error enviando audio a LinkedIn"

**Causas:**
1. URL de LinkedIn inválida
2. Perfil privado
3. Chrome Extension no instalada

**Solución:**
- Verificar URL
- Asegurar que el perfil sea público
- Instalar Chrome Extension

### Audio no se reproduce

**Solución:**
- Verificar que el archivo .mp3 exista
- Comprobar permisos de lectura
- Revisar formato de audio (debe ser MP3)

---

## 📈 Métricas y Analíticas

### KPIs a Trackear

1. **Tasa de Respuesta**
   - Audio vs Texto
   - Por personalidad de voz
   - Por longitud de mensaje

2. **Engagement**
   - Reproducciones de audio
   - Respuestas recibidas
   - Conexiones aceptadas

3. **Conversión**
   - Demos agendadas
   - Deals cerrados
   - ROI por campaña

### Ejemplo de Reporte

```typescript
const campaignStats = {
  campaign_name: 'SDR Outreach Q1 2024',
  sent: 100,
  delivered: 98,
  played: 76,  // 77% play rate
  responses: 23,  // 23% response rate
  demos: 8,  // 8% conversion
  deals: 2,  // 2% close rate
}
```

---

## 🔮 Roadmap

### Próximas Funcionalidades

1. **Análisis de Sentimiento**
   - Detectar tono del audio generado
   - Ajustar automáticamente

2. **A/B Testing**
   - Probar diferentes voces
   - Optimizar mensajes

3. **Integración con CRM**
   - Auto-crear leads desde LinkedIn
   - Tracking de conversaciones

4. **Clonación de Voz**
   - Usar tu propia voz
   - Mantener consistencia de marca

5. **Respuestas Automáticas**
   - Detectar respuestas
   - Generar follow-ups automáticos

---

## 📚 Referencias

- [ElevenLabs API Docs](https://docs.elevenlabs.io/)
- [LinkedIn Messaging API](https://docs.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [tRPC Documentation](https://trpc.io/)

---

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Verificar logs del Growth Worker
3. Consultar tests para ejemplos de uso
4. Revisar código fuente en `linkedin_audio.py`

---

## 📝 Changelog

### v1.0.0 (2024-12-07)
- ✅ Generación de audio con ElevenLabs
- ✅ 6 voces (3M + 3F)
- ✅ 3 personalidades
- ✅ Envío individual de mensajes
- ✅ Campañas masivas
- ✅ Frontend UI completo
- ✅ 4 endpoints tRPC
- ✅ 4 endpoints FastAPI
- ✅ 35 tests de validación
- ✅ Documentación completa

---

**¡El sistema está listo para usar!** 🚀
