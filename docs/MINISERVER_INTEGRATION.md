# 📡 MiniServer Integration Guide

## Documentación de Integración: MiniServer → Wallie Backend

Este documento describe cómo el **MiniServer** (servidor local del usuario) debe enviar datos enriquecidos de WhatsApp Business al backend de Wallie.

---

## 🎯 Objetivo

El MiniServer escanea códigos QR de WhatsApp y extrae metadatos enriquecidos:

- **Bio de WhatsApp Business** (descripción del negocio)
- **Website URL** (si está en el perfil)
- **Google Maps Rating** (rating de 0 a 5 estrellas)
- **Google Maps Name** (nombre del negocio en Maps)
- **OCR Text** (texto extraído de la foto de perfil usando Tesseract/similar)

Estos datos se envían al backend de Wallie para:

1. **Enriquecer** el perfil del cliente automáticamente
2. **Sanitizar PII** (datos personales sensibles) antes de guardarlos
3. **Priorizar leads** con alta calificación de Google Maps
4. **Facilitar conversión** de lead → cliente

---

## 🔌 Endpoint de Integración

### POST `clientEnrichment.receiveEnrichmentFromMiniServer`

**URL tRPC:**

```
POST https://tu-dominio.com/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer
```

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer <USER_JWT_TOKEN>
```

**Body (tRPC format):**

```json
{
  "json": {
    "phone": "+34612345678",
    "waBusinessBio": "Somos una empresa de reformas...",
    "websiteUrl": "https://www.ejemplo.com",
    "googleMapsRating": 4.7,
    "googleMapsName": "Reformas Ejemplo S.L.",
    "ocrText": "Texto extraído de la imagen de perfil"
  }
}
```

---

## 📋 Esquema de Datos

### Request Schema

| Campo              | Tipo   | Requerido | Descripción                                 | Ejemplo                          |
| ------------------ | ------ | --------- | ------------------------------------------- | -------------------------------- |
| `phone`            | string | ✅        | Teléfono del cliente (para buscar en DB)    | `"+34612345678"`                 |
| `clientId`         | string | ❌        | UUID del cliente (alternativa a phone)      | `"uuid-del-cliente"`             |
| `waBusinessBio`    | string | ❌        | Bio de WhatsApp Business (se sanitizará)    | `"Empresa de reformas desde..."` |
| `websiteUrl`       | string | ❌        | URL del website (debe ser URL válida)       | `"https://ejemplo.com"`          |
| `googleMapsRating` | number | ❌        | Rating de Google Maps (0.00 - 5.00)         | `4.7`                            |
| `googleMapsName`   | string | ❌        | Nombre del negocio en Google Maps           | `"Reformas Ejemplo S.L."`        |
| `ocrText`          | string | ❌        | Texto OCR de foto de perfil (se sanitizará) | `"Texto extraído..."`            |

**Notas importantes:**

- ✅ **Se requiere `phone` O `clientId`** (al menos uno)
- 🔒 **`waBusinessBio` y `ocrText`** se sanitizan automáticamente para remover PII
- ⚠️ **`googleMapsRating`** debe estar entre 0.00 y 5.00
- ⚠️ **`websiteUrl`** debe ser una URL válida (formato `https://...`)

---

### Response Schema

```json
{
  "result": {
    "data": {
      "success": true,
      "clientId": "uuid-del-cliente",
      "fieldsUpdated": 5,
      "piiSanitized": true,
      "piiTypes": ["bio:email", "ocr:dni"]
    }
  }
}
```

| Campo           | Tipo     | Descripción                         |
| --------------- | -------- | ----------------------------------- |
| `success`       | boolean  | `true` si se procesó correctamente  |
| `clientId`      | string   | UUID del cliente actualizado        |
| `fieldsUpdated` | number   | Cantidad de campos actualizados     |
| `piiSanitized`  | boolean  | `true` si se detectó y sanitizó PII |
| `piiTypes`      | string[] | Tipos de PII detectados (si hay)    |

---

## 🔒 PII Sanitization (GDPR Compliance)

El backend **detecta y redacta automáticamente** los siguientes tipos de datos sensibles:

