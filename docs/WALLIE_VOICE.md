# 🎙️ Wallie Voice - Sistema de Voz

Sistema completo de transcripción y generación de voz para WhatsApp.

---

## 🎯 Objetivo

Permitir que Wallie interactúe por WhatsApp usando notas de voz naturales:

1. **Input**: Si el cliente manda audio → Wallie lo transcribe (Whisper API)
2. **Output**: Wallie puede responder con nota de voz que suena como el usuario (ElevenLabs TTS)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     Cliente WhatsApp                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Mensaje de Audio                          │
│                  (OGG/MP3, 1-5 minutos)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Worker: audio-received.ts                       │
│  1. Descarga archivo de WhatsApp                            │
│  2. Valida límites (tamaño, duración)                       │
│  3. Transcribe con Whisper API                              │
│  4. Guarda transcripción en DB                              │
│  5. Dispara flujo de respuesta                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Router: ai.generateResponse                 │
│  - Input: responseFormat: 'text' | 'audio'                  │
│  - Si audio: genera texto + convierte a voz                 │
│  - Devuelve audio en base64                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Servicio: voice.ts                              │
│  - transcribeAudio(): Whisper API                           │
│  - generateSpeech(): ElevenLabs API                         │
│  - cloneVoice(): Clonación de voz                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes

### 1. **Servicio de Voz** (`packages/api/src/lib/voice.ts`)

Funciones principales:

#### `transcribeAudio(audioBuffer, filename, metadata?)`

Transcribe audio usando OpenAI Whisper API.

**Parámetros**:
- `audioBuffer`: Buffer del archivo de audio
- `filename`: Nombre con extensión (.mp3, .ogg, .wav)
- `metadata`: Metadatos opcionales (formato, duración, tamaño)

**Retorna**:
```typescript
{
  text: string
  language?: string
  duration?: number
}
```

**Ejemplo**:
```typescript
const result = await transcribeAudio(
  audioBuffer,
  'audio.mp3',
  { format: 'audio/mpeg', size: 1024000 }
)
console.log(result.text) // "Hola, ¿qué tal?"
```

#### `generateSpeech(text, options)`

Genera audio a partir de texto usando ElevenLabs API.

**Parámetros**:
- `text`: Texto a convertir en voz (máximo 5000 caracteres)
- `options`: Configuración de voz
  - `voiceId`: ID de la voz clonada (requerido)
  - `modelId`: Modelo de TTS (default: `eleven_multilingual_v2`)
  - `stability`: Estabilidad de la voz (0-1, default: 0.5)
  - `similarityBoost`: Similitud con la voz original (0-1, default: 0.75)

**Retorna**: `Buffer` del audio generado (MP3)

**Ejemplo**:
```typescript
const audioBuffer = await generateSpeech(
  'Hola Juan, el plan Pro son 79 euros. ¿Te lo activo?',
  {
    voiceId: 'abc123...',
    stability: 0.5,
    similarityBoost: 0.75,
  }
)
```

#### `cloneVoice(name, audioSamples, description?)`

Clona una voz a partir de muestras de audio.

**Parámetros**:
- `name`: Nombre de la voz clonada
- `audioSamples`: Array de buffers de audio (mínimo 1, recomendado 3-5)
- `description`: Descripción opcional

**Retorna**: `string` (Voice ID de la voz clonada)

**Ejemplo**:
```typescript
const voiceId = await cloneVoice(
  'Juan Pérez',
  [sample1Buffer, sample2Buffer, sample3Buffer],
  'Voz del usuario Juan para respuestas automáticas'
)
```

---

### 2. **Router de IA** (`packages/api/src/routers/ai.ts`)

#### Mutación `generateResponse`

**Input**:
```typescript
{
  contextId: string // conversationId
  channel: 'whatsapp' | 'email'
  message: string
  clientId?: string
  responseFormat: 'text' | 'audio' // NUEVO
  voiceId?: string // Requerido si responseFormat es 'audio'
}
```

