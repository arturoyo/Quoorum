# Wallie Onboarding & Business Verification Wizard

> **Versión:** 1.0.0 | **Fecha:** 2 Dic 2025
> **Prioridad:** 🔴 CRÍTICA — Bloqueante para adopción de usuarios
> **Fase:** MVP Phase 5.7

---

## Resumen Ejecutivo

### El Problema

1. **Fricción de entrada extrema:** WhatsApp Business API requiere Business Verification de Meta, un proceso que:
   - Toma 3-14 días (o más si hay rechazos)
   - Requiere documentación empresarial (escrituras, CIF, dominio)
   - Es confuso para autónomos y pequeñas empresas españolas
   - Tiene alta tasa de rechazo por errores evitables

2. **Impacto en conversión:**
   - Usuarios abandonan antes de completar verificación
   - No entienden qué documentos necesitan
   - No saben el estado de su solicitud
   - Rechazos sin explicación clara causan frustración

3. **Competencia:**
   - Competidores como Clientify ofrecen "onboarding guiado" pero sin asistencia real
   - La mayoría deja al usuario solo con documentación de Meta

### La Solución

**Wizard de Onboarding en 2 Fases:**

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1: ONBOARDING PRODUCTO (5-10 min)                        │
│  ═══════════════════════════════════════════════════════════   │
│  • Tour guiado del dashboard                                    │
│  • Configuración básica (perfil, preferencias)                  │
│  • Importar contactos iniciales (opcional)                      │
│  • Personalización de IA (tono, estilo)                        │
│                                                                 │
│  FASE 2: BUSINESS VERIFICATION ASSISTANT (3-14 días)           │
│  ═══════════════════════════════════════════════════════════   │
│  • Pre-checklist de documentos                                  │
│  • Asistente paso a paso con Meta                               │
│  • Tracking de estado en tiempo real                            │
│  • Gestión de rechazos con soluciones                          │
│  • Celebración al completar                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Impacto Esperado

| Métrica | Sin Wizard | Con Wizard | Mejora |
|---------|------------|------------|--------|
| Tasa de completado verificación | ~40% | ~75% | +87% |
| Tiempo medio verificación | 14 días | 7 días | -50% |
| Tickets de soporte onboarding | 80% usuarios | 20% usuarios | -75% |
| Abandono pre-verificación | 35% | 10% | -71% |

---

## Índice

