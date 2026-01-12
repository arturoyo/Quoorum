# 🚀 Wallie - Checklist Completo de Deployment

**Fecha:** 8 de Diciembre, 2024  
**Estado:** CODE COMPLETE - Listo para deployment  

---

## 📋 Resumen Ejecutivo

Este checklist cubre el deployment completo de Wallie CRM con todas las funcionalidades implementadas:
- ✅ Inbox Unificado (WhatsApp + Email + LinkedIn)
- ✅ Voice AI con almacenamiento completo
- ✅ LinkedIn Audio Messages
- ✅ W. Allie (Influencer Sintético)
- ✅ Arsenal de Growth (Vacancy Sniper, CV Troyano, Scout 2.0)
- ✅ Chrome Extension

---

## 🗄️ PASO 1: Base de Datos (Supabase)

### 1.1 Aplicar Migraciones

```bash
cd packages/db

# Migración de Voice AI
pnpm drizzle-kit push:pg --migration=0008_voice_ai_tables.sql

# Migración de LinkedIn
pnpm drizzle-kit push:pg --migration=0009_linkedin_integration.sql
```

**Verificar:**
```sql
-- Voice AI tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'voice_%';

-- LinkedIn tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'linkedin_%';
```

**Resultado esperado:**
- `voice_calls`
- `voice_commands`
- `voice_transcription_segments`
- `linkedin_messages`
- `linkedin_conversations`

### 1.2 Verificar Índices

```sql
-- Voice AI indexes
SELECT indexname FROM pg_indexes 
WHERE tablename LIKE 'voice_%';

-- LinkedIn indexes
SELECT indexname FROM pg_indexes 
WHERE tablename LIKE 'linkedin_%';
```

---

## 🔐 PASO 2: Variables de Entorno

### 2.1 Backend (Next.js - Vercel)

Ir a Vercel → Settings → Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=https://wallie.app
NEXTAUTH_SECRET=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Growth Worker
GROWTH_WORKER_URL=https://growth-worker.railway.app

# ElevenLabs (para Voice AI)
ELEVENLABS_API_KEY=sk_...

# OpenAI
OPENAI_API_KEY=sk-...
```

### 2.2 Growth Worker (Python - Railway)

Ir a Railway → Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# ElevenLabs (Audio Messages)
ELEVENLABS_API_KEY=sk_...

# LinkedIn (W. Allie + DM Sync)
LINKEDIN_EMAIL=wallie@example.com
LINKEDIN_PASSWORD=...

# Database (para guardar resultados)
DATABASE_URL=postgresql://...

# Port
PORT=8000
```

### 2.3 Baileys Worker (WhatsApp - Railway)

```bash
DATABASE_URL=postgresql://...
PORT=3001
```

---

## 🐍 PASO 3: Growth Worker (Python)

### 3.1 Deploy a Railway

**Opción A: Desde GitHub (Recomendado)**

1. Ir a [Railway](https://railway.app)
2. New Project → Deploy from GitHub
3. Seleccionar repo: `arturoyo/Wallie`
4. Root Directory: `packages/growth-worker`
5. Railway detectará `requirements.txt` automáticamente

**Opción B: Railway CLI**

```bash
cd packages/growth-worker

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### 3.2 Verificar Deployment

```bash
# Obtener URL del servicio
railway domain

# Test health check
curl https://growth-worker.railway.app/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "version": "2.0",
  "modules": [
    "vacancy_sniper",
    "wallie_scout_v2",
    "linkedin_audio",
    "cv_troyano",
    "w_allie_bot",
    "sync_dms"
  ]
}
```

### 3.3 Verificar Endpoints

```bash
# Vacancy Sniper
curl https://growth-worker.railway.app/vacancy-sniper/search

# LinkedIn Audio
curl https://growth-worker.railway.app/audio/voices

# W. Allie
curl https://growth-worker.railway.app/w-allie/generate-post

# LinkedIn Sync
curl https://growth-worker.railway.app/linkedin/conversations
```

---

## 📱 PASO 4: Baileys Worker (WhatsApp)

### 4.1 Deploy a Railway

```bash
cd packages/baileys-worker

# Deploy
railway up
```

### 4.2 Verificar QR Code

```bash
# Ver logs
railway logs

# Buscar QR code en logs
# Escanear con WhatsApp
```

### 4.3 Test Envío de Mensaje

```bash
curl -X POST https://baileys-worker.railway.app/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+34612345678",
    "message": "Test desde Wallie"
  }'
```

---

## 🌐 PASO 5: Frontend (Next.js)

### 5.1 Deploy a Vercel

**Opción A: Desde GitHub (Recomendado)**

1. Ir a [Vercel](https://vercel.com)
2. Import Project → GitHub
3. Seleccionar repo: `arturoyo/Wallie`
4. Root Directory: `apps/web`
5. Framework Preset: Next.js
6. Deploy

**Opción B: Vercel CLI**

```bash
cd apps/web

