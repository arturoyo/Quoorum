# 📡 MiniServer → Wallie: Instrucciones de Envío de Datos

> **Fecha:** 30 Dic 2025
> **Propósito:** Guía para que el MiniServer envíe datos de enrichment correctamente
> **Endpoint:** `clientEnrichment.receiveEnrichmentFromMiniServer`

---

## 🎯 Endpoint Destino

```
POST https://wallie.pro/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer
```

**Protocolo:** tRPC (Wrapped JSON)

---

## 🔑 Autenticación

El MiniServer DEBE incluir el JWT token del usuario en el header:

```http
Authorization: Bearer <JWT_TOKEN_DEL_USUARIO>
Content-Type: application/json
```

**¿Dónde obtener el token?**
- El usuario debe configurar su `USER_JWT_TOKEN` en el MiniServer
- Se obtiene al hacer login en Wallie (Supabase Auth)

---

## 📦 Formato del Payload

### Estructura JSON (tRPC)

```json
{
  "json": {
    "clientId": "uuid-del-cliente",
    "phone": "+34612345678",
    "waBusinessBio": "Texto completo de la bio de WhatsApp Business",
    "websiteUrl": "https://ejemplo.com",
    "googleMapsRating": 4.8,
    "googleMapsName": "Nombre del negocio en Google Maps",
    "ocrText": "Texto extraído de la foto de perfil con OCR"
  }
}
```

### Campos del Input (Validación Zod)

| Campo              | Tipo     | Requerido | Validación                          | Notas                                        |
| ------------------ | -------- | --------- | ----------------------------------- | -------------------------------------------- |
| `clientId`         | `string` | ✅ Sí*    | UUID válido                         | *O `phone` (si no tienes el UUID)            |
| `phone`            | `string` | ⚠️ Sí*    | Formato internacional (+34...)      | *Requerido si no tienes `clientId`           |
| `waBusinessBio`    | `string` | ❌ No     | Texto libre                         | Se sanitiza automáticamente (PII)            |
| `websiteUrl`       | `string` | ❌ No     | URL válida                          | Null permitido                               |
| `googleMapsRating` | `number` | ❌ No     | Min: 0, Max: 5                      | Decimal (ej: 4.8). Null permitido            |
| `googleMapsName`   | `string` | ❌ No     | Texto libre                         | Null permitido                               |
| `ocrText`          | `string` | ❌ No     | Texto libre                         | Se sanitiza automáticamente (PII)            |

**IMPORTANTE:**
- DEBES proporcionar `clientId` **O** `phone` (al menos uno)
- Si envías `phone`, el backend buscará automáticamente el cliente

---

## 🔒 Sanitización PII Automática

**El backend sanitiza automáticamente estos campos:**

### `waBusinessBio` y `ocrText`

El sistema detecta y reemplaza:
- 📧 **Emails:** `contacto@ejemplo.com` → `[EMAIL_REDACTED]`
- 📱 **Teléfonos:** `+34 612 34 56 78` → `[PHONE_REDACTED]`
- 🆔 **DNI/NIE:** `12345678Z` → `[DNI_REDACTED]`
- 💳 **Tarjetas:** `4111111111111111` → `[CARD_REDACTED]`
- 🏦 **IBAN:** `ES9121000418450200051332` → `[IBAN_REDACTED]`

**Ejemplo:**

```json
{
  "waBusinessBio": "Empresa líder en reformas. Contacto: juan@reformas.com Tel: 612345678"
}
```

**Se guarda como:**

```
"Empresa líder en reformas. Contacto: [EMAIL_REDACTED] Tel: [PHONE_REDACTED]"
```

**Logs generados:**
```
[PII Sanitizer] Datos sensibles detectados en waBusinessBio
{
  clientId: "uuid",
  detectedTypes: ["email", "phone"],
  redactionCount: 2
}
```

---

## ✅ Respuesta Exitosa

