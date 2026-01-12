# Wallie Coexistence Strategy
## Recordatorios, Deeplinks y Modelo de Pricing Híbrido

**Versión:** 1.0
**Fecha:** 2 de Diciembre 2025
**Relacionado con:** MIGRATION_ASSISTANT.md

---

## 1. Contexto: Limitaciones y Oportunidades de Coexistence

### 1.1 Limitaciones Técnicas de Meta
```
┌─────────────────────────────────────────────────────────────┐
│  COEXISTENCE: REGLAS DE META                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⏰ LÍMITE 14 DÍAS                                          │
│  Si no abres la app móvil en 14 días → se desconecta       │
│  Hay que re-vincular manualmente (fricción alta)           │
│                                                             │
│  💰 COSTES DIFERENCIADOS                                    │
│  • Mensajes desde App móvil = GRATIS                        │
│  • Mensajes desde API = Se cobran por Meta                  │
│    (Marketing: ~€0.05-0.15, Utility: ~€0.02-0.05)          │
│                                                             │
│  🔄 SINCRONIZACIÓN                                          │
│  • Mensajes se ven en ambos lados                           │
│  • Pero Meta sabe de dónde se envió cada uno               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Oportunidad para Wallie

**Problema del usuario:**
- No sabe que tiene que abrir la app cada 14 días
- Si usa mucho la API, los costes se disparan
- Otros BSPs no optimizan esto → cobran más

**Solución Wallie:**
- Sistema de recordatorios inteligentes
- Deeplinks para que responda desde app (gratis)
- Modelo de pricing que incentiva uso eficiente

---

## 2. Sistema de Recordatorios 14 Días

### 2.1 Lógica del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Día 0: Usuario abre app móvil                             │
│          └── Wallie registra timestamp                      │
│                                                             │
│   Día 10: Recordatorio suave                                │
│          └── "Recuerda abrir WhatsApp en tu móvil           │
│               esta semana para mantener la conexión"        │
│                                                             │
│   Día 12: Recordatorio urgente                              │
│          └── "⚠️ Abre WhatsApp móvil en 48h o se            │
│               desconectará. Toca aquí para abrir."          │
│                                                             │
│   Día 13: Recordatorio crítico                              │
│          └── "🚨 ÚLTIMO DÍA: Abre la app móvil AHORA"       │
│          └── Push notification + Email + SMS si tiene       │
│                                                             │
│   Día 14+: Desconexión                                      │
│          └── Wallie detecta pérdida de conexión             │
│          └── Guía de re-vinculación automática              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Detección de Apertura de App

**Opción A: Webhook de Meta (preferida)**
```python
# Meta envía webhook cuando usuario envía mensaje desde app
# Campo: "message_echoes" indica origen del mensaje

def handle_webhook(payload):
    if payload.get("field") == "smb_message_echoes":
        # Usuario envió mensaje desde app móvil
        user_id = extract_user_id(payload)
        update_last_app_open(user_id, datetime.now())
```

**Opción B: Heurística basada en mensajes**
```python
# Si recibimos echo de mensaje que NO enviamos nosotros vía API
# → Usuario lo envió desde la app

def detect_app_usage(message):
    if message.source == "echo" and not message.sent_by_wallie_api:
        return True  # Usuario usó la app
    return False
```

### 2.3 Canales de Recordatorio

| Día | Canal | Tono | Acción |
|-----|-------|------|--------|
| 10 | In-app notification | Informativo | Solo informar |
| 12 | Push + In-app | Urgente | Deeplink a WhatsApp |
| 13 | Push + Email + SMS | Crítico | Múltiples CTAs |
| 14 | Email | Recuperación | Guía re-vinculación |

### 2.4 Implementación Técnica

```typescript
// services/coexistence-monitor.ts

interface CoexistenceStatus {
  userId: string;
  lastAppOpen: Date;
  daysUntilDisconnect: number;
  status: 'healthy' | 'warning' | 'critical' | 'disconnected';
}

