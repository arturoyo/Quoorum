# Forum - TODO de Trabajo Real (Para IA que SÍ trabaje)

## 📍 Ubicación
Este documento está en: `/home/ubuntu/Wallie/FORUM_TODO_TRABAJO.md`

## 🎯 Objetivo
Completar el Sistema de Forum al 100% funcional. No código bonito, sino **código que FUNCIONA**.

---

## ✅ Checklist de Trabajo

### Phase 1: Backend Core (2-3 días)

#### 1.1 Dynamic System Flow
- [ ] Leer `runner-dynamic.ts` línea por línea
- [ ] Verificar que `runDebate()` funciona end-to-end
- [ ] Testear con pregunta real: "¿Debería Wallie subir precios?"
- [ ] Verificar que devuelve `DebateResult` completo
- [ ] Añadir try/catch en todas las funciones async
- [ ] Añadir logging en cada paso crítico
- [ ] Si falla, debuggear hasta que funcione

**Comando para testear:**
```typescript
import { runDebate } from '@wallie/forum'

const result = await runDebate({
  sessionId: 'test-1',
  question: '¿Debería Wallie subir precios?',
  context: { documents: [], metadata: {} }
})

console.log('Result:', result)
```

#### 1.2 Expert Matching
- [ ] Leer `expert-matcher.ts`
- [ ] Verificar que `matchExperts()` devuelve expertos relevantes
- [ ] Testear con 10 preguntas diferentes
- [ ] Verificar que el scoring tiene sentido
- [ ] Si devuelve expertos irrelevantes, ajustar algoritmo

#### 1.3 Quality Monitor
- [ ] Leer `quality-monitor.ts`
- [ ] Verificar que `analyzeDebateQuality()` funciona
- [ ] Testear con debate real
- [ ] Verificar que detecta problemas (repetición, off-topic, etc.)
- [ ] Ajustar thresholds si es necesario

#### 1.4 Meta-Moderator
- [ ] Leer `meta-moderator.ts`
- [ ] Verificar que `shouldIntervene()` funciona
- [ ] Verificar que `generateIntervention()` genera prompts útiles
- [ ] Testear en debate real
- [ ] Ajustar frecuencia de intervención si es spam

#### 1.5 Learning System
- [ ] Leer `learning-system.ts`
- [ ] Implementar storage real (DB o in-memory)
- [ ] Testear que guarda performance de expertos
- [ ] Testear que actualiza scores después de debates
- [ ] Verificar que `getTopExperts()` devuelve los mejores

---

### Phase 2: Integraciones (1-2 días)

#### 2.1 Pinecone (Vector DB)
- [ ] Leer `integrations/pinecone.ts`
- [ ] Añadir check: `if (!envConfig.pinecone.enabled) return fallback`
- [ ] Implementar fallback: usar similarity básica con embeddings en memoria
- [ ] Testear con API key real (si existe)
- [ ] Testear sin API key (debe usar fallback)
- [ ] Logging claro de qué modo está usando

#### 2.2 Serper (Search API)
- [ ] Leer `integrations/serper.ts`
- [ ] Añadir check: `if (!envConfig.serper.enabled) return fallback`
- [ ] Implementar fallback: devolver contexto vacío con warning
- [ ] Testear con API key real (si existe)
- [ ] Testear sin API key (debe usar fallback)

#### 2.3 Redis (Caching)
- [ ] Leer `integrations/redis.ts`
- [ ] Añadir check: `if (!envConfig.redis.enabled) use in-memory`
- [ ] Implementar in-memory cache con Map()
- [ ] Testear con Redis real (si existe)
- [ ] Testear sin Redis (debe usar in-memory)
- [ ] Verificar que TTL funciona

#### 2.4 Slack/Discord
- [ ] Leer `integrations/messaging.ts`
- [ ] Añadir check: `if (!envConfig.slack.enabled) skip`
- [ ] No fallar si webhook no existe, solo loguear
- [ ] Testear con webhook real (si existe)
- [ ] Testear sin webhook (debe skip silenciosamente)

---

### Phase 3: API (tRPC Router) (0.5 días)

#### 3.1 Testear Endpoints
- [ ] Leer `packages/api/src/routers/forum.ts`
- [ ] Para cada endpoint, crear test manual:

**list:**
```typescript
const debates = await api.forum.list.query({ limit: 10 })
console.log('Debates:', debates)
```

**create:**
```typescript
const debate = await api.forum.create.mutate({
  question: 'Test question',
  context: {}
})
console.log('Created:', debate)
```

**start:**
```typescript
const result = await api.forum.start.mutate({
  debateId: 'xxx'
})
console.log('Result:', result)
```

- [ ] Verificar que TODOS los endpoints responden
- [ ] Añadir validación de inputs con zod
- [ ] Añadir error handling con try/catch
- [ ] Logging de todas las requests

---

### Phase 4: Frontend (1 día)

#### 4.1 Debate Viewer
- [ ] Abrir `apps/web/src/components/forum/debate-viewer.tsx`
- [ ] Verificar que renderiza sin errores
- [ ] Conectar con API real (no mocks)
- [ ] Testear con debate real
- [ ] Añadir error states
- [ ] Añadir loading states
- [ ] Añadir empty states