# Login
vercel login

# Deploy
vercel --prod
```

### 5.2 Verificar Rutas

```
https://wallie.app/
https://wallie.app/inbox
https://wallie.app/voice
https://wallie.app/admin/growth
https://wallie.app/admin/w-allie
```

---

## 🔌 PASO 6: Chrome Extension

### 6.1 Empaquetar Extension

```bash
cd chrome-extension

# Crear ZIP
zip -r wallie-extension.zip . \
  -x "*.git*" \
  -x "node_modules/*" \
  -x "*.DS_Store"
```

### 6.2 Publicar en Chrome Web Store

1. Ir a [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. New Item
3. Upload `wallie-extension.zip`
4. Rellenar metadata:
   - Name: Wallie - LinkedIn Growth Assistant
   - Description: Automate LinkedIn prospecting with AI
   - Category: Productivity
   - Screenshots: (usar capturas de la extensión)
5. Submit for Review

### 6.3 Test Local (Mientras se aprueba)

1. Chrome → Extensions → Developer Mode
2. Load Unpacked
3. Seleccionar carpeta `chrome-extension`
4. Ir a LinkedIn y verificar botón flotante

---

## 🤖 PASO 7: W. Allie Scheduler

### 7.1 Deploy Scheduler

**Opción A: Railway (Recomendado)**

```bash
cd packages/growth-worker

# Crear nuevo servicio en Railway
railway service create w-allie-scheduler

# Deploy
railway up
```

**Comando de inicio:**
```bash
python w_allie_scheduler.py
```

### 7.2 Verificar Rutinas Programadas

```bash
# Ver logs
railway logs --service w-allie-scheduler

# Buscar en logs:
# ✅ Morning Routine programada: Lun-Vie 9:00 AM
# ✅ Coffee Break programado: Lun-Vie 3:00 PM
# ✅ Friday Sports programado: Viernes 6:00 PM
# ✅ Sunday Philosophy programado: Domingo 10:00 AM
# ✅ Tuesday War Stories programado: Martes 11:00 AM
```

### 7.3 Test Manual

```bash
# Trigger manual de rutina
curl -X POST https://growth-worker.railway.app/w-allie/run-routine \
  -H "Content-Type: application/json" \
  -d '{
    "routine_type": "morning"
  }'
```

---

## ✅ PASO 8: Verificación End-to-End

### 8.1 Voice AI

1. Ir a `/voice`
2. Verificar tabs: Llamadas, Asistente, Grabaciones, Analíticas
3. Crear llamada de prueba
4. Verificar que se guarda en BD

**SQL:**
```sql
SELECT * FROM voice_calls ORDER BY created_at DESC LIMIT 5;
```

### 8.2 LinkedIn Audio Messages

1. Ir a `/admin/growth`
2. Scroll a "Audio Messages 🎤"
3. Pegar URL de LinkedIn
4. Escribir pitch
5. Click "Enviar Audio"
6. Verificar que se envía

### 8.3 Inbox Unificado

1. Ir a `/inbox`
2. Verificar filtros: All, WhatsApp, Email, LinkedIn, Hot
3. Click en filtro "LinkedIn"
4. Verificar que muestra conversaciones de LinkedIn

**SQL:**
```sql
SELECT * FROM linkedin_conversations ORDER BY last_message_at DESC LIMIT 10;
```

### 8.4 W. Allie

1. Ir a `/admin/w-allie`
2. Generar post de prueba
3. Verificar que se genera correctamente
4. Publicar manualmente en LinkedIn

### 8.5 Vacancy Sniper

1. Ir a `/admin/growth`
2. Vacancy Sniper → Search Jobs
3. Keywords: "SDR Outbound"
4. Location: "Madrid"
5. Verificar que encuentra ofertas

### 8.6 CV Troyano

1. Ir a `/admin/growth`
2. CV Troyano → Generate CV
3. Target Role: "SDR"
4. Company: "TechCorp"
5. Verificar que genera PDF

---

## 🧪 PASO 9: Tests

### 9.1 Backend Tests

```bash
cd packages/api

# Voice AI tests
pnpm test voice-validation

# LinkedIn Audio tests
pnpm test linkedin-audio-validation
```

### 9.2 Growth Worker Tests

```bash
cd packages/growth-worker

# Todos los tests
pytest test_growth_modules.py -v

