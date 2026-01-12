# Gamification System — Especificacion Tecnica

> **Version:** 1.0.0 | **Fecha:** 3 Dic 2025
> **Estado:** Planificado | **Prioridad:** MEDIA

---

## Resumen Ejecutivo

Sistema de puntos, niveles y logros para incentivar el uso correcto de la plataforma y mejorar los habitos de venta del usuario.

### Objetivos

1. **Aumentar engagement** con la plataforma
2. **Mejorar habitos** de venta y seguimiento
3. **Recompensar** el uso de features clave (IA, recordatorios)
4. **Crear competencia sana** (opcional: leaderboards)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    GAMIFICATION SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   EVENT     │────▶│   POINTS    │────▶│   LEVEL     │        │
│  │  LISTENER   │     │   ENGINE    │     │   SYSTEM    │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│       │                    │                    │                │
│       │                    │                    ▼                │
│       │                    │           ┌─────────────┐          │
│       │                    │           │ ACHIEVEMENTS│          │
│       │                    │           │   CHECKER   │          │
│       │                    │           └─────────────┘          │
│       │                    │                    │                │
│       │                    ▼                    │                │
│       │           ┌─────────────┐               │                │
│       │           │   STREAK    │               │                │
│       └──────────▶│   TRACKER   │◀──────────────┘                │
│                   └─────────────┘                                │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                            │
│              │   NOTIFICATIONS     │                            │
│              │   & CELEBRATIONS    │                            │
│              └─────────────────────┘                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sistema de Niveles

### Progresion

| Nivel | Nombre         | Puntos Requeridos | Beneficios                         |
| ----- | -------------- | ----------------- | ---------------------------------- |
| 1     | Novato         | 0                 | Acceso basico                      |
| 2     | Aprendiz       | 100               | Badge visible en perfil            |
| 3     | Profesional    | 500               | Sugerencias IA prioritarias        |
| 4     | Experto        | 2,000             | Analisis avanzados, exportar datos |
| 5     | Maestro Wallie | 5,000             | Beta features, soporte prioritario |

### Visualizacion de Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│  Tu Nivel                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│    ⭐⭐⭐☆☆  Nivel 3: Profesional                               │
│                                                                   │
│    Puntos: 823 / 2,000                                           │
│    ████████████████░░░░░░░░░░░░░░░░  41%                        │
│                                                                   │
│    Siguiente nivel: Experto                                      │
│    Beneficios: Analisis avanzados, exportar datos               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sistema de Puntos

### Acciones y Recompensas

| Accion                           | Puntos | Categoria    | Condiciones            |
| -------------------------------- | ------ | ------------ | ---------------------- |
| Responder mensaje < 5 min        | +5     | Velocidad    | Solo primera respuesta |
| Responder mensaje < 15 min       | +3     | Velocidad    | Solo primera respuesta |
| Cerrar un deal                   | +10    | Ventas       | Mover a "won"          |
| Crear nuevo lead                 | +15    | Ventas       | Cliente nuevo          |
| Completar recordatorio           | +3     | Organizacion | A tiempo               |
| Completar recordatorio atrasado  | +1     | Organizacion | Con retraso            |
| Usar sugerencia de Wallie        | +2     | IA           | Aceptar sugerencia     |
| Subir documento a knowledge base | +5     | IA           | Documento procesado    |
| Login diario                     | +1     | Engagement   | Una vez por dia        |
| Contactar cliente frio           | +4     | Seguimiento  | Sin contacto 7+ dias   |

### Multiplicadores

| Condicion       | Multiplicador | Descripcion                          |
| --------------- | ------------- | ------------------------------------ |
| Racha 7+ dias   | x1.25         | 25% bonus en todos los puntos        |
| Racha 30+ dias  | x1.5          | 50% bonus en todos los puntos        |
| Hora productiva | x1.1          | Durante horas de mayor productividad |
| Fin de semana   | x0.5          | Reducido (descanso)                  |

### Calculo de Puntos

