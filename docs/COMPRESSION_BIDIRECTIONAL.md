# 🔄 Sistema de Compresión Bidireccional

> **Fecha:** 23 Ene 2026  
> **Estado:** ✅ Implementado y activo

---

## 🎯 Objetivo

**Comprimir información antes de enviarla a la IA y descomprimir después para mostrar al usuario**, reduciendo significativamente el consumo de tokens sin sacrificar la experiencia del usuario.

---

## 📊 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. buildAgentPrompt() → Prompt completo (pregunta + contexto) │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. compressInput(prompt) → Comprimir si >200 tokens         │
│    - Usa gemini-2.0-flash-exp (free tier)                  │
│    - Reduce 30-50% de tokens                               │
│    - Si falla → usa original (fallback seguro)             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. IA genera respuesta en formato comprimido                │
│    - Formato: 💡49€ ✓77%📈 WTP✓ 👑pos ⚠️🐌adopt 75% 👍2   │
│    - ~15 tokens vs 150+ tokens sin comprimir               │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. decompressOutput(respuesta) → Traducir a texto legible   │
│    - Usa gemini-2.0-flash-exp (free tier)                   │
│    - Expande emojis y símbolos a texto completo             │
│    - Si falla → muestra original (mejor que nada)           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Guardar ambos:                                           │
│    - content: Versión expandida (para mostrar al usuario)   │
│    - compressedContent: Versión original (para análisis)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementación

### 1. Compresión de Input (`compressInput`)

**Ubicación:** `packages/quoorum/src/ultra-language.ts`

**Funcionalidad:**
- Comprime contexto/prompt antes de enviarlo a la IA
- Solo comprime si el contexto es >100 tokens (evita overhead)
- Usa `gemini-2.0-flash-exp` (free tier) para comprimir
- Verifica que la compresión reduzca al menos 30% de tokens
- Si falla o no reduce suficiente, usa el original

**Ejemplo:**
```typescript
const original = "La opción de 49 euros tiene un margen del 77% que es positivo..."
const compressed = await compressInput(original)
// Resultado: "O49€ ✓77%📈 WTP✓ 👑pos ⚠️🐌adopt 75% 👍2"
// Ahorro: ~70% de tokens
```

### 2. Descompresión de Output (`decompressOutput`)

**Ubicación:** `packages/quoorum/src/ultra-language.ts`

**Funcionalidad:**
- Traduce respuesta comprimida de la IA a texto legible
- Detecta si el mensaje está comprimido (emojis, símbolos)
- Si no está comprimido, lo devuelve tal cual
- Usa `gemini-2.0-flash-exp` (free tier) para traducir
- Si falla, devuelve el mensaje original

**Ejemplo:**
```typescript
const compressed = "💡49€ ✓77%📈 WTP✓ 👑pos ⚠️🐌adopt 75% 👍2"
const expanded = await decompressOutput(compressed)
// Resultado: "La opción de 49 euros tiene un margen del 77% que es positivo, 
//            el willingness to pay está validado, hay posicionamiento premium 
//            pero riesgo de adopción lenta, probabilidad de éxito del 75% con 2 apoyos"
```

### 3. Integración en el Flujo

**Archivos modificados:**
- `packages/quoorum/src/runner-dynamic.ts` (líneas 750-800)
- `packages/quoorum/src/runner.ts` (líneas 390-443)
- `packages/quoorum/src/types.ts` (añadido campo `compressedContent`)

**Flujo en `generateAgentResponse`:**
```typescript
// 1. Comprimir prompt (si es largo)
const compressedPrompt = originalTokens > 200 
  ? await compressInput(prompt)
  : prompt

// 2. Enviar a IA (con retry logic)
const response = await retryWithBackoff(
  () => client.generate(compressedPrompt, {...})
)

// 3. Descomprimir respuesta
const expandedContent = await decompressOutput(response.text)

// 4. Guardar ambos
return {
  content: expandedContent,        // Para mostrar al usuario
  compressedContent: response.text, // Para análisis
  // ...
}
```

---

## 💰 Ahorro Estimado

### Input (Contexto)
- **Antes:** 500-1000 tokens por prompt (contexto + rondas previas)
- **Después:** 250-500 tokens (comprimido)
- **Ahorro:** 30-50% de tokens

