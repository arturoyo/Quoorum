# Wallie Chat Timeline — Especificacion Tecnica

> **Version:** 1.0.0 | **Fecha:** 3 Dic 2025
> **Estado:** Planificado | **Prioridad:** CRITICA

---

## Resumen Ejecutivo

Integrar las conversaciones con Wallie directamente en el timeline de cada chat con cliente, como "globos" colapsables que muestran cuando el usuario consulto a la IA y que respuestas obtuvo.

### Objetivos

1. **Contexto historico**: Ver que preguntaste a Wallie cuando escribiste ese mensaje
2. **Aprendizaje**: Revisar como Wallie te ayudo a cerrar una venta
3. **Auditoria**: Entender el proceso de toma de decisiones
4. **UX natural**: La IA es parte de la conversacion, no una herramienta separada

---

## Flujo Visual

### Vista de Conversacion con Wallie Integrado

```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Conversacion con: Juan Perez              [📞] [📎] [···]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─ 10:30 ──────────────────────────────────────────────────┐   │
│  │ 👤 Juan: Hola, quisiera informacion sobre el producto X   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ 10:32 ── 🤖 WALLIE ─────────────────────── [▼ Expandir] ─┐  │
│  │ ┌─────────────────────────────────────────────────────┐    │  │
│  │ │ Tu: ¿Que sabes de este cliente?                      │    │  │
│  │ │                                                       │    │  │
│  │ │ Wallie: Juan es un lead desde hace 2 semanas.        │    │  │
│  │ │ Mostro interes en productos similares. Su empresa    │    │  │
│  │ │ tiene 15 empleados y estan en expansion.             │    │  │
│  │ │                                                       │    │  │
│  │ │ Tu: Sugiere una respuesta                            │    │  │
│  │ │                                                       │    │  │
│  │ │ Wallie: "¡Hola Juan! El producto X es perfecto       │    │  │
│  │ │ para empresas en crecimiento como la tuya..."        │    │  │
│  │ │                                    [📋 Copiar]       │    │  │
│  │ └─────────────────────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ 10:35 ──────────────────────────────────────────────────┐   │
│  │ 📤 Tu: ¡Hola Juan! El producto X es perfecto para        │   │
│  │    empresas en crecimiento como la tuya. Tiene...        │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ 10:45 ──────────────────────────────────────────────────┐   │
│  │ 👤 Juan: Suena interesante, ¿cual es el precio?          │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ 10:47 ── 🤖 WALLIE ── [▶ Colapsado] ─────────────────────┐  │
│  │ "Analice precios de la competencia. Sugiero ofrecer..."  │  │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─ 11:00 ──────────────────────────────────────────────────┐   │
│  │ 👤 Juan: Perfecto, me interesa. ¿Cuando podemos hablar?  │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 💬 Escribe un mensaje...           [🤖] [😊] [📎] [➤]   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  [🤖 Preguntar a Wallie]  [💡 Sugerir respuesta]               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Estados del Globo de Wallie

#### Colapsado (Default)

```
┌─ 10:47 ── 🤖 WALLIE ── [▶] ──────────────────────────────────┐
│ "Analice precios de la competencia. Sugiero ofrecer..."      │
└───────────────────────────────────────────────────────────────┘
```

#### Expandido

```
┌─ 10:47 ── 🤖 WALLIE ─────────────────────────── [▼] ─────────┐
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Tu: ¿Que precio deberia ofrecerle?                       │   │
│ │                                                           │   │
│ │ Wallie: Analice los precios de la competencia:           │   │
│ │ - Competidor A: $299/mes                                  │   │
│ │ - Competidor B: $349/mes                                  │   │
│ │ - Nuestro precio: $279/mes                                │   │
│ │                                                           │   │
│ │ Sugiero ofrecer el plan Pro a $249/mes como oferta       │   │
│ │ especial por ser nuevo cliente. Esto nos da margen       │   │
│ │ y es competitivo.                                         │   │
│ │                                                           │   │
│ │ Tu: Dame un mensaje con esa oferta                       │   │
│ │                                                           │   │
│ │ Wallie: "Juan, tengo una oferta especial para ti:        │   │
│ │ Plan Pro a $249/mes (normalmente $279). Incluye..."      │   │
│ │                                         [📋 Copiar]      │   │
│ └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    WALLIE CHAT TIMELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐                                                 │
│  │   MESSAGE   │  Mensaje del cliente o usuario                 │
│  │   STREAM    │                                                 │
│  └──────┬──────┘                                                 │
│         │                                                         │
│         ▼                                                         │
│  ┌─────────────┐     ┌─────────────┐                            │
│  │   TIMELINE  │────▶│   MERGER    │  Combina mensajes +        │
│  │   BUILDER   │     │             │  interacciones Wallie      │
│  └─────────────┘     └──────┬──────┘                            │
│                             │                                     │
│         ┌───────────────────┼───────────────────┐                │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   CLIENT    │     │   USER      │     │   WALLIE    │        │
│  │   MESSAGE   │     │   MESSAGE   │     │INTERACTION  │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│                                                 │                │
│                                                 ▼                │
│                                          ┌─────────────┐        │
│                                          │ COLLAPSIBLE │        │
│                                          │    CARD     │        │
│                                          └─────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Interaccion