```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "clientId": "uuid-del-cliente",
        "fieldsUpdated": 4,
        "piiSanitized": true,
        "piiTypes": ["bio:email", "bio:phone", "ocr:dni"]
      }
    }
  }
}
```

### Campos de la Respuesta

| Campo           | Tipo       | Descripción                                   |
| --------------- | ---------- | --------------------------------------------- |
| `success`       | `boolean`  | `true` si se guardó correctamente             |
| `clientId`      | `string`   | UUID del cliente actualizado                  |
| `fieldsUpdated` | `number`   | Número de campos actualizados (excluye dates) |
| `piiSanitized`  | `boolean`  | `true` si se detectó y sanitizó PII           |
| `piiTypes`      | `string[]` | Lista de tipos PII detectados (opcional)      |

---

## ❌ Errores Comunes

### 1. Cliente no encontrado (404)

```json
{
  "error": {
    "message": "Cliente no encontrado",
    "code": "NOT_FOUND"
  }
}
```

**Causa:** El `clientId` o `phone` no existe, o no pertenece al usuario autenticado.

**Solución:** Verificar que el cliente existe en Wallie antes de enviar datos.

---

### 2. Token inválido (401)

```json
{
  "error": {
    "message": "UNAUTHORIZED",
    "code": "UNAUTHORIZED"
  }
}
```

**Causa:** JWT token expirado, inválido o no enviado.

**Solución:** Renovar el token del usuario.

---

### 3. Validación fallida (400)

```json
{
  "error": {
    "message": "Invalid input",
    "code": "BAD_REQUEST"
  }
}
```

**Causa:** Formato de datos incorrecto (ej: `googleMapsRating` fuera de rango 0-5).

**Solución:** Revisar validaciones Zod en la tabla de arriba.

---

## 🧪 Ejemplos de Llamadas

### Ejemplo 1: Envío completo con clientId

```bash
curl -X POST https://wallie.pro/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "clientId": "550e8400-e29b-41d4-a716-446655440000",
      "waBusinessBio": "Reformas integrales desde 1995. Llámanos al 612345678 o escríbenos a info@reformas.com",
      "websiteUrl": "https://reformas-ejemplo.com",
      "googleMapsRating": 4.8,
      "googleMapsName": "Reformas Ejemplo S.L.",
      "ocrText": "Logo: REFORMAS SL. CIF: B12345678. Tel: 900123456"
    }
  }'
```

**Resultado:**
```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "clientId": "550e8400-e29b-41d4-a716-446655440000",
        "fieldsUpdated": 5,
        "piiSanitized": true,
        "piiTypes": ["bio:email", "bio:phone", "ocr:phone"]
      }
    }
  }
}
```

**Datos guardados en DB:**
```sql
SELECT
  wa_business_bio,
  website_url,
  google_maps_rating,
  google_maps_name,
  ocr_text
FROM clients
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

**Resultado:**
```
wa_business_bio: "Reformas integrales desde 1995. Llámanos al [PHONE_REDACTED] o escríbenos a [EMAIL_REDACTED]"
website_url: "https://reformas-ejemplo.com"
google_maps_rating: 4.8
google_maps_name: "Reformas Ejemplo S.L."
ocr_text: "Logo: REFORMAS SL. CIF: [DNI_REDACTED]. Tel: [PHONE_REDACTED]"
```

---

### Ejemplo 2: Búsqueda por teléfono (sin clientId)

```bash
curl -X POST https://wallie.pro/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "phone": "+34612345678",
      "googleMapsRating": 4.5,
      "googleMapsName": "Bar Los Amigos"
    }
  }'
```

**Resultado:**
```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "clientId": "uuid-encontrado-por-telefono",
        "fieldsUpdated": 2,
        "piiSanitized": false
      }
    }
  }
}
```

---

### Ejemplo 3: Solo bio (mínimo)

```bash
curl -X POST https://wallie.pro/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "phone": "+34600111222",
      "waBusinessBio": "Peluquería canina profesional"
    }
  }'
