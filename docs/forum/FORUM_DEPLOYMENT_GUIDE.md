# 🚀 Forum Dynamic System - Guía de Deployment 100%

## 1. Configuración de Entorno

### Variables de Entorno (.env)

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# Database (requerido)
DATABASE_URL="postgresql://user:pass@host:5432/db"
DIRECT_URL="postgresql://user:pass@host:5432/db?pgbouncer=true"

# OpenAI (requerido)
OPENAI_API_KEY="sk-..."

# Email (requerido para notificaciones)
RESEND_API_KEY="re_..."
FORUM_EMAIL_FROM="forum@wallie.app"

# App URL (requerido para links en emails)
NEXT_PUBLIC_APP_URL="https://wallie.app"

# WebSocket (opcional, default 3001)
FORUM_WS_PORT=3001

# Push Notifications (opcional)
FIREBASE_SERVER_KEY="..."
WEB_PUSH_PRIVATE_KEY="..."

# Vector DB (opcional, para similarity search)
PINECONE_API_KEY="..."
PINECONE_ENVIRONMENT="..."

# Search API (opcional, para context loader)
SERPER_API_KEY="..."
```

### Dependencias

Instala todas las dependencias del monorepo:

```bash
pnpm install
```

## 2. Base de Datos

### Prerrequisitos
- PostgreSQL 14+
- `pgvector` extension (opcional, para similarity search)

```sql
-- Instalar pgvector (como superusuario)
CREATE EXTENSION IF NOT EXISTS vector;
```

### Migraciones

Ejecuta todas las migraciones de la base de datos:

```bash
cd packages/db
pnpm drizzle-kit migrate
```

**Verificación:**

```bash
# Conectar a la DB
psql $DATABASE_URL

# Verificar tablas de forum
\dt forum_*
```

Deberías ver 6 tablas: `forum_debates`, `forum_debate_comments`, `forum_debate_reactions`, `forum_custom_experts`, `forum_expert_performance`, `forum_debate_embeddings`.

## 3. Build del Proyecto

Compila todos los paquetes del monorepo:

```bash
pnpm build
```

## 4. Deployment

### Frontend (Next.js)

Deploy de la webapp en `apps/web` a Vercel, Netlify, o similar.

### Backend (tRPC API)

El backend tRPC está integrado en la app Next.js, no necesita un deploy separado.

### WebSocket Server

El servidor WebSocket en `packages/forum/src/websocket-server.ts` debe correr como un proceso separado.

**Opción 1: Node.js (PM2)**

```bash
# Iniciar servidor WebSocket
cd packages/forum
pm2 start dist/websocket-server.js --name forum-ws

# Guardar configuración de PM2
pm2 save
```

**Opción 2: Docker**

Crea un `Dockerfile` para el servidor WebSocket:

```Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY packages/forum/dist ./dist
COPY packages/forum/package.json .

RUN npm install --production

CMD ["node", "dist/websocket-server.js"]
```

**Opción 3: Vercel (Serverless Functions)**

No recomendado para WebSockets por la naturaleza sin estado de las funciones serverless. Usa un servicio como [Pusher](https://pusher.com/) o [Ably](https://ably.com/) si necesitas una solución serverless.

## 5. Verificación Post-Deployment

### 1. TypeScript

Verifica que no haya errores de TypeScript en producción:

```bash
pnpm typecheck
```

### 2. Tests

Ejecuta todos los tests del workspace:

```bash
pnpm -w test
```

### 3. Funcionalidad End-to-End

1. **Crea un usuario** en la aplicación.
2. **Ve a la página `/forum`**.
3. **Crea un nuevo debate**.
4. **Verifica que el debate se ejecuta** (status cambia a `in_progress`).
5. **Verifica que recibes actualizaciones** en tiempo real (WebSocket).
6. **Verifica que el debate se completa** (status cambia a `completed`).
7. **Verifica que recibes una notificación** por email.
8. **Exporta el debate a PDF**.

## 6. Mantenimiento y Monitoreo

### Logs
- **API/Backend**: `packages/api/logs/`
- **WebSocket**: Logs de PM2 o Docker

### Backups
- Configura backups diarios de la base de datos PostgreSQL.

### Actualizaciones
- Para actualizar, haz `git pull` y repite los pasos de build y deploy.
- Si hay nuevas migraciones, ejecútalas antes de reiniciar el servidor.

## 7. Integraciones Opcionales

### Vector Database (Pinecone)
1. Crea una cuenta en [Pinecone](https://www.pinecone.io/).
2. Crea un índice con 1536 dimensiones (para `text-embedding-3-small`).
3. Añade `PINECONE_API_KEY` y `PINECONE_ENVIRONMENT` a tu `.env`.
4. Descomenta el código de integración en `packages/forum/src/question-similarity.ts`.

### Search API (Serper)
1. Crea una cuenta en [Serper](https://serper.dev/).
2. Añade `SERPER_API_KEY` a tu `.env`.
3. Descomenta el código de integración en `packages/forum/src/context-loader.ts`.

---

**¡Felicidades! Tu sistema de Forum está 100% desplegado y funcional.** 🚀