### 1. Usuario Inicia Chat con Wallie

```
Usuario hace clic en [🤖 Preguntar a Wallie]
         │
         ▼
┌─────────────────────────────────────┐
│  Modal/Sidebar de Wallie            │
│  ┌─────────────────────────────┐    │
│  │ Escribe tu pregunta...      │    │
│  └─────────────────────────────┘    │
│                                      │
│  Contexto actual:                    │
│  - Cliente: Juan Perez               │
│  - Ultimo mensaje hace 5 min         │
│  - Estado: Propuesta                 │
│                                      │
└─────────────────────────────────────┘
```

### 2. Wallie Responde

```
┌─────────────────────────────────────┐
│  Tu: ¿Que descuento puedo ofrecer?  │
│                                      │
│  Wallie: Basado en el historial de  │
│  Juan y su empresa, puedes ofrecer  │
│  hasta 15% de descuento...          │
│                                      │
│  [📋 Copiar]  [Seguir preguntando]  │
└─────────────────────────────────────┘
```

### 3. Interaccion se Guarda en Timeline

```
Al cerrar el modal:
- Se crea registro en wallie_interactions
- Se asocia al mensaje mas reciente (afterMessageId)
- Aparece en el timeline como globo colapsado
```

---

## Schema de Base de Datos

### Tabla: wallie_interactions

```sql
CREATE TABLE wallie_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Posicion en timeline
  after_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  timestamp_in_conversation TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contenido de la conversacion con Wallie
  messages JSONB NOT NULL DEFAULT '[]',
  -- Estructura: [{ role: 'user' | 'assistant', content: string, timestamp: string }]

  -- Preview para estado colapsado
  preview_text VARCHAR(100),

  -- Metadata
  context_used JSONB DEFAULT '{}', -- RAG context, client info, etc.
  model_used VARCHAR(50),
  tokens_used INTEGER,

  -- Estado UI
  is_collapsed BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallie_interactions_conversation ON wallie_interactions(conversation_id);
CREATE INDEX idx_wallie_interactions_user ON wallie_interactions(user_id);
CREATE INDEX idx_wallie_interactions_timestamp ON wallie_interactions(timestamp_in_conversation);
```

### Estructura del Campo messages (JSONB)

```typescript
interface WallieMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string // ISO 8601
  metadata?: {
    suggestionUsed?: boolean
    copiedToClipboard?: boolean
  }
}

// Ejemplo
const messages: WallieMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: '¿Que sabes de este cliente?',
    timestamp: '2025-12-03T10:32:00Z',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'Juan es un lead desde hace 2 semanas...',
    timestamp: '2025-12-03T10:32:05Z',
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'Sugiere una respuesta',
    timestamp: '2025-12-03T10:32:30Z',
  },
  {
    id: 'msg-4',
    role: 'assistant',
    content: '¡Hola Juan! El producto X es perfecto...',
    timestamp: '2025-12-03T10:32:35Z',
    metadata: { copiedToClipboard: true },
  },
]
```