```

**Resultado:**
```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "clientId": "uuid-del-cliente",
        "fieldsUpdated": 1,
        "piiSanitized": false
      }
    }
  }
}
```

---

## 📊 Flujo Completo (Diagrama)

```
┌──────────────────┐
│   MiniServer     │ (Usuario escanea QR de WhatsApp)
│   (tu código)    │
└────────┬─────────┘
         │
         │ 1. Escanea QR → Obtiene datos de WhatsApp Business:
         │    - Bio completa
         │    - Website (si lo tiene)
         │    - Foto de perfil → OCR
         │
         │ 2. Busca en Google Maps por nombre/teléfono:
         │    - Rating (1.0 a 5.0)
         │    - Nombre en Maps
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer │
│ Headers:                                                     │
│   Authorization: Bearer <JWT_TOKEN>                         │
│   Content-Type: application/json                            │
│                                                              │
│ Body:                                                        │
│   {                                                          │
│     "json": {                                                │
│       "phone": "+34612345678",                               │
│       "waBusinessBio": "...",                                │
│       "websiteUrl": "https://...",                           │
│       "googleMapsRating": 4.8,                               │
│       "googleMapsName": "...",                               │
│       "ocrText": "..."                                       │
│     }                                                        │
│   }                                                          │
└────────┬────────────────────────────────────────────────────┘
         │
         │ 3. Backend valida con Zod
         │ 4. Busca cliente por phone en DB
         │ 5. Verifica que userId coincide (seguridad)
         │ 6. Sanitiza PII en waBusinessBio y ocrText
         │ 7. Guarda en DB (clients table)
         │
         ▼
┌──────────────────┐
│ PostgreSQL       │
│ (Supabase)       │
│                  │
│ UPDATE clients   │
│ SET              │
│   wa_business_bio = '[SANITIZADO]',
│   website_url = 'https://...',
│   google_maps_rating = 4.8,
│   google_maps_name = '...',
│   ocr_text = '[SANITIZADO]',
│   last_enrichment_at = NOW(),
│   updated_at = NOW()
│ WHERE id = '...' │
│   AND user_id = '...' ✅ Seguridad
└──────────────────┘
         │
         │ 8. Responde al MiniServer:
         │    { "success": true, "fieldsUpdated": 5, "piiSanitized": true }
         │
         ▼
┌──────────────────┐
│   MiniServer     │
│                  │
│ ✅ Log: "Cliente enriquecido exitosamente"
│ ✅ Continúa con el siguiente QR
└──────────────────┘
```

---

## 🧰 Implementación Recomendada (MiniServer)

### Pseudocódigo

```typescript
// En tu MiniServer
import axios from 'axios'

interface EnrichmentData {
  clientId?: string
  phone: string
  waBusinessBio?: string
  websiteUrl?: string | null
  googleMapsRating?: number | null
  googleMapsName?: string | null
  ocrText?: string
}