```typescript
function calculatePoints(action: ActionType, basePoints: number, context: PointsContext): number {
  let points = basePoints

  // Aplicar multiplicador de racha
  if (context.currentStreak >= 30) {
    points *= 1.5
  } else if (context.currentStreak >= 7) {
    points *= 1.25
  }

  // Aplicar multiplicador de hora productiva
  if (isProductiveHour(context.timestamp, context.productiveHours)) {
    points *= 1.1
  }

  // Reducir en fin de semana (opcional)
  if (isWeekend(context.timestamp) && action !== 'deal_closed') {
    points *= 0.5
  }

  return Math.round(points)
}
```

---

## Sistema de Logros (Achievements)

### Categorias de Logros

#### Velocidad

| Badge  | Nombre           | Requisito              | Puntos Bonus |
| ------ | ---------------- | ---------------------- | ------------ |
| ⚡     | Respuesta Rapida | 50 respuestas < 5 min  | 100          |
| ⚡⚡   | Rayo             | 200 respuestas < 5 min | 250          |
| ⚡⚡⚡ | Flash            | 500 respuestas < 5 min | 500          |

#### Ventas

| Badge  | Nombre            | Requisito            | Puntos Bonus |
| ------ | ----------------- | -------------------- | ------------ |
| 🎯     | Cerrador          | 10 deals cerrados    | 100          |
| 🎯🎯   | Cerrador Serial   | 50 deals cerrados    | 300          |
| 🎯🎯🎯 | Maquina de Ventas | 200 deals cerrados   | 750          |
| 💰     | Primer Millon     | $1,000,000 en ventas | 1000         |

#### Consistencia

| Badge  | Nombre           | Requisito                   | Puntos Bonus |
| ------ | ---------------- | --------------------------- | ------------ |
| 🔥     | En Racha         | 7 dias consecutivos         | 50           |
| 🔥🔥   | Imparable        | 30 dias consecutivos        | 200          |
| 🔥🔥🔥 | Leyenda          | 100 dias consecutivos       | 500          |
| ❄️     | Sin Cliente Frio | 30 dias sin leads ignorados | 150          |

#### IA

| Badge | Nombre          | Requisito                       | Puntos Bonus |
| ----- | --------------- | ------------------------------- | ------------ |
| 🤖    | Wallie's Friend | 100 sugerencias usadas          | 100          |
| 🤖🤖  | IA Master       | 500 sugerencias usadas          | 300          |
| 📚    | Bibliotecario   | 50 documentos en knowledge base | 150          |

#### Multi-canal

| Badge | Nombre       | Requisito            | Puntos Bonus |
| ----- | ------------ | -------------------- | ------------ |
| 🌐    | Multicanal   | Activo en 2+ canales | 75           |
| 🌐🌐  | Omnipresente | Activo en 4+ canales | 200          |

### Logros Secretos

| Badge | Nombre           | Requisito                              | Puntos Bonus |
| ----- | ---------------- | -------------------------------------- | ------------ |
| 🦉    | Noctambulo       | 10 deals cerrados despues de las 22:00 | 100          |
| 🌅    | Madrugador       | 10 deals cerrados antes de las 8:00    | 100          |
| 📱    | WhatsApp Warrior | 1000 mensajes via WhatsApp             | 200          |
| 🎂    | Aniversario      | 1 ano usando Wallie                    | 500          |

---

## Sistema de Rachas (Streaks)

### Mecanica

```
Dia 1    Dia 2    Dia 3    ...    Dia 7    ...    Dia 30
  │        │        │              │              │
  ▼        ▼        ▼              ▼              ▼
┌───┐    ┌───┐    ┌───┐          ┌───┐          ┌───┐
│ 🔥│───▶│🔥🔥│───▶│🔥🔥│ ───────▶ │⭐ │ ───────▶ │🏆 │
│ 1 │    │ 2 │    │ 3 │          │x1.25│        │x1.5│
└───┘    └───┘    └───┘          └───┘          └───┘
```

### Reglas de Racha

