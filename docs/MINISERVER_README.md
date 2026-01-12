# 📡 MiniServer Integration Documentation

> **Índice completo de documentación para integrar el MiniServer con Wallie**
> **Fecha:** 30 Dic 2025

---

## 🎯 Propósito

El **MiniServer** es un sistema que extrae datos de WhatsApp Business (bio, website, foto de perfil) y Google Maps (rating, nombre verificado) para enriquecer automáticamente la base de datos de clientes de Wallie.

**Objetivo principal:** Conseguir **Leads de Oro** (clientes con Google Maps rating ≥ 4.5)

---

## 📚 Documentación Disponible

### 🚀 Quick Start (Comienza aquí)

| Documento                          | Propósito                                    | Tiempo   | Audiencia          |
| ---------------------------------- | -------------------------------------------- | -------- | ------------------ |
| **MINISERVER_QUICK_START.md**      | Guía rápida de 5 minutos para integrar      | 5 min    | Desarrolladores    |
| **miniserver-example-client.ts**   | Código de ejemplo ejecutable                 | 10 min   | Desarrolladores    |
| **test-miniserver-endpoint.ts**    | Script para verificar que el endpoint funciona| 5 min    | QA/DevOps          |

**📖 Comienza leyendo:** `MINISERVER_QUICK_START.md`

---

### 📖 Documentación Técnica Completa

| Documento                              | Propósito                                              | Audiencia          |
| -------------------------------------- | ------------------------------------------------------ | ------------------ |
| **MINISERVER_INSTRUCCIONES_ENVIO.md** | Guía completa con todos los detalles del endpoint      | Desarrolladores    |
| **MINISERVER_INTEGRATION.md**         | Documentación original de integración (legacy)         | Arquitectos        |

**🔍 Para debugging:** `MINISERVER_INSTRUCCIONES_ENVIO.md` (sección Troubleshooting)

---

### 🔍 Diagnóstico y Auditoría

| Documento                        | Propósito                                           | Audiencia          |
| -------------------------------- | --------------------------------------------------- | ------------------ |
| **DIAGNOSTICO_RESULTADO.md**     | Análisis completo del problema "No Leads de Oro"   | Product Managers   |
| **DIAGNOSTICO_LEADS_ORO.md**     | Guía de diagnóstico paso a paso                    | Soporte/QA         |
| **diagnose-golden-leads.sql**    | Queries SQL para diagnóstico manual                | DBAs               |
| **verify-golden-leads.ts**       | Script TypeScript para verificar Leads de Oro      | Desarrolladores    |
| **verify-golden-leads.md**       | Guía de verificación manual                        | QA                 |

**🔧 Para troubleshooting:** `DIAGNOSTICO_RESULTADO.md`

---

## 🗂️ Estructura de Archivos

```
docs/
├── MINISERVER_README.md                     # ← Este archivo (índice)
├── MINISERVER_QUICK_START.md                # Guía rápida (5 min)
├── MINISERVER_INSTRUCCIONES_ENVIO.md        # Documentación completa
├── MINISERVER_INTEGRATION.md                # Documentación original (legacy)
├── miniserver-example-client.ts             # Código de ejemplo
├── DIAGNOSTICO_RESULTADO.md                 # Análisis del problema
└── DIAGNOSTICO_LEADS_ORO.md                 # Guía de diagnóstico

scripts/
├── test-miniserver-endpoint.ts              # Test del endpoint
├── verify-golden-leads.ts                   # Verificar Leads de Oro
├── verify-golden-leads.md                   # Guía de verificación
└── diagnose-golden-leads.sql                # Queries SQL de diagnóstico

packages/
└── api/src/routers/client-enrichment.ts     # Código del endpoint (backend)
```

---

## 🎓 Guía de Lectura por Rol

### 👨‍💻 Para Desarrolladores del MiniServer

**Orden recomendado:**

1. **MINISERVER_QUICK_START.md** (5 min) - Visión general
2. **miniserver-example-client.ts** (10 min) - Ver código de ejemplo
3. **MINISERVER_INSTRUCCIONES_ENVIO.md** (20 min) - Detalles técnicos
4. **test-miniserver-endpoint.ts** (5 min) - Testear el endpoint

**Total:** ~40 minutos