1. [Fase 1: Onboarding del Producto](#fase-1-onboarding-del-producto)
2. [Fase 2: Business Verification Assistant](#fase-2-business-verification-assistant)
3. [Pre-Verification Checklist](#pre-verification-checklist)
4. [Flujo Técnico Completo](#flujo-técnico-completo)
5. [Gestión de Rechazos](#gestión-de-rechazos)
6. [Contenido Educativo](#contenido-educativo)
7. [Base de Datos y Estado](#base-de-datos-y-estado)
8. [Componentes UI](#componentes-ui)
9. [Integraciones](#integraciones)
10. [Métricas y Analytics](#métricas-y-analytics)
11. [Implementación por Fases](#implementación-por-fases)

---

## Fase 1: Onboarding del Producto

### 1.1 Flujo del Wizard de Producto

```
PASO 1: Bienvenida (30s)
────────────────────────────────────────
┌─────────────────────────────────────┐
│  🎉 ¡Bienvenido a Wallie!           │
│                                     │
│  Tu asistente de ventas con IA     │
│  para WhatsApp Business             │
│                                     │
│  Vamos a configurar tu cuenta       │
│  en menos de 10 minutos.            │
│                                     │
│  [▶️ Ver video intro (2 min)]       │
│                                     │
│         [Empezar →]                 │
└─────────────────────────────────────┘

PASO 2: Perfil de Negocio (2 min)
────────────────────────────────────────
┌─────────────────────────────────────┐
│  📋 Cuéntanos sobre tu negocio      │
│                                     │
│  Nombre del negocio:                │
│  [______________________________]   │
│                                     │
│  Sector:                            │
│  [Seleccionar ▼]                    │
│  • Consultoría/Servicios            │
│  • Comercio/Retail                  │
│  • Salud/Bienestar                  │
│  • Educación/Formación              │
│  • Inmobiliaria                     │
│  • Otros                            │
│                                     │
│  Tamaño de equipo:                  │
│  ( ) Solo yo                        │
│  ( ) 2-5 personas                   │
│  ( ) 6-20 personas                  │
│  ( ) Más de 20                      │
│                                     │
│  [← Atrás]        [Siguiente →]     │
└─────────────────────────────────────┘

PASO 3: Estilo de Comunicación (2 min)
────────────────────────────────────────
┌─────────────────────────────────────┐
│  💬 ¿Cómo te comunicas?             │
│                                     │
│  La IA adaptará sus sugerencias     │
│  a tu estilo personal.              │
│                                     │
│  Tono preferido:                    │
│  [Formal ──●────── Informal]        │
│                                     │
│  Longitud de mensajes:              │
│  [Corto ────●──── Detallado]        │
│                                     │
│  Uso de emojis:                     │
│  [ ] Nunca                          │
│  [●] Ocasionalmente                 │
│  [ ] Frecuentemente                 │
│                                     │
│  [← Atrás]        [Siguiente →]     │
└─────────────────────────────────────┘

PASO 4: Importar Contactos (Opcional, 2 min)
────────────────────────────────────────
┌─────────────────────────────────────┐
│  📱 Importa tus contactos           │
│                                     │
│  Puedes hacerlo ahora o después.    │
│                                     │
│  [📄 Subir CSV/Excel]               │
│                                     │
│  [📇 Desde Google Contacts]         │
│                                     │
│  [✋ Saltar por ahora]              │
│                                     │
│  ℹ️ Podrás importar más contactos   │
│     desde Configuración             │
│                                     │
│  [← Atrás]        [Siguiente →]     │
└─────────────────────────────────────┘

PASO 5: Tour Interactivo (3 min)
────────────────────────────────────────
┌─────────────────────────────────────┐
│  🎯 Conoce tu Dashboard             │
│                                     │
│  [Tour interactivo con highlights   │
│   en cada sección:]                 │
│                                     │
│  1. 📊 Panel principal              │
│     "Aquí verás tus métricas"       │
│                                     │
│  2. 💬 Conversaciones               │
│     "Gestiona todos tus chats"      │
│                                     │
│  3. 👥 Clientes                     │
│     "Tu CRM integrado"              │
│                                     │
│  4. 🤖 Asistente IA                 │
│     "Tu copiloto de ventas"         │
│                                     │
│  5. ⚙️ Configuración                │
│     "Personaliza todo"              │
│                                     │
│         [Completar Tour]            │
└─────────────────────────────────────┘

PASO 6: Siguiente Paso Crítico
────────────────────────────────────────
┌─────────────────────────────────────┐
│  ✅ ¡Perfil configurado!            │
│                                     │
│  Para usar Wallie con WhatsApp      │
│  necesitas completar la             │
│  verificación de Meta.              │
│                                     │
│  ⏱️ Tiempo estimado: 3-14 días      │
│                                     │
│  📋 Te guiaremos paso a paso        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ⚠️ IMPORTANTE                  │  │
│  │                               │  │
│  │ Sin verificación solo podrás  │  │
│  │ usar Wallie en modo DEMO      │  │
│  │ (datos de prueba)             │  │
│  └───────────────────────────────┘  │
│                                     │
│  [Empezar Verificación →]           │
│                                     │
│  [Explorar modo demo primero]       │
└─────────────────────────────────────┘
```

### 1.2 Modo Demo (Sin Verificación)

Para usuarios que quieren explorar antes de verificar:

```typescript
// Estado del usuario
enum OnboardingStatus {
  PRODUCT_ONBOARDING = 'product_onboarding',  // Fase 1 en progreso
  DEMO_MODE = 'demo_mode',                     // Explorando sin verificar
  VERIFICATION_PENDING = 'verification_pending', // Verificando
  VERIFICATION_REJECTED = 'verification_rejected',
  VERIFIED = 'verified',                       // ✅ Listo para producción
}

// Funcionalidades en modo demo
const DEMO_MODE_FEATURES = {
  enabled: [
    'dashboard_preview',      // Dashboard con datos de ejemplo
    'ai_suggestions_demo',    // IA con conversaciones de muestra
    'client_management_demo', // CRUD clientes (datos ficticios)
    'reports_preview',        // Reportes con datos de ejemplo
  ],
  disabled: [
    'real_whatsapp_messages', // No puede enviar/recibir real
    'webhook_integration',    // No hay webhook activo
    'billing',                // No puede pagar hasta verificar
  ],
  warnings: {
    message: '⚠️ Estás en modo demo. Completa la verificación para usar WhatsApp real.',
    cta: 'Verificar ahora',
  }
}
```

---

## Fase 2: Business Verification Assistant

### 2.1 El Problema de la Verificación de Meta

```
PROCESO ACTUAL (Sin asistencia):
═══════════════════════════════════════════════════════════════════

Usuario → Lee docs de Meta → Confusión → Intenta → Rechazado → ???
              │                  │           │          │
              ▼                  ▼           ▼          ▼
         "¿Qué es            "¿Qué       "Error en    "¿Por qué?
          Business            docs        formulario"   ¿Qué hago?"
          Manager?"           subo?"

RESULTADO: 35% abandono, 60% necesitan soporte, 3+ rechazos promedio
```

### 2.2 Nuestra Solución: Verificación Guiada

```
PROCESO CON WALLIE VERIFICATION ASSISTANT:
═══════════════════════════════════════════════════════════════════

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐
│ Pre-Check   │───►│ Preparación │───►│ Verificar   │───►│ ¡Listo! │
│ Documentos  │    │ Guiada      │    │ con Meta    │    │         │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────┘
      │                   │                  │
      ▼                   ▼                  ▼
 "Necesitas          "Subir aquí"      "Estado: En revisión"
  estos docs"         [Validación]      [Tracking tiempo real]
```

### 2.3 Flujo del Verification Assistant

```
PASO 1: Pre-Verificación Checklist
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│  📋 ANTES DE EMPEZAR                                            │
│                                                                 │
│  Meta requiere verificar que tu negocio es real.                │
│  Prepara estos documentos ANTES de continuar:                   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  DOCUMENTOS REQUERIDOS                                     │  │
│  │  ══════════════════════════════════════════════════════   │  │
│  │                                                           │  │
│  │  [ ] 📄 CIF/NIF de la empresa                             │  │
│  │      Documento oficial con número fiscal                  │  │
│  │      [ℹ️ Ver ejemplo]                                     │  │
│  │                                                           │  │
│  │  [ ] 🏢 Documento de constitución                         │  │
│  │      Escrituras, estatutos o alta autónomo                │  │
│  │      [ℹ️ Ver ejemplo]                                     │  │
│  │                                                           │  │
│  │  [ ] 🌐 Dominio web verificable                           │  │
│  │      Web con el nombre de tu negocio                      │  │
│  │      [ℹ️ ¿No tengo web?]                                  │  │
│  │                                                           │  │
│  │  [ ] 📱 Número de teléfono NUEVO                          │  │
│  │      NO puede estar registrado en WhatsApp                │  │
│  │      [ℹ️ ¿Por qué nuevo?]                                 │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ⏱️ Tiempo de verificación: 3-14 días laborables                │
│                                                                 │
│  [Tengo todo → Empezar]    [Necesito preparar docs]            │
└─────────────────────────────────────────────────────────────────┘

PASO 2: Configurar Facebook Business Manager
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│  🔷 PASO 1 de 6: Facebook Business Manager                      │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░ 15%                           │
│                                                                 │
│  El Business Manager es el panel de control de Meta             │
│  para empresas. Es GRATUITO.                                    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [▶️ VIDEO: Cómo crear Business Manager (2:30)]            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📌 PASOS:                                                      │
│                                                                 │
│  1. Ve a business.facebook.com                                  │
│     [Abrir en nueva pestaña →]                                 │
│                                                                 │
│  2. Haz clic en "Crear cuenta"                                  │
│                                                                 │
│  3. Introduce:                                                  │
│     • Nombre del negocio (debe coincidir con documentos)        │
│     • Tu nombre                                                 │
│     • Email de empresa                                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ⚠️ IMPORTANTE: El nombre debe ser EXACTAMENTE igual       │  │
│  │    al que aparece en tus documentos fiscales.             │  │
│  │                                                           │  │
│  │    ❌ "Mi Tienda SL" vs "MI TIENDA SOCIEDAD LIMITADA"     │  │
│  │    ✅ "MI TIENDA SOCIEDAD LIMITADA" (como en el CIF)      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ¿Ya tienes Business Manager?                                   │
│  [Sí, ya lo tengo]    [No, lo acabo de crear]                  │
│                                                                 │
│  [← Atrás]                              [Siguiente →]           │
└─────────────────────────────────────────────────────────────────┘

PASO 3: Verificación de Negocio
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│  📄 PASO 2 de 6: Verificación de Negocio                        │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░ 30%                           │
│                                                                 │
│  Ahora Meta verificará que tu empresa existe legalmente.        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [▶️ VIDEO: Subir documentos correctamente (3:00)]         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📌 SUBIR DOCUMENTOS:                                           │
│                                                                 │
│  1. En Business Manager → Configuración → Verificación          │
│     [Abrir directamente →]                                     │
│                                                                 │
│  2. Sube UNO de estos documentos:                               │
│                                                                 │
│     📄 Opción A: CIF + Escrituras de constitución               │
│        (Recomendado para S.L. y S.A.)                          │
│                                                                 │
│     📄 Opción B: Alta en Hacienda (Modelo 036/037)              │
│        (Recomendado para autónomos)                            │
│                                                                 │
│     📄 Opción C: Factura de servicios + Documento fiscal        │
│        (Alternativa si no tienes los anteriores)               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 💡 CONSEJOS PARA APROBACIÓN:                              │  │
│  │                                                           │  │
│  │ ✅ Documentos legibles (no borrosos)                      │  │
│  │ ✅ PDF o imagen de alta calidad                           │  │
│  │ ✅ Nombre coincide EXACTAMENTE con Business Manager       │  │
│  │ ✅ Dirección visible y legible                            │  │
│  │ ❌ No subas documentos con datos tachados                 │  │
│  │ ❌ No subas capturas de pantalla                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [He subido los documentos →]                                   │
└─────────────────────────────────────────────────────────────────┘

PASO 4: Verificación de Dominio
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│  🌐 PASO 3 de 6: Verificar tu Dominio                           │
│  ████████████░░░░░░░░░░░░░░░░░░░ 45%                           │
│                                                                 │
│  Meta necesita confirmar que el dominio web es tuyo.            │
│                                                                 │
│  Tu dominio: [tuempresa.com____________]                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [▶️ VIDEO: Verificar dominio paso a paso (2:00)]          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📌 MÉTODO RECOMENDADO: Registro DNS                            │
│                                                                 │
│  1. Copia este registro TXT:                                    │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ facebook-domain-verification=abc123xyz789...        │    │
│     │                                    [📋 Copiar]      │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
│  2. Añádelo en tu proveedor de dominio:                        │
│                                                                 │
│     [Logo] GoDaddy    → [Ver instrucciones]                    │
│     [Logo] Namecheap  → [Ver instrucciones]                    │
│     [Logo] Cloudflare → [Ver instrucciones]                    │
│     [Logo] 1&1 IONOS  → [Ver instrucciones]                    │
│     [Logo] Otros      → [Instrucciones genéricas]              │
│                                                                 │
│  3. Espera 5-10 minutos y haz clic en verificar                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ❓ ¿No tienes web?                                        │  │
│  │                                                           │  │
│  │ Opciones:                                                 │  │
│  │ • Crea una web básica gratis con Carrd.co                 │  │
│  │ • Usa tu perfil de LinkedIn Company                       │  │
│  │ • Contacta soporte para alternativas                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Verificar dominio]    [Necesito ayuda con esto]               │
└─────────────────────────────────────────────────────────────────┘

PASO 5: Registrar Número WhatsApp
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│  📱 PASO 4 de 6: Número de WhatsApp Business                    │
│  ████████████████░░░░░░░░░░░░░░░ 60%                           │
│                                                                 │
│  Necesitas un número de teléfono DEDICADO para WhatsApp         │
│  Business. Este número NO puede estar en uso.                   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ⚠️ REQUISITOS DEL NÚMERO:                                 │  │
│  │                                                           │  │
│  │ ✅ Número español (+34)                                   │  │
│  │ ✅ Capaz de recibir SMS o llamada                         │  │
│  │ ❌ NO registrado en WhatsApp personal                     │  │
│  │ ❌ NO registrado en otra cuenta WhatsApp Business         │  │
│  │                                                           │  │
│  │ 💡 Recomendación: Compra una SIM nueva dedicada           │  │
│  │    o usa un número virtual (Twilio, MessageBird)          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Tu número de WhatsApp Business:                                │
│  +34 [___ ___ ___]                                             │
│                                                                 │
│  [▶️ VIDEO: Cómo migrar número existente (si aplica)]          │
│                                                                 │
│  [Siguiente →]                                                  │
└─────────────────────────────────────────────────────────────────┘

PASO 6: Display Name
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│  🏷️ PASO 5 de 6: Nombre para mostrar                           │
│  ████████████████████░░░░░░░░░░░ 75%                           │
│                                                                 │
│  Este es el nombre que verán tus clientes en WhatsApp.          │
│                                                                 │
│  Display Name: [Mi Empresa____________]                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✅ REGLAS DE META PARA DISPLAY NAME:                      │  │
│  │                                                           │  │
│  │ ✅ Debe representar a tu negocio                          │  │
│  │ ✅ Sin caracteres especiales excesivos                    │  │
│  │ ✅ Sin términos genéricos solos ("Tienda", "Shop")        │  │
│  │ ✅ Sin palabras prohibidas (Meta, WhatsApp, Facebook)     │  │
│  │ ❌ No puede ser engañoso                                  │  │
│  │ ❌ No puede infringir marcas registradas                  │  │
│  │                                                           │  │
│  │ EJEMPLOS:                                                 │  │
│  │ ✅ "Peluquería María" → Aprobado                          │  │
│  │ ✅ "TechSolutions Spain" → Aprobado                       │  │
│  │ ❌ "Shop" → Rechazado (muy genérico)                      │  │
│  │ ❌ "Best Deals Official" → Rechazado (engañoso)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Siguiente →]                                                  │
└─────────────────────────────────────────────────────────────────┘

PASO 7: Enviar y Esperar
────────────────────────────────────────
┌─────────────────────────────────────────────────────────────────┐
│  🚀 PASO 6 de 6: ¡Solicitud Enviada!                            │
│  ████████████████████████████░░░ 90%                           │
│                                                                 │
│  Tu solicitud de verificación ha sido enviada a Meta.           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │     ⏳ ESTADO: EN REVISIÓN                                │  │
│  │                                                           │  │
│  │     Enviado: 2 Dic 2025, 14:30                            │  │
│  │     Tiempo estimado: 3-14 días laborables                 │  │
│  │                                                           │  │
│  │     ┌─────────────────────────────────────────────────┐   │  │
│  │     │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ En cola        │   │  │
│  │     │ Día 0 de ~7                                    │   │  │
│  │     └─────────────────────────────────────────────────┘   │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📧 Te notificaremos por email cuando haya novedades.          │
│                                                                 │
│  MIENTRAS ESPERAS:                                              │
│  • Explora Wallie en modo demo                                  │
│  • Importa tus contactos                                        │
│  • Configura tus preferencias de IA                             │
│  • Prepara plantillas de mensajes                               │
│                                                                 │
│  [Ir al Dashboard]    [Ver estado de verificación]              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pre-Verification Checklist

### 3.1 Checklist Interactivo

```typescript
// Tipos para el checklist
interface VerificationChecklistItem {
  id: string
  title: string
  description: string
  required: boolean
  helpUrl?: string
  videoUrl?: string
  status: 'pending' | 'ready' | 'uploaded' | 'verified'
  tips: string[]
  commonErrors: string[]
}

const VERIFICATION_CHECKLIST: VerificationChecklistItem[] = [
  {
    id: 'business_documents',
    title: 'Documentos de empresa',
    description: 'CIF, escrituras, o alta de autónomo',
    required: true,
    videoUrl: '/videos/onboarding/docs-empresa.mp4',
    status: 'pending',
    tips: [
      'PDF de alta calidad (no fotos borrosas)',
      'El nombre debe coincidir EXACTAMENTE con el Business Manager',
      'Asegúrate de que la dirección sea legible',
    ],
    commonErrors: [
      'Nombre de empresa no coincide con Business Manager',
      'Documento borroso o ilegible',
      'Falta la dirección fiscal',
    ],
  },
  {
    id: 'domain',
    title: 'Dominio web',
    description: 'Web con nombre de tu negocio',
    required: true,
    helpUrl: '/help/domain-verification',
    videoUrl: '/videos/onboarding/verificar-dominio.mp4',
    status: 'pending',
    tips: [
      'Puede ser una web simple (incluso landing page)',
      'El dominio debe contener o relacionarse con tu negocio',
      'Necesitas acceso al panel DNS',
    ],
    commonErrors: [
      'No tienes acceso al DNS del dominio',
      'Registro TXT mal copiado',
      'No esperaste 5-10 min antes de verificar',
    ],
  },
  {
    id: 'phone_number',
    title: 'Número de teléfono',
    description: 'Número NO registrado en WhatsApp',
    required: true,
    videoUrl: '/videos/onboarding/numero-whatsapp.mp4',
    status: 'pending',
    tips: [
      'Compra una SIM nueva si es necesario',
      'Asegúrate de poder recibir SMS en ese número',
      'No intentes usar tu número personal actual',
    ],
    commonErrors: [
      'El número ya está en WhatsApp personal',
      'No puede recibir SMS',
      'Intentaron migrar número sin seguir proceso correcto',
    ],
  },
  {
    id: 'business_manager',
    title: 'Facebook Business Manager',
    description: 'Cuenta creada en business.facebook.com',
    required: true,
    helpUrl: 'https://business.facebook.com/',
    videoUrl: '/videos/onboarding/crear-business-manager.mp4',
    status: 'pending',
    tips: [
      'Es 100% gratuito',
      'Usa tu cuenta de Facebook personal para crearlo',
      'El nombre del negocio debe ser OFICIAL (como en documentos)',
    ],
    commonErrors: [
      'Nombre del negocio informal (ej: "Mi Tienda" vs "MI TIENDA S.L.")',
      'Email no verificado',
      'Cuenta de Facebook personal restringida',
    ],
  },
]
```

### 3.2 Vista del Checklist Pre-Verificación

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 CHECKLIST PRE-VERIFICACIÓN                                  │
│                                                                 │
│  Completa estos pasos ANTES de iniciar la verificación          │
│  para evitar rechazos.                                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  1. Documentos de Empresa                         ⬜      │  │
│  │     └─ CIF, escrituras, o alta autónomo                   │  │
│  │        [Ver requisitos] [Ver video 2:00]                  │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  2. Facebook Business Manager                     ⬜      │  │
│  │     └─ Cuenta creada en business.facebook.com             │  │
│  │        [Crear ahora] [Ver video 2:30]                     │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  3. Dominio Web                                   ⬜      │  │
│  │     └─ Web propia con nombre del negocio                  │  │
│  │        [Alternativas sin web] [Ver video 1:30]            │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  4. Número de Teléfono                            ⬜      │  │
│  │     └─ Número español NO registrado en WhatsApp           │  │
│  │        [¿Puedo usar mi número actual?] [Ver video 1:00]   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Progreso: 0/4 completados                                      │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%               │
│                                                                 │
│  [Tengo todo listo → Comenzar verificación]                     │
│                                                                 │
│  ⏱️ Nota: Una vez enviada la solicitud, Meta tarda 3-14 días    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo Técnico Completo

### 4.1 Estados y Máquina de Estados

```typescript
// Estados del proceso de onboarding y verificación
type OnboardingState =
  | 'registered'                    // Cuenta creada, sin empezar onboarding
  | 'product_onboarding_step_1'     // Bienvenida
  | 'product_onboarding_step_2'     // Perfil de negocio
  | 'product_onboarding_step_3'     // Estilo comunicación
  | 'product_onboarding_step_4'     // Importar contactos
  | 'product_onboarding_step_5'     // Tour
  | 'product_onboarding_complete'   // Fase 1 completada
  | 'demo_mode'                     // Explorando sin verificar
  | 'verification_checklist'        // Revisando pre-requisitos
  | 'verification_step_1'           // Business Manager
  | 'verification_step_2'           // Documentos empresa
  | 'verification_step_3'           // Verificar dominio
  | 'verification_step_4'           // Número WhatsApp
  | 'verification_step_5'           // Display Name
  | 'verification_submitted'        // Enviado a Meta
  | 'verification_in_review'        // Meta revisando
  | 'verification_needs_info'       // Meta solicita más info
  | 'verification_rejected'         // Rechazado (puede reintentar)
  | 'verification_approved'         // ✅ Aprobado por Meta
  | 'active'                        // Cuenta activa y operativa

// Transiciones permitidas
const STATE_TRANSITIONS: Record<OnboardingState, OnboardingState[]> = {
  'registered': ['product_onboarding_step_1'],
  'product_onboarding_step_1': ['product_onboarding_step_2'],
  'product_onboarding_step_2': ['product_onboarding_step_3'],
  'product_onboarding_step_3': ['product_onboarding_step_4'],
  'product_onboarding_step_4': ['product_onboarding_step_5'],
  'product_onboarding_step_5': ['product_onboarding_complete'],
  'product_onboarding_complete': ['demo_mode', 'verification_checklist'],
  'demo_mode': ['verification_checklist'],
  'verification_checklist': ['verification_step_1', 'demo_mode'],
  'verification_step_1': ['verification_step_2', 'verification_checklist'],
  'verification_step_2': ['verification_step_3', 'verification_step_1'],
  'verification_step_3': ['verification_step_4', 'verification_step_2'],
  'verification_step_4': ['verification_step_5', 'verification_step_3'],
  'verification_step_5': ['verification_submitted', 'verification_step_4'],
  'verification_submitted': ['verification_in_review'],
  'verification_in_review': ['verification_needs_info', 'verification_rejected', 'verification_approved'],
  'verification_needs_info': ['verification_in_review', 'verification_rejected'],
  'verification_rejected': ['verification_checklist'],
  'verification_approved': ['active'],
  'active': [],
}
```

### 4.2 Diagrama de Flujo Completo

```
                          ┌──────────────┐
                          │  REGISTRO    │
                          └──────┬───────┘
                                 │
                    ┌────────────▼────────────┐
                    │   FASE 1: ONBOARDING    │
                    │   PRODUCTO (5-10 min)   │
                    │                         │
                    │  1. Bienvenida          │
                    │  2. Perfil negocio      │
                    │  3. Estilo comunicación │
                    │  4. Importar contactos  │
                    │  5. Tour dashboard      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    ¿QUÉ HACER AHORA?    │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                                     │
              ▼                                     ▼
     ┌────────────────┐                   ┌────────────────┐
     │   MODO DEMO    │◄─────────────────►│  VERIFICACIÓN  │
     │                │                   │                │
     │ • Dashboard    │                   │ 1. Checklist   │
     │ • IA demo      │                   │ 2. Biz Manager │
     │ • Clientes     │                   │ 3. Documentos  │
     │   ficticios    │                   │ 4. Dominio     │
     │                │                   │ 5. Teléfono    │
     │ [Sin WhatsApp  │                   │ 6. Display     │
     │  real]         │                   │                │
     └────────────────┘                   └───────┬────────┘
                                                  │
                                    ┌─────────────▼─────────────┐
                                    │   ENVIADO A META          │
                                    │   ⏳ 3-14 días            │
                                    └─────────────┬─────────────┘
                                                  │
                          ┌───────────────────────┼───────────────────────┐
                          │                       │                       │
                          ▼                       ▼                       ▼
                 ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
                 │   NECESITA     │     │   RECHAZADO    │     │   APROBADO ✅  │
                 │   MÁS INFO     │     │                │     │                │
                 │                │     │ • Ver razones  │     │ • Webhook ON   │
                 │ • Subir docs   │     │ • Corregir     │     │ • Templates    │
                 │   adicionales  │     │ • Reintentar   │     │ • ¡Listo!      │
                 └───────┬────────┘     └───────┬────────┘     └───────┬────────┘
                         │                      │                       │
                         └──────────────────────┼───────────────────────┘
                                                │
                                    ┌───────────▼───────────┐
                                    │   🎉 CUENTA ACTIVA    │
                                    │                       │
                                    │   WhatsApp Business   │
                                    │   operativo           │
                                    └───────────────────────┘
```

---

## Gestión de Rechazos

### 5.1 Razones Comunes de Rechazo y Soluciones

```typescript
interface RejectionReason {
  code: string
  title: string
  description: string
  solution: string
  videoUrl?: string
  estimatedFixTime: string
}

const REJECTION_REASONS: Record<string, RejectionReason> = {
  'name_mismatch': {
    code: 'name_mismatch',
    title: 'Nombre no coincide',
    description: 'El nombre en Business Manager no coincide con los documentos',
    solution: 'Actualiza el nombre en Business Manager para que sea EXACTAMENTE igual al de tus documentos fiscales. Incluye "S.L.", "S.A." si aplica.',
    videoUrl: '/videos/rejections/name-mismatch.mp4',
    estimatedFixTime: '10 minutos',
  },
  'document_unclear': {
    code: 'document_unclear',
    title: 'Documento ilegible',
    description: 'Los documentos subidos no son legibles o están borrosos',
    solution: 'Sube documentos en PDF de alta calidad. Si es escaneo, asegúrate de que sea nítido. No uses fotos con flash.',
    videoUrl: '/videos/rejections/document-unclear.mp4',
    estimatedFixTime: '15 minutos',
  },
  'domain_not_verified': {
    code: 'domain_not_verified',
    title: 'Dominio no verificado',
    description: 'No se pudo verificar la propiedad del dominio',
    solution: 'Asegúrate de que el registro DNS TXT está correctamente configurado. Puede tardar hasta 48h en propagarse.',
    videoUrl: '/videos/rejections/domain-verify.mp4',
    estimatedFixTime: '1-48 horas',
  },
  'business_not_found': {
    code: 'business_not_found',
    title: 'Empresa no encontrada',
    description: 'Meta no pudo verificar que tu empresa existe',
    solution: 'Asegúrate de que tu empresa está registrada oficialmente y los documentos son actuales. Puedes necesitar documentos adicionales.',
    videoUrl: '/videos/rejections/business-not-found.mp4',
    estimatedFixTime: '1-3 días',
  },
  'phone_already_registered': {
    code: 'phone_already_registered',
    title: 'Número ya en uso',
    description: 'El número de teléfono ya está registrado en WhatsApp',
    solution: 'Debes usar un número nuevo que NO esté registrado en WhatsApp (personal ni business). Considera comprar una SIM nueva.',
    videoUrl: '/videos/rejections/phone-registered.mp4',
    estimatedFixTime: '1 día (comprar SIM)',
  },
  'display_name_rejected': {
    code: 'display_name_rejected',
    title: 'Display Name rechazado',
    description: 'El nombre para mostrar no cumple las políticas de Meta',
    solution: 'Usa el nombre oficial de tu negocio. Evita términos genéricos ("Shop"), engañosos ("Official"), o marcas protegidas.',
    videoUrl: '/videos/rejections/display-name.mp4',
    estimatedFixTime: '5 minutos',
  },
  'suspicious_activity': {
    code: 'suspicious_activity',
    title: 'Actividad sospechosa',
    description: 'Meta detectó actividad sospechosa en la cuenta',
    solution: 'Contacta al soporte de Meta directamente. Puede requerir verificación adicional de identidad.',
    estimatedFixTime: '3-7 días',
  },
}
```

### 5.2 UI de Gestión de Rechazo

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ VERIFICACIÓN RECHAZADA                                      │
│                                                                 │
│  Tu solicitud fue rechazada por Meta.                          │
│  No te preocupes, la mayoría de rechazos se resuelven fácil.   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  RAZÓN DEL RECHAZO:                                       │  │
│  │  ══════════════════════════════════════════════════════   │  │
│  │                                                           │  │
│  │  📛 Nombre no coincide                                    │  │
│  │                                                           │  │
│  │  El nombre en Business Manager ("Mi Tienda") no           │  │
│  │  coincide con los documentos ("MI TIENDA S.L.")           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  💡 SOLUCIÓN:                                                   │
│                                                                 │
│  Actualiza el nombre en Business Manager para que sea          │
│  EXACTAMENTE igual al de tus documentos fiscales.              │
│  Incluye "S.L.", "S.A." si aplica.                            │
│                                                                 │
│  ⏱️ Tiempo estimado: 10 minutos                                │
│                                                                 │
│  [▶️ Ver video tutorial]                                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📝 PASOS PARA CORREGIR:                                  │  │
│  │                                                           │  │
│  │  1. Ve a business.facebook.com                            │  │
│  │  2. Configuración → Información del negocio               │  │
│  │  3. Edita el nombre legal                                 │  │
│  │  4. Guarda cambios                                        │  │
│  │  5. Vuelve aquí y reintenta verificación                  │  │
│  │                                                           │  │
│  │  [Abrir Business Manager →]                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Ya lo corregí → Reintentar verificación]                      │
│                                                                 │
│  [Necesito ayuda → Contactar soporte]                           │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Sistema de Reintentos

```typescript
// Política de reintentos
const RETRY_POLICY = {
  maxRetries: 5,
  cooldownPeriod: {
    afterFirstReject: 0,      // Puede reintentar inmediatamente
    afterSecondReject: 24,    // 24 horas
    afterThirdReject: 72,     // 3 días
    afterFourthReject: 168,   // 1 semana
    afterFifthReject: 'manual', // Requiere soporte
  },
  supportEscalation: {
    afterRejects: 3,          // Ofrecer soporte después de 3 rechazos
    priority: 'high',
  },
}

// Tracking de intentos
interface VerificationAttempt {
  attemptNumber: number
  submittedAt: Date
  status: 'pending' | 'approved' | 'rejected' | 'needs_info'
  rejectionReason?: string
  resolvedAt?: Date
  resolution?: string
}
```

---

## Contenido Educativo

### 6.1 Videos Requeridos

```typescript
const ONBOARDING_VIDEOS = [
  // Fase 1: Producto
  {
    id: 'intro',
    title: '¿Qué es Wallie?',
    duration: '2:00',
    url: '/videos/onboarding/intro.mp4',
    phase: 'product_onboarding',
  },
  {
    id: 'tour',
    title: 'Tour del Dashboard',
    duration: '3:30',
    url: '/videos/onboarding/tour.mp4',
    phase: 'product_onboarding',
  },

  // Fase 2: Verificación
  {
    id: 'verification_overview',
    title: '¿Por qué necesito verificar?',
    duration: '1:30',
    url: '/videos/verification/overview.mp4',
    phase: 'verification',
  },
  {
    id: 'business_manager',
    title: 'Crear Facebook Business Manager',
    duration: '2:30',
    url: '/videos/verification/business-manager.mp4',
    phase: 'verification',
  },
  {
    id: 'documents',
    title: 'Qué documentos subir',
    duration: '3:00',
    url: '/videos/verification/documents.mp4',
    phase: 'verification',
  },
  {
    id: 'domain',
    title: 'Verificar tu dominio',
    duration: '2:00',
    url: '/videos/verification/domain.mp4',
    phase: 'verification',
  },
  {
    id: 'phone_setup',
    title: 'Configurar número WhatsApp',
    duration: '1:30',
    url: '/videos/verification/phone.mp4',
    phase: 'verification',
  },

  // Solución de problemas
  {
    id: 'common_errors',
    title: 'Errores comunes y cómo evitarlos',
    duration: '4:00',
    url: '/videos/verification/common-errors.mp4',
    phase: 'troubleshooting',
  },
]
```

### 6.2 Tooltips y Ayuda Contextual

```typescript
const CONTEXTUAL_HELP = {
  business_name: {
    tooltip: 'Usa el nombre EXACTO que aparece en tus documentos fiscales',
    example: 'Ej: "ACME SOLUCIONES S.L." no "Acme Soluciones"',
    commonMistake: 'No usar abreviaturas si el documento las tiene completas',
  },
  domain_dns: {
    tooltip: 'Un registro DNS TXT es un texto que añades en tu proveedor de dominio',
    providers: {
      godaddy: 'DNS → Añadir → Tipo: TXT → Valor: [código]',
      namecheap: 'Domain List → Manage → Advanced DNS → Add Record',
      cloudflare: 'DNS → Add Record → Type: TXT',
    },
  },
  phone_number: {
    tooltip: 'El número debe poder recibir SMS para verificación',
    warning: 'Si el número ya está en WhatsApp personal, deberás eliminarlo primero (perderás historial)',
    recommendation: 'Recomendamos comprar una SIM nueva dedicada para el negocio',
  },
}
```

### 6.3 FAQ Integrado

```typescript
const VERIFICATION_FAQ = [
  {
    question: '¿Cuánto tarda la verificación?',
    answer: 'Normalmente entre 3-14 días laborables. El tiempo puede variar según la carga de trabajo de Meta y la claridad de tus documentos.',
  },
  {
    question: '¿Puedo usar mi número personal de WhatsApp?',
    answer: 'No directamente. Si quieres usar tu número actual, deberás desvincularlo de WhatsApp personal primero (perderás tu historial personal). Recomendamos usar un número nuevo dedicado al negocio.',
  },
  {
    question: '¿Qué pasa si me rechazan?',
    answer: 'No te preocupes, la mayoría de rechazos se resuelven fácilmente. Te mostraremos la razón exacta del rechazo y cómo solucionarlo. Puedes reintentar las veces que necesites.',
  },
  {
    question: '¿Necesito una web para verificar?',
    answer: 'Meta requiere verificar un dominio. Si no tienes web, puedes crear una landing page gratuita con servicios como Carrd.co o usar tu perfil de LinkedIn Company si tiene dominio personalizado.',
  },
  {
    question: '¿Cuánto cuesta la verificación?',
    answer: 'La verificación con Meta es 100% gratuita. Wallie tampoco cobra por el proceso de onboarding. Solo pagarás por tu plan de Wallie una vez verificado.',
  },
  {
    question: '¿Puedo usar Wallie sin verificar?',
    answer: 'Puedes explorar Wallie en modo demo con datos de ejemplo, pero para enviar y recibir mensajes reales de WhatsApp necesitas completar la verificación.',
  },
  {
    question: '¿Qué documentos necesito si soy autónomo?',
    answer: 'Como autónomo necesitas: 1) Alta en Hacienda (Modelo 036 o 037), 2) DNI/NIE, 3) Acceso a un dominio web. No necesitas escrituras de constitución.',
  },
]
```

---

## Base de Datos y Estado

### 7.1 Schema para Onboarding

```typescript
// packages/db/src/schema/onboarding.ts
import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum, integer, boolean } from 'drizzle-orm/pg-core'
import { users } from './users'

// Estados del onboarding
export const onboardingStatusEnum = pgEnum('onboarding_status', [
  'registered',
  'product_onboarding_step_1',
  'product_onboarding_step_2',
  'product_onboarding_step_3',
  'product_onboarding_step_4',
  'product_onboarding_step_5',
  'product_onboarding_complete',
  'demo_mode',
  'verification_checklist',
  'verification_step_1',
  'verification_step_2',
  'verification_step_3',
  'verification_step_4',
  'verification_step_5',
  'verification_submitted',
  'verification_in_review',
  'verification_needs_info',
  'verification_rejected',
  'verification_approved',
  'active',
])

// Tabla principal de onboarding
export const userOnboarding = pgTable('user_onboarding', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),

  // Estado actual
  status: onboardingStatusEnum('status').notNull().default('registered'),

  // Progreso de Fase 1 (Producto)
  productOnboardingCompleted: boolean('product_onboarding_completed').default(false),
  productOnboardingData: jsonb('product_onboarding_data').$type<{
    businessName?: string
    sector?: string
    teamSize?: string
    communicationStyle?: {
      formality: number // 1-10
      messageLength: number // 1-10
      emojiUsage: 'never' | 'occasionally' | 'frequently'
    }
    contactsImported?: boolean
    tourCompleted?: boolean
  }>(),

  // Progreso de Fase 2 (Verificación)
  verificationStartedAt: timestamp('verification_started_at', { withTimezone: true }),
  verificationCompletedAt: timestamp('verification_completed_at', { withTimezone: true }),
  verificationData: jsonb('verification_data').$type<{
    businessManagerId?: string
    documentsUploaded?: string[]
    domainVerified?: boolean
    domain?: string
    phoneNumber?: string
    displayName?: string
  }>(),

  // Tracking de intentos de verificación
  verificationAttempts: integer('verification_attempts').default(0),
  lastRejectionReason: varchar('last_rejection_reason', { length: 100 }),
  lastRejectionDetails: text('last_rejection_details'),

  // Meta (para saber qué pasos mostrar/ocultar)
  checklistCompleted: jsonb('checklist_completed').$type<string[]>().default([]),
  videosWatched: jsonb('videos_watched').$type<string[]>().default([]),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Historial de intentos de verificación
export const verificationAttempts = pgTable('verification_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  attemptNumber: integer('attempt_number').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // pending, approved, rejected, needs_info

  // Datos enviados en este intento
  submittedData: jsonb('submitted_data').$type<{
    businessManagerId: string
    documents: string[]
    domain: string
    phoneNumber: string
    displayName: string
  }>(),

  // Respuesta de Meta
  rejectionReason: varchar('rejection_reason', { length: 100 }),
  rejectionDetails: text('rejection_details'),
  metaResponse: jsonb('meta_response'),

  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolution: varchar('resolution', { length: 50 }), // approved, rejected, resubmitted

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Tipos inferidos
export type UserOnboarding = typeof userOnboarding.$inferSelect
export type NewUserOnboarding = typeof userOnboarding.$inferInsert
export type VerificationAttempt = typeof verificationAttempts.$inferSelect
```

### 7.2 Queries Principales

```typescript
// packages/api/src/routers/onboarding.ts
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { db } from '@proyecto/db'
import { userOnboarding, verificationAttempts } from '@proyecto/db/schema'
import { eq } from 'drizzle-orm'

export const onboardingRouter = router({
  // Obtener estado actual del onboarding
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const [onboarding] = await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, ctx.userId))

    if (!onboarding) {
      // Crear registro si no existe
      const [newOnboarding] = await db
        .insert(userOnboarding)
        .values({ userId: ctx.userId })
        .returning()
      return newOnboarding
    }

    return onboarding
  }),

  // Actualizar paso del onboarding de producto
  updateProductOnboarding: protectedProcedure
    .input(z.object({
      step: z.number().min(1).max(5),
      data: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const newStatus = `product_onboarding_step_${input.step}` as const

      await db
        .update(userOnboarding)
        .set({
          status: newStatus,
          productOnboardingData: input.data ?
            sql`${userOnboarding.productOnboardingData} || ${input.data}::jsonb` :
            undefined,
          updatedAt: new Date(),
        })
        .where(eq(userOnboarding.userId, ctx.userId))

      return { success: true }
    }),

  // Completar onboarding de producto
  completeProductOnboarding: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db
        .update(userOnboarding)
        .set({
          status: 'product_onboarding_complete',
          productOnboardingCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(userOnboarding.userId, ctx.userId))

      return { success: true }
    }),

  // Marcar item del checklist como completado
  completeChecklistItem: protectedProcedure
    .input(z.object({
      itemId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(userOnboarding)
        .set({
          checklistCompleted: sql`
            CASE
              WHEN ${input.itemId} = ANY(${userOnboarding.checklistCompleted})
              THEN ${userOnboarding.checklistCompleted}
              ELSE ${userOnboarding.checklistCompleted} || ARRAY[${input.itemId}]::text[]
            END
          `,
          updatedAt: new Date(),
        })
        .where(eq(userOnboarding.userId, ctx.userId))

      return { success: true }
    }),

  // Enviar solicitud de verificación
  submitVerification: protectedProcedure
    .input(z.object({
      businessManagerId: z.string(),
      domain: z.string(),
      phoneNumber: z.string(),
      displayName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Obtener estado actual
      const [current] = await db
        .select()
        .from(userOnboarding)
        .where(eq(userOnboarding.userId, ctx.userId))

      const attemptNumber = (current?.verificationAttempts ?? 0) + 1

      // Crear registro de intento
      await db.insert(verificationAttempts).values({
        userId: ctx.userId,
        attemptNumber,
        submittedAt: new Date(),
        status: 'pending',
        submittedData: input,
      })

      // Actualizar estado del usuario
      await db
        .update(userOnboarding)
        .set({
          status: 'verification_submitted',
          verificationStartedAt: current?.verificationStartedAt ?? new Date(),
          verificationAttempts: attemptNumber,
          verificationData: input,
          updatedAt: new Date(),
        })
        .where(eq(userOnboarding.userId, ctx.userId))

      // TODO: Aquí se integraría con la API de Meta para enviar la solicitud
      // Por ahora simulamos el envío

      return {
        success: true,
        attemptNumber,
        estimatedDays: '3-14',
      }
    }),

  // Obtener historial de intentos de verificación
  getVerificationHistory: protectedProcedure.query(async ({ ctx }) => {
    const attempts = await db
      .select()
      .from(verificationAttempts)
      .where(eq(verificationAttempts.userId, ctx.userId))
      .orderBy(desc(verificationAttempts.submittedAt))

    return attempts
  }),

  // Registrar video visto
  markVideoWatched: protectedProcedure
    .input(z.object({
      videoId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(userOnboarding)
        .set({
          videosWatched: sql`
            CASE
              WHEN ${input.videoId} = ANY(${userOnboarding.videosWatched})
              THEN ${userOnboarding.videosWatched}
              ELSE ${userOnboarding.videosWatched} || ARRAY[${input.videoId}]::text[]
            END
          `,
          updatedAt: new Date(),
        })
        .where(eq(userOnboarding.userId, ctx.userId))

      return { success: true }
    }),

  // Entrar en modo demo
  enterDemoMode: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db
        .update(userOnboarding)
        .set({
          status: 'demo_mode',
          updatedAt: new Date(),
        })
        .where(eq(userOnboarding.userId, ctx.userId))

      return { success: true }
    }),
})
```

---

## Componentes UI

### 8.1 Estructura de Componentes

```
apps/web/src/components/onboarding/
├── wizard/
│   ├── OnboardingWizard.tsx          # Contenedor principal
│   ├── WizardProgress.tsx            # Barra de progreso
│   ├── WizardNavigation.tsx          # Botones anterior/siguiente
│   └── steps/
│       ├── WelcomeStep.tsx           # Paso 1
│       ├── BusinessProfileStep.tsx   # Paso 2
│       ├── CommunicationStyleStep.tsx # Paso 3
│       ├── ImportContactsStep.tsx    # Paso 4
│       ├── ProductTourStep.tsx       # Paso 5
│       └── NextStepsStep.tsx         # Qué hacer después
│
├── verification/
│   ├── VerificationWizard.tsx        # Contenedor verificación
│   ├── VerificationProgress.tsx      # Estado de verificación
│   ├── PreVerificationChecklist.tsx  # Checklist inicial
│   └── steps/
│       ├── BusinessManagerStep.tsx
│       ├── DocumentsStep.tsx
│       ├── DomainVerificationStep.tsx
│       ├── PhoneSetupStep.tsx
│       ├── DisplayNameStep.tsx
│       └── SubmittedStep.tsx
│
├── shared/
│   ├── VideoPlayer.tsx               # Reproductor de videos
│   ├── Tooltip.tsx                   # Ayuda contextual
│   ├── ChecklistItem.tsx             # Item de checklist
│   ├── StepCard.tsx                  # Card de paso
│   └── FAQAccordion.tsx              # FAQ expandible
│
├── rejection/
│   ├── RejectionHandler.tsx          # Gestión de rechazos
│   ├── RejectionReasonCard.tsx       # Mostrar razón
│   └── RetryGuide.tsx                # Guía para reintentar
│
└── demo/
    ├── DemoModeBanner.tsx            # Banner "Estás en demo"
    └── DemoModeData.tsx              # Datos de ejemplo
```

### 8.2 Componente Principal del Wizard

```tsx
// apps/web/src/components/onboarding/wizard/OnboardingWizard.tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { api } from '@/lib/trpc'
import { Button } from '@proyecto/ui'

import { WizardProgress } from './WizardProgress'
import { WizardNavigation } from './WizardNavigation'
import { WelcomeStep } from './steps/WelcomeStep'
import { BusinessProfileStep } from './steps/BusinessProfileStep'
import { CommunicationStyleStep } from './steps/CommunicationStyleStep'
import { ImportContactsStep } from './steps/ImportContactsStep'
import { ProductTourStep } from './steps/ProductTourStep'
import { NextStepsStep } from './steps/NextStepsStep'

import type { UserOnboarding } from '@proyecto/db/schema'

interface OnboardingWizardProps {
  initialData: UserOnboarding
}

const STEPS = [
  { id: 1, component: WelcomeStep, title: 'Bienvenida' },
  { id: 2, component: BusinessProfileStep, title: 'Tu Negocio' },
  { id: 3, component: CommunicationStyleStep, title: 'Estilo' },
  { id: 4, component: ImportContactsStep, title: 'Contactos' },
  { id: 5, component: ProductTourStep, title: 'Tour' },
  { id: 6, component: NextStepsStep, title: 'Siguiente' },
]

export function OnboardingWizard({ initialData }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(
    getInitialStep(initialData.status)
  )
  const [stepData, setStepData] = useState<Record<string, unknown>>({})

  const updateOnboarding = api.onboarding.updateProductOnboarding.useMutation()
  const completeOnboarding = api.onboarding.completeProductOnboarding.useMutation({
    onSuccess: () => {
      router.push('/onboarding/verification')
    },
  })

  const handleNext = useCallback(async (data?: Record<string, unknown>) => {
    if (data) {
      setStepData((prev) => ({ ...prev, ...data }))
    }

    if (currentStep < STEPS.length) {
      await updateOnboarding.mutateAsync({
        step: currentStep,
        data: data,
      })
      setCurrentStep((prev) => prev + 1)
    } else {
      await completeOnboarding.mutateAsync()
    }
  }, [currentStep, updateOnboarding, completeOnboarding])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const CurrentStepComponent = STEPS[currentStep - 1]?.component

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-2xl py-8">
        <WizardProgress
          steps={STEPS}
          currentStep={currentStep}
        />

        <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
          {CurrentStepComponent && (
            <CurrentStepComponent
              data={stepData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
        </div>

        <WizardNavigation
          currentStep={currentStep}
          totalSteps={STEPS.length}
          onNext={handleNext}
          onBack={handleBack}
          isLoading={updateOnboarding.isLoading || completeOnboarding.isLoading}
        />
      </div>
    </div>
  )
}

function getInitialStep(status: string): number {
  const stepMatch = status.match(/product_onboarding_step_(\d)/)
  if (stepMatch) {
    return parseInt(stepMatch[1], 10)
  }
  return 1
}
```

---

## Integraciones

### 9.1 Integración con Meta Business API

```typescript
// packages/integrations/src/meta/business-verification.ts

interface MetaVerificationRequest {
  businessManagerId: string
  businessName: string
  businessDocuments: string[] // URLs de documentos subidos
  domain: string
  phoneNumber: string
  displayName: string
}

interface MetaVerificationStatus {
  status: 'pending' | 'approved' | 'rejected' | 'needs_info'
  submittedAt: Date
  updatedAt: Date
  rejectionReason?: string
  additionalInfoRequired?: string[]
}

export class MetaBusinessVerification {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  // Verificar estado de Business Manager
  async getBusinessManagerStatus(businessManagerId: string): Promise<{
    verified: boolean
    verificationStatus: string
  }> {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${businessManagerId}?fields=verification_status`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    )

    const data = await response.json()
    return {
      verified: data.verification_status === 'verified',
      verificationStatus: data.verification_status,
    }
  }

  // Subir documento de verificación
  async uploadVerificationDocument(
    businessManagerId: string,
    documentUrl: string,
    documentType: 'business_registration' | 'tax_document' | 'utility_bill'
  ): Promise<{ documentId: string }> {
    // Implementación de subida de documento a Meta
    // ...
  }

  // Iniciar verificación de dominio
  async initiateDomainVerification(
    businessManagerId: string,
    domain: string
  ): Promise<{ verificationCode: string; method: 'dns_txt' | 'meta_tag' }> {
    // Obtener código de verificación de Meta
    // ...
  }

  // Verificar dominio
  async verifyDomain(
    businessManagerId: string,
    domain: string
  ): Promise<{ verified: boolean; error?: string }> {
    // Verificar que el registro DNS/meta tag existe
    // ...
  }

  // Registrar número de WhatsApp
  async registerWhatsAppNumber(
    businessManagerId: string,
    phoneNumber: string,
    displayName: string
  ): Promise<{ phoneNumberId: string; status: string }> {
    // Registrar número en WhatsApp Business API
    // ...
  }

  // Obtener estado de verificación
  async getVerificationStatus(
    businessManagerId: string
  ): Promise<MetaVerificationStatus> {
    // Consultar estado actual de verificación
    // ...
  }
}
```

### 9.2 Webhooks de Meta

```typescript
// apps/web/src/app/api/webhooks/meta-verification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@proyecto/db'
import { userOnboarding, verificationAttempts } from '@proyecto/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Verificar firma del webhook
  const signature = req.headers.get('x-hub-signature-256')
  if (!verifyMetaWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Procesar evento de verificación
  if (body.object === 'business' && body.entry) {
    for (const entry of body.entry) {
      const changes = entry.changes || []

      for (const change of changes) {
        if (change.field === 'verification_status') {
          await handleVerificationStatusChange({
            businessManagerId: entry.id,
            newStatus: change.value.verification_status,
            reason: change.value.rejection_reason,
          })
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}

async function handleVerificationStatusChange({
  businessManagerId,
  newStatus,
  reason,
}: {
  businessManagerId: string
  newStatus: string
  reason?: string
}) {
  // Buscar usuario por Business Manager ID
  const [onboarding] = await db
    .select()
    .from(userOnboarding)
    .where(sql`${userOnboarding.verificationData}->>'businessManagerId' = ${businessManagerId}`)

  if (!onboarding) {
    console.error('No se encontró usuario para Business Manager:', businessManagerId)
    return
  }

  // Mapear estado de Meta a nuestro estado
  const statusMap: Record<string, OnboardingState> = {
    'verified': 'verification_approved',
    'pending': 'verification_in_review',
    'rejected': 'verification_rejected',
    'not_verified': 'verification_needs_info',
  }

  const newOnboardingStatus = statusMap[newStatus] || 'verification_in_review'

  // Actualizar estado del usuario
  await db
    .update(userOnboarding)
    .set({
      status: newOnboardingStatus,
      lastRejectionReason: newStatus === 'rejected' ? reason : null,
      verificationCompletedAt: newStatus === 'verified' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(userOnboarding.userId, onboarding.userId))

  // Actualizar intento de verificación más reciente
  await db
    .update(verificationAttempts)
    .set({
      status: newStatus === 'verified' ? 'approved' :
              newStatus === 'rejected' ? 'rejected' : 'pending',
      rejectionReason: reason,
      resolvedAt: ['verified', 'rejected'].includes(newStatus) ? new Date() : null,
    })
    .where(and(
      eq(verificationAttempts.userId, onboarding.userId),
      isNull(verificationAttempts.resolvedAt)
    ))

  // Enviar notificación al usuario
  await sendVerificationStatusEmail({
    userId: onboarding.userId,
    status: newOnboardingStatus,
    reason,
  })
}
```

---

## Métricas y Analytics

### 10.1 Eventos a Trackear

```typescript
// packages/analytics/src/onboarding-events.ts

export const ONBOARDING_EVENTS = {
  // Fase 1: Producto
  PRODUCT_ONBOARDING_STARTED: 'product_onboarding_started',
  PRODUCT_ONBOARDING_STEP_COMPLETED: 'product_onboarding_step_completed',
  PRODUCT_ONBOARDING_COMPLETED: 'product_onboarding_completed',
  PRODUCT_ONBOARDING_ABANDONED: 'product_onboarding_abandoned',

  // Videos
  VIDEO_STARTED: 'onboarding_video_started',
  VIDEO_COMPLETED: 'onboarding_video_completed',
  VIDEO_SKIPPED: 'onboarding_video_skipped',

  // Demo mode
  DEMO_MODE_ENTERED: 'demo_mode_entered',
  DEMO_MODE_FEATURE_USED: 'demo_mode_feature_used',
  DEMO_MODE_EXITED_TO_VERIFY: 'demo_mode_exited_to_verify',

  // Fase 2: Verificación
  VERIFICATION_STARTED: 'verification_started',
  VERIFICATION_CHECKLIST_COMPLETED: 'verification_checklist_completed',
  VERIFICATION_STEP_COMPLETED: 'verification_step_completed',
  VERIFICATION_SUBMITTED: 'verification_submitted',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
  VERIFICATION_RETRY_STARTED: 'verification_retry_started',

  // Ayuda
  HELP_VIDEO_WATCHED: 'help_video_watched',
  FAQ_EXPANDED: 'faq_expanded',
  SUPPORT_CONTACTED: 'support_contacted',
  TOOLTIP_VIEWED: 'tooltip_viewed',
}

// Propiedades comunes
interface OnboardingEventProperties {
  userId: string
  step?: number
  stepName?: string
  duration?: number // segundos en el paso
  videoId?: string
  rejectionReason?: string
  attemptNumber?: number
}

// Función para trackear
export function trackOnboardingEvent(
  eventName: string,
  properties: OnboardingEventProperties
) {
  // Enviar a analytics (Mixpanel, Amplitude, etc.)
  analytics.track(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
    platform: 'web',
  })
}
```

### 10.2 Dashboard de Métricas

```typescript
// KPIs a monitorear
const ONBOARDING_KPIS = {
  // Conversión
  productOnboardingCompletionRate: {
    name: 'Tasa de completado onboarding producto',
    formula: 'completados / iniciados * 100',
    target: 85,
  },
  verificationSubmissionRate: {
    name: 'Tasa de envío de verificación',
    formula: 'verificaciones_enviadas / onboarding_completado * 100',
    target: 70,
  },
  verificationApprovalRate: {
    name: 'Tasa de aprobación verificación',
    formula: 'aprobados / enviados * 100',
    target: 75,
  },
  firstAttemptApprovalRate: {
    name: 'Aprobación al primer intento',
    formula: 'aprobados_primer_intento / enviados * 100',
    target: 60,
  },

  // Tiempo
  avgProductOnboardingTime: {
    name: 'Tiempo medio onboarding producto',
    unit: 'minutos',
    target: 8,
  },
  avgVerificationTime: {
    name: 'Tiempo medio verificación',
    unit: 'días',
    target: 7,
  },

  // Abandono
  productOnboardingDropoffByStep: {
    name: 'Abandono por paso (producto)',
    breakdown: ['step_1', 'step_2', 'step_3', 'step_4', 'step_5'],
  },
  verificationDropoffByStep: {
    name: 'Abandono por paso (verificación)',
    breakdown: ['checklist', 'biz_manager', 'docs', 'domain', 'phone', 'display_name'],
  },

  // Rechazos
  topRejectionReasons: {
    name: 'Top razones de rechazo',
    breakdown: ['name_mismatch', 'document_unclear', 'domain_not_verified', 'other'],
  },
  avgRetriesBeforeApproval: {
    name: 'Reintentos promedio antes de aprobación',
    target: 1.5,
  },

  // Soporte
  supportTicketsFromOnboarding: {
    name: 'Tickets de soporte desde onboarding',
    target: '< 20% usuarios',
  },
}
```

---

## Implementación por Fases

### 11.1 Fase 1: MVP (2 semanas)

```
SEMANA 1:
─────────────────────────────────────────────────────────────────
[ ] Base de datos y schema de onboarding
[ ] API endpoints básicos (getStatus, updateStep, complete)
[ ] Wizard de producto (5 pasos básicos)
    [ ] Bienvenida
    [ ] Perfil de negocio
    [ ] Estilo de comunicación
    [ ] Tour (sin videos, solo highlights)
    [ ] Siguiente paso

SEMANA 2:
─────────────────────────────────────────────────────────────────
[ ] Pre-verification checklist
[ ] Wizard de verificación (6 pasos)
    [ ] Business Manager
    [ ] Documentos
    [ ] Dominio
    [ ] Teléfono
    [ ] Display Name
    [ ] Enviado
[ ] Estados de verificación (pending, approved, rejected)
[ ] Banner de modo demo
```

### 11.2 Fase 2: Contenido Educativo (1 semana)

```
SEMANA 3:
─────────────────────────────────────────────────────────────────
[ ] Grabar videos tutoriales (8 videos, ~20 min total)
[ ] Integrar reproductor de video
[ ] Tooltips y ayuda contextual
[ ] FAQ integrado
[ ] Guías por proveedor de dominio (GoDaddy, Namecheap, etc.)
```

### 11.3 Fase 3: Gestión de Rechazos (1 semana)

```
SEMANA 4:
─────────────────────────────────────────────────────────────────
[ ] Mapeo de razones de rechazo de Meta
[ ] UI de rechazo con soluciones
[ ] Sistema de reintentos con cooldown
[ ] Videos de solución de problemas
[ ] Escalación automática a soporte
```

### 11.4 Fase 4: Integración Meta (2 semanas)

```
SEMANA 5-6:
─────────────────────────────────────────────────────────────────
[ ] Integración con Meta Business API
[ ] Webhook para actualizaciones de estado
[ ] Verificación automática de dominio
[ ] Registro de número WhatsApp
[ ] Notificaciones por email de cambios de estado
[ ] Testing E2E del flujo completo
```

### 11.5 Fase 5: Analytics y Optimización (Continuo)

```
POST-LAUNCH:
─────────────────────────────────────────────────────────────────
[ ] Dashboard de métricas de onboarding
[ ] A/B testing de pasos
[ ] Optimización basada en datos de abandono
[ ] Mejora de contenido según feedback
[ ] Automatización de soporte común
```

---

## Resumen de Archivos a Crear

```
apps/web/src/
├── app/
│   ├── onboarding/
│   │   ├── page.tsx                    # Entrada al wizard producto
│   │   ├── verification/
│   │   │   └── page.tsx                # Wizard verificación
│   │   └── status/
│   │       └── page.tsx                # Estado de verificación
│   │
│   └── api/
│       └── webhooks/
│           └── meta-verification/
│               └── route.ts            # Webhook Meta
│
├── components/
│   └── onboarding/
│       └── [todos los componentes]
│
└── hooks/
    └── use-onboarding.ts               # Hook principal

packages/
├── db/src/schema/
│   └── onboarding.ts                   # Schema DB
│
├── api/src/routers/
│   └── onboarding.ts                   # Router tRPC
│
└── integrations/src/meta/
    └── business-verification.ts        # Cliente Meta API
```

---

## Dependencias en el Roadmap

```
┌─────────────────────────────────────────────────────────────────┐
│  PRERREQUISITOS:                                                │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  ✅ Phase 4 completada (A11y, E2E, Security)                   │
│  ✅ 5.1 Infraestructura (Vercel + Supabase prod)               │
│  ✅ 5.4 Email Transaccional (notificaciones)                   │
│                                                                 │
│  ESTE FEATURE:                                                  │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  5.7 Onboarding Verification Wizard                             │
│                                                                 │
│  DEPENDIENTES:                                                  │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  → 5.8 WhatsApp Business Verification (completa el flujo)       │
│  → 5.10 Beta Launch (requiere onboarding funcional)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*Última actualización: 2 Dic 2025*
*Versión: 1.0.0*