| Tipo PII       | Patrón detectado             | Ejemplo Input      | Output Sanitizado        |
| -------------- | ---------------------------- | ------------------ | ------------------------ |
| **Tarjetas**   | Visa, Mastercard, Amex, etc. | `4111111111111111` | `[CREDIT_CARD_REDACTED]` |
| **Emails**     | `usuario@dominio.com`        | `info@negocio.com` | `[EMAIL_REDACTED]`       |
| **Teléfonos**  | Formatos internacionales     | `+34600111222`     | `[PHONE_REDACTED]`       |
| **DNI/NIE**    | Formato español `12345678A`  | `87654321B`        | `[DNI_REDACTED]`         |
| **SSN**        | Formato USA `123-45-6789`    | `111-22-3333`      | `[SSN_REDACTED]`         |
| **IPs**        | IPv4 / IPv6                  | `192.168.1.1`      | `[IP_REDACTED]`          |
| **API Keys**   | Patrones `sk-`, `pk-`, etc.  | `sk-ant-api03-xxx` | `[API_KEY_REDACTED]`     |
| **JWT Tokens** | Tokens con formato `eyJ...`  | `eyJhbGc...`       | `[JWT_REDACTED]`         |

### Ejemplo de Sanitización

**Input (MiniServer):**

```json
{
  "waBusinessBio": "Empresa familiar. Email: contacto@negocio.com. DNI: 12345678A",
  "ocrText": "Tarjeta Visa: 4111111111111111. Llamar al +34600111222"
}
```

**Output (Guardado en DB):**

```json
{
  "waBusinessBio": "Empresa familiar. Email: [EMAIL_REDACTED]. DNI: [DNI_REDACTED]",
  "ocrText": "Tarjeta Visa: [CREDIT_CARD_REDACTED]. Llamar al [PHONE_REDACTED]"
}
```

**Logs de Auditoría (Sentry):**

```
[PII Sanitizer] Datos sensibles detectados en waBusinessBio
  clientId: "uuid-123"
  detectedTypes: ["email", "dni"]
  redactionCount: 2
```

---

## 🚀 Flujo de Integración

```
┌─────────────┐
│ MiniServer  │
│  (Usuario)  │
└──────┬──────┘
       │ 1. Escanea QR de WhatsApp Business
       │ 2. Extrae: Bio, Website, Google Maps rating, OCR
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  POST /api/trpc/clientEnrichment.receiveEnrichment │
└──────┬──────────────────────────────────────────────┘
       │ 3. Valida con Zod
       │ 4. Busca cliente por phone o clientId
       │
       ▼
┌──────────────────┐
│  PII Sanitizer   │ ← 5. Sanitiza waBusinessBio y ocrText
└──────┬───────────┘
       │ 6. Detecta: emails, DNI, tarjetas, etc.
       │ 7. Redacta datos sensibles
       │
       ▼
┌──────────────────┐
│  PostgreSQL DB   │ ← 8. Guarda datos limpios
│  (Supabase)      │
└──────┬───────────┘
       │ 9. Actualiza: wa_business_bio, google_maps_rating, etc.
       │ 10. Timestamp: last_enrichment_at = NOW()
       │
       ▼
┌────────────────────┐
│  Admin Dashboard   │ ← 11. Admin ve leads enriquecidos
│  /admin/enriched-  │      en orden de prioridad
│  leads             │
└────────────────────┘
```

---

## 💻 Ejemplo de Implementación (Python)

### Para el MiniServer (Python)

```python
import requests
import json

# Configuración
API_URL = "https://wallie-app.com"  # Cambiar por tu dominio
USER_JWT_TOKEN = "eyJhbGc..."  # Token JWT del usuario (obtener de Supabase Auth)

def send_enrichment_data(phone, bio, website, rating, maps_name, ocr_text):
    """
    Envía datos enriquecidos al backend de Wallie
    """
    endpoint = f"{API_URL}/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {USER_JWT_TOKEN}"
    }

    payload = {
        "json": {
            "phone": phone,
            "waBusinessBio": bio,
            "websiteUrl": website,
            "googleMapsRating": rating,
            "googleMapsName": maps_name,
            "ocrText": ocr_text
        }
    }

    response = requests.post(endpoint, headers=headers, json=payload)

    if response.status_code == 200:
        result = response.json()
        print(f"✅ Datos enviados: {result['result']['data']}")

        if result['result']['data'].get('piiSanitized'):
            print(f"🔒 PII detectado: {result['result']['data']['piiTypes']}")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")

    return response

# Ejemplo de uso
send_enrichment_data(
    phone="+34612345678",
    bio="Somos una empresa de reformas con +15 años de experiencia",
    website="https://www.ejemplo.com",
    rating=4.7,
    maps_name="Reformas Ejemplo S.L.",
    ocr_text="Texto extraído de la imagen de perfil"
)
```

