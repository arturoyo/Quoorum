# START.md — Resumen Ejecutivo

> **Lee esto en 2 minutos para entender el proyecto**

---

## ¿Qué es Wallie?

**Tu clon de ventas en WhatsApp.**

Un asistente que:

- Sincroniza tu WhatsApp Business automáticamente
- Aprende cómo escribes TÚ
- Te dice a quién escribir y qué decir
- Puede responder por ti (como si fueras tú)
- Nunca olvida un seguimiento
- Predice oportunidades de venta

---

## El problema

> **El 44% de las ventas se pierden por mal seguimiento.**

Los autónomos y pymes:

- Tienen cientos de chats en WhatsApp
- Olvidan hacer seguimiento
- No saben qué escribir
- Pierden ventas por no responder a tiempo

---

## La solución

```
WhatsApp Business  →  WALLIE  →  Más ventas, menos esfuerzo
```

Wallie se conecta a tu WhatsApp, organiza todo, y te dice (o hace por ti) lo que hay que hacer.

---

## Diferenciadores (21 quick wins)

1. **IA que escribe como TÚ** (no plantillas genéricas)
2. **Seguimiento proactivo** ("Hace 4 días enviaste presupuesto...")
3. **Piloto automático** (responde mientras trabajas)
4. **Email + WhatsApp unificado**
5. **Recordatorios predictivos** ("A Juan le toca cambio de aceite")
6. **Chat con Wallie** (tu asistente siempre arriba)
7. **Agentes** (busca en web, docs, facturas)

---

## Stack

| Capa     | Tecnología                     |
| -------- | ------------------------------ |
| Frontend | Next.js 14 + Tailwind + shadcn |
| API      | tRPC                           |
| DB       | Supabase (Postgres)            |
| IA       | OpenAI GPT-4o-mini             |
| WhatsApp | Business API (360dialog)       |
| Pagos    | Stripe                         |

---

## Roadmap

| Fase | Semanas | Qué                          |
| ---- | ------- | ---------------------------- |
| 0    | 1       | Validar API WhatsApp         |
| 1    | 2-4     | Core: sync + organización    |
| 2    | 5-6     | IA personalizada             |
| 3    | 7-8     | Piloto automático → **BETA** |
| 4-7  | 9-17    | CRM, agentes, integraciones  |
| 8    | 18-19   | Launch 🚀                    |

---

## Pricing

| Plan     | Precio   | Para                 |
| -------- | -------- | -------------------- |
| Starter  | €49/mes  | Autónomo que empieza |
| Pro      | €99/mes  | Autónomo con volumen |
| Business | €199/mes | Pyme con equipo      |

---

## Documentos

| Doc                | Qué contiene                               |
| ------------------ | ------------------------------------------ |
| **SYSTEM.md**      | Reglas, stack, arquitectura (LEER SIEMPRE) |
| **PHASES.md**      | Roadmap detallado con tareas               |
| **QUICK_WINS.md**  | 21 diferenciadores vs competencia          |
| **MASTER_PLAN.md** | Arquitectura técnica completa              |
| **CLAUDE.md**      | Instrucciones para desarrollo              |

---

## Próximo paso

**Fase 0: Validar que WhatsApp Business API funciona.**

1. Elegir proveedor (360dialog)
2. Crear cuenta
3. Enviar/recibir mensaje de prueba
4. Calcular costes
5. GO/NO-GO

---

_¡Vamos! 🚀_
