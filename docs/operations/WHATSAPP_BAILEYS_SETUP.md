# 🚀 Manual de Arranque: WhatsApp Baileys (QR Home Server)

> **Auditoría Técnica Completa** - Generada: 25 Dic 2025
> **Objetivo:** Conectar miniserver local con Supabase production DB

---

## 📋 Tabla de Contenidos

1. [Arquitectura del Sistema](#1-arquitectura-del-sistema)
2. [Flujo Completo de Conexión QR](#2-flujo-completo-de-conexión-qr)
3. [Persistencia de Sesión](#3-persistencia-de-sesión)
4. [Estado del Schema DB](#4-estado-del-schema-db)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Comandos de Arranque](#6-comandos-de-arranque)
7. [Verificación y Troubleshooting](#7-verificación-y-troubleshooting)

---

## 1. Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    WALLIE CORE (Next.js)                    │
│  apps/web/src/app/api/webhooks/baileys/route.ts            │
│  - Recibe webhooks del worker                               │
│  - Procesa mensajes con IA                                  │
│  - Gestiona estado de conexión                              │
└─────────────────┬────────────────────────────────┬──────────┘
                  │                                │
                  │ HTTP API                       │ tRPC
                  │                                │
         ┌────────▼────────┐              ┌────────▼────────┐
         │  BAILEYS WORKER │              │   API ROUTER    │
         │  (Fastify)      │              │ whatsapp-       │
         │  Port: 3001     │              │ connections.ts  │
         │                 │              └─────────────────┘
         │ - Session mgmt  │                     │
         │ - QR generation │                     │ SQL
         │ - Message recv  │                     │
         └────────┬────────┘              ┌──────▼──────────┐
                  │                       │   SUPABASE DB   │
                  │ WhatsApp Protocol     │                 │
         ┌────────▼────────┐              │ whatsapp_       │
         │   BAILEYS SDK   │              │ connections     │
         │  @whiskeysockets│              │ table (143)     │
         └────────┬────────┘              └─────────────────┘
                  │
         ┌────────▼────────┐
         │ WHATSAPP SERVER │
         │  (QR Scan)      │
         └─────────────────┘
```

---

## 2. Flujo Completo de Conexión QR

### 2.1 Inicio de Sesión (Frontend → API)

**Archivo:** `packages/api/src/routers/whatsapp-connections.ts`

```typescript
// PROCEDURE: startQrSession
// INPUT: ctx.userId (automático desde auth)
// OUTPUT: { sessionId, status, qr: "data:image/png;base64,..." }

1. Frontend llama: api.whatsappConnections.startQrSession.mutate()

2. Router verifica:
   - ¿Usuario ya tiene conexión activa? → Error
   - ¿Usuario ya tiene Cloud API? → Error

3. Router llama Baileys Worker:
   POST http://localhost:3001/session/start
   Headers: x-service-secret: [BAILEYS_SERVICE_SECRET]
   Body: { userId: "uuid-del-usuario" }

4. Worker responde:
   {
     success: true,
     sessionId: "user_uuid-del-usuario",
     status: "qr_pending",
     qr: "data:image/png;base64,iVBOR..."
   }

5. Router crea/actualiza registro en DB:
   INSERT INTO whatsapp_connections (
     user_id,
     baileys_session_id: "user_uuid",
     baileys_worker_url: "http://localhost:3001",
     status: "pending",
     connection_mode: "qr_baileys",
     monthly_conversations_limit: 450  -- Glass Ceiling
   )

6. Frontend recibe QR y lo muestra
```

### 2.2 Worker: Generación de QR

**Archivo:** `packages/baileys-worker/src/routes/session.ts`

```typescript
// POST /session/start
1. Extrae userId del body
2. Genera sessionId = "user_{userId}"

3. Verifica si sesión ya existe:
   - Si existe y está connected → Retorna QR actual
   - Si no existe → Crea nueva sesión

4. Llama session-manager.createSession():
   - Carga auth state desde ./sessions/user_{userId}/
   - Crea socket de Baileys con printQRInTerminal=false
   - Registra event listeners

5. Espera 2 segundos para QR generation

6. Convierte QR string a base64 image (QRCode.toDataURL)

7. Retorna QR al router
```

### 2.3 Worker: Event Listeners

**Archivo:** `packages/baileys-worker/src/services/session-manager.ts`

```typescript
// connection.update event handler

socket.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect, qr } = update

  // 1. QR GENERADO
  if (qr) {
    sessionState.status = 'qr_pending'
    sessionState.qrCode = qr
    emitEvent(sessionId, 'qr', { qr })
    // → Webhook sender enviará a Core
  }

  // 2. CONEXIÓN ABIERTA
  if (connection === 'open') {
    // ⚠️ VALIDACIÓN CRÍTICA: Solo WhatsApp Business
    const validation = await validateBusinessAccount(socket)

    if (!validation.isBusiness) {
      // RECHAZO: Cuenta personal detectada
      emitEvent(sessionId, 'connection_rejected', {
        reason: 'PERSONAL_ACCOUNT_DETECTED',
        message: 'Las políticas de Meta prohíben la automatización...',
      })

      await sleep(2000) // Espera webhook
      await socket.logout()
      await rm(sessionPath) // Borra sesión
      return
    }

    // ÉXITO: Cuenta business confirmada
    sessionState.status = 'connected'
    sessionState.connectedAt = new Date()
    emitEvent(sessionId, 'connection', {
      status: 'connected',
      isBusiness: true,
    })
  }

  // 3. CONEXIÓN CERRADA
  if (connection === 'close') {
    sessionState.status = 'disconnected'
    emitEvent(sessionId, 'connection', { status: 'disconnected' })

    // Solo reconecta automáticamente el worker session
    if (shouldReconnect && type === 'worker') {
      setTimeout(() => createSession(config), 5000)
    }
  }
})
```

### 2.4 Polling Status (Frontend → API)

**Archivo:** `packages/api/src/routers/whatsapp-connections.ts`

```typescript
// PROCEDURE: pollStatus (query)
// Se ejecuta cada 3 segundos desde el frontend

1. Frontend: api.whatsappConnections.pollStatus.useQuery(undefined, {
     refetchInterval: 3000
   })

2. Router consulta DB:
   SELECT * FROM whatsapp_connections WHERE user_id = ctx.userId

3. Si no hay baileysSessionId → Retorna 'not_started'

4. Router llama Worker:
   GET http://localhost:3001/session/{userId}/status

5. Worker consulta session state en memoria:
   - Si status = 'connected':
     - Llama /session/{userId}/info para obtener phoneNumber
     - Actualiza DB: status='active', phoneNumber, lastConnectedAt
     - Actualiza profiles.waConnected = true

6. Retorna al frontend:
   {
     status: 'connected',  // o 'qr_pending', 'disconnected'
     qr: "base64..." | null,
     connected: true/false,
     connectedAt: "2025-12-25T20:00:00Z"
   }
```

### 2.5 Webhook Flow (Worker → Core)

**Archivo:** `packages/baileys-worker/src/services/webhook-sender.ts`

```typescript
// Emisor de eventos registrado en initWebhookSender()

onSessionEvent((sessionId, event, data) => {
  switch (event) {
    case 'qr':
      // QR generado
      sendWebhook({
        type: 'connection',
        userId: extractUserId(sessionId),
        sessionId,
        connection: { status: 'qr_pending', qr: data.qr },
      })
      break

    case 'connection':
      // Cambio de estado conexión
      sendWebhook({
        type: data.status === 'connected' ? 'connection_success' : 'connection',
        userId: extractUserId(sessionId),
        sessionId,
        connection: {
          status: data.status,
          isBusiness: data.isBusiness,
        },
      })
      break

    case 'connection_rejected':
      // Cuenta personal rechazada
      sendWebhook({
        type: 'connection_rejected',
        userId: extractUserId(sessionId),
        sessionId,
        rejection: {
          reason: 'PERSONAL_ACCOUNT_DETECTED',
          message: data.message,
        },
      })
      break

    case 'messages.upsert':
      // Mensaje entrante
      for (const msg of data.messages) {
        if (!msg.key.fromMe) {
          const normalized = normalizeMessage(msg)
          addJob('message-webhook', { userId, sessionId, message: normalized }, async (jobData) => {
            await sendWebhook({
              type: 'message',
              userId: jobData.userId,
              sessionId: jobData.sessionId,
              message: jobData.message,
            })
          })
        }
      }
      break
  }
})
```

**Receptor:** `apps/web/src/app/api/webhooks/baileys/route.ts`

```typescript
POST /api/webhooks/baileys
Headers: x-service-secret: [BAILEYS_SERVICE_SECRET]

switch (payload.type) {
  case 'message':
    // 1. Procesa mensaje → crea client, conversation, message en DB
    // 2. Genera respuesta IA (Router → POD/Brain)
    // 3. Envía respuesta humanizada
    break

  case 'connection':
  case 'connection_success':
    // Actualiza whatsapp_connections.status
    updateConnectionStatus(userId, connection.status)
    break

  case 'connection_rejected':
    // Usuario intentó usar cuenta personal
    // UI debe mostrar error y explicación
    break
}
```

---

## 3. Persistencia de Sesión

### 3.1 Almacenamiento Local (Baileys Worker)

**Ubicación:** Definida por env var `SESSIONS_DIR`

```bash
./sessions/
  └── user_{userId}/          # Una carpeta por usuario
      ├── creds.json          # Credenciales de autenticación
      ├── app-state-sync-key-*.json
      ├── sender-key-memory-*.json
      └── ...                 # Otros archivos de state
```

**Código:** `packages/baileys-worker/src/services/session-manager.ts:96`

```typescript
const SESSIONS_DIR = process.env['SESSIONS_DIR'] || './sessions'

const { state, saveCreds } = await useMultiFileAuthState(
  path.join(SESSIONS_DIR, sessionId) // ./sessions/user_uuid
)

// Baileys guarda automáticamente en esta carpeta
socket.ev.on('creds.update', saveCreds)
```

**Persistencia:**

- ✅ Sesión sobrevive a restart del worker
- ✅ No requiere escanear QR nuevamente
- ⚠️ **CRÍTICO:** En producción (Railway), montar volumen persistente en `/app/sessions`

### 3.2 Metadata en Supabase

**Tabla:** `whatsapp_connections`

```sql
SELECT
  baileys_session_id,      -- "user_{userId}"
  baileys_worker_url,      -- "http://localhost:3001" o Railway URL
  status,                  -- 'pending' | 'active' | 'disconnected'
  phone_number,            -- "+34612345678" (extraído de socket.user.id)
  last_connected_at,       -- Timestamp última conexión exitosa
  monthly_conversations_count,  -- Contador para Glass Ceiling (450 limit)
  rate_limit_enabled,      -- true (Ruedines activos)
  rate_limit_delay_ms      -- 5000 (delay entre mensajes)
FROM whatsapp_connections
WHERE user_id = 'user-uuid';
```

**Sincronización:**

- Worker → Webhook → Core actualiza metadata
- Core nunca escribe en `./sessions/` del worker
- Worker solo escribe auth files, nunca DB

---

## 4. Estado del Schema DB

### 4.1 Verificación de Tabla

**Archivo:** `packages/db/src/schema/whatsapp-connections.ts`

✅ **Schema sincronizado con código actual** (última verificación: 25 Dic 2025)

```typescript
export const whatsappConnections = pgTable('whatsapp_connections', {
  // ✅ Campos necesarios para Baileys
  baileysSessionId: text('baileys_session_id'), // "user_{userId}"
  baileysWorkerUrl: text('baileys_worker_url'), // Worker URL

  // ✅ Estado de conexión
  status: waConnectionStatusEnum('status') // pending/active/disconnected
    .notNull()
    .default('pending'),

  // ✅ Phone number (extraído en pollStatus)
  phoneNumber: text('phone_number'),

  // ✅ Glass Ceiling tracking
  monthlyConversationsCount: integer('monthly_conversations_count').notNull().default(0),
  monthlyConversationsLimit: integer('monthly_conversations_limit').notNull().default(450), // ⚠️ Límite antes de sugerir migración a Cloud API

  // ✅ Ruedines (Rate limiting)
  rateLimitEnabled: boolean('rate_limit_enabled').notNull().default(true),
  rateLimitDelayMs: integer('rate_limit_delay_ms').notNull().default(5000),

  // ✅ Migration tracking
  migrationStatus: waMigrationStatusEnum('migration_status').notNull().default('not_started'),

  // ✅ Timestamps
  lastConnectedAt: timestamp('last_connected_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
```

### 4.2 Enums Necesarios

```sql
-- ✅ Ya creados en Supabase (87 enums total)
CREATE TYPE wa_connection_mode AS ENUM (
  'qr_baileys',   -- QR code (Baileys) ← MODO POR DEFECTO
  'cloud_api'     -- Meta Cloud API (migración)
);

CREATE TYPE wa_connection_status AS ENUM (
  'pending',      -- Esperando QR scan
  'active',       -- Conectado y funcionando
  'disconnected', -- Perdió conexión
  'migrating',    -- En proceso de migración
  'suspended'     -- Temporalmente suspendido
);

CREATE TYPE wa_migration_status AS ENUM (
  'not_started',  -- No ha alcanzado límite
  'suggested',    -- Mostrado prompt de migración
  'in_progress',  -- Usuario configurando Cloud API
  'completed',    -- Migrado exitosamente
  'declined'      -- Usuario rechazó migración
);
```

### 4.3 Verificación en Producción

```bash
# Comando para verificar tabla en Supabase
PGPASSWORD="LM6NuKHOOINGBh3T" psql \
  -h aws-1-eu-central-2.pooler.supabase.com \
  -p 6543 \
  -U postgres.kcopoxrrnvogcwdwnhjr \
  -d postgres \
  -c "\d whatsapp_connections"

# Resultado esperado:
#  baileys_session_id     | text
#  baileys_worker_url     | text
#  status                 | wa_connection_status
#  phone_number           | text
#  monthly_conversations_count | integer (default 0)
#  monthly_conversations_limit | integer (default 450)
#  ...
```

---

## 5. Variables de Entorno

### 5.1 Baileys Worker (.env)

**Crear:** `packages/baileys-worker/.env`

```bash
# ==================================================
# Server Configuration
# ==================================================
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# ==================================================
# Authentication (CRÍTICO - CAMBIAR EN PRODUCCIÓN)
# ==================================================
# Debe coincidir con BAILEYS_SERVICE_SECRET en Wallie Core
BAILEYS_SERVICE_SECRET=dev-secret-change-me

# Opcional: API key para llamadas directas
BAILEYS_API_KEY=dev-key-change-me

# ==================================================
# Sessions Storage (CRÍTICO para persistencia)
# ==================================================
# Carpeta donde se guardan las sesiones de WhatsApp
# ⚠️ En Railway: Montar volumen en /app/sessions
SESSIONS_DIR=./sessions

# ==================================================
# Webhook Configuration (CRÍTICO)
# ==================================================
# URL donde el worker enviará mensajes entrantes
CORE_WEBHOOK_URL=http://localhost:3000/api/webhooks/baileys

# ==================================================
# Logging
# ==================================================
LOG_LEVEL=info

# ==================================================
# CORS
# ==================================================
CORS_ORIGIN=*
```

### 5.2 Wallie Core (.env.local)

**Archivo:** `C:\_WALLIE\.env.local` o `apps/web/.env.local`

```bash
# ==================================================
# Baileys Worker Integration
# ==================================================
# URL del worker (local o Railway)
BAILEYS_WORKER_URL=http://localhost:3001

# Secret compartido (debe coincidir con worker)
BAILEYS_SERVICE_SECRET=dev-secret-change-me

# ==================================================
# Database (ya existente)
# ==================================================
DATABASE_URL=postgresql://postgres.kcopoxrrnvogcwdwnhjr:LM6NuKHOOINGBh3T@aws-1-eu-central-2.pooler.supabase.com:6543/postgres

# ... resto de env vars
```

### 5.3 Variables Críticas Explicadas

| Variable                 | Propósito                        | ¿Dónde?                 |
| ------------------------ | -------------------------------- | ----------------------- |
| `BAILEYS_SERVICE_SECRET` | Autenticación Worker ↔ Core      | Ambos (deben coincidir) |
| `SESSIONS_DIR`           | Carpeta de persistencia sesiones | Worker                  |
| `CORE_WEBHOOK_URL`       | URL del webhook receptor         | Worker                  |
| `BAILEYS_WORKER_URL`     | URL del worker desde Core        | Core                    |

---

## 6. Comandos de Arranque

### 6.1 Preparación Inicial

```bash
# 1. Instalar dependencias (si no está hecho)
cd /c/_WALLIE
pnpm install

# 2. Verificar que existe la carpeta sessions
mkdir -p packages/baileys-worker/sessions

# 3. Crear .env del worker
cp packages/baileys-worker/.env.example packages/baileys-worker/.env

# 4. Editar .env con tus valores
code packages/baileys-worker/.env
# Asegúrate de que BAILEYS_SERVICE_SECRET coincide con el de Core
```

### 6.2 Arranque del Worker (Modo Desarrollo)

```bash
# Terminal 1: Arrancar Baileys Worker
cd /c/_WALLIE/packages/baileys-worker
pnpm dev

# Salida esperada:
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║   🤖 Baileys Worker Microservice (Enterprise Core)                    ║
# ║   Server running on http://0.0.0.0:3001                               ║
# ╚═══════════════════════════════════════════════════════════════════════╝

# Verificar health check:
curl http://localhost:3001/health
# Debe retornar: {"status":"ok","timestamp":"...","sessions":{"total":1,"connected":0}}
```

### 6.3 Arranque de Wallie Core

```bash
# Terminal 2: Arrancar Next.js
cd /c/_WALLIE
pnpm dev

# Salida esperada:
# ▲ Next.js 14.2.15
# - Local:        http://localhost:3000
# - ready in 5.2s
```

### 6.4 Test de Integración

```bash
# Terminal 3: Test manual de conexión

# 1. Verificar que worker responde
curl -X POST http://localhost:3001/session/start \
  -H "x-service-secret: dev-secret-change-me" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123"}'

# Respuesta esperada:
# {
#   "success": true,
#   "sessionId": "user_test-user-123",
#   "status": "qr_pending",
#   "qr": "data:image/png;base64,iVBOR..."
# }

# 2. Verificar que se creó carpeta de sesión
ls -la packages/baileys-worker/sessions/
# Debe aparecer: user_test-user-123/

# 3. Verificar status
curl http://localhost:3001/session/test-user-123/status \
  -H "x-service-secret: dev-secret-change-me"

# Respuesta esperada:
# {
#   "success": true,
#   "sessionId": "user_test-user-123",
#   "status": "qr_pending",
#   "qr": "data:image/png;base64,..."
# }
```

### 6.5 Test desde Frontend

```bash
# 1. Abrir navegador en http://localhost:3000
# 2. Login con e2e_user@test.com / password123
# 3. Ir a /dashboard/settings/whatsapp
# 4. Click en "Conectar WhatsApp"
# 5. Debe mostrarse QR code
# 6. Escanear con WhatsApp Business app
# 7. Verificar que aparece "Conectado"
```

---

## 7. Verificación y Troubleshooting

### 7.1 Checklist de Verificación

```bash
# ✅ 1. Worker está corriendo
curl http://localhost:3001/health
# Debe retornar status: "ok"

# ✅ 2. Core puede comunicarse con Worker
curl -X POST http://localhost:3000/api/trpc/whatsappConnections.startQrSession \
  -H "Content-Type: application/json" \
  -H "Cookie: [tu-cookie-de-sesión]" \
  -d '{"json":{}}'
# Debe retornar QR en response.result.data.json.qr

# ✅ 3. Sesión se persiste
ls packages/baileys-worker/sessions/user_*/
# Deben existir archivos: creds.json, app-state-sync-key-*.json

# ✅ 4. DB tiene registro
psql $DATABASE_URL -c "SELECT baileys_session_id, status FROM whatsapp_connections;"
# Debe aparecer: user_[uuid] | pending

# ✅ 5. Webhook funciona
# Enviar test webhook manualmente
curl -X POST http://localhost:3000/api/webhooks/baileys \
  -H "x-service-secret: dev-secret-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "connection",
    "userId": "test-user-123",
    "sessionId": "user_test-user-123",
    "connection": {"status": "connected", "isBusiness": true}
  }'
# Debe retornar: {"success": true}
```

### 7.2 Problemas Comunes

#### 🔴 Error: "Unauthorized" en Worker

```bash
# Problema: BAILEYS_SERVICE_SECRET no coincide
# Solución:
grep BAILEYS_SERVICE_SECRET packages/baileys-worker/.env
grep BAILEYS_SERVICE_SECRET .env.local
# Deben ser idénticos

# Fix:
echo "BAILEYS_SERVICE_SECRET=mi-secret-compartido" >> packages/baileys-worker/.env
echo "BAILEYS_SERVICE_SECRET=mi-secret-compartido" >> .env.local
```

#### 🔴 Error: "Session not found" después de restart

```bash
# Problema: SESSIONS_DIR apunta a carpeta temporal
# Solución:
echo "SESSIONS_DIR=./sessions" >> packages/baileys-worker/.env

# Verificar que la carpeta existe y tiene permisos
mkdir -p packages/baileys-worker/sessions
chmod 755 packages/baileys-worker/sessions
```

#### 🔴 QR no se muestra en frontend

```bash
# 1. Verificar que pollStatus está funcionando
# Abrir DevTools → Network → Filter: pollStatus
# Debe haber requests cada 3 segundos

# 2. Verificar response de pollStatus
# Debe incluir: qr: "data:image/png;base64,..."

# 3. Si qr es null, verificar logs del worker
cd packages/baileys-worker
pnpm dev
# Buscar: "QR code generated"
```

#### 🔴 Cuenta personal rechazada

```bash
# Logs del worker mostrarán:
# "Personal account detected - rejecting connection"

# Solución:
# 1. Convertir cuenta de WhatsApp a Business:
#    - Abrir WhatsApp → Settings → Business Tools → Create a Business Account
# 2. O usar otra cuenta que ya sea Business
# 3. Verificar en logs: "WhatsApp Business account validated"
```

#### 🔴 Worker no reenvía mensajes a Core

```bash
# Verificar variable CORE_WEBHOOK_URL
grep CORE_WEBHOOK_URL packages/baileys-worker/.env
# Debe ser: http://localhost:3000/api/webhooks/baileys

# Verificar logs de webhook sender:
# Buscar: "Webhook sent successfully" o "Webhook request failed"

# Test manual:
curl -X POST http://localhost:3000/api/webhooks/baileys \
  -H "x-service-secret: dev-secret-change-me" \
  -H "Content-Type: application/json" \
  -d '{"type":"connection","userId":"test","sessionId":"user_test","connection":{"status":"connected"}}'
```

### 7.3 Logs Importantes

#### Worker Logs

```bash
# Logs a buscar en terminal del worker:

✅ "Initializing worker session..."
✅ "Worker session initialized"
✅ "QR code generated" { sessionId: "user_..." }
✅ "Connection opened, validating account type..."
✅ "WhatsApp Business account validated" { businessName: "..." }
✅ "Connected successfully" { sessionId: "user_..." }
✅ "Webhook sent successfully" { sessionId: "user_...", type: "connection" }

⚠️ "Personal account detected - rejecting connection"
❌ "Failed to start session" { error: "..." }
❌ "Webhook request failed" { status: 401 }
```

#### Core Logs

```bash
# Logs a buscar en terminal de Next.js:

✅ "[Baileys] Received event" { type: "connection", userId: "..." }
✅ "[Baileys] Updated connection status" { userId: "...", status: "connected" }
✅ "[Baileys] Processed message" { from: "+34...", text: "..." }
✅ "[Baileys] Sent AI response" { preview: "Hola! Gracias por..." }

⚠️ "[Baileys] User has reached AI limit" { used: 100, limit: 100 }
❌ "[Baileys] Invalid service secret"
❌ "[Baileys] Error processing message"
```

---

## 🎯 Resumen: Orden de Ejecución

### Para arrancar el sistema completo:

```bash
# 1. PREPARACIÓN (una sola vez)
cd /c/_WALLIE
pnpm install
mkdir -p packages/baileys-worker/sessions
cp packages/baileys-worker/.env.example packages/baileys-worker/.env
# Editar .env con secrets correctos

# 2. ARRANQUE (cada vez)
# Terminal 1: Baileys Worker
cd packages/baileys-worker && pnpm dev

# Terminal 2: Wallie Core
cd /c/_WALLIE && pnpm dev

# 3. VERIFICACIÓN
curl http://localhost:3001/health  # Worker OK
curl http://localhost:3000          # Core OK

# 4. USO
# - Abrir http://localhost:3000
# - Login → Settings → WhatsApp → Connect
# - Escanear QR con WhatsApp Business
# - ¡Listo! 🎉
```

---

## 📚 Referencias de Código

| Componente       | Archivo                                                   | Líneas Clave                                        |
| ---------------- | --------------------------------------------------------- | --------------------------------------------------- |
| QR Router        | `packages/api/src/routers/whatsapp-connections.ts`        | 80-162 (startQrSession), 168-237 (pollStatus)       |
| Worker Server    | `packages/baileys-worker/src/index.ts`                    | 130-177 (start)                                     |
| Session Routes   | `packages/baileys-worker/src/routes/session.ts`           | 31-94 (POST /session/start)                         |
| Session Manager  | `packages/baileys-worker/src/services/session-manager.ts` | 76-274 (createSession), 119-221 (connection.update) |
| Webhook Sender   | `packages/baileys-worker/src/services/webhook-sender.ts`  | 81-130 (sendWebhook), 412-449 (init)                |
| Webhook Receiver | `apps/web/src/app/api/webhooks/baileys/route.ts`          | 81-138 (POST), 143-400 (processIncomingMessage)     |
| DB Schema        | `packages/db/src/schema/whatsapp-connections.ts`          | 55-141 (table definition)                           |

---

**Generado por Claude Code** 🤖
**Fecha:** 25 Dic 2025
**Estado DB:** 143 tablas sincronizadas ✅
**Entorno:** Windows (miniserver local) → Supabase (production)
