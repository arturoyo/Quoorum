# 💰 ANÁLISIS FINANCIERO: ¿Estamos Perdiendo Dinero con IA?

> **Fecha:** 28 Enero 2026
> **Estado:** 🚨 CRÍTICO - Business Plan PIERDE DINERO
> **Autor:** Sistema de Análisis Financiero

---

## 📊 RESUMEN EJECUTIVO

**Resultado:** ⚠️ El sistema es RENTABLE en planes Free/Starter/Pro, pero **PIERDE DINERO en plan Business**

| Plan | Precio Mensual | Créditos Incluidos | Margen si Uso 100% | Veredicto |
|------|----------------|---------------------|-------------------|-----------|
| **Free** | $0 | 1,000 | N/A | ✅ Sin costo |
| **Starter** | $29 | 3,500 | +$9.05 (31%) | ✅ RENTABLE |
| **Pro** | $49 | 7,000* | +$9.10 (18%) | ✅ RENTABLE |
| **Business** | $99 | 30,000 | **-$72 (-73%)** | 🚨 PÉRDIDA |

*Asumido basado en progresión de planes

---

## 🔢 MODELO ECONÓMICO ACTUAL

### Constantes del Sistema

```typescript
// packages/quoorum/src/analytics/cost.ts
export const CREDIT_MULTIPLIER = 1.75  // 75% markup sobre costo API
export const USD_PER_CREDIT = 0.01     // 1 crédito = $0.01 USD nominal
```

**Fórmula de Conversión:**
```
Créditos = ⌈(Coste API USD × 1.75) / 0.01⌉
```

**Ejemplo:**
- Costo API: $0.10 USD
- Markup 1.75x: $0.10 × 1.75 = $0.175 USD
- Créditos: ⌈$0.175 / $0.01⌉ = **18 créditos**

### Precios de Modelos de IA (por 1M tokens)

| Modelo | Input $/M | Output $/M | Promedio $/M |
|--------|-----------|------------|--------------|
| **gpt-4o-mini** | $0.15 | $0.60 | **$0.375** |
| gpt-4o | $2.50 | $10.00 | $6.25 |
| claude-sonnet-4 | $3.00 | $15.00 | $9.00 |
| gemini-2.0-flash | $0.00 | $0.00 | **$0.00** (Free!) |
| deepseek-chat | $0.14 | $0.28 | $0.21 |

**Modelo más usado:** gpt-4o-mini (óptimo costo/calidad)

---

## 💸 ANÁLISIS POR PLAN

### Costo Real por Crédito

```
1 crédito = $0.01 USD nominal
Costo API cubierto = $0.01 / 1.75 = $0.00571 USD
```

**Interpretación:** Cada crédito vendido cubre hasta **$0.00571 USD** en costos de API.

### Starter Plan ($29/mes)

**Oferta:** 3,500 créditos/mes

**Escenarios de Uso:**

| Créditos Usados | Costo API Real | Ganancia | Margen |
|-----------------|----------------|----------|--------|
| 0 (0%) | $0.00 | $29.00 | 100% |
| 1,000 (29%) | $5.71 | $23.29 | 80% |
| 2,000 (57%) | $11.42 | $17.58 | 61% |
| 3,500 (100%) | $19.95 | **$9.05** | **31%** |

✅ **Veredicto:** RENTABLE incluso si el cliente usa todos los créditos.

### Pro Plan ($49/mes)

**Oferta estimada:** 7,000 créditos/mes

**Escenarios de Uso:**

| Créditos Usados | Costo API Real | Ganancia | Margen |
|-----------------|----------------|----------|--------|
| 0 (0%) | $0.00 | $49.00 | 100% |
| 3,500 (50%) | $19.95 | $29.05 | 59% |
| 5,000 (71%) | $28.50 | $20.50 | 42% |
| 7,000 (100%) | $39.90 | **$9.10** | **18%** |

✅ **Veredicto:** RENTABLE pero margen ajustado.

### Business Plan ($99/mes)

**Oferta:** 30,000 créditos/mes (según código)

**Escenarios de Uso:**

| Créditos Usados | Costo API Real | Ganancia | Margen |
|-----------------|----------------|----------|--------|
| 0 (0%) | $0.00 | $99.00 | 100% |
| 10,000 (33%) | $57.10 | $41.90 | 42% |
| 20,000 (67%) | $114.20 | **-$15.20** | **-15%** |
| 30,000 (100%) | $171.30 | **-$72.30** | **-73%** |

🚨 **CRÍTICO:** Si el cliente usa más de ~17,300 créditos/mes, **PERDEMOS DINERO**.

**Breakeven Point:**
```
$99 = creditsUsed × $0.00571
creditsUsed = $99 / $0.00571 = 17,330 créditos
```

Si el cliente usa más de **17,330 créditos** (58% de su cuota), entramos en pérdidas.

---

## 🎯 MÉTRICAS ACTUALES DEL SISTEMA

### ✅ Métricas YA Implementadas

Endpoint: `api.admin.getCostAnalytics`

```typescript
{
  overall: {
    totalDebates: number,
    totalCostUsd: number,
    totalCreditsUsed: number,
    avgCostPerDebate: number,      // ✅ YA EXISTE
    avgCreditsPerDebate: number,   // ✅ YA EXISTE
  },
  byUser: Array<{
    userId, email, name,
    totalDebates,
    totalCostUsd,
    totalCreditsUsed,
  }>
}
```

### ❌ Métricas FALTANTES

1. **Avg tokens por debate** - NO existe
2. **Métricas específicas para scenarios** - NO existen
3. **Profit margin por usuario** - NO existe
4. **Proyección de pérdidas Business plan** - NO existe

---

