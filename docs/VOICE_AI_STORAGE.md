# Voice AI Storage - Documentación Completa

## 📋 Resumen

Sistema completo de almacenamiento para Voice AI en Wallie, que permite guardar, consultar y analizar todas las llamadas de voz, transcripciones, comandos ejecutados y grabaciones de forma persistente y estructurada.

---

## 🗄️ Estructura de Base de Datos

### Tablas Creadas

#### 1. `voice_calls`
Tabla principal que almacena todas las llamadas de voz.

**Campos principales:**
- `id` (UUID): Identificador único
- `user_id` (UUID): Usuario propietario
- `client_id` (UUID, opcional): Cliente asociado
- `conversation_id` (UUID, opcional): Conversación asociada
- `direction` (enum): `inbound` | `outbound`
- `status` (enum): `initiated` | `ringing` | `in_progress` | `completed` | `failed` | `no_answer` | `busy` | `cancelled`
- `purpose` (enum): `support` | `sales` | `follow_up` | `reminder` | `information` | `complaint` | `other`
- `from_number` (text): Número origen
- `to_number` (text): Número destino
- `external_call_id` (text): ID externo (Telnyx/Twilio)
- `duration` (integer): Duración en segundos
- `transcription` (text): Transcripción completa
- `recording_url` (text): URL de la grabación
- `voice_id` (text): ID de voz ElevenLabs
- `sentiment` (text): Sentimiento detectado
- `sentiment_score` (integer): Score -100 a 100
- `metadata` (jsonb): Metadata flexible

**Índices:**
- `voice_calls_user_idx`: Por usuario + fecha
- `voice_calls_client_idx`: Por cliente
- `voice_calls_status_idx`: Por estado
- `voice_calls_direction_idx`: Por dirección
- `voice_calls_external_call_idx`: Por ID externo

#### 2. `voice_commands`
Comandos ejecutados durante las llamadas.

**Campos principales:**
- `id` (UUID): Identificador único
- `call_id` (UUID): Llamada asociada
- `user_id` (UUID): Usuario propietario
- `type` (enum): Tipo de comando
  - `send_email`
  - `create_task`
  - `schedule_call`
  - `get_summary`
  - `get_leads`
  - `update_client`
  - `create_reminder`
  - `get_analytics`
  - `send_whatsapp`
  - `create_invoice`
  - `other`
- `status` (enum): `detected` | `executing` | `completed` | `failed` | `cancelled`
- `original_text` (text): Texto original del usuario
- `normalized_text` (text): Texto normalizado
- `parameters` (jsonb): Parámetros extraídos
- `result` (jsonb): Resultado de la ejecución
- `confidence` (integer): Confianza 0-100

**Índices:**
- `voice_commands_call_idx`: Por llamada
- `voice_commands_user_idx`: Por usuario
- `voice_commands_type_idx`: Por tipo
- `voice_commands_status_idx`: Por estado

#### 3. `voice_transcription_segments`
Segmentos detallados de transcripción con timestamps.

**Campos principales:**
- `id` (UUID): Identificador único
- `call_id` (UUID): Llamada asociada
- `sequence_number` (integer): Orden del segmento
- `speaker` (text): `user` | `assistant` | `system`
- `text` (text): Texto del segmento
- `start_time` (integer): Inicio en milisegundos
- `end_time` (integer): Fin en milisegundos
- `duration` (integer): Duración en milisegundos
- `confidence` (integer): Confianza 0-100
- `language` (text): Idioma detectado

**Índices:**
- `voice_transcription_segments_call_idx`: Por llamada + secuencia
- `voice_transcription_segments_speaker_idx`: Por speaker

---

## 🔌 API tRPC

### Endpoints Disponibles

#### Gestión de Llamadas

##### `voice.listCalls`
Lista llamadas con filtros.

**Input:**
```typescript
{
  clientId?: string          // Filtrar por cliente
  direction?: 'inbound' | 'outbound'
  status?: VoiceCallStatus
  purpose?: VoiceCallPurpose
  startDate?: Date          // Fecha inicio
  endDate?: Date            // Fecha fin
  limit?: number            // Default: 20, Max: 100
  offset?: number           // Default: 0
}
```

**Output:**
```typescript
Array<{
  id: string
  direction: string
  status: string
  purpose: string
  fromNumber: string
  toNumber: string
  duration: number | null
  startedAt: Date | null
  endedAt: Date | null
  transcription: string | null
  hasRecording: boolean
  isImportant: boolean
  sentiment: string | null
  createdAt: Date
  client: {
    id: string
    name: string
    phone: string
  } | null
}>
```

##### `voice.getCall`
Obtiene detalles completos de una llamada.

**Input:**
```typescript
{
  callId: string
}
```

**Output:**
```typescript
{
  // Todos los campos de voice_calls
  commands: VoiceCommand[]
  transcriptionSegments: VoiceTranscriptionSegment[]
}
```

##### `voice.createCall`
Crea una nueva llamada.