**Output (si responseFormat es 'audio')**:
```typescript
{
  response: string // Texto de la respuesta
  suggestedActions: string[]
  intent: string
  confidence: number
  audio: {
    data: string // Base64 del audio
    mimeType: 'audio/mpeg'
    size: number // Tamaño en bytes
  }
}
```

**Ejemplo de uso**:
```typescript
const result = await trpc.ai.generateResponse.mutate({
  contextId: 'conv-123',
  channel: 'whatsapp',
  message: '¿Cuánto cuesta el plan Pro?',
  responseFormat: 'audio',
  voiceId: 'abc123...',
})

// Convertir base64 a buffer
const audioBuffer = Buffer.from(result.audio.data, 'base64')

// Enviar audio por WhatsApp
await sendWhatsAppAudio(clientPhone, audioBuffer)
```

---

### 3. **Worker de Audio** (`packages/workers/src/functions/audio-received.ts`)

#### Evento: `whatsapp/audio.received`

**Payload**:
```typescript
{
  messageId: string
  conversationId: string
  clientId: string
  mediaUrl: string // URL del archivo en WhatsApp
  mimeType: string // audio/ogg, audio/mpeg
  fileSize: number // Tamaño en bytes
}
```

**Flujo**:
1. Valida límites de audio (tamaño < 25 MB, duración < 5 minutos)
2. Descarga archivo desde `mediaUrl`
3. Transcribe con Whisper API
4. Guarda transcripción en tabla `messages` con flag `isTranscription: true`
5. Dispara evento `whatsapp/message.received` para flujo normal

**Ejemplo de trigger manual**:
```typescript
import { triggerAudioReceived } from '@wallie/workers'

await triggerAudioReceived({
  messageId: 'msg-123',
  conversationId: 'conv-456',
  clientId: 'client-789',
  mediaUrl: 'https://whatsapp.com/media/abc123.ogg',
  mimeType: 'audio/ogg',
  fileSize: 1024000,
})
```

---

## 🔒 Límites de Seguridad

### Validaciones Implementadas

1. **Tamaño máximo**: 25 MB (límite de Whisper API)
2. **Duración máxima**: 5 minutos (300 segundos)
3. **Texto máximo para TTS**: 5000 caracteres
4. **Formatos soportados**: MP3, OGG, WAV, M4A, WebM

### Estimación de Duración

Si no se conoce la duración exacta, se estima basándose en el tamaño:

```
1 MB ≈ 60 segundos (MP3 a 128kbps)
```

---

## 💰 Costos

### OpenAI Whisper API

- **Precio**: $0.006 por minuto de audio
- **Ejemplo**: 100 audios/día × 30s × $0.006/60s × 30 días = **$9/mes**

### ElevenLabs API

- **Precio**: ~$0.30 por 1000 caracteres (plan Creator)
- **Ejemplo**: 100 respuestas/día × 100 chars × $0.30/1000 × 30 días = **$9/mes**

### Total Estimado

**~$18/mes** para 100 interacciones de voz por día.

---

## 🚀 Setup

### 1. Instalar Dependencias

Ya están instaladas en el proyecto:
- `openai` (Whisper API)
- `elevenlabs-node` o `fetch` directo (ElevenLabs API)

### 2. Configurar Variables de Entorno

Copia `.env.voice.example` a `.env` y rellena:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# ElevenLabs
ELEVENLABS_API_KEY=...
ELEVENLABS_DEFAULT_VOICE_ID=... # Opcional
```

### 3. Clonar Tu Voz (Primera Vez)

```typescript
import { cloneVoice } from '@wallie/api/lib/voice'

// Grabar 3-5 muestras de audio (30-60s cada una)
// Hablar con naturalidad, sin ruido de fondo

const voiceId = await cloneVoice(
  'Mi Voz',
  [sample1, sample2, sample3],
  'Voz para respuestas automáticas de Wallie'
)

console.log('Voice ID:', voiceId)
// Guardar este ID en .env o en la DB del usuario
```

### 4. Probar Transcripción

```typescript
import { transcribeAudio } from '@wallie/api/lib/voice'
import fs from 'fs'