async function sendEnrichmentToWallie(data: EnrichmentData, userJWT: string) {
  try {
    const response = await axios.post(
      'https://wallie.pro/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer',
      {
        json: data, // ⚠️ IMPORTANTE: Wrapped en "json"
      },
      {
        headers: {
          'Authorization': `Bearer ${userJWT}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const result = response.data.result.data.json

    if (result.success) {
      console.log('✅ Enrichment enviado:', {
        clientId: result.clientId,
        fieldsUpdated: result.fieldsUpdated,
        piiSanitized: result.piiSanitized,
      })

      if (result.piiSanitized) {
        console.warn('⚠️ PII detectada y sanitizada:', result.piiTypes)
      }
    }

    return result
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Error al enviar enrichment:', {
        status: error.response?.status,
        message: error.response?.data?.error?.message,
        code: error.response?.data?.error?.code,
      })
    }
    throw error
  }
}

// Uso:
const enrichmentData = {
  phone: '+34612345678',
  waBusinessBio: 'Texto de la bio...',
  googleMapsRating: 4.8,
  googleMapsName: 'Nombre del negocio',
  websiteUrl: 'https://ejemplo.com',
  ocrText: 'Texto del OCR...',
}

await sendEnrichmentToWallie(enrichmentData, process.env.USER_JWT_TOKEN!)
```

---

## 🔍 Verificación Post-Envío

### Query SQL para verificar que se guardó

```sql
SELECT
  id,
  name,
  phone,
  google_maps_rating,
  google_maps_name,
  wa_business_bio,
  website_url,
  ocr_text,
  last_enrichment_at,
  updated_at
FROM clients
WHERE phone = '+34612345678'
  AND google_maps_rating IS NOT NULL; -- ← Debe tener datos
```

**Resultado esperado:**

```
| id   | name         | phone         | rating | maps_name      | bio                                    | last_enrichment_at   |
|------|--------------|---------------|--------|----------------|----------------------------------------|----------------------|
| uuid | Juan García  | +34612345678  | 4.8    | Reformas SL    | Reformas integrales desde 1995. Llá... | 2025-12-30 12:00:00  |
```

---

## ⚠️ Checklist de Integración

Antes de deployar el MiniServer, verificar:

- [ ] **JWT Token configurado:** Variable `USER_JWT_TOKEN` en .env
- [ ] **URL correcta:** `https://wallie.pro/api/trpc/...` (producción)
- [ ] **Payload wrapped en "json":** `{ "json": { ... } }`
- [ ] **Header Authorization:** `Bearer <token>`
- [ ] **Validación de rating:** 0.0 a 5.0 (no enviar strings)
- [ ] **URL válida:** websiteUrl debe ser URL completa o null
- [ ] **Manejo de errores:** Catch 401, 404, 400
- [ ] **Logs estructurados:** Registrar cada envío exitoso/fallido
- [ ] **Retry logic:** Si falla por timeout, reintentar
- [ ] **Rate limiting:** No enviar > 10 requests/segundo

---

## 🚨 Troubleshooting

### Problema: "Cliente no encontrado con ese teléfono"

**Causa:** El cliente no existe en Wallie, o el teléfono no coincide exactamente.

**Solución:**
1. Normalizar formato de teléfono (siempre con `+` y código país)
2. Verificar que el cliente existe:
   ```sql
   SELECT id, name, phone FROM clients WHERE phone = '+34612345678';
   ```
3. Si no existe, crear el cliente primero en Wallie

---

### Problema: "piiSanitized: true" pero quiero ver los datos originales

**Respuesta:** Por diseño GDPR, los datos sensibles se sanitizan **antes** de guardar en DB.

**Alternativa:**
- Guardar datos originales en **logs locales del MiniServer**
- NO enviar PII a Wallie (solo metadata pública)

---

### Problema: Rating se guarda como NULL

**Causa:** Enviaste `googleMapsRating` como string (`"4.8"` en lugar de `4.8`)

**Solución:**
```javascript
// ❌ MAL
{ googleMapsRating: "4.8" }

// ✅ BIEN
{ googleMapsRating: parseFloat("4.8") }
```

---

## 📚 Referencias

- **Schema DB:** `packages/db/src/schema/clients.ts`
- **Router tRPC:** `packages/api/src/routers/client-enrichment.ts` (línea 394)
- **PII Sanitizer:** `packages/api/src/lib/pii-sanitizer.ts`
- **Documentación MiniServer:** `docs/MINISERVER_INTEGRATION.md`

---

## ✅ Resultado Final Esperado

Después de que el MiniServer envíe datos correctamente:

```sql
SELECT COUNT(*) FROM clients WHERE google_maps_rating >= 4.5;
```

**Antes:**
```
count
-----
0     ❌
```

**Después:**
```
count
-----
5     ✅ ¡Leads de Oro!
```

---

_Creado: 30 Dic 2025_
_Para: Desarrolladores del MiniServer_
_Endpoint Version: v1.0 (estable)_