| Regla             | Descripcion                             |
| ----------------- | --------------------------------------- |
| **Inicio**        | Cualquier accion que otorgue puntos     |
| **Mantenimiento** | Al menos 1 accion por dia               |
| **Perdida**       | 24h sin actividad = racha perdida       |
| **Recuperacion**  | "Freeze" disponible 1x/semana (premium) |
| **Milestone**     | Notificacion especial cada 7 dias       |

### UI de Racha

```
┌─────────────────────────────────────────────────────────────────┐
│  🔥 Racha Actual: 12 dias                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───┬───┬───┬───┬───┬───┬───┐                                  │
│  │ L │ M │ X │ J │ V │ S │ D │  Esta semana                     │
│  │ ✓ │ ✓ │ ✓ │ ✓ │ ✓ │ ✓ │ ○ │                                  │
│  └───┴───┴───┴───┴───┴───┴───┘                                  │
│                                                                   │
│  Mejor racha: 23 dias                                            │
│  Multiplicador actual: x1.25                                     │
│  Proximo milestone: 18 dias (x1.5)                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Schema de Base de Datos

### Tabla: user_scores

```sql
CREATE TABLE user_scores (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Puntos y nivel
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  points_to_next_level INTEGER DEFAULT 100,

  -- Rachas
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_available BOOLEAN DEFAULT FALSE,

  -- Estadisticas
  total_achievements INTEGER DEFAULT 0,
  total_actions INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_scores_level ON user_scores(level DESC);
CREATE INDEX idx_user_scores_points ON user_scores(total_points DESC);
```

### Tabla: achievements

```sql
CREATE TABLE achievements (
  id VARCHAR(50) PRIMARY KEY, -- 'fast_responder_1', 'deal_closer_2', etc.

  -- Informacion
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(30) NOT NULL, -- 'speed', 'sales', 'consistency', 'ai', 'multichannel'

  -- Visual
  icon VARCHAR(10), -- Emoji
  badge_url TEXT,

  -- Requisitos
  requirement_type VARCHAR(50) NOT NULL, -- 'count', 'streak', 'value', 'custom'
  requirement_value INTEGER NOT NULL,
  requirement_metric VARCHAR(50) NOT NULL, -- 'fast_responses', 'deals_closed', etc.

  -- Recompensa
  points_bonus INTEGER DEFAULT 0,

  -- Orden
  tier INTEGER DEFAULT 1, -- 1, 2, 3 para progresion
  sort_order INTEGER DEFAULT 0,

  -- Estado
  is_secret BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabla: user_achievements

```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),

  -- Progreso (para logros incrementales)
  current_progress INTEGER DEFAULT 0,

  -- Estado
  unlocked_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(unlocked_at) WHERE unlocked_at IS NOT NULL;
```

### Tabla: points_history

```sql
CREATE TABLE points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Puntos
  points INTEGER NOT NULL,
  multiplier NUMERIC(3, 2) DEFAULT 1.0,
  final_points INTEGER NOT NULL, -- points * multiplier

  -- Origen
  action_type VARCHAR(50) NOT NULL,
  source_id UUID, -- ID del mensaje, deal, etc.
  source_type VARCHAR(30), -- 'message', 'deal', 'reminder', etc.

  -- Contexto
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_points_history_user_date ON points_history(user_id, created_at DESC);
```

---

## API Endpoints (tRPC)

### Router: gamificationRouter

```typescript
// packages/api/src/routers/gamification.ts

export const gamificationRouter = router({
  // Obtener score y nivel del usuario
  getScore: protectedProcedure.query(/* ... */),

  // Obtener todos los logros (con progreso)
  getAchievements: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        includeSecret: z.boolean().default(false),
      })
    )
    .query(/* ... */),

  // Obtener historial de puntos
  getPointsHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(/* ... */),

  // Obtener estadisticas de racha
  getStreakStats: protectedProcedure.query(/* ... */),

  // Usar freeze de racha (premium)
  useStreakFreeze: protectedProcedure.mutation(/* ... */),

  // Leaderboard (opcional)
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        period: z.enum(['week', 'month', 'all_time']),
        limit: z.number().default(10),
      })
    )
    .query(/* ... */),

  // Interno: registrar accion (llamado por otros routers)
  recordAction: protectedProcedure
    .input(
      z.object({
        actionType: z.string(),
        sourceId: z.string().uuid().optional(),
        sourceType: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(/* ... */),
})
```

---

## Integracion con Otros Modulos

### Eventos que Generan Puntos

```typescript
// Ejemplo de integracion en messagesRouter
const sendMessage = protectedProcedure.input(/* ... */).mutation(async ({ ctx, input }) => {
  // 1. Enviar mensaje
  const message = await sendMessageToClient(input)

  // 2. Calcular tiempo de respuesta
  const responseTime = calculateResponseTime(input.conversationId)

  // 3. Registrar puntos si aplica
  if (responseTime < 5) {
    await ctx.gamification.recordAction({
      actionType: 'fast_response_5min',
      sourceId: message.id,
      sourceType: 'message',
    })
  } else if (responseTime < 15) {
    await ctx.gamification.recordAction({
      actionType: 'fast_response_15min',
      sourceId: message.id,
      sourceType: 'message',
    })
  }

  return message
})
```

---

## Componentes UI

### Widget de Gamificacion (Sidebar)

```
┌─────────────────────────┐
│  👤 Juan Martinez       │
│  ⭐⭐⭐☆☆ Profesional   │
├─────────────────────────┤
│  823 / 2,000 pts        │
│  ████████░░░░░  41%     │
├─────────────────────────┤
│  🔥 Racha: 12 dias      │
│  🏆 Logros: 8/24        │
└─────────────────────────┘
```

### Modal de Logro Desbloqueado

```
┌─────────────────────────────────────────────┐
│                                              │
│            🎉 LOGRO DESBLOQUEADO!           │
│                                              │
│                    ⚡                        │
│              Respuesta Rapida                │
│                                              │
│    50 respuestas en menos de 5 minutos      │
│                                              │
│              +100 puntos bonus               │
│                                              │
│            [ Compartir ]  [ OK ]             │
│                                              │
└─────────────────────────────────────────────┘
```

---

## Notificaciones

### Tipos de Notificaciones

| Evento             | Tipo        | Mensaje Ejemplo                           |
| ------------------ | ----------- | ----------------------------------------- |
| Logro desbloqueado | Celebracion | "🎉 Desbloqueaste 'Respuesta Rapida'!"    |
| Subir de nivel     | Celebracion | "⬆️ Subiste a nivel 3: Profesional"       |
| Racha en riesgo    | Warning     | "⚠️ Tu racha de 12 dias termina en 2h"    |
| Racha perdida      | Info        | "😢 Perdiste tu racha. Empieza de nuevo!" |
| Milestone de racha | Celebracion | "🔥 7 dias seguidos! Multiplicador x1.25" |
| Cerca de logro     | Motivacion  | "📈 Solo 5 mas para 'Cerrador Serial'"    |

---

## Fases de Implementacion

### Fase 1: Core (2 semanas)

- [ ] Schema de base de datos
- [ ] Sistema de puntos basico
- [ ] Niveles y progresion
- [ ] Widget en sidebar

### Fase 2: Logros (1 semana)

- [ ] Sistema de achievements
- [ ] Integracion con eventos
- [ ] Notificaciones de logros
- [ ] Pagina de logros

### Fase 3: Rachas (1 semana)

- [ ] Tracking de rachas
- [ ] Multiplicadores
- [ ] Streak freeze (premium)
- [ ] Notificaciones de racha

### Fase 4: Social (Post-MVP)

- [ ] Leaderboards
- [ ] Compartir logros
- [ ] Equipos/Competencias

---

## Consideraciones

### Evitar Gamificacion Toxica

1. **No penalizar excesivamente**: Perder racha no debe ser devastador
2. **Multiples caminos**: Diferentes formas de ganar puntos
3. **Calidad sobre cantidad**: No incentivar spam de mensajes
4. **Opcional**: El usuario puede ocultar gamificacion si prefiere

### Privacidad

- Leaderboards opcionales
- No mostrar datos sensibles de otros usuarios
- Opcion de perfil privado

---

_Ultima actualizacion: 3 Dic 2025_