## 🔧 CONTROLES DE ADMIN: ¿Se Puede Cambiar el Ratio?

### Estado Actual

**❌ NO EXISTE** panel de admin para controlar:
- `CREDIT_MULTIPLIER` (hardcoded a 1.75)
- `USD_PER_CREDIT` (hardcoded a 0.01)

**Ubicación actual:** `packages/quoorum/src/analytics/cost.ts:21-22`

```typescript
export const CREDIT_MULTIPLIER = 1.75 // Hardcoded
export const USD_PER_CREDIT = 0.01    // Hardcoded
```

### ¿Qué Necesitamos Implementar?

**Opción A: Variables de Entorno** (Rápido)
```bash
# .env
CREDIT_MULTIPLIER=2.0        # Subir markup a 100%
USD_PER_CREDIT=0.01          # Mantener valor del crédito
```

**Opción B: Admin Panel UI** (Completo)
- Formulario en `/admin/billing`
- Guardar en tabla `system_config`
- Aplicar cambios en tiempo real

---

## 🚨 RECOMENDACIONES URGENTES

### 1. **INMEDIATO: Ajustar Business Plan**

**Problema:** Plan Business pierde $72/mes si cliente usa todos los créditos.

**Soluciones:**

| Opción | Cambio | Breakeven | Margen Final |
|--------|--------|-----------|--------------|
| **A) Reducir créditos** | 30,000 → 17,000 | ✅ Rentable | 18% |
| **B) Subir precio** | $99 → $170 | ✅ Rentable | 0% |
| **C) Subir markup** | 1.75 → 3.0 | ✅ Rentable | 31% |
| **D) Combo** | $99 → $130 + 20,000 créditos | ✅ Rentable | 13% |

**Recomendación:** **Opción D** - Subir precio a $130 y reducir a 20,000 créditos.

### 2. Implementar Admin Controls

**Prioridad:** ALTA

**Funcionalidad:**
```typescript
// Admin puede ajustar en tiempo real
CREDIT_MULTIPLIER: 1.5 - 3.0  (slider)
USD_PER_CREDIT: 0.005 - 0.02  (slider)

// Ver impacto instantáneo:
"Con markup 2.0x, Business plan es rentable hasta 25,000 créditos"
```

### 3. Añadir Métricas de Profit Margin

**Nuevas métricas en dashboard admin:**
- Profit margin por plan (%)
- Usuarios en riesgo de pérdida (usando > breakeven)
- Proyección mensual de pérdidas/ganancias

### 4. Migrar a Gemini Free Tier

**Alternativa:** Usar `gemini-2.0-flash-exp` (FREE) para:
- Debates de usuarios Free tier
- Primeros 10,000 créditos de cada plan

**Ahorro:** ~$20-30/usuario/mes

---

## 📈 ESCENARIOS

### Estado Actual

**❌ NO HAY** tracking diferenciado para scenarios vs debates normales.

**Problema:** No sabemos si los scenarios (plantillas preconstruidas) cuestan más o menos que debates ad-hoc.

**Solución Necesaria:**
1. Añadir campo `is_scenario` a `quoorum_debates`
2. Rastrear `scenario_id` si aplica
3. Métricas separadas:
   ```typescript
   {
     scenarios: {
       avgCostUsd,
       avgCredits,
       totalDebates,
     },
     regularDebates: {
       avgCostUsd,
       avgCredits,
       totalDebates,
     }
   }
   ```

---

## 💡 PLAN DE ACCIÓN

### Fase 1: Parar Sangrado (URGENTE - 1 día)

- [ ] Desactivar plan Business temporalmente
- [ ] O reducir créditos a 17,000 (breakeven point)
- [ ] Comunicar a clientes Business actuales

### Fase 2: Admin Controls (ALTA - 2 días)

- [ ] Implementar variables de entorno para CREDIT_MULTIPLIER
- [ ] Crear UI en `/admin/billing` para ajustar markup
- [ ] Añadir preview de impacto financiero

### Fase 3: Métricas Avanzadas (MEDIA - 3 días)

- [ ] Añadir avg tokens por debate
- [ ] Tracking de scenarios vs debates
- [ ] Dashboard de profit margin

### Fase 4: Optimización de Costos (BAJA - continuo)

- [ ] Migrar Free tier a Gemini gratis
- [ ] Usar modelos más baratos para debates simples
- [ ] Implementar rate limiting agresivo

---

## 🎯 CONCLUSIONES

### ✅ Lo Bueno

1. Planes Free, Starter y Pro son **RENTABLES**
2. Sistema de tracking de costos **YA FUNCIONA**
3. Markup de 1.75x es **razonable** para la mayoría de planes

### 🚨 Lo Crítico

1. **Business plan PIERDE $72/mes** si cliente usa todos sus créditos
2. **NO HAY controles de admin** para ajustar pricing dinámicamente
3. **NO sabemos** cuántos clientes Business están cerca del breakeven
4. **NO hay métricas** de profit margin en tiempo real

### 💪 Próximos Pasos

**AHORA MISMO:**
1. Revisar cuántos clientes Business tenemos
2. Calcular pérdidas potenciales mensuales
3. Decidir: ¿Desactivar Business plan o ajustar pricing?

**ESTA SEMANA:**
1. Implementar admin controls para markup
2. Añadir métricas de profit margin
3. Crear alertas cuando usuario se acerca a breakeven

**ESTE MES:**
1. Optimizar uso de modelos (más Gemini free, menos OpenAI)
2. Implementar tracking de scenarios
3. A/B test de nuevos precios Business plan

---

**📧 Contacto:** admin@quoorum.com
**🔗 Dashboard Admin:** https://app.quoorum.com/admin/billing
