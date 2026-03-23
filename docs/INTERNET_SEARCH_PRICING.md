# 💰 Búsqueda en Internet - Sistema de Precios

> **Versión:** 1.0.0 | **Última actualización:** 23 Ene 2026
> **Proyecto:** Quoorum - Sistema de Debates Multi-Agente IA

---

## 📋 RESUMEN

La búsqueda en internet es una funcionalidad premium que permite enriquecer el contexto de los debates con información actualizada de la web.

### 💵 Costo por Búsqueda

| Concepto | Valor |
|----------|-------|
| **Costo API (Serper)** | $0.005 USD por búsqueda |
| **Multiplicador de Servicio** | 1.75x |
| **Costo Final** | $0.00875 USD |
| **Créditos Requeridos** | **1 crédito** por búsqueda |

**Fórmula:** `Créditos = ⌈($0.005 × 1.75) / 0.01⌉ = ⌈0.875⌉ = 1 crédito`

---

## 🎯 LÍMITES POR TIER

| Tier | Búsquedas/Día | Notas |
|------|---------------|-------|
| **Free** | 5 | Incluidas gratis (5 créditos/día) |
| **Starter** | 20 | 1 crédito por búsqueda adicional |
| **Pro** | 100 | 1 crédito por búsqueda adicional |
| **Enterprise** | Ilimitadas | Sin límite de búsquedas |

### 📊 Desglose por Tier

#### Free Tier
- **5 búsquedas gratis por día** (incluidas en el plan)
- Después de 5 búsquedas, se requieren créditos adicionales
- **Costo:** 1 crédito por búsqueda adicional

#### Starter Tier
- **20 búsquedas por día** (incluidas en el plan)
- Después de 20 búsquedas, se requieren créditos adicionales
- **Costo:** 1 crédito por búsqueda adicional

#### Pro Tier
- **100 búsquedas por día** (incluidas en el plan)
- Después de 100 búsquedas, se requieren créditos adicionales
- **Costo:** 1 crédito por búsqueda adicional

#### Enterprise Tier
- **Búsquedas ilimitadas**
- Sin costo adicional
- Sin límite diario

---

## 🔄 FLUJO DE COBRO

### 1. Verificación de Créditos
```typescript
// Antes de buscar, se verifica que el usuario tenga créditos suficientes
const hasCredits = await hasSufficientCredits(userId, 1) // 1 crédito
if (!hasCredits) {
  throw new Error('Créditos insuficientes')
}
```

### 2. Deducción Atómica
```typescript
// Se deducen los créditos ANTES de realizar la búsqueda
const deductionResult = await deductCredits(userId, 1)
if (!deductionResult.success) {
  throw new Error('Error al deducir créditos')
}
```

### 3. Ejecución de Búsqueda
```typescript
// Se realiza la búsqueda en internet
const result = await performAutoResearch(question)
```

### 4. Refund en Caso de Error
```typescript
// Si la búsqueda falla, se reembolsan los créditos
if (error) {
  await refundCredits(userId, 1, undefined, 'Búsqueda falló')
}
```

---

## 📊 MARGEN DE BENEFICIO

| Concepto | Valor |
|----------|-------|
| **Costo Real (Serper API)** | $0.005 USD |
| **Costo con Margen (1.75x)** | $0.00875 USD |
| **Precio al Usuario** | 1 crédito = $0.01 USD |
| **Margen Bruto** | **$0.00425 USD** (85% de margen) |

**Nota:** El margen de beneficio es del **85%**, similar al margen aplicado a otros servicios de IA.

---

## 🎨 EXPERIENCIA DE USUARIO

### Antes de Buscar
El usuario ve un mensaje informativo:
```
🔍 Esta búsqueda consumirá 1 crédito (~$0.01 USD)
Buscaremos información relevante en internet para enriquecer el contexto de tu debate
```

### Durante la Búsqueda
Se muestra un indicador:
```
Buscando en internet...
Buscando: "[pregunta principal] [pregunta actual]"
```

### Después de Buscar
Se informa al usuario:
```
✅ 5 resultados encontrados
Créditos usados: 1 crédito
```

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Endpoint: `contextAssessment.autoResearch`

**Input:**
```typescript
{
  question: string // Pregunta a buscar
  detectedDomain?: string // Dominio detectado (opcional)
}
```

**Output:**
```typescript
{
  question: string
  researchResults: ResearchResult[]
  suggestedContext: Record<string, unknown>
  executionTimeMs: number
  detectedDomain: string
  creditsUsed: number // 1 crédito
  costUsd: number // $0.00875 USD
}
```

### Archivos Modificados

1. **`packages/api/src/routers/context-assessment.ts`**
   - Añadida deducción de créditos antes de buscar
   - Añadido refund en caso de error
   - Añadidos `creditsUsed` y `costUsd` en respuesta

2. **`packages/quoorum/src/rate-limiting-advanced.ts`**
   - Añadido `internetSearchesPerDay` a `RateLimitTier`
   - Definidos límites por tier

3. **`apps/web/src/app/debates/new-unified/components/question-card.tsx`**
   - Añadido mensaje informativo sobre costo de búsqueda

---

## 📈 MÉTRICAS Y MONITOREO

### Métricas a Rastrear

- **Búsquedas realizadas por día**
- **Créditos consumidos por búsquedas**
- **Tasa de éxito de búsquedas** (resultados encontrados vs. fallos)
- **Tiempo promedio de búsqueda**
- **Búsquedas por tier**

### Alertas

- **Límite diario alcanzado** (por tier)
- **Créditos insuficientes** (más de 3 intentos fallidos)
- **Tasa de error alta** (>10% de búsquedas fallan)

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Implementado:** Deducción de créditos
2. ✅ **Implementado:** Límites por tier
3. ✅ **Implementado:** Mensaje informativo al usuario
4. 📋 **Pendiente:** Dashboard de métricas de búsquedas
5. 📋 **Pendiente:** Notificaciones cuando se alcanza el límite diario
6. 📋 **Pendiente:** Historial de búsquedas realizadas

---

## 📝 NOTAS ADICIONALES

- **Costo Real:** El costo de Serper API puede variar según el volumen. El precio de $0.005 es un promedio conservador.
- **Fallback:** Si Serper API no está configurado, se usa búsqueda AI-only (sin costo adicional).
- **Cache:** Los resultados de búsqueda se cachean por 1 hora para evitar búsquedas duplicadas.

---

_Última actualización: 23 Ene 2026_