class CoexistenceMonitor {
  private readonly WARNING_THRESHOLD = 10;  // días
  private readonly CRITICAL_THRESHOLD = 12;
  private readonly DISCONNECT_THRESHOLD = 14;

  async checkAllUsers(): Promise<void> {
    const users = await this.getCoexistenceUsers();

    for (const user of users) {
      const status = this.calculateStatus(user);

      if (status.status !== 'healthy') {
        await this.sendReminder(user, status);
      }
    }
  }

  private calculateStatus(user: User): CoexistenceStatus {
    const daysSinceOpen = this.daysSince(user.lastAppOpen);
    const daysUntilDisconnect = this.DISCONNECT_THRESHOLD - daysSinceOpen;

    let status: CoexistenceStatus['status'];
    if (daysSinceOpen >= this.DISCONNECT_THRESHOLD) {
      status = 'disconnected';
    } else if (daysSinceOpen >= this.CRITICAL_THRESHOLD) {
      status = 'critical';
    } else if (daysSinceOpen >= this.WARNING_THRESHOLD) {
      status = 'warning';
    } else {
      status = 'healthy';
    }

    return {
      userId: user.id,
      lastAppOpen: user.lastAppOpen,
      daysUntilDisconnect,
      status
    };
  }

  private async sendReminder(user: User, status: CoexistenceStatus): Promise<void> {
    const templates = {
      warning: {
        title: '📱 Recordatorio WhatsApp',
        body: `Abre WhatsApp en tu móvil esta semana para mantener Wallie conectado. Quedan ${status.daysUntilDisconnect} días.`,
        channels: ['in_app']
      },
      critical: {
        title: '⚠️ Acción requerida',
        body: `Tu conexión con Wallie se desconectará en ${status.daysUntilDisconnect} días. Abre WhatsApp móvil ahora.`,
        channels: ['push', 'in_app'],
        deeplink: 'whatsapp://send?phone=...'
      },
      disconnected: {
        title: '🚨 Conexión perdida',
        body: 'Tu WhatsApp se ha desconectado de Wallie. Sigue estos pasos para reconectar.',
        channels: ['email', 'sms'],
        action: 'show_reconnection_guide'
      }
    };

    const template = templates[status.status];
    await this.notificationService.send(user, template);
  }
}
```

### 2.5 UI de Estado de Conexión

```typescript
// components/CoexistenceStatus.tsx

const CoexistenceStatus: React.FC<{status: CoexistenceStatus}> = ({status}) => {
  const statusConfig = {
    healthy: {
      color: 'green',
      icon: '✅',
      message: 'Conexión activa',
      action: null
    },
    warning: {
      color: 'yellow',
      icon: '⚠️',
      message: `Abre la app en ${status.daysUntilDisconnect} días`,
      action: 'Abrir WhatsApp'
    },
    critical: {
      color: 'red',
      icon: '🚨',
      message: `¡Solo quedan ${status.daysUntilDisconnect} días!`,
      action: 'ABRIR AHORA'
    },
    disconnected: {
      color: 'gray',
      icon: '❌',
      message: 'Desconectado - Reconectar',
      action: 'Reconectar'
    }
  };

  const config = statusConfig[status.status];

  return (
    <div className={`status-badge status-${config.color}`}>
      <span className="icon">{config.icon}</span>
      <span className="message">{config.message}</span>
      {config.action && (
        <button
          onClick={() => openDeeplink('whatsapp://')}
          className="action-button"
        >
          {config.action}
        </button>
      )}
    </div>
  );
};
```

---

## 3. Estrategia de Deeplinks

### 3.1 Concepto: "Responde Gratis desde tu Móvil"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  FLUJO OPTIMIZADO PARA COSTE €0                             │
│                                                             │
│  1. Cliente envía mensaje a WhatsApp del usuario            │
│     └── Wallie recibe vía API (gratis, es inbound)          │
│                                                             │
│  2. Wallie analiza y prepara sugerencia de respuesta        │
│     └── "Sugerencia: Hola Juan, el presupuesto..."         │
│                                                             │
│  3. Wallie envía NOTIFICACIÓN al usuario (no WhatsApp)      │
│     └── Push/Email: "Juan te escribió. Toca para           │
│         responder desde tu móvil (gratis)"                  │
│                                                             │
│  4. Usuario toca → Deeplink abre WhatsApp en ese chat       │
│     └── Texto sugerido en clipboard o pre-rellenado        │
│                                                             │
│  5. Usuario envía desde app → GRATIS                        │
│     └── Wallie recibe echo, registra, aprende              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Tipos de Deeplinks WhatsApp

```typescript
// utils/whatsapp-deeplinks.ts