**Input:**
```typescript
{
  clientId?: string
  conversationId?: string
  direction: 'inbound' | 'outbound'
  purpose: VoiceCallPurpose
  fromNumber: string
  toNumber: string
  externalCallId?: string
  externalSessionId?: string
  voiceId?: string
  voiceName?: string
  metadata?: Record<string, unknown>
}
```

**Output:**
```typescript
VoiceCall
```

##### `voice.updateCall`
Actualiza una llamada existente.

**Input:**
```typescript
{
  callId: string
  status?: VoiceCallStatus
  duration?: number
  ringDuration?: number
  answeredAt?: Date
  endedAt?: Date
  transcription?: string
  transcriptionLanguage?: string
  transcriptionConfidence?: number  // 0-100
  recordingUrl?: string
  recordingDuration?: number
  recordingSize?: number
  sentiment?: string
  sentimentScore?: number           // -100 a 100
  isImportant?: boolean
  metadata?: Record<string, unknown>
}
```

**Output:**
```typescript
VoiceCall
```

##### `voice.deleteCall`
Elimina una llamada (cascade elimina comandos y segmentos).

**Input:**
```typescript
{
  callId: string
}
```

**Output:**
```typescript
{
  success: boolean
}
```

#### Gestión de Comandos

##### `voice.logCommand`
Registra un comando ejecutado.

**Input:**
```typescript
{
  callId: string
  type: VoiceCommandType
  originalText: string
  normalizedText?: string
  parameters?: Record<string, unknown>
  confidence?: number  // 0-100
}
```

**Output:**
```typescript
VoiceCommand
```

##### `voice.updateCommand`
Actualiza el estado de un comando.

**Input:**
```typescript
{
  commandId: string
  status: 'detected' | 'executing' | 'completed' | 'failed' | 'cancelled'
  result?: {
    success: boolean
    message?: string
    data?: unknown
    errorCode?: string
    errorMessage?: string
  }
  executedAt?: Date
  completedAt?: Date
}
```

**Output:**
```typescript
VoiceCommand
```

#### Transcripciones

##### `voice.addTranscriptionSegments`
Agrega segmentos de transcripción.

**Input:**
```typescript
{
  callId: string
  segments: Array<{
    sequenceNumber: number
    speaker: 'user' | 'assistant' | 'system'
    text: string
    startTime: number      // Milisegundos
    endTime: number        // Milisegundos
    duration: number       // Milisegundos
    confidence?: number    // 0-100
    language?: string
  }>
}
```

**Output:**
```typescript
VoiceTranscriptionSegment[]
```

#### Estadísticas

##### `voice.getAssistantStats`
Obtiene estadísticas del asistente de voz.

**Input:** Ninguno

**Output:**
```typescript
{
  totalCalls: number
  totalCommands: number
  averageDuration: number        // Segundos
  successRate: number            // Porcentaje
  callsByPurpose: Array<{
    purpose: string
    count: number
  }>
  topCommands: Array<{
    type: string
    count: number
  }>
}
```

#### Grabaciones

##### `voice.getRecording`
Obtiene URL de grabación.

**Input:**
```typescript
{
  callId: string
}
```

**Output:**
```typescript
{
  url: string
  duration: number | null
  size: number | null
}
```

---

## 🔄 Migración de Base de Datos

### Archivo de Migración
`packages/db/drizzle/0008_voice_ai_tables.sql`

### Aplicar Migración

**Opción 1: Drizzle Kit (Recomendado)**
```bash
cd packages/db
pnpm drizzle-kit push:pg
```

**Opción 2: SQL Directo**
```bash
psql $DATABASE_URL < drizzle/0008_voice_ai_tables.sql
```

### Verificar Migración
```sql
-- Verificar tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'voice_%';

-- Verificar enums
SELECT typname 
FROM pg_type 
WHERE typname LIKE 'voice_%';
```

---

## 🧪 Tests

### Archivo de Tests
`packages/api/src/__tests__/voice-validation.test.ts`

### Ejecutar Tests
```bash
cd packages/api
pnpm test voice-validation
```

### Cobertura de Tests
- ✅ 41 tests totales
- ✅ Validación de schemas Zod
- ✅ Rangos de valores (confidence, sentiment)
- ✅ Enums y tipos
- ✅ UUIDs y campos requeridos

---

## 💻 Uso en Frontend

### Ejemplo: Listar Llamadas
```typescript
'use client'

import { api } from '@/lib/trpc'

export default function VoicePage() {
  const { data: calls, isLoading } = api.voice.listCalls.useQuery({
    limit: 20,
    status: 'completed',
  })

  if (isLoading) return <div>Cargando...</div>

  return (
    <div>
      {calls?.map((call) => (
        <div key={call.id}>
          <p>{call.toNumber}</p>
          <p>{call.duration}s</p>
          <p>{call.transcription}</p>
        </div>
      ))}
    </div>
  )
}
```

