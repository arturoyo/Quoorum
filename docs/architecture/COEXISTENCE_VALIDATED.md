# COEXISTENCE_VALIDATED.md — Validación Técnica WhatsApp

> **Fecha:** 29 Noviembre 2025
> **Estado:** ✅ VALIDADO
> **Conclusión:** El modelo "Copiloto Fantasma" es viable en España

---

## Resumen Ejecutivo

Se ha validado que **WhatsApp Coexistence** está disponible para números españoles (+34), lo que permite que Wallie funcione como una capa de inteligencia sobre WhatsApp Business App sin "secuestrar" el móvil del usuario.

---

## Evidencia Recopilada

### 1. Investigación Web (Nov 2025)

| Fuente         | Fecha    | España/UE    |
| -------------- | -------- | ------------ |
| Chakra Chat    | Nov 2025 | ✅ Soportado |
| Respond.io     | Nov 2025 | ✅ Soportado |
| 360dialog docs | Nov 2025 | ✅ Soportado |

**Países NO soportados (únicos):** Nigeria, Sudáfrica

### 2. Validación Visual en Respond.io

Se llegó hasta la pantalla de configuración con un número español (+34):

- ✅ Apareció opción "Connect WhatsApp Business App"
- ✅ Texto: "Seguirás teniendo acceso total a la app de WhatsApp Business"
- ✅ Texto: "Los mensajes que envíes desde la app también se enviarán a respond.io"
- ✅ No aparece warning de "número será desconectado del móvil"

### 3. Bloqueador encontrado (NO relacionado con Coexistence)

El proceso se detuvo por problemas administrativos de Facebook Business Manager (permisos, portfolio comercial antiguo). Esto es un problema de cuenta específica, no de la tecnología.

---

## Modelo Validado: "Copiloto Fantasma"

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (Fontanero)                       │
│                                                              │
│   📱 WhatsApp Business App                                   │
│   └── Sigue usando como SIEMPRE                             │
│   └── Responde desde el móvil (GRATIS)                      │
│   └── Notificaciones normales                               │
│                                                              │
│                         ↕️ SYNC                              │
│                                                              │
│   💻 Wallie (API via Coexistence)                           │
│   └── Recibe copia de todos los mensajes                    │
│   └── IA analiza y sugiere respuestas                       │
│   └── CRM organiza clientes                                 │
│   └── Recordatorios predictivos                             │
│   └── Piloto automático (opcional)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Características de Coexistence

### ✅ Lo que SÍ funciona

- Mismo número en App + API simultáneamente
- Mensajes se sincronizan ("echo") entre ambos
- Usuario puede responder desde App o desde API
- Historial de hasta 6 meses sincronizable
- Contactos sincronizables
- Llamadas desde la App (no desde API)
- Estados de WhatsApp funcionan
- Grupos funcionan en App (no sync a API)

### ⚠️ Limitaciones conocidas

- Broadcast lists: Solo lectura en App (usar API para masivos)
- Grupos: No se sincronizan con API
- WhatsApp Windows/WearOS: No soportados para sync
- Blue tick: No se transfiere (hay que re-solicitar)
- Abrir App cada 14 días para mantener conexión

### 💰 Modelo de costes

| Acción                                            | Coste                             |
| ------------------------------------------------- | --------------------------------- |
| Usuario responde desde App                        | **GRATIS**                        |
| Usuario responde desde API (dentro de 24h window) | **GRATIS** (Service conversation) |
| Wallie inicia conversación (template)             | ~0.05-0.07€                       |
| Wallie envía recordatorio (template)              | ~0.05-0.07€                       |

---

## BSPs Validados para España

| BSP             | Coexistence | Pricing          | Notas                |
| --------------- | ----------- | ---------------- | -------------------- |
| **Respond.io**  | ✅          | Desde $79/mes    | UI muy amigable      |
| **Chakra Chat** | ✅          | Desde $12.49/mes | Más económico        |
| **360dialog**   | ✅          | Pay-as-you-go    | Más técnico/API pura |
| **SleekFlow**   | ✅          | Desde $79/mes    | Buena UI             |

---

## Impacto en Roadmap

### Cambios respecto al plan original

| Aspecto             | Plan Original        | Nuevo Plan                  |
| ------------------- | -------------------- | --------------------------- |
| Modelo              | Reemplazar WhatsApp  | **Capa sobre WhatsApp**     |
| App móvil           | Crítica desde Fase 1 | **Opcional/futuro**         |
| Fricción onboarding | Alta (pierde móvil)  | **Baja (mantiene móvil)**   |
| Propuesta de valor  | "Tu nuevo WhatsApp"  | **"Tu copiloto invisible"** |

### Tareas que se SIMPLIFICAN

- ❌ ~~Construir UI de chat completa~~ → Solo dashboard/CRM
- ❌ ~~Replicar WhatsApp~~ → Solo mostrar sugerencias
- ❌ ~~App móvil urgente~~ → Web-first está OK
- ❌ ~~Migración de historial~~ → Sync automático

### Tareas que se AÑADEN

- ✅ Integración con BSP (respond.io / 360dialog)
- ✅ Manejo de "echo messages"
- ✅ Gestión de templates para mensajes proactivos
- ✅ Lógica de "cuándo interviene Wallie"

---

## Riesgos Restantes

### 1. Verificación de Business Manager (MEDIO)

- Meta requiere verificación para API
- Puede tardar días para autónomos
- **Mitigación:** Servicio "concierge" de onboarding

### 2. Costes de Templates (BAJO)

- ~0.05-0.07€ por mensaje proactivo
- 100 recordatorios/mes = ~7€
- **Mitigación:** Incluido en margen de 49€/mes

### 3. Dependencia de Meta (BAJO)

- Meta podría cambiar reglas
- **Mitigación:** Es riesgo de toda la industria, no solo Wallie

---

## Conclusión

**Wallie es viable.** El modelo "Copiloto Fantasma" resuelve el problema de fricción identificado en la crítica inicial. El usuario mantiene su WhatsApp, Wallie opera como capa inteligente.

**Siguiente paso:** Comenzar Fase 0 del desarrollo técnico.

---

_Documento generado tras validación práctica el 29/11/2025_