---

### 🧪 Para QA/Testing

**Orden recomendado:**

1. **MINISERVER_QUICK_START.md** (5 min) - Entender el flujo
2. **test-miniserver-endpoint.ts** (5 min) - Ejecutar tests
3. **verify-golden-leads.md** (10 min) - Verificar manualmente
4. **DIAGNOSTICO_LEADS_ORO.md** (15 min) - Si algo falla

**Total:** ~35 minutos

---

### 🏗️ Para Product Managers/Arquitectos

**Orden recomendado:**

1. **DIAGNOSTICO_RESULTADO.md** (10 min) - Contexto del problema
2. **MINISERVER_INTEGRATION.md** (15 min) - Arquitectura original
3. **MINISERVER_INSTRUCCIONES_ENVIO.md** (10 min) - Solución implementada

**Total:** ~35 minutos

---

### 🛠️ Para Soporte/DevOps

**Orden recomendado:**

1. **MINISERVER_QUICK_START.md** (5 min) - Entender el flujo
2. **DIAGNOSTICO_RESULTADO.md** (10 min) - Problema conocido
3. **test-miniserver-endpoint.ts** (5 min) - Verificar endpoint
4. **diagnose-golden-leads.sql** (10 min) - Queries de diagnóstico

**Total:** ~30 minutos

---

## 🔥 Problema Actual (30 Dic 2025)

### Estado

```sql
SELECT COUNT(*) FROM clients WHERE google_maps_rating >= 4.5;
-- Result: 0 ❌ (debería haber al menos 5)
```

### Causa Raíz

- **31 clientes** existen en la DB
- **0 clientes** tienen datos de enrichment (`google_maps_rating`, `wa_business_bio`, etc.)
- **Pipeline de enrichment NO está operativo**

### Solución

El MiniServer debe:

1. Escanear QR de WhatsApp Business → Extraer bio, website, OCR de foto
2. Buscar en Google Maps → Extraer rating (0-5) y nombre verificado
3. **Enviar a Wallie** usando el endpoint `receiveEnrichmentFromMiniServer`

**Endpoint:**
```
POST https://wallie.pro/api/trpc/clientEnrichment.receiveEnrichmentFromMiniServer
```

**Payload mínimo:**
```json
{
  "json": {
    "phone": "+34612345678",
    "googleMapsRating": 4.8
  }
}
```

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Ver detalles completos en:** `MINISERVER_QUICK_START.md`

---

## ✅ Checklist de Integración

### Para el MiniServer (equipo externo)

- [ ] Leer `MINISERVER_QUICK_START.md`
- [ ] Obtener JWT token del usuario
- [ ] Implementar función de envío (ver `miniserver-example-client.ts`)
- [ ] Enviar datos mínimos: `phone` + `googleMapsRating`
- [ ] Testear con `test-miniserver-endpoint.ts`
- [ ] Verificar que se guarda con `verify-golden-leads.ts`
- [ ] Deploy a producción

### Para Wallie (backend)

- [x] Endpoint `receiveEnrichmentFromMiniServer` existe
- [x] Validación Zod implementada
- [x] Sanitización PII automática (GDPR)
- [x] Logs estructurados (Sentry)
- [x] Documentación completa

---

## 🧪 Testing

### Test Automático

```bash
# 1. Configurar token
export JWT_TOKEN="tu-jwt-token-de-supabase"

# 2. Ejecutar tests
cd C:\_WALLIE
npx tsx scripts/test-miniserver-endpoint.ts
```

**Tests incluidos:**
1. ✅ Endpoint existe
2. ✅ Autenticación requerida (401 sin token)
3. ✅ Token inválido rechazado (401)
4. ✅ Cliente no encontrado (404)
5. ✅ Enrichment exitoso (200)
6. ✅ Datos guardados en DB

---

### Test Manual (curl)

```bash
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

---

### Verificación en DB

```sql
-- Verificar que se guardó
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

---

## 📊 Métricas de Éxito

### Antes (30 Dic 2025)

```sql
-- Leads de Oro
SELECT COUNT(*) FROM clients WHERE google_maps_rating >= 4.5;
-- Result: 0 ❌

-- Clientes con enrichment
SELECT COUNT(*) FROM clients WHERE google_maps_rating IS NOT NULL;
-- Result: 0 ❌

-- Total clientes
SELECT COUNT(*) FROM clients;
-- Result: 31 ✅
```