### Ejemplo: Crear Llamada
```typescript
const createCallMutation = api.voice.createCall.useMutation()

const handleCreateCall = async () => {
  const call = await createCallMutation.mutateAsync({
    direction: 'outbound',
    purpose: 'sales',
    fromNumber: '+34900000000',
    toNumber: '+34612345678',
    clientId: 'uuid-del-cliente',
  })
  
  console.log('Llamada creada:', call.id)
}
```

### Ejemplo: Registrar Comando
```typescript
const logCommandMutation = api.voice.logCommand.useMutation()

const handleLogCommand = async (callId: string) => {
  await logCommandMutation.mutateAsync({
    callId,
    type: 'send_email',
    originalText: 'Envía un email a Juan con el presupuesto',
    parameters: {
      recipient: 'juan@ejemplo.com',
      subject: 'Presupuesto',
    },
    confidence: 95,
  })
}
```

---

## 🐍 Integración con Worker de Python

### Ejemplo: Guardar Llamada desde Telnyx

```python
import requests
from datetime import datetime

# Webhook de Telnyx
@app.post("/webhooks/telnyx/call")
async def telnyx_call_webhook(payload: dict):
    event_type = payload.get("data", {}).get("event_type")
    call_data = payload.get("data", {}).get("payload")
    
    # Crear llamada en DB
    if event_type == "call.initiated":
        call = await create_voice_call(
            user_id=get_user_from_number(call_data["to"]),
            direction="inbound",
            purpose="support",
            from_number=call_data["from"],
            to_number=call_data["to"],
            external_call_id=call_data["call_control_id"],
            started_at=datetime.now()
        )
        
    # Actualizar cuando contesta
    elif event_type == "call.answered":
        await update_voice_call(
            call_id=get_call_by_external_id(call_data["call_control_id"]),
            status="in_progress",
            answered_at=datetime.now()
        )
        
    # Guardar transcripción
    elif event_type == "call.transcription":
        await update_voice_call(
            call_id=get_call_by_external_id(call_data["call_control_id"]),
            transcription=call_data["transcription_text"],
            transcription_confidence=call_data["confidence"]
        )
        
    # Finalizar llamada
    elif event_type == "call.hangup":
        await update_voice_call(
            call_id=get_call_by_external_id(call_data["call_control_id"]),
            status="completed",
            ended_at=datetime.now(),
            duration=call_data["duration_seconds"]
        )

async def create_voice_call(**kwargs):
    """Llamar al endpoint tRPC desde Python"""
    response = requests.post(
        f"{TRPC_URL}/voice.createCall",
        json=kwargs,
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    return response.json()
```

---

## 📊 Consultas SQL Útiles

### Llamadas por día
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_calls,
  AVG(duration) as avg_duration
FROM voice_calls
WHERE user_id = 'user-uuid'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Comandos más usados
```sql
SELECT 
  type,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence
FROM voice_commands
WHERE user_id = 'user-uuid'
GROUP BY type
ORDER BY count DESC
LIMIT 10;
```

### Tasa de éxito por propósito
```sql
SELECT 
  purpose,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM voice_calls
WHERE user_id = 'user-uuid'
GROUP BY purpose;
```

### Análisis de sentimiento
```sql
SELECT 
  sentiment,
  COUNT(*) as count,
  AVG(sentiment_score) as avg_score
FROM voice_calls
WHERE user_id = 'user-uuid'
  AND sentiment IS NOT NULL
GROUP BY sentiment;
```

---

## 🔐 Seguridad

### Protección de Datos
- ✅ Todas las queries filtran por `user_id` (ctx.userId)
- ✅ Foreign keys con `ON DELETE cascade` para integridad
- ✅ Validación Zod en todos los inputs
- ✅ TRPCError para manejo de errores

### Permisos
- Solo el usuario propietario puede ver/editar sus llamadas
- Las grabaciones deben usar URLs firmadas (S3)
- Los comandos solo se ejecutan con autorización del usuario

---

## 🚀 Próximos Pasos

### Funcionalidades Pendientes
1. **Almacenamiento de grabaciones en S3**
   - Subir audio a S3
   - Generar URLs firmadas
   - Política de retención

2. **Worker de Python completo**
   - Integración con Telnyx
   - Procesamiento de audio
   - Detección de comandos con NLP

3. **Análisis avanzado**
   - Detección de emociones
   - Análisis de palabras clave
   - Resúmenes automáticos

4. **Dashboard de analíticas**
   - Gráficos de uso
   - Tendencias temporales
   - Comparativas

---

## 📝 Changelog

### v1.0.0 (2024-12-08)
- ✅ Schema completo de base de datos (3 tablas, 5 enums)
- ✅ Router tRPC con 13 endpoints
- ✅ Migración SQL lista para aplicar
- ✅ 41 tests de validación
- ✅ Componente frontend con tabs funcionales
- ✅ Documentación completa

---

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Verificar logs de Sentry
3. Consultar tests para ejemplos de uso
4. Revisar schema de base de datos

---

## 📚 Referencias

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [tRPC Docs](https://trpc.io/)
- [Telnyx API](https://developers.telnyx.com/)
- [ElevenLabs API](https://docs.elevenlabs.io/)
- [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text)