# Tests específicos
pytest test_growth_modules.py::TestCVTroyano -v
pytest test_growth_modules.py::TestVacancySniper -v
pytest test_growth_modules.py::TestWAllieBot -v
pytest test_growth_modules.py::TestWallieScout -v
pytest test_growth_modules.py::TestLinkedInDMSync -v
pytest test_growth_modules.py::TestWAllieScheduler -v
```

**Resultado esperado:**
```
50+ tests passed
```

---

## 📊 PASO 10: Monitoreo

### 10.1 Railway Logs

```bash
# Growth Worker
railway logs --service growth-worker

# Baileys Worker
railway logs --service baileys-worker

# W. Allie Scheduler
railway logs --service w-allie-scheduler
```

### 10.2 Vercel Logs

```
https://vercel.com/arturoyo/wallie/logs
```

### 10.3 Supabase Logs

```
https://supabase.com/dashboard/project/[project-id]/logs
```

### 10.4 Métricas Clave

**Voice AI:**
- Total llamadas creadas
- Comandos ejecutados
- Tasa de éxito

**LinkedIn Audio:**
- Audios generados
- Mensajes enviados
- Tasa de respuesta

**W. Allie:**
- Posts publicados
- Comentarios realizados
- Engagement rate

**Vacancy Sniper:**
- Ofertas detectadas
- Pitches enviados
- Tasa de respuesta

---

## 🔒 PASO 11: Seguridad

### 11.1 Verificar Secrets

- ✅ API keys no expuestas en frontend
- ✅ Database URL no expuesta
- ✅ LinkedIn credentials encriptadas
- ✅ CORS configurado correctamente

### 11.2 Rate Limiting

```typescript
// Verificar en middleware
// Max 100 requests/min por usuario
```

### 11.3 Backups

```bash
# Backup de BD (Supabase)
# Configurar backup automático diario
```

---

## 📚 PASO 12: Documentación

### 12.1 Documentos Creados

- ✅ `VOICE_AI_STORAGE.md` (460 líneas)
- ✅ `LINKEDIN_AUDIO_MESSAGES.md` (500+ líneas)
- ✅ `W_ALLIE_README.md` (370 líneas)
- ✅ `DEPLOYMENT_GUIDE.md` (250 líneas)
- ✅ `TESTING.md` (235 líneas)
- ✅ `CHROME_EXTENSION_SPEC.md` (212 líneas)

### 12.2 Acceso a Docs

```
/docs/VOICE_AI_STORAGE.md
/docs/LINKEDIN_AUDIO_MESSAGES.md
/packages/growth-worker/W_ALLIE_README.md
/packages/growth-worker/DEPLOYMENT_GUIDE.md
/chrome-extension/README.md
```

---

## 🎯 PASO 13: Go Live

### 13.1 Checklist Final

- [ ] ✅ Migraciones de BD aplicadas
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Growth Worker deployado
- [ ] ✅ Baileys Worker deployado
- [ ] ✅ Frontend deployado
- [ ] ✅ Chrome Extension publicada
- [ ] ✅ W. Allie Scheduler corriendo
- [ ] ✅ Tests pasando
- [ ] ✅ Logs monitoreados
- [ ] ✅ Backups configurados
- [ ] ✅ Documentación completa

### 13.2 Anuncio

Una vez todo verificado:

1. Enviar email a usuarios beta
2. Publicar en LinkedIn (con W. Allie)
3. Actualizar landing page
4. Activar onboarding

---

## 🆘 Troubleshooting

### Error: "voice_calls table not found"

**Solución:**
```bash
cd packages/db
pnpm drizzle-kit push:pg --migration=0008_voice_ai_tables.sql
```

### Error: "ELEVENLABS_API_KEY not configured"

**Solución:**
```bash
# En Railway
railway variables set ELEVENLABS_API_KEY=sk_...
```

### Error: "LinkedIn login failed"

**Solución:**
1. Verificar LINKEDIN_EMAIL y LINKEDIN_PASSWORD
2. Verificar que la cuenta no tiene 2FA
3. Usar cuenta dedicada para bots

### Error: "Chrome Extension not loading"

**Solución:**
1. Verificar manifest.json
2. Verificar permisos
3. Reload extension

---

## 📞 Soporte

Para problemas de deployment:
1. Revisar logs en Railway/Vercel
2. Verificar variables de entorno
3. Consultar documentación específica
4. Abrir issue en GitHub

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, Wallie CRM estará **100% operativo** con:

- ✅ Inbox Unificado (WhatsApp + Email + LinkedIn)
- ✅ Voice AI completo
- ✅ LinkedIn Audio Messages
- ✅ W. Allie publicando automáticamente
- ✅ Vacancy Sniper detectando ofertas
- ✅ CV Troyano aplicando a jobs
- ✅ Scout 2.0 analizando leads
- ✅ Chrome Extension activa

**¡A vender!** 🚀