const audioBuffer = fs.readFileSync('./test-audio.mp3')

const result = await transcribeAudio(audioBuffer, 'test-audio.mp3')

console.log('Transcripción:', result.text)
console.log('Idioma:', result.language)
console.log('Duración:', result.duration, 'segundos')
```

### 5. Probar Generación de Voz

```typescript
import { generateSpeech } from '@wallie/api/lib/voice'
import fs from 'fs'

const audioBuffer = await generateSpeech(
  'Hola, soy Wallie. ¿En qué puedo ayudarte hoy?',
  {
    voiceId: process.env.ELEVENLABS_DEFAULT_VOICE_ID!,
  }
)

fs.writeFileSync('./output.mp3', audioBuffer)
console.log('Audio generado: output.mp3')
```

---

## 🎬 Demo Completa

### Flujo de Interacción

**Cliente** (vía WhatsApp):
```
🎙️ [Audio 15s]: "Oye, ¿qué precio tenía el plan Pro?"
```

**Wallie** (backend):
1. Worker `audio-received` descarga y transcribe
2. Transcripción: "Oye, ¿qué precio tenía el plan Pro?"
3. Router `ai.generateResponse` genera respuesta
4. Respuesta: "El plan Pro son 79 euros, Juan. ¿Te lo activo?"
5. Convierte texto a audio con voz clonada
6. Envía audio por WhatsApp

**Cliente** (vía WhatsApp):
```
🎙️ [Audio 8s]: "El plan Pro son 79 euros, Juan. ¿Te lo activo?"
```

---

## 🔧 Troubleshooting

### Error: "Audio demasiado grande"

**Causa**: El archivo excede 25 MB.

**Solución**: Pedir al cliente que envíe audios más cortos o comprimir el audio antes de enviarlo.

### Error: "ELEVENLABS_API_KEY no configurada"

**Causa**: Falta la API key de ElevenLabs.

**Solución**: Añadir `ELEVENLABS_API_KEY` a `.env`.

### Error: "voiceId es requerido para respuestas en audio"

**Causa**: Se solicitó `responseFormat: 'audio'` pero no se proporcionó `voiceId`.

**Solución**: Clonar una voz primero con `cloneVoice()` y pasar el ID.

### Audio suena robótico o poco natural

**Causa**: Configuración de `stability` y `similarityBoost` no óptima.

**Solución**: Ajustar valores:
- `stability: 0.3-0.7` (más bajo = más expresivo, más alto = más estable)
- `similarityBoost: 0.5-0.9` (más alto = más parecido a la voz original)

---

## 📊 Métricas Recomendadas

### Trackear en Analytics

1. **Audios recibidos/día**
2. **Audios transcritos exitosamente**
3. **Errores de transcripción** (audio muy largo, formato inválido)
4. **Respuestas generadas en audio**
5. **Duración promedio de audios**
6. **Costo mensual de Whisper + ElevenLabs**

### Alertas

- ⚠️ Si tasa de error de transcripción > 10%
- ⚠️ Si costo mensual > presupuesto
- ⚠️ Si duración promedio de audios > 2 minutos (usuarios enviando audios muy largos)

---

## 🎯 Próximos Pasos

1. **Integrar con WhatsApp Business API** para enviar audios
2. **Añadir soporte para múltiples idiomas** (detectar idioma automáticamente)
3. **Implementar caché de respuestas de audio** (si la misma respuesta se genera varias veces)
4. **Añadir análisis de sentimiento en audio** (detectar tono emocional)
5. **Implementar streaming de audio** (para respuestas muy largas)

---

## 🏆 Conclusión

**Wallie Voice rompe la barrera de la frialdad** en la comunicación automatizada.

En lugar de recibir un texto genérico, el cliente recibe un audio con **tu propia voz**, lo que hace que la interacción sea mucho más personal y humana.

**Esto es un diferenciador único** que ningún otro CRM tiene.

---

## 📚 Referencias

- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [ElevenLabs API](https://elevenlabs.io/docs/api-reference)
- [WhatsApp Business API - Media](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media)
