# ⚡ MiniServer Quick Start: Envío de Datos a Wallie

> **5 minutos para integrar el MiniServer con Wallie**

---

## 🎯 Lo que necesitas saber en 30 segundos

```javascript
// El MiniServer debe hacer esto:

fetch('https://wallie.pro/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TU_JWT_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    json: {                           // ⚠️ Wrapped en "json"
      phone: '+34612345678',          // ✅ REQUERIDO (o clientId)
      googleMapsRating: 4.8,          // ⭐ Esto es lo que buscamos
      googleMapsName: 'Nombre Maps',
      waBusinessBio: 'Bio WA...',
      websiteUrl: 'https://...',
      ocrText: 'Texto del logo...',
    }
  })
})
```

**Resultado esperado:**
```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "clientId": "uuid",
        "fieldsUpdated": 4,
        "piiSanitized": true
      }
    }
  }
}
```

---

## ✅ Checklist de 5 Pasos

### 1️⃣ Configurar JWT Token

```bash
# En el MiniServer:
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**¿Dónde obtener el token?**
- Usuario hace login en Wallie
- Copiar token de Supabase Auth
- Configurar en `.env` del MiniServer

---

### 2️⃣ Implementar Función de Envío

```typescript
async function enviarAWallie(datos) {
  const response = await fetch(
    'https://wallie.pro/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.JWT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ json: datos }) // ⚠️ "json" wrapper
    }
  )

  if (!response.ok) {
    throw new Error(`Error ${response.status}`)
  }

  return response.json()
}
```

---

### 3️⃣ Datos Mínimos Requeridos

```typescript
const datosMinimos = {
  phone: '+34612345678',  // ✅ REQUERIDO
  googleMapsRating: 4.8,  // ⭐ CRÍTICO para "Leads de Oro"
}

// Esto ya funciona:
await enviarAWallie(datosMinimos)
```

---

### 4️⃣ Datos Completos (Recomendado)

```typescript
const datosCompletos = {
  phone: '+34612345678',              // ✅ REQUERIDO
  googleMapsRating: 4.8,              // ⭐ CRÍTICO
  googleMapsName: 'Reformas SL',      // Recomendado
  waBusinessBio: 'Bio de WhatsApp',   // Se sanitiza automáticamente
  websiteUrl: 'https://ejemplo.com',  // Opcional
  ocrText: 'Texto del logo...',       // Se sanitiza automáticamente
}

await enviarAWallie(datosCompletos)
```

---

### 5️⃣ Verificar que se Guardó

```sql
-- Ejecutar en Supabase:
SELECT
  name,
  phone,
  google_maps_rating,
  google_maps_name,
  wa_business_bio,
  last_enrichment_at
FROM clients
WHERE phone = '+34612345678';
```

**Resultado esperado:**
```
name         | phone         | google_maps_rating | google_maps_name | last_enrichment_at
-------------|---------------|--------------------|--------------------|--------------------
Juan García  | +34612345678  | 4.8                | Reformas SL        | 2025-12-30 12:00:00
```

---

## 🔥 Error "No Leads de Oro" → Solución

**Problema actual:**
```sql
SELECT COUNT(*) FROM clients WHERE google_maps_rating >= 4.5;
-- Result: 0 ❌
```

**Causa:**
- MiniServer NO está enviando `googleMapsRating`
- O el endpoint NO está siendo llamado

**Solución:**

```typescript
// ✅ ASEGÚRATE de enviar esto:
{
  phone: '+34612345678',
  googleMapsRating: 4.8,  // ← ESTO es obligatorio para Leads de Oro
}
```

**Después del envío:**
```sql
SELECT COUNT(*) FROM clients WHERE google_maps_rating >= 4.5;
-- Result: 5 ✅ ¡Leads de Oro!
```

---

## 🚨 Errores Comunes y Soluciones

### Error 1: "Cliente no encontrado"

```
❌ Error: NOT_FOUND - Cliente no encontrado
```

**Causa:** El teléfono no existe en Wallie.

**Solución:**
```sql
-- Verificar que el cliente existe:
SELECT id, name, phone FROM clients WHERE phone = '+34612345678';

-- Si no existe, crear primero en Wallie UI
```

---

### Error 2: "UNAUTHORIZED"

```
❌ Error: 401 UNAUTHORIZED
```

**Causa:** JWT token expirado o inválido.

**Solución:**
```bash
# Renovar token:
# 1. Usuario hace login en Wallie
# 2. Copiar nuevo token
# 3. export JWT_TOKEN="nuevo-token"
```

---

### Error 3: Rating se guarda como NULL

```javascript
// ❌ MAL - Envías como string
{ googleMapsRating: "4.8" }

