# 📧 Mensaje para el Equipo del MiniServer

> **Copia y pega esto para enviar al equipo responsable del MiniServer**

---

## Para: Equipo MiniServer
## De: Equipo Wallie
## Asunto: Integración MiniServer → Wallie (Envío de Datos de Enrichment)
## Fecha: 30 Dic 2025
## Prioridad: Alta ⚠️

---

## 🎯 Objetivo

Necesitamos que el MiniServer envíe los datos de enrichment (Google Maps rating, WhatsApp bio, etc.) a Wallie para poder identificar **Leads de Oro** (clientes con rating ≥ 4.5).

**Estado actual:** 31 clientes en la DB, **0 con datos de enrichment** ❌

---

## 📡 Endpoint que deben llamar

```
POST https://wallie.pro/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer
```

---

## 🔑 Autenticación

```http
Authorization: Bearer <JWT_TOKEN_DEL_USUARIO>
Content-Type: application/json
```

El usuario debe configurar su `JWT_TOKEN` en el MiniServer (se obtiene al hacer login en Wallie).

---

## 📦 Formato del Payload

```json
{
  "json": {
    "phone": "+34612345678",
    "googleMapsRating": 4.8,
    "googleMapsName": "Nombre del negocio en Google Maps",
    "waBusinessBio": "Bio completa de WhatsApp Business",
    "websiteUrl": "https://ejemplo.com",
    "ocrText": "Texto extraído de la foto de perfil"
  }
}
```

### Campos Requeridos

| Campo                | Tipo     | Requerido | Validación         | Notas                              |
| -------------------- | -------- | --------- | ------------------ | ---------------------------------- |
| `phone`              | `string` | ✅ Sí     | Formato +34...     | O enviar `clientId` (UUID)         |
| `googleMapsRating`   | `number` | ⭐ Crítico | 0.0 - 5.0          | **Necesario para Leads de Oro**    |
| `googleMapsName`     | `string` | No        | Texto libre        | Recomendado                        |
| `waBusinessBio`      | `string` | No        | Texto libre        | Se sanitiza automáticamente (PII)  |
| `websiteUrl`         | `string` | No        | URL válida o null  | Opcional                           |
| `ocrText`            | `string` | No        | Texto libre        | Se sanitiza automáticamente (PII)  |

**⚠️ IMPORTANTE:** `googleMapsRating` debe ser **número** (4.8), NO string ("4.8")

---

## ✅ Ejemplo de Llamada (cURL)

```bash
curl -X POST https://wallie.pro/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "phone": "+34612345678",
      "googleMapsRating": 4.8,
      "googleMapsName": "Reformas Ejemplo S.L.",
      "waBusinessBio": "Reformas integrales desde 1995. Contacto: info@reformas.com"
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
        "clientId": "uuid-del-cliente",
        "fieldsUpdated": 3,
        "piiSanitized": true
      }
    }
  }
}
```

---

## 🔒 Sanitización PII (Automática)

El backend sanitiza automáticamente emails, teléfonos, DNI, etc. en `waBusinessBio` y `ocrText`:

**Ejemplo:**
```
Input:  "Contacto: juan@reformas.com Tel: 612345678"
Output: "Contacto: [EMAIL_REDACTED] Tel: [PHONE_REDACTED]"
```

**No es necesario hacer nada en el MiniServer**, Wallie se encarga de cumplir GDPR.

---

## 🧪 Verificación

Después de enviar datos, verificar en Supabase:

```sql
SELECT
  name,
  phone,
  google_maps_rating,
  google_maps_name,
  last_enrichment_at
FROM clients
WHERE phone = '+34612345678'
  AND google_maps_rating IS NOT NULL;
```

**Debe mostrar el cliente con los datos enriquecidos.**

---

## 📚 Documentación Completa

Hemos preparado documentación completa para facilitar la integración:

1. **Guía rápida (5 min):** `docs/MINISERVER_QUICK_START.md`
2. **Documentación completa:** `docs/MINISERVER_INSTRUCCIONES_ENVIO.md`
3. **Código de ejemplo ejecutable:** `docs/miniserver-example-client.ts`
4. **Script de test:** `scripts/test-miniserver-endpoint.ts`

**Acceso:** `C:\_WALLIE\docs\MINISERVER_README.md` (índice completo)

---

## 🚨 Errores Comunes

### 1. "Cliente no encontrado" (404)

**Causa:** El `phone` no existe en Wallie o no coincide exactamente.

**Solución:** Normalizar formato (`+34612345678`) y verificar que el cliente existe.

---

### 2. "UNAUTHORIZED" (401)

**Causa:** JWT token inválido o expirado.

**Solución:** Renovar token (hacer login en Wallie y copiar nuevo token).

---

### 3. Rating se guarda como NULL

**Causa:** Enviaste `googleMapsRating` como string.

**Solución:**
```javascript
// ❌ MAL
{ googleMapsRating: "4.8" }

// ✅ BIEN
{ googleMapsRating: 4.8 }
{ googleMapsRating: parseFloat("4.8") }
```

---

## ✅ Checklist de Implementación

- [ ] Configurar `JWT_TOKEN` en .env del MiniServer
- [ ] Implementar función de envío a Wallie
- [ ] Enviar `phone` + `googleMapsRating` (mínimo)
- [ ] Validar que `googleMapsRating` es número (0.0 - 5.0)
- [ ] Testear con curl o script de test
- [ ] Verificar en Supabase que se guardó
- [ ] Implementar manejo de errores (401, 404, 400)
- [ ] Implementar rate limiting (max 10 req/s)
- [ ] Deploy a producción
- [ ] Monitorear logs de éxito/fallo

---

## 🎯 Resultado Esperado

**Antes:**
```sql
SELECT COUNT(*) FROM clients WHERE google_maps_rating >= 4.5;
-- Result: 0 ❌
```

**Después (con MiniServer funcionando):**
```sql
SELECT COUNT(*) FROM clients WHERE google_maps_rating >= 4.5;
-- Result: 5+ ✅ ¡Leads de Oro conseguidos!
```

---

## 📞 Soporte

- **Documentación completa:** `C:\_WALLIE\docs\MINISERVER_README.md`
- **Troubleshooting:** `C:\_WALLIE\docs\MINISERVER_INSTRUCCIONES_ENVIO.md` (sección final)
- **Diagnóstico:** `C:\_WALLIE\docs\DIAGNOSTICO_RESULTADO.md`

**Para dudas técnicas:** Revisar primero la documentación completa.

---

## ⏱️ Tiempo Estimado de Implementación

- **Lectura de docs:** 15 minutos
- **Implementación básica:** 30 minutos
- **Testing:** 10 minutos
- **Total:** ~1 hora

---

**Prioridad:** Alta ⚠️
**Bloqueante:** Sí (necesitamos Leads de Oro para funcionalidad crítica)
**Deadline sugerida:** ASAP

---

_Mensaje generado: 30 Dic 2025_
_Equipo Wallie - Backend Team_