---

## API Endpoints (tRPC)

### Extension del wallieRouter

```typescript
// packages/api/src/routers/wallie.ts

// Nuevo: Chat en contexto de conversacion
chatInConversation: protectedProcedure
  .input(z.object({
    conversationId: z.string().uuid(),
    message: z.string().min(1).max(2000),
    interactionId: z.string().uuid().optional(), // Para continuar conversacion
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Obtener contexto del cliente y conversacion
    const context = await getConversationContext(input.conversationId, ctx.userId);

    // 2. Obtener o crear interaccion
    let interaction = input.interactionId
      ? await getInteraction(input.interactionId)
      : await createInteraction(input.conversationId, ctx.userId);

    // 3. Generar respuesta de Wallie
    const response = await generateWallieResponse(input.message, context);

    // 4. Actualizar interaccion con nuevos mensajes
    const updatedMessages = [
      ...interaction.messages,
      { role: 'user', content: input.message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response, timestamp: new Date().toISOString() }
    ];

    await updateInteraction(interaction.id, {
      messages: updatedMessages,
      previewText: truncate(response, 100),
    });

    return {
      interactionId: interaction.id,
      response,
      messages: updatedMessages,
    };
  }),

// Obtener interacciones de una conversacion
getWallieInteractions: protectedProcedure
  .input(z.object({
    conversationId: z.string().uuid(),
  }))
  .query(async ({ ctx, input }) => {
    return db
      .select()
      .from(wallieInteractions)
      .where(
        and(
          eq(wallieInteractions.conversationId, input.conversationId),
          eq(wallieInteractions.userId, ctx.userId)
        )
      )
      .orderBy(wallieInteractions.timestampInConversation);
  }),

// Actualizar estado de colapso
toggleInteractionCollapse: protectedProcedure
  .input(z.object({
    interactionId: z.string().uuid(),
    isCollapsed: z.boolean(),
  }))
  .mutation(async ({ ctx, input }) => {
    return db
      .update(wallieInteractions)
      .set({ isCollapsed: input.isCollapsed })
      .where(
        and(
          eq(wallieInteractions.id, input.interactionId),
          eq(wallieInteractions.userId, ctx.userId)
        )
      );
  }),

// Registrar cuando se usa una sugerencia
markSuggestionUsed: protectedProcedure
  .input(z.object({
    interactionId: z.string().uuid(),
    messageIndex: z.number(),
  }))
  .mutation(/* Actualizar metadata del mensaje */),
```

---

## Componentes UI

### Estructura de Componentes

```
components/
├── chat/
│   ├── message-list.tsx           # Lista principal de mensajes
│   ├── message-item.tsx           # Mensaje individual
│   ├── wallie-interaction.tsx     # Globo de interaccion Wallie
│   ├── wallie-interaction-collapsed.tsx
│   ├── wallie-interaction-expanded.tsx
│   └── wallie-chat-modal.tsx      # Modal para chatear con Wallie
```

### WallieInteraction Component

```typescript
// components/chat/wallie-interaction.tsx

interface WallieInteractionProps {
  interaction: WallieInteraction;
  onToggle: (id: string, collapsed: boolean) => void;
  onCopyMessage: (content: string) => void;
}

export function WallieInteraction({
  interaction,
  onToggle,
  onCopyMessage
}: WallieInteractionProps) {
  const [isCollapsed, setIsCollapsed] = useState(interaction.isCollapsed);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggle(interaction.id, !isCollapsed);
  };

  return (
    <div className="wallie-interaction my-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <span>{format(interaction.timestampInConversation, 'HH:mm')}</span>
        <span className="flex items-center gap-1">
          <Bot className="w-3 h-3" />
          WALLIE
        </span>
        <button onClick={handleToggle}>
          {isCollapsed ? <ChevronRight /> : <ChevronDown />}
        </button>
      </div>

      {isCollapsed ? (
        <WallieInteractionCollapsed
          preview={interaction.previewText}
          onClick={handleToggle}
        />
      ) : (
        <WallieInteractionExpanded
          messages={interaction.messages}
          onCopy={onCopyMessage}
          onCollapse={handleToggle}
        />
      )}
    </div>
  );
}
```

