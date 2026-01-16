# 🧪 Instrucciones para Probar los Fixes del Sistema de Debates

## 📋 Cambios Implementados (3 commits)

### 1. ✅ **Commit `55ca087`** - Mensajes visibles con expand/collapse
- Los mensajes de cada agente se muestran en tiempo real
- Auto-expansión durante deliberación activa
- Auto-colapso al pasar a siguiente fase
- Click manual para expandir/colapsar
- Barra de progreso por ronda

### 2. ✅ **Commit `9a381a3`** - Ranking relevante a la pregunta
- El consensus ahora recibe la pregunta original
- Extrae opciones que responden DIRECTAMENTE la pregunta
- Ejemplo: "ChatGPT" vs "Perplexity" (no "OpenSource")

### 3. ✅ **Commit `a6f17ac`** - Mensajes legibles (sin emojis)
- Eliminado sistema ultra-comprimido (15 tokens max)
- Mensajes ahora en español claro: 1-3 oraciones, 150 tokens
- ANTES: `"🤔ambas? R↑PMF↓ ∵datos opacos"`
- AHORA: `"Perplexity ofrece búsqueda en tiempo real..."`

---

## 🚀 Cómo Probar

### Paso 1: Abrir la aplicación
```
http://localhost:3000/debates/new
```

### Paso 2: Autenticarse
Si no estás autenticado, la app te redirigirá a `/login`.

### Paso 3: Crear nuevo debate
Usa esta pregunta de prueba:
```
¿Qué es mejor ChatGPT o Perplexity para programar?
```

### Paso 4: Observar la interfaz en tiempo real

---

## 🎯 QUÉ DEBERÍAS VER

### ✅ Durante la Deliberación

#### Fase Expandida Automáticamente
- La fase "deliberando" se expande sola
- Las fases anteriores se colapsan automáticamente

#### Mensajes de Agentes Visibles
Cada mensaje debe mostrar:

```
┌─────────────────────────────────────────────────┐
│ 🤖 Optimista          [Gemini 2.0 Flash]       │
├─────────────────────────────────────────────────┤
│ "Perplexity ofrece búsqueda en tiempo real     │
│  integrada, lo cual es valioso para            │
│  programación actual."                          │
│                                                 │
│ 10:23:45                                        │
└─────────────────────────────────────────────────┘
```

**Elementos clave:**
- ✅ Nombre del agente (Optimista, Analista, Crítico, Sintetizador)
- ✅ Modelo de IA usado (Gemini 2.0 Flash, GPT-4o Mini, etc.)
- ✅ Contenido LEGIBLE (1-3 oraciones claras en español)
- ✅ Timestamp

#### Múltiples Agentes Participan
Deberías ver mensajes de:
- 🟢 Optimista
- 🔵 Analista
- 🔴 Crítico
- 🟣 Sintetizador
- (Y posiblemente otros expertos dinámicos)

**⚠️ PROBLEMA si solo ves al Crítico**

#### Barra de Progreso
```
Progreso de la ronda
3 de ~5 agentes
███████████████░░░░░  60%
```

#### Interactividad
- Click en cualquier fase para expandir/colapsar manualmente
- Las fases completadas muestran ✅
- La fase activa muestra spinner animado

---

### ✅ Resultado Final

#### Ranking de Opciones RELEVANTES
El ranking final debe mostrar opciones que **responden directamente** la pregunta:

```
📊 Ranking Final de Opciones

1. ChatGPT
   Success Rate: 65%
   Confidence: 80%
   Pros: Mejor comprensión de código, más modelos disponibles
   Cons: Sin búsqueda en tiempo real
   Supporters: Optimista, Analista

2. Perplexity
   Success Rate: 55%
   Confidence: 75%
   Pros: Búsqueda en tiempo real, fuentes citadas
   Cons: Menos potente en reasoning complejo
   Supporters: Crítico

3. Usar ambos según contexto
   Success Rate: 75%
   Confidence: 85%
   Pros: Aprovecha fortalezas de cada uno
   Cons: Requiere más tiempo
   Supporters: Sintetizador, Analista
```

#### ❌ NO Deberías Ver Esto:
```
❌ INCORRECTO:
1. OpenSource 0.0%
2. A/B Testing 0.0%
3. User Segmentation 0.0%
```
(Estas opciones NO responden la pregunta original)

---

## 🔍 Checklist de Verificación

### Durante el Debate:
- [ ] ✅ Fase "deliberando" se expande automáticamente
- [ ] ✅ Veo mensajes de **múltiples agentes** (no solo el crítico)
- [ ] ✅ Los mensajes son **legibles** (español claro, no emojis)
- [ ] ✅ Cada mensaje muestra nombre de agente + modelo
- [ ] ✅ Barra de progreso se actualiza: "X de ~Y agentes"
- [ ] ✅ Al pasar a otra fase, la anterior se colapsa
- [ ] ✅ Puedo expandir/colapsar manualmente con click

### Resultado Final:
- [ ] ✅ El ranking muestra opciones **relevantes**:
  - "ChatGPT"
  - "Perplexity"
  - "Usar ambos según contexto"
  - Etc.
- [ ] ❌ El ranking NO muestra conceptos genéricos:
  - "OpenSource"
  - "A/B Testing"
  - "User Segmentation"
  - Etc.

---

## 📸 Capturas de Pantalla Recomendadas

Para verificar todo funciona:

1. **Captura de pantalla durante deliberación**
   - Mostrando fase expandida con mensajes de agentes

2. **Captura del ranking final**
   - Mostrando las opciones extraídas

3. **Captura de fase colapsada**
   - Mostrando que se pueden colapsar manualmente

---

## 🐛 Si Encuentras Problemas

### Problema 1: Solo participa el Crítico
**Causa:** Puede que los otros agentes no se estén llamando
**Solución:** Revisar logs del servidor, verificar que `agentOrder` incluye todos los agentes

### Problema 2: Mensajes siguen siendo emojis comprimidos
**Causa:** El código no se recompilÓ correctamente
**Solución:**
```bash
# Reiniciar servidor
pnpm dev --filter @quoorum/web
```

### Problema 3: Ranking muestra opciones irrelevantes
**Causa:** El modelo de consenso no está recibiendo la pregunta
**Solución:** Verificar que `checkConsensus()` recibe el parámetro `question`

---

## 📊 Ver Debates Existentes

También puedes ver debates ya completados en:
```
http://localhost:3000/debates
```

Busca debates con preguntas similares para comparar el antes/después.

---

## ✨ Resultado Esperado

Si todo funciona correctamente, deberías tener una experiencia como esta:

1. **Visibilidad total** de lo que cada agente está pensando
2. **Interactividad fluida** con expand/collapse
3. **Rankings relevantes** que responden directamente la pregunta
4. **Mensajes legibles** que puedes entender sin decodificar emojis

**🎉 ¡Disfruta viendo a los agentes debatir en tiempo real!**