---

## 🧪 Testing

### Script de Testing Incluido

```bash
# 1. Configurar token (desde DevTools → Application → Cookies)
export API_TOKEN="Bearer tu-jwt-token"

# 2. Ejecutar tests
node scripts/test-miniserver-enrichment.mjs
```

El script incluye 3 casos de prueba:

1. ✅ **Datos completos** - Todos los campos
2. ✅ **Datos mínimos** - Solo campos obligatorios
3. 🔒 **PII Sanitization** - Datos con PII para verificar sanitización

---

## 🔐 Autenticación

### Obtener JWT Token

El MiniServer debe autenticarse con un JWT token válido del usuario.

**Opción 1: Desde el navegador (testing)**

```
1. Abre DevTools → Application → Cookies
2. Copia el valor de "sb-access-token"
3. Úsalo en header: Authorization: Bearer <token>
```

**Opción 2: Login programático (producción)**

```bash
curl -X POST https://wallie-app.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@ejemplo.com", "password": "..."}'
```

---

## 👁️ Visualización Admin

Los datos enriquecidos solo son visibles para **administradores** en:

**URL:** `https://wallie-app.com/admin/enriched-leads`

**Características:**

- 📊 Lista de leads ordenados por `lastEnrichmentAt` (más recientes primero)
- ⭐ Rating de Google Maps destacado
- 🌐 Links clicables a websites
- 📝 Bio de WhatsApp Business (sanitizada)
- ✅ Botón "Promover" → Convierte lead en cliente (`pipelineStatus: contacted`)
- ❌ Botón "Descartar" → Marca lead como perdido

---

## ⚠️ Errores Comunes

| Error Code | Mensaje                         | Causa                       | Solución                       |
| ---------- | ------------------------------- | --------------------------- | ------------------------------ |
| 401        | Unauthorized                    | Token JWT inválido/expirado | Renovar token de autenticación |
| 404        | Cliente no encontrado           | `phone` no existe en DB     | Crear cliente primero          |
| 400        | `googleMapsRating` must be <= 5 | Rating fuera de rango       | Usar valores 0.00 - 5.00       |
| 400        | Invalid URL                     | `websiteUrl` mal formada    | Usar formato `https://...`     |

---

## 📊 Métricas y Monitoreo

### Logs Estructurados (Sentry)

Cada envío genera logs con:

```json
{
  "message": "[MiniServer Enrichment] Datos recibidos y sanitizados",
  "clientId": "uuid-123",
  "clientName": "Juan García",
  "fieldsUpdated": ["waBusinessBio", "googleMapsRating", "websiteUrl"],
  "piiDetected": ["bio:email", "ocr:dni"]
}
```

### Endpoint de Estadísticas

```bash
GET /api/trpc/clientEnrichment.getStats
```

Retorna:

- Total de clientes enriquecidos
- Promedio de confidence
- Tasa de enriquecimiento

---

## 📚 Referencias

- **Schema DB:** `packages/db/src/schema/clients.ts`
- **Router Backend:** `packages/api/src/routers/client-enrichment.ts`
- **PII Sanitizer:** `packages/api/src/lib/pii-sanitizer.ts`
- **UI Admin:** `apps/web/src/app/admin/enriched-leads/page.tsx`

---

## 🆘 Soporte

Para problemas de integración:

1. Revisar logs de Sentry (`[MiniServer Enrichment]`)
2. Verificar que el cliente existe en DB antes de enriquecer
3. Testear con `scripts/test-miniserver-enrichment.mjs`
4. Contactar al equipo de desarrollo

---

**Última actualización:** 26 Dic 2024
**Versión API:** v1.0
**Mantenedor:** Arquitecto de Datos de Wallie