### Después (Objetivo)

```sql
-- Leads de Oro (objetivo: mínimo 5)
SELECT COUNT(*) FROM clients WHERE google_maps_rating >= 4.5;
-- Result: 5+ ✅

-- Clientes con enrichment (objetivo: 50%+)
SELECT COUNT(*) FROM clients WHERE google_maps_rating IS NOT NULL;
-- Result: 15+ ✅

-- Tasa de enrichment
SELECT
  COUNT(*) FILTER (WHERE google_maps_rating IS NOT NULL) * 100.0 / COUNT(*) AS enrichment_rate
FROM clients;
-- Result: 50%+ ✅
```

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: "Cliente no encontrado"

**Síntoma:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Cliente no encontrado con ese teléfono"
  }
}
```

**Solución:**
1. Verificar que el cliente existe:
   ```sql
   SELECT id, name, phone FROM clients WHERE phone = '+34612345678';
   ```
2. Normalizar formato de teléfono (siempre con `+` y código país)

**Ver más en:** `MINISERVER_INSTRUCCIONES_ENVIO.md` (sección Troubleshooting)

---

### Problema 2: Token expirado

**Síntoma:**
```json
{
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

**Solución:**
1. Renovar JWT token (hacer login en Wallie)
2. Actualizar `JWT_TOKEN` en .env del MiniServer

---

### Problema 3: Rating se guarda como NULL

**Síntoma:**
```sql
SELECT google_maps_rating FROM clients WHERE phone = '+34612345678';
-- Result: NULL
```

**Causa:** Enviaste `googleMapsRating` como string (`"4.8"`) en lugar de número (`4.8`)

**Solución:**
```javascript
// ❌ MAL
{ googleMapsRating: "4.8" }

// ✅ BIEN
{ googleMapsRating: parseFloat("4.8") }
```

---

## 📞 Contacto y Soporte

### Para reportar problemas

1. **Issue tracker:** GitHub (si aplica)
2. **Logs:** Verificar logs en Sentry (producción)
3. **Database:** Revisar con queries de diagnóstico (`diagnose-golden-leads.sql`)

### Para preguntas técnicas

- **Documentación completa:** `MINISERVER_INSTRUCCIONES_ENVIO.md`
- **Ejemplos de código:** `miniserver-example-client.ts`
- **Troubleshooting:** `DIAGNOSTICO_RESULTADO.md`

---

## 🔄 Historial de Cambios

### v1.0.0 - 30 Dic 2025

- ✅ Documentación completa creada
- ✅ Endpoint `receiveEnrichmentFromMiniServer` verificado
- ✅ Scripts de testing implementados
- ✅ Diagnóstico del problema "No Leads de Oro" completado
- ✅ Ejemplos de código completos
- ✅ Guías de integración para todos los roles

---

## 📚 Referencias Adicionales

### Backend (Wallie)

- **Router tRPC:** `packages/api/src/routers/client-enrichment.ts` (línea 394)
- **Schema DB:** `packages/db/src/schema/clients.ts`
- **PII Sanitizer:** `packages/api/src/lib/pii-sanitizer.ts`

### Tecnologías

- **tRPC:** https://trpc.io/
- **Zod:** https://zod.dev/
- **Supabase Auth:** https://supabase.com/docs/guides/auth

---

## ✨ Next Steps

### Para el MiniServer

1. **Leer Quick Start** → `MINISERVER_QUICK_START.md`
2. **Implementar cliente** → Usar `miniserver-example-client.ts` como template
3. **Testear endpoint** → `npx tsx scripts/test-miniserver-endpoint.ts`
4. **Deploy a producción** → Enviar datos reales
5. **Verificar Leads de Oro** → `npx tsx scripts/verify-golden-leads.ts`

### Para Wallie

1. **Monitorear logs** → Verificar que requests llegan correctamente
2. **Verificar métricas** → Dashboard de enrichment (TODO: crear)
3. **Optimizar PII sanitizer** → Si hay falsos positivos

---

_Documentación completa - 30 Dic 2025_
_Mantenido por: Equipo Wallie_