class WhatsAppDeeplinks {

  /**
   * Abre chat con número específico
   * Funciona en móvil, abre WhatsApp directamente
   */
  static openChat(phone: string): string {
    // Formato E.164 sin + ni espacios
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `whatsapp://send?phone=${cleanPhone}`;
  }

  /**
   * Abre chat con texto pre-rellenado
   * El usuario solo tiene que tocar "Enviar"
   */
  static openChatWithText(phone: string, text: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(text);
    return `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
  }

  /**
   * Versión web (fallback si no tiene app)
   */
  static webChatWithText(phone: string, text: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }

  /**
   * Abre WhatsApp Business App (no personal)
   * Para asegurar que usa la cuenta correcta
   */
  static openBusinessApp(): string {
    return 'whatsapp://business';
  }

  /**
   * Genera deeplink inteligente según dispositivo
   */
  static smart(phone: string, text?: string, device?: 'ios' | 'android' | 'web'): string {
    // iOS y Android soportan whatsapp://
    // Web necesita wa.me

    if (device === 'web') {
      return text
        ? this.webChatWithText(phone, text)
        : `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
    }

    return text
      ? this.openChatWithText(phone, text)
      : this.openChat(phone);
  }
}
```

### 3.3 Notificación con Deeplink

```typescript
// services/smart-notification.ts

interface SmartNotification {
  title: string;
  body: string;
  deeplink: string;
  suggestedReply?: string;
  priority: 'low' | 'normal' | 'high';
  expiresIn?: number; // minutos
}

class SmartNotificationService {

  /**
   * Notifica al usuario que le escribieron
   * con opción de responder gratis desde app
   */
  async notifyIncomingMessage(
    user: User,
    incomingMessage: Message,
    suggestedReply: string
  ): Promise<void> {

    const notification: SmartNotification = {
      title: `💬 ${incomingMessage.senderName}`,
      body: this.truncate(incomingMessage.content, 100),
      deeplink: WhatsAppDeeplinks.openChatWithText(
        incomingMessage.senderPhone,
        suggestedReply
      ),
      suggestedReply,
      priority: this.calculatePriority(incomingMessage),
      expiresIn: 60 // 1 hora para responder gratis
    };

    // Enviar push notification
    await this.pushService.send(user.deviceTokens, {
      ...notification,
      data: {
        type: 'incoming_message',
        messageId: incomingMessage.id,
        action: 'open_whatsapp'
      }
    });

    // También mostrar in-app si está online
    if (user.isOnline) {
      await this.inAppService.show(user.id, notification);
    }
  }

  /**
   * Determina prioridad basada en contexto
   */
  private calculatePriority(message: Message): 'low' | 'normal' | 'high' {
    // Cliente VIP → alta
    if (message.clientTier === 'vip') return 'high';

    // Palabras urgentes → alta
    const urgentWords = ['urgente', 'asap', 'hoy', 'ahora', 'problema'];
    if (urgentWords.some(w => message.content.toLowerCase().includes(w))) {
      return 'high';
    }

    // Horario laboral → normal
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 19) return 'normal';

    // Fuera de horario → baja
    return 'low';
  }
}
```

### 3.4 UI: Botón "Responder Gratis"

```typescript
// components/MessageSuggestion.tsx