// ✅ BIEN - Envía como número
{ googleMapsRating: 4.8 }
{ googleMapsRating: parseFloat("4.8") }
```

---

### Error 4: "Invalid input"

```
❌ Error: 400 Invalid input
```

**Causa:** Rating fuera de rango (0.0 - 5.0)

**Solución:**
```javascript
// ✅ Validar antes de enviar
const rating = Math.min(Math.max(rating, 0), 5) // Clamp entre 0 y 5
```

---

## 📊 Flow Diagram

```
MiniServer                    Wallie Backend               PostgreSQL
    │                               │                          │
    │ 1. POST /api/trpc/...         │                          │
    ├──────────────────────────────>│                          │
    │   { json: {                   │                          │
    │     phone: "+34612345678",    │                          │
    │     googleMapsRating: 4.8     │                          │
    │   }}                          │                          │
    │                               │ 2. Validate Zod          │
    │                               │ 3. Find client by phone  │
    │                               ├─────────────────────────>│
    │                               │                          │
    │                               │<─────────────────────────┤
    │                               │ 4. Client found          │
    │                               │                          │
    │                               │ 5. Sanitize PII          │
    │                               │ 6. UPDATE clients SET... │
    │                               ├─────────────────────────>│
    │                               │                          │
    │                               │<─────────────────────────┤
    │                               │ 7. Updated (1 row)       │
    │                               │                          │
    │<──────────────────────────────┤                          │
    │   { success: true,            │                          │
    │     fieldsUpdated: 2 }        │                          │
    │                               │                          │
    ▼                               ▼                          ▼
```

---

## 🧪 Test Rápido (curl)

```bash
# Reemplaza:
# - TU_JWT_TOKEN con tu token real
# - +34612345678 con un teléfono que exista en Wallie

curl -X POST https://wallie.pro/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "phone": "+34612345678",
      "googleMapsRating": 4.8,
      "googleMapsName": "Test Company"
    }
  }'
```

**Respuesta esperada:**
```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "clientId": "550e8400-e29b-41d4-a716-446655440000",
        "fieldsUpdated": 2,
        "piiSanitized": false
      }
    }
  }
}
```

---

## 📦 Variables de Entorno Necesarias

```bash
# .env del MiniServer

# 1. JWT del usuario (OBLIGATORIO)
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. URL del backend (opcional, default: https://wallie.pro)
WALLIE_API_URL="https://wallie.pro"

# 3. Rate limiting (opcional)
MAX_REQUESTS_PER_SECOND=10
```

---

## 🎯 Objetivo: Conseguir Leads de Oro

**Definición de "Lead de Oro":**
- Cliente con `google_maps_rating >= 4.5`

**Estado actual:**
```sql
SELECT COUNT(*) FROM clients WHERE google_maps_rating >= 4.5;
-- Result: 0 ❌
```

**Después de MiniServer funcionando:**
```sql
SELECT
  name,
  phone,
  google_maps_rating,
  google_maps_name
FROM clients
WHERE google_maps_rating >= 4.5
ORDER BY google_maps_rating DESC
LIMIT 5;
```

**Resultado esperado:**
```
name              | phone         | rating | maps_name
------------------|---------------|--------|------------------
Reformas Elite    | +34600111222  | 4.9    | Reformas Elite SL
Gestoría Pro      | +34611222333  | 4.8    | Gestoría Profesional
Clínica Dental    | +34622333444  | 4.7    | Dr. Sonrisas
Pizzería Napoli   | +34633444555  | 4.6    | La Vera Napoli
Taller López      | +34644555666  | 4.5    | Mecánica López
```

**¡5 Leads de Oro conseguidos! 🏆**

---

## 📚 Recursos Adicionales

| Documento                          | Propósito                            |
| ---------------------------------- | ------------------------------------ |
| `MINISERVER_INSTRUCCIONES_ENVIO.md` | Guía completa con todos los detalles |
| `miniserver-example-client.ts`     | Código de ejemplo ejecutable         |
| `MINISERVER_INTEGRATION.md`        | Documentación original de integración|
| `DIAGNOSTICO_RESULTADO.md`         | Análisis del problema actual         |

---

## ✅ Checklist Final

Antes de deployar el MiniServer a producción:

- [ ] JWT_TOKEN configurado en .env
- [ ] Función `enviarAWallie()` implementada
- [ ] Envía `googleMapsRating` (número, no string)
- [ ] Envía `phone` en formato internacional (+34...)
- [ ] Maneja errores 401, 404, 400
- [ ] Implementa retry logic
- [ ] Respeta rate limiting (max 10 req/s)
- [ ] Logs estructurados (éxito/fallo)
- [ ] Tested con curl/Postman
- [ ] Verificado en Supabase que se guarda

**Cuando todos los checks estén ✅, el MiniServer estará listo.**

---

_Quick Start Guide - 30 Dic 2025_
_Tiempo estimado de implementación: 5 minutos_