### Timeline Merger

```typescript
// hooks/use-conversation-timeline.ts

interface TimelineItem {
  type: 'message' | 'wallie_interaction'
  timestamp: Date
  data: Message | WallieInteraction
}

export function useConversationTimeline(conversationId: string) {
  const { data: messages } = api.conversations.getMessages.useQuery({ conversationId })
  const { data: interactions } = api.wallie.getWallieInteractions.useQuery({ conversationId })

  const timeline = useMemo(() => {
    const items: TimelineItem[] = []

    // Agregar mensajes
    messages?.forEach((msg) => {
      items.push({
        type: 'message',
        timestamp: new Date(msg.sentAt),
        data: msg,
      })
    })

    // Agregar interacciones de Wallie
    interactions?.forEach((interaction) => {
      items.push({
        type: 'wallie_interaction',
        timestamp: new Date(interaction.timestampInConversation),
        data: interaction,
      })
    })

    // Ordenar por timestamp
    return items.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }, [messages, interactions])

  return timeline
}
```

---

## Flujo de Datos

### Secuencia: Usuario Pregunta a Wallie

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  USER   │     │FRONTEND │     │  tRPC   │     │   AI    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Click Wallie  │               │               │
     │──────────────▶│               │               │
     │               │               │               │
     │               │ Open Modal    │               │
     │               │──────────────▶│               │
     │               │               │               │
     │ Type question │               │               │
     │──────────────▶│               │               │
     │               │               │               │
     │               │chatInConversation             │
     │               │──────────────▶│               │
     │               │               │               │
     │               │               │ Get context   │
     │               │               │──────────────▶│
     │               │               │               │
     │               │               │ Generate      │
     │               │               │◀──────────────│
     │               │               │               │
     │               │    Response   │               │
     │               │◀──────────────│               │
     │               │               │               │
     │  Show response│               │               │
     │◀──────────────│               │               │
     │               │               │               │
     │ Close modal   │               │               │
     │──────────────▶│               │               │
     │               │               │               │
     │               │ Show in       │               │
     │               │ timeline      │               │
     │◀──────────────│               │               │
     │               │               │               │
```

---

## Integracion con Gamificacion

### Puntos por Uso de Wallie

| Accion                    | Puntos |
| ------------------------- | ------ |
| Preguntar a Wallie        | +1     |
| Usar sugerencia de Wallie | +2     |
| Copiar respuesta sugerida | +1     |

### Achievement: Wallie's Friend

- Usar 100 sugerencias de Wallie = Badge desbloqueado

---

## Consideraciones de UX

### Principios

1. **No intrusivo**: El globo de Wallie no debe interrumpir la lectura
2. **Contexto claro**: Siempre visible cuando ocurrio la interaccion
3. **Acceso rapido**: Un clic para expandir/colapsar
4. **Copiable**: Facil copiar sugerencias al portapapeles

### Accesibilidad

- Navegacion por teclado en globos
- ARIA labels para lectores de pantalla
- Contraste adecuado para el estado colapsado/expandido

### Responsive

- En movil: Globos ocupan todo el ancho
- Modal de Wallie es bottom sheet en movil
- Botones de accion accesibles con pulgar

---

## Fases de Implementacion

### Fase 1: Core (1 semana)

- [ ] Schema de base de datos
- [ ] Endpoint chatInConversation
- [ ] Endpoint getWallieInteractions
- [ ] Componente WallieInteraction basico

### Fase 2: UI Completa (1 semana)

- [ ] Timeline merger
- [ ] Modal de chat con Wallie
- [ ] Estados colapsado/expandido
- [ ] Botones de accion (copiar, usar)

### Fase 3: Polish (3 dias)

- [ ] Animaciones de expansion
- [ ] Integracion con gamificacion
- [ ] Optimizacion de performance
- [ ] Tests E2E

---

## Dependencias

- `wallieRouter` existente (extender)
- `conversations` schema
- `messages` schema
- Gemini/OpenAI para generacion

---

_Ultima actualizacion: 3 Dic 2025_
