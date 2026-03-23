# 🎨 Propuesta: Sistema de Creación de Debates Tipo Typeform

## 📋 Resumen Ejecutivo

Combinar lo mejor de `/debates/new` (estructura de 4 fases) y `/debates/new-v2` (chat guiado) en una experiencia tipo **Typeform**: una pregunta a la vez, visual, progresiva y amigable.

---

## 🎯 Objetivos

1. **Experiencia más amigable**: Una pregunta/paso a la vez, sin abrumar
2. **Visual y progresivo**: Indicador de fases arriba (tipo Typeform)
3. **Inteligente**: Combina chat guiado con estructura de fases
4. **Flexible**: Permite avanzar/retroceder entre fases

---

## 🏗️ Arquitectura Propuesta

### **5 Fases Visuales (Indicador Superior)**

```
┌─────────────────────────────────────────────────────────┐
│  [1] Contexto  →  [2] Expertos  →  [3] Estrategia  →   │
│  [4] Revisión  →  [5] Debate                           │
│                                                         │
│  Progreso: ████████░░░░░░░░░░ 40%                      │
└─────────────────────────────────────────────────────────┘
```

### **Fase 1: Contexto (40% del peso)**
- **Modo Typeform**: Una pregunta a la vez
- **Chat guiado**: IA hace preguntas, usuario responde
- **Progreso visual**: Barra de progreso por pregunta
- **Opciones**:
  - Responder con texto libre
  - Seleccionar de opciones múltiples
  - Subir archivos de contexto
  - Usar ejemplos/templates

**Flujo**:
1. Usuario escribe pregunta inicial
2. IA genera preguntas críticas (una por una)
3. Usuario responde cada pregunta
4. IA evalúa contexto y genera más preguntas si es necesario
5. Al completar → Avanza a Fase 2

### **Fase 2: Expertos (20% del peso)**
- **Selector visual**: Grid de expertos con avatares
- **Recomendaciones IA**: "Basado en tu contexto, recomendamos..."
- **Búsqueda y filtros**: Por dominio, especialidad, etc.
- **Departamentos opcionales**: Si aplica

### **Fase 3: Estrategia (20% del peso)**
- **Cards visuales**: Cada estrategia con descripción e icono
- **Recomendación IA**: "Para tu caso, recomendamos..."
- **Preview**: Vista previa de cómo funcionará el debate

### **Fase 4: Revisión (NUEVA - 10% del peso)**
- **Resumen visual**: Todo lo configurado
- **Editar cualquier fase**: Click para volver atrás
- **Preview del debate**: Cómo se verá
- **Confirmar y crear**

### **Fase 5: Debate (10% del peso)**
- **Debate activo**: Interfaz de chat
- **Mensajes en tiempo real**
- **Resultados y consenso**

---

## 🎨 Diseño Visual Tipo Typeform

### **Características Clave**:

1. **Una pregunta a la vez**:
   - Pregunta grande y clara en el centro
   - Campo de respuesta destacado
   - Botones de acción claros (Siguiente, Atrás, Saltar)

2. **Indicador de fases arriba**:
   - 5 círculos numerados con líneas conectadas
   - Fase actual resaltada
   - Fases completadas con check ✓
   - Fases pendientes grises

3. **Animaciones suaves**:
   - Transición entre preguntas (slide)
   - Barra de progreso animada
   - Feedback visual al responder

4. **Responsive y centrado**:
   - Contenido centrado vertical y horizontalmente
   - Máximo ancho para legibilidad
   - Fondo con gradiente sutil

---

## 🔄 Flujo de Usuario

```
1. Usuario entra → Ve Fase 1, Pregunta 1
   ↓
2. Responde pregunta → Click "Siguiente"
   ↓
3. IA muestra siguiente pregunta (animación slide)
   ↓
4. Repite hasta completar Fase 1
   ↓
5. Transición suave a Fase 2 (Expertos)
   ↓
6. Selecciona expertos → Click "Siguiente"
   ↓
7. Fase 3 (Estrategia) → Selecciona estrategia
   ↓
8. Fase 4 (Revisión) → Revisa todo, puede editar
   ↓
9. Click "Crear Debate" → Fase 5 (Debate activo)
```

---

## 💡 Ventajas de Esta Propuesta

### ✅ **Mejor UX**:
- No abruma: una cosa a la vez
- Progreso claro: siempre sabes dónde estás
- Visual y amigable: tipo Typeform es familiar

### ✅ **Combina lo mejor**:
- Chat guiado de `new-v2` (preguntas inteligentes)
- Estructura de `new` (4 fases claras)
- Nueva fase de revisión (evita errores)

### ✅ **Flexible**:
- Puede avanzar/retroceder
- Puede editar fases anteriores
- Puede saltar preguntas opcionales

### ✅ **Inteligente**:
- IA recomienda expertos y estrategias
- Evalúa contexto en tiempo real
- Sugiere mejoras

---

## 🛠️ Implementación Técnica