interface MessageSuggestionProps {
  message: IncomingMessage;
  suggestion: string;
  onSendViaApi: () => void;  // Cobra
  onSendViaApp: () => void;  // Gratis
}

const MessageSuggestion: React.FC<MessageSuggestionProps> = ({
  message,
  suggestion,
  onSendViaApi,
  onSendViaApp
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAndOpen = () => {
    navigator.clipboard.writeText(suggestion);
    setCopied(true);

    // Abrir WhatsApp con deeplink
    const deeplink = WhatsAppDeeplinks.openChat(message.senderPhone);
    window.location.href = deeplink;

    onSendViaApp();
  };

  return (
    <div className="message-suggestion">
      <div className="incoming-message">
        <span className="sender">{message.senderName}</span>
        <p>{message.content}</p>
      </div>

      <div className="suggestion-box">
        <h4>💡 Sugerencia de Wallie:</h4>
        <p className="suggestion-text">{suggestion}</p>

        <div className="actions">
          {/* Opción gratuita - destacada */}
          <button
            className="btn-primary btn-free"
            onClick={handleCopyAndOpen}
          >
            📱 Responder desde móvil
            <span className="badge-free">GRATIS</span>
          </button>

          {/* Opción API - secundaria */}
          <button
            className="btn-secondary"
            onClick={onSendViaApi}
          >
            ⚡ Enviar ahora (API)
            <span className="badge-cost">~€0.05</span>
          </button>
        </div>

        <p className="tip">
          💡 Tip: Responder desde tu móvil es gratis.
          Usa API solo para mensajes automáticos.
        </p>
      </div>
    </div>
  );
};
```

---

## 4. Modelo de Pricing Híbrido

### 4.1 Filosofía del Modelo

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  PRINCIPIO: "WALLIE OPTIMIZA TUS COSTES"                    │
│                                                             │
│  La mayoría de competidores cobran:                         │
│  • Suscripción mensual + markup por mensaje                 │
│  • No incentivan uso eficiente                              │
│  • Usuario paga más de lo necesario                         │
│                                                             │
│  Wallie cobra:                                              │
│  • Suscripción mensual (incluye X mensajes API)             │
│  • 0% markup sobre costes Meta                              │
│  • Incentiva uso de app (gratis) vía deeplinks              │
│  • Packs adicionales transparentes si se excede             │
│                                                             │
│  RESULTADO: Usuario paga menos, Wallie diferenciado         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Estructura de Planes

```
┌─────────────────────────────────────────────────────────────┐
│                       PLANES WALLIE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌱 STARTER - €29/mes                                       │
│  ├── Mensajes API incluidos: 200/mes                        │
│  ├── Conversaciones API: ~50/mes                            │
│  ├── Ideal para: <100 clientes activos                      │
│  ├── Coste extra por mensaje: €0.08                         │
│  └── Pack adicional: 100 mensajes por €6                    │
│                                                             │
│  🚀 GROWTH - €59/mes                                        │
│  ├── Mensajes API incluidos: 500/mes                        │
│  ├── Conversaciones API: ~125/mes                           │
│  ├── Ideal para: 100-300 clientes activos                   │
│  ├── Coste extra por mensaje: €0.06                         │
│  └── Pack adicional: 250 mensajes por €12                   │
│                                                             │
│  💼 PRO - €99/mes                                           │
│  ├── Mensajes API incluidos: 1,500/mes                      │
│  ├── Conversaciones API: ~375/mes                           │
│  ├── Ideal para: 300+ clientes activos                      │
│  ├── Coste extra por mensaje: €0.05                         │
│  └── Pack adicional: 500 mensajes por €20                   │
│                                                             │
│  📊 Nota: Mensajes desde APP MÓVIL = SIEMPRE GRATIS         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Cálculo de Mensajes Incluidos

**Metodología para determinar cuotas:**

```python
# Estimación basada en uso típico de autónomo español

def calculate_monthly_api_usage(
    active_clients: int,
    response_rate: float = 0.7,  # 70% responden
    messages_per_conversation: float = 4,  # Media de intercambios
    api_vs_app_ratio: float = 0.3  # 30% vía API, 70% desde app
) -> dict:
    """
    Calcula uso estimado mensual de API

    Supuestos:
    - Usuario responde mayoría desde app (incentivado)
    - API solo para: broadcasts, automatizaciones, fuera de horario
    """

    total_conversations = active_clients * response_rate
    total_messages = total_conversations * messages_per_conversation
    api_messages = total_messages * api_vs_app_ratio

    return {
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "api_messages": api_messages,
        "app_messages": total_messages - api_messages,
        "estimated_api_cost": api_messages * 0.05  # €0.05 media
    }

# Ejemplos por plan:
starter = calculate_monthly_api_usage(active_clients=50)
# → ~50 convos, ~200 msgs total, ~60 API msgs → 200 incluidos OK

growth = calculate_monthly_api_usage(active_clients=150)
# → ~150 convos, ~600 msgs total, ~180 API msgs → 500 incluidos OK

pro = calculate_monthly_api_usage(active_clients=400)
# → ~400 convos, ~1600 msgs total, ~480 API msgs → 1500 incluidos OK
```

### 4.4 Sistema de Packs Adicionales

```typescript
// types/billing.ts

interface MessagePack {
  id: string;
  name: string;
  messages: number;
  price: number;
  pricePerMessage: number;
  validityDays: number;
  autoRenew: boolean;
}

interface UserMessageBalance {
  included: number;          // Del plan
  includedUsed: number;      // Usados del plan
  includedRemaining: number; // Restantes del plan
  packs: PurchasedPack[];    // Packs comprados
  totalAvailable: number;    // Total disponible
  resetDate: Date;           // Cuándo se reinicia el plan
}

// Definición de packs disponibles
const MESSAGE_PACKS: Record<string, MessagePack[]> = {
  starter: [
    { id: 'starter-100', name: '100 mensajes', messages: 100, price: 6, pricePerMessage: 0.06, validityDays: 30, autoRenew: false },
    { id: 'starter-300', name: '300 mensajes', messages: 300, price: 15, pricePerMessage: 0.05, validityDays: 30, autoRenew: false },
  ],
  growth: [
    { id: 'growth-250', name: '250 mensajes', messages: 250, price: 12, pricePerMessage: 0.048, validityDays: 30, autoRenew: false },
    { id: 'growth-600', name: '600 mensajes', messages: 600, price: 25, pricePerMessage: 0.042, validityDays: 30, autoRenew: false },
  ],
  pro: [
    { id: 'pro-500', name: '500 mensajes', messages: 500, price: 20, pricePerMessage: 0.04, validityDays: 30, autoRenew: false },
    { id: 'pro-1500', name: '1500 mensajes', messages: 1500, price: 50, pricePerMessage: 0.033, validityDays: 30, autoRenew: false },
  ]
};
```

### 4.5 Alertas de Consumo

```typescript
// services/usage-monitor.ts

class UsageMonitor {
  private readonly THRESHOLDS = [
    { percent: 50, type: 'info' },
    { percent: 75, type: 'warning' },
    { percent: 90, type: 'urgent' },
    { percent: 100, type: 'depleted' }
  ];

  async checkUsage(userId: string): Promise<void> {
    const balance = await this.getBalance(userId);
    const usagePercent = (balance.includedUsed / balance.included) * 100;

    for (const threshold of this.THRESHOLDS) {
      if (usagePercent >= threshold.percent && !this.alreadyNotified(userId, threshold.percent)) {
        await this.sendAlert(userId, threshold, balance);
        await this.markNotified(userId, threshold.percent);
      }
    }
  }

  private async sendAlert(userId: string, threshold: any, balance: UserMessageBalance): Promise<void> {
    const alerts = {
      info: {
        title: '📊 Has usado el 50% de tus mensajes API',
        body: `Te quedan ${balance.includedRemaining} mensajes. Recuerda: responder desde la app es gratis.`,
        action: null
      },
      warning: {
        title: '⚠️ 75% de mensajes API consumidos',
        body: `Solo quedan ${balance.includedRemaining} mensajes. Considera comprar un pack adicional.`,
        action: 'show_packs'
      },
      urgent: {
        title: '🚨 Casi sin mensajes API',
        body: `Solo ${balance.includedRemaining} mensajes restantes. Compra más o responde desde tu móvil.`,
        action: 'show_packs_urgent'
      },
      depleted: {
        title: '❌ Sin mensajes API disponibles',
        body: 'Compra un pack para seguir enviando desde Wallie, o responde desde tu app móvil (gratis).',
        action: 'show_packs_blocker'
      }
    };

    const alert = alerts[threshold.type];
    await this.notificationService.send(userId, alert);
  }
}
```

### 4.6 UI: Dashboard de Consumo

```typescript
// components/UsageDashboard.tsx

const UsageDashboard: React.FC<{balance: UserMessageBalance}> = ({balance}) => {
  const usagePercent = (balance.includedUsed / balance.included) * 100;
  const daysUntilReset = differenceInDays(balance.resetDate, new Date());

  return (
    <div className="usage-dashboard">
      <h3>📊 Uso de Mensajes API</h3>

      {/* Barra de progreso */}
      <div className="usage-bar">
        <div
          className={`usage-fill ${usagePercent > 90 ? 'critical' : usagePercent > 75 ? 'warning' : 'normal'}`}
          style={{width: `${Math.min(usagePercent, 100)}%`}}
        />
      </div>

      <div className="usage-stats">
        <div className="stat">
          <span className="value">{balance.includedRemaining}</span>
          <span className="label">disponibles</span>
        </div>
        <div className="stat">
          <span className="value">{balance.includedUsed}</span>
          <span className="label">usados</span>
        </div>
        <div className="stat">
          <span className="value">{daysUntilReset}</span>
          <span className="label">días para reinicio</span>
        </div>
      </div>

      {/* Packs adicionales si tiene */}
      {balance.packs.length > 0 && (
        <div className="extra-packs">
          <h4>Packs adicionales:</h4>
          {balance.packs.map(pack => (
            <div key={pack.id} className="pack-item">
              <span>{pack.remaining}/{pack.total} mensajes</span>
              <span className="expiry">Expira: {formatDate(pack.expiryDate)}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA comprar más */}
      {usagePercent > 75 && (
        <div className="buy-more">
          <button className="btn-secondary" onClick={() => openPacksModal()}>
            ➕ Comprar más mensajes
          </button>
        </div>
      )}

      {/* Tip de ahorro */}
      <div className="savings-tip">
        💡 <strong>Tip:</strong> Los mensajes desde tu app móvil son gratis.
        Wallie te sugiere respuestas y tú las envías desde WhatsApp.
        <a href="#" onClick={showDeeplinkTutorial}>Ver cómo</a>
      </div>
    </div>
  );
};
```

### 4.7 Modal de Compra de Packs

```typescript
// components/BuyPacksModal.tsx

const BuyPacksModal: React.FC<{plan: string, onPurchase: (packId: string) => void}> = ({plan, onPurchase}) => {
  const packs = MESSAGE_PACKS[plan];

  return (
    <div className="modal buy-packs-modal">
      <h2>➕ Comprar Mensajes Adicionales</h2>

      <p className="intro">
        Añade más mensajes API a tu cuenta.
        <strong>Recuerda:</strong> responder desde tu móvil es siempre gratis.
      </p>

      <div className="packs-grid">
        {packs.map(pack => (
          <div key={pack.id} className="pack-card">
            <div className="pack-header">
              <span className="messages">{pack.messages}</span>
              <span className="unit">mensajes</span>
            </div>

            <div className="pack-price">
              <span className="amount">€{pack.price}</span>
              <span className="per-msg">€{pack.pricePerMessage.toFixed(3)}/msg</span>
            </div>

            <div className="pack-validity">
              Válido por {pack.validityDays} días
            </div>

            <button
              className="btn-primary"
              onClick={() => onPurchase(pack.id)}
            >
              Comprar
            </button>
          </div>
        ))}
      </div>

      <div className="comparison">
        <h4>💡 ¿Necesitas más regularmente?</h4>
        <p>Considera subir de plan para mejor precio por mensaje.</p>
        <button className="btn-link">Ver planes</button>
      </div>
    </div>
  );
};
```

---

## 5. Flujo Completo: Decisión de Envío

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  MENSAJE ENTRANTE DE CLIENTE                                │
│              │                                              │
│              ▼                                              │
│  ┌─────────────────────┐                                    │
│  │ Wallie analiza      │                                    │
│  │ y genera sugerencia │                                    │
│  └─────────────────────┘                                    │
│              │                                              │
│              ▼                                              │
│  ┌─────────────────────┐                                    │
│  │ ¿Es automatización? │                                    │
│  │ (broadcast, bot,    │                                    │
│  │  fuera de horario)  │                                    │
│  └─────────────────────┘                                    │
│        │           │                                        │
│       SÍ          NO                                        │
│        │           │                                        │
│        ▼           ▼                                        │
│   ┌─────────┐  ┌─────────────────────┐                      │
│   │ Enviar  │  │ Notificar usuario   │                      │
│   │ vía API │  │ con sugerencia +    │                      │
│   │ (cobra) │  │ deeplink a app      │                      │
│   └─────────┘  └─────────────────────┘                      │
│        │                 │                                  │
│        ▼                 ▼                                  │
│   Descuenta        ┌───────────────┐                        │
│   del balance      │ Usuario elige │                        │
│                    └───────────────┘                        │
│                      │         │                            │
│                 "Desde app" "Desde API"                     │
│                      │         │                            │
│                      ▼         ▼                            │
│                   GRATIS    Descuenta                       │
│                              del balance                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Configuración de Usuario

### 6.1 Preferencias de Envío

```typescript
// types/user-preferences.ts

interface SendingPreferences {
  // Cuándo usar API automáticamente
  autoSendViaApi: {
    broadcasts: boolean;           // Envíos masivos
    automations: boolean;          // Flujos automáticos
    outsideHours: boolean;         // Fuera de horario laboral
    urgentResponses: boolean;      // Clientes VIP urgentes
  };

  // Horario laboral (para decidir API vs notificación)
  workingHours: {
    start: string;  // "09:00"
    end: string;    // "19:00"
    days: number[]; // [1,2,3,4,5] = Lun-Vie
    timezone: string;
  };

  // Notificaciones
  notifications: {
    incomingMessages: 'always' | 'working_hours' | 'never';
    suggestionsReady: 'push' | 'in_app' | 'both';
    usageAlerts: boolean;
    coexistenceReminders: boolean;
  };

  // Comportamiento de respuesta
  defaultAction: 'notify_for_app' | 'send_via_api' | 'ask_each_time';
}
```

### 6.2 UI de Configuración

```typescript
// components/SendingPreferencesSettings.tsx

const SendingPreferencesSettings: React.FC = () => {
  const [prefs, setPrefs] = useState<SendingPreferences>(defaultPrefs);

  return (
    <div className="settings-section">
      <h2>⚙️ Preferencias de Envío</h2>

      <div className="setting-group">
        <h3>📱 Acción por defecto cuando llega un mensaje</h3>
        <p className="description">
          Elige qué hace Wallie cuando recibes un mensaje y tiene una sugerencia lista.
        </p>

        <RadioGroup
          value={prefs.defaultAction}
          onChange={(value) => setPrefs({...prefs, defaultAction: value})}
          options={[
            {
              value: 'notify_for_app',
              label: '📱 Notificarme para responder desde app (GRATIS)',
              description: 'Wallie te avisa y tú envías desde WhatsApp. Sin coste.'
            },
            {
              value: 'send_via_api',
              label: '⚡ Enviar automáticamente vía API',
              description: 'Respuesta inmediata pero consume mensajes del plan.'
            },
            {
              value: 'ask_each_time',
              label: '🤔 Preguntarme cada vez',
              description: 'Máximo control, tú decides en cada mensaje.'
            }
          ]}
        />
      </div>

      <div className="setting-group">
        <h3>🤖 Envío automático vía API para:</h3>

        <CheckboxList
          items={[
            { key: 'broadcasts', label: 'Envíos masivos / Campañas' },
            { key: 'automations', label: 'Respuestas automáticas del chatbot' },
            { key: 'outsideHours', label: 'Mensajes fuera de mi horario laboral' },
            { key: 'urgentResponses', label: 'Respuestas urgentes a clientes VIP' }
          ]}
          values={prefs.autoSendViaApi}
          onChange={(values) => setPrefs({...prefs, autoSendViaApi: values})}
        />
      </div>

      <div className="setting-group">
        <h3>🕐 Horario Laboral</h3>
        <p className="description">
          Fuera de este horario, Wallie puede responder automáticamente
          (si lo configuras arriba).
        </p>

        <TimeRangePicker
          start={prefs.workingHours.start}
          end={prefs.workingHours.end}
          days={prefs.workingHours.days}
          onChange={(hours) => setPrefs({...prefs, workingHours: hours})}
        />
      </div>

      <div className="savings-estimate">
        <h3>💰 Estimación de Ahorro</h3>
        <p>
          Con tu configuración actual, estimamos que ahorrarás
          <strong>~€{calculateSavings(prefs)}/mes</strong>
          al responder desde tu app en lugar de API.
        </p>
      </div>
    </div>
  );
};
```

---

## 7. Integración con Roadmap

### 7.1 Features a Añadir

| Feature | Fase | Esfuerzo | Prioridad |
|---------|------|----------|-----------|
| Monitor Coexistence (14 días) | MVP | 2 días | ALTA |
| Alertas recordatorio app | MVP | 1 día | ALTA |
| Deeplinks básicos | MVP | 1 día | ALTA |
| UI estado conexión | MVP | 1 día | MEDIA |
| Sistema packs adicionales | Post-MVP | 3 días | MEDIA |
| Dashboard consumo | Post-MVP | 2 días | MEDIA |
| Preferencias envío | Post-MVP | 2 días | MEDIA |
| Notificaciones inteligentes | Post-MVP | 3 días | MEDIA |

### 7.2 Dependencias

```
Coexistence Strategy DEPENDE DE:
├── Integración BSP con Coexistence (Chakra/360dialog/etc)
├── Sistema de notificaciones push
├── Sistema de pagos (para packs)
└── UI base de Wallie

Coexistence Strategy ALIMENTA A:
├── Modelo de negocio sostenible
├── Diferenciación vs competencia
├── Reducción churn (menos costes sorpresa)
└── Mayor engagement (recordatorios)
```

---

## 8. Resumen Ejecutivo

### Lo que implementamos:

1. **Recordatorios 14 días** → Usuario nunca pierde conexión por olvido
2. **Deeplinks inteligentes** → Responder desde app = GRATIS
3. **Modelo híbrido de pricing** → X mensajes incluidos + packs opcionales
4. **Dashboard de consumo** → Transparencia total
5. **Preferencias de envío** → Usuario controla cuándo usa API

### Diferenciación vs Competidores:

| Aspecto | Competidores | Wallie |
|---------|--------------|--------|
| Aviso 14 días | No | Sí, múltiples alertas |
| Incentivo usar app | No | Deeplinks + tips |
| Markup mensajes | 10-35% | 0% |
| Transparencia costes | Ocultos | Dashboard tiempo real |
| Packs flexibles | Solo upgrades | Compra lo que necesitas |

### Claim de Marketing:

> *"Wallie optimiza tus costes: te ayuda a responder gratis desde tu móvil y solo usas API cuando realmente lo necesitas"*

---

**Documento listo para integrar con MIGRATION_ASSISTANT.md**