#### 4.2 Analytics Dashboard
- [ ] Abrir `analytics-dashboard.tsx`
- [ ] Conectar con API real
- [ ] Verificar que charts renderizan
- [ ] Testear con datos reales
- [ ] Añadir error/loading/empty states

#### 4.3 Command Palette
- [ ] Verificar que Cmd+K abre el palette
- [ ] Testear cada comando
- [ ] Verificar que ejecutan acciones reales
- [ ] Añadir feedback visual

---

### Phase 5: WebSocket (0.5 días)

#### 5.1 Servidor
- [ ] Leer `websocket-server.ts`
- [ ] Crear script para iniciar servidor: `pnpm ws:start`
- [ ] Verificar que servidor inicia en puerto 3001
- [ ] Testear conexión con cliente de prueba

#### 5.2 Cliente
- [ ] Abrir `apps/web/src/providers/websocket-provider.tsx`
- [ ] Verificar que conecta con servidor
- [ ] Testear que recibe mensajes
- [ ] Testear reconnection
- [ ] Añadir error handling

---

### Phase 6: E2E Testing (1 día)

#### 6.1 Flow Completo
1. Usuario crea debate
2. Debate se ejecuta
3. Resultados se muestran en UI
4. Analytics se actualizan
5. PDF se exporta

- [ ] Ejecutar flow completo manualmente
- [ ] Documentar cada paso
- [ ] Tomar screenshots
- [ ] Identificar bugs
- [ ] Fixear bugs
- [ ] Repetir hasta que funcione 100%

#### 6.2 Edge Cases
- [ ] Debate sin contexto
- [ ] Pregunta muy larga
- [ ] Pregunta muy corta
- [ ] Sin internet
- [ ] Sin API keys
- [ ] DB caída
- [ ] Redis caído

---

### Phase 7: Cleanup (0.5 días)

#### 7.1 Eliminar Código No Funcional
- [ ] Buscar archivos con TODOs
- [ ] Buscar funciones placeholder
- [ ] Eliminar o completar
- [ ] No dejar código a medias

#### 7.2 Actualizar Documentación
- [ ] Actualizar README con setup real
- [ ] Actualizar DEPLOYMENT.md con pasos reales
- [ ] Crear TROUBLESHOOTING.md con problemas comunes
- [ ] Actualizar API_DOCUMENTATION.md con endpoints reales

---

## 🚀 Instrucciones para IA

### Reglas de Oro

1. **NO INVENTES**: Si algo no funciona, NO digas que funciona
2. **TESTEA TODO**: Cada función, cada endpoint, cada componente
3. **LOGUEA TODO**: Usa logger, no console.log
4. **MANEJA ERRORES**: try/catch en TODAS las funciones async
5. **FALLBACKS**: Si API no existe, usa fallback, NO falles
6. **DOCUMENTA**: Cada cambio, cada fix, cada decisión

### Workflow

Para cada tarea del checklist:

1. **Leer** el código actual
2. **Entender** qué hace
3. **Testear** si funciona
4. **Si funciona**: Marcar ✅ y continuar
5. **Si NO funciona**: 
   - Identificar el problema
   - Fixear
   - Testear de nuevo
   - Repetir hasta que funcione
   - Marcar ✅
6. **Commit** cada vez que completes una sección

### Comandos Útiles

```bash
# Testear TypeScript
cd packages/forum && pnpm typecheck

# Ejecutar tests
cd packages/forum && pnpm test

# Iniciar dev server
cd apps/web && pnpm dev

# Iniciar WebSocket server
cd packages/forum && node -r esbuild-register src/websocket-server.ts

# Ver logs
tail -f logs/forum.log
```

### Criterio de Éxito

Una tarea está ✅ cuando:
1. El código compila sin errores
2. Los tests pasan
3. Funciona manualmente (testeado)
4. Tiene error handling
5. Tiene logging
6. Tiene fallbacks (si aplica)
7. Está documentado

---

## 📊 Progreso

**Última actualización:** 2026-01-01

| Phase | Completado | Total | %  |
|-------|------------|-------|----|
| 1. Backend Core | 0 | 5 | 0% |
| 2. Integraciones | 0 | 4 | 0% |
| 3. API | 0 | 1 | 0% |
| 4. Frontend | 0 | 3 | 0% |
| 5. WebSocket | 0 | 2 | 0% |
| 6. E2E | 0 | 2 | 0% |
| 7. Cleanup | 0 | 2 | 0% |
| **TOTAL** | **0** | **19** | **0%** |

---

## 🎯 Objetivo Final

Sistema de Forum que:
- ✅ Funciona end-to-end
- ✅ Maneja errores elegantemente
- ✅ Tiene fallbacks para integraciones opcionales
- ✅ Está testeado manualmente
- ✅ Está documentado
- ✅ Está listo para deploy

**NO** necesita:
- ❌ Tests automatizados completos (nice to have)
- ❌ Performance optimization (se hace después)
- ❌ Features del roadmap (se hacen después)
- ❌ Código perfecto (se refactoriza después)

**SÍ** necesita:
- ✅ Funcionar
- ✅ No romper
- ✅ Tener fallbacks
- ✅ Estar documentado

---

## 💪 Motivación

Este sistema va a revolucionar cómo Wallie toma decisiones. Pero solo si FUNCIONA.

No importa que el código sea perfecto. Importa que FUNCIONE.

**Let's fucking do this.** 🚀