### **Estructura de Archivos**:

```
apps/web/src/app/debates/new-unified/
├── page.tsx                    # Componente principal
├── components/
│   ├── phase-indicator.tsx     # Indicador de 5 fases arriba
│   ├── question-card.tsx      # Card tipo Typeform (pregunta + respuesta)
│   ├── phase-contexto.tsx      # Fase 1: Contexto (chat guiado)
│   ├── phase-expertos.tsx      # Fase 2: Expertos (selector visual)
│   ├── phase-estrategia.tsx    # Fase 3: Estrategia (cards)
│   ├── phase-revision.tsx      # Fase 4: Revisión (resumen + editar)
│   └── phase-debate.tsx        # Fase 5: Debate activo
├── hooks/
│   └── use-unified-debate-state.ts  # Estado centralizado
└── types.ts                    # Tipos TypeScript
```

### **Estado Centralizado**:

```typescript
interface UnifiedDebateState {
  // Fase actual (1-5)
  currentPhase: 1 | 2 | 3 | 4 | 5
  
  // Progreso por fase
  phaseProgress: {
    contexto: number      // 0-100
    expertos: number      // 0-100
    estrategia: number    // 0-100
    revision: number      // 0-100
    debate: number        // 0-100
  }
  
  // Datos de cada fase
  contexto: {
    mainQuestion: string
    answers: Record<string, string>
    currentQuestionIndex: number
    questions: Question[]
  }
  
  expertos: {
    selectedExpertIds: string[]
    selectedDepartmentIds: string[]
  }
  
  estrategia: {
    selectedStrategy: string
  }
  
  // Navegación
  canGoNext: boolean
  canGoBack: boolean
}
```

---

## 🎨 Componente Principal (Ejemplo)

```tsx
export default function NewUnifiedDebatePage() {
  const state = useUnifiedDebateState()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Indicador de Fases (Arriba) */}
      <PhaseIndicator
        currentPhase={state.currentPhase}
        phaseProgress={state.phaseProgress}
        onPhaseClick={(phase) => state.setCurrentPhase(phase)}
      />
      
      {/* Contenido Centrado (Tipo Typeform) */}
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <div className="w-full max-w-2xl">
          {/* Animación de transición entre fases */}
          <AnimatePresence mode="wait">
            {state.currentPhase === 1 && (
              <PhaseContexto key="contexto" {...state.contexto} />
            )}
            {state.currentPhase === 2 && (
              <PhaseExpertos key="expertos" {...state.expertos} />
            )}
            {state.currentPhase === 3 && (
              <PhaseEstrategia key="estrategia" {...state.estrategia} />
            )}
            {state.currentPhase === 4 && (
              <PhaseRevision key="revision" state={state} />
            )}
            {state.currentPhase === 5 && (
              <PhaseDebate key="debate" {...state.debate} />
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Navegación (Abajo) */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto flex justify-between">
          <Button
            onClick={() => state.goToPreviousPhase()}
            disabled={!state.canGoBack}
            variant="ghost"
          >
            ← Atrás
          </Button>
          <Button
            onClick={() => state.goToNextPhase()}
            disabled={!state.canGoNext}
            className="bg-purple-600"
          >
            Siguiente →
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 Comparación con Sistemas Actuales

| Característica | `/debates/new` | `/debates/new-v2` | **Propuesta Unificada** |
|----------------|----------------|-------------------|-------------------------|
| **UX** | Acordeones expandibles | Chat guiado | **Typeform (una pregunta a la vez)** |
| **Visual** | Barra de progreso simple | Chat básico | **Indicador de 5 fases + animaciones** |
| **Navegación** | Expandir/colapsar fases | Secuencial | **Avanzar/retroceder + click en fases** |
| **Fases** | 4 fases | Implícitas | **5 fases explícitas (incluye revisión)** |
| **Amigable** | ⚠️ Puede abrumar | ✅ Chat simple | **✅✅ Muy amigable (tipo Typeform)** |

---

## 🚀 Próximos Pasos

1. **Aprobar propuesta** ✅
2. **Crear estructura de archivos** 📁
3. **Implementar PhaseIndicator** (indicador de 5 fases)
4. **Migrar lógica de `new-v2`** a Fase 1 (Contexto)
5. **Migrar lógica de `new`** a Fases 2-5
6. **Añadir Fase 4 (Revisión)**
7. **Aplicar diseño Typeform** (animaciones, centrado, etc.)
8. **Testing y refinamiento** 🧪

---

## ❓ Preguntas para Decidir

1. ¿Mantenemos `/debates/new` y `/debates/new-v2` o los reemplazamos completamente?
2. ¿La Fase 4 (Revisión) es obligatoria o se puede saltar?
3. ¿Permitimos editar fases anteriores desde la Revisión?
4. ¿Queremos guardar progreso automáticamente (draft)?

---

**¿Te parece bien esta propuesta? ¿Quieres que empecemos a implementarla?**