### Output (Respuestas)
- **Antes:** 150-300 tokens por respuesta
- **Después:** 15-30 tokens (formato comprimido)
- **Ahorro:** 90% de tokens

### Ahorro Total
- **Por debate (5 rondas, 4 agentes):**
  - Input: 500 tokens × 20 mensajes = 10,000 tokens → 5,000 tokens (50% ahorro)
  - Output: 200 tokens × 20 mensajes = 4,000 tokens → 400 tokens (90% ahorro)
  - **Total: 14,000 tokens → 5,400 tokens (61% ahorro)**

---

## 🎨 Formato de Compresión

### Emojis (1 token cada uno)
- 💰 = dinero/precio
- 📈 = tendencia positiva
- 📉 = tendencia negativa
- ✓ = sí/positivo
- ✗ = no/negativo
- ⚠️ = riesgo
- 🎯 = objetivo
- 👑 = premium
- 🐌 = lento
- 🚀 = rápido
- 👍 = apoyo
- 👎 = rechazo
- 🔥 = crítico
- 💡 = idea

### Símbolos
- ∆ = cambio
- → = implica
- ∴ = por tanto
- ≈ = aproximadamente
- ↑↓ = sube/baja

### Abreviaturas
- O = Opción
- R = Riesgo
- S = Score
- P = Pros
- C = Cons
- A = Apoyan
- WTP = Willingness to Pay
- PMF = Product-Market Fit

### Ejemplo Completo
```
Input (150 tokens):
"La opción de 49 euros tiene un margen del 77% que es positivo, 
el willingness to pay está validado, hay posicionamiento premium 
pero riesgo de adopción lenta, probabilidad de éxito del 75% con 2 apoyos"

Output (15 tokens):
"💡49€ ✓77%📈 WTP✓ 👑pos ⚠️🐌adopt 75% 👍2"
```

---

## ⚙️ Configuración

### Thresholds
- **Input compression:** Solo si contexto >200 tokens
- **Output decompression:** Solo si detecta marcadores de compresión
- **Compression validation:** Debe reducir al menos 30% de tokens

### Modelos Usados
- **Compresión:** `gemini-2.0-flash-exp` (free tier)
- **Descompresión:** `gemini-2.0-flash-exp` (free tier)
- **Temperatura:** 0.1-0.3 (baja para mantener precisión)

### Fallbacks
- Si compresión falla → usa original
- Si descompresión falla → muestra original (mejor que nada)
- Si contexto muy corto → no comprime (evita overhead)

---

## 📈 Métricas y Monitoreo

### Logs
```typescript
quoorumLogger.debug(`[Compression] Input compressed: ${originalTokens} → ${compressedTokens} tokens (saved ${tokensSaved})`, {
  sessionId,
  agentName: agent.name,
  round,
})
```

### Datos Guardados
```typescript
{
  content: string,              // Versión expandida (para UI)
  compressedContent?: string,    // Versión original (para análisis)
  tokensUsed: number,           // Tokens del comprimido (para costo)
  // ...
}
```

---

## 🧪 Testing

**Archivo:** `packages/quoorum/src/__tests__/compression-bidirectional.test.ts`

**Tests incluidos:**
- ✅ No comprimir si contexto muy corto
- ✅ Comprimir contexto largo
- ✅ Fallback si compresión falla
- ✅ No descomprimir si no tiene marcadores
- ✅ Descomprimir mensaje con emojis
- ✅ Ciclo completo (compresión → IA → descompresión)
- ✅ Cálculo de ahorro de tokens

---

## 🚀 Próximos Pasos (Opcional)

### Optimizaciones Futuras
1. **Cache de compresiones:** Cachear compresiones de contextos similares
2. **Compresión incremental:** Comprimir solo las partes nuevas del contexto
3. **Compresión adaptativa:** Ajustar nivel de compresión según tipo de debate
4. **Métricas avanzadas:** Tracking de ahorro por debate/usuario

---

## ⚠️ Notas Importantes

1. **No crítico:** Si la compresión falla, el sistema funciona normalmente (usa original)
2. **Free tier:** Usa modelos gratuitos para compresión/descompresión (no añade costos)
3. **Precisión:** Baja temperatura (0.1-0.3) mantiene precisión en traducción
4. **UX:** El usuario siempre ve texto legible, nunca formato comprimido

---

_Última actualización: 23 Ene 2026_
