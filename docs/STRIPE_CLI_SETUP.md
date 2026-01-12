# 🔧 Stripe CLI - Guía de Configuración

**Instalado:** ✅ Stripe CLI v1.34.0
**Ubicación:** `C:\Users\Usuario\.local\bin\stripe.exe`

---

## 📋 Configuración Inicial

### 1. Autenticación

Conectar Stripe CLI con tu cuenta de Stripe:

```bash
# Desde PowerShell o terminal con alias configurado
stripe login
```

**Qué hace:**

- Abre tu navegador predeterminado
- Te pide autorización en Stripe Dashboard
- Guarda las credenciales localmente
- Permite acceso a tus datos de Stripe desde CLI

**Importante:**

- ✅ Autentica con la cuenta que tiene las API keys que usarás
- ✅ Puedes tener múltiples perfiles (producción/test)

---

## 🚀 Uso Principal: Webhook Forwarding Local

### Iniciar Forwarding de Webhooks

Para recibir eventos de Stripe en tu entorno local:

```bash
# Forward webhooks a tu endpoint local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Output esperado:**

```
> Ready! You are using Stripe API Version [YYYY-MM-DD]. Your webhook signing secret is whsec_xxxxx (^C to quit)
```

**⚠️ IMPORTANTE:**

- Copia el `whsec_xxxxx` que aparece
- Actualiza tu `.env.local`:
  ```bash
  STRIPE_SIGNING_SECRET=whsec_xxxxx
  ```

---

## 🧪 Trigger de Eventos de Prueba

### Eventos Comunes

```bash
# Simular checkout completado
stripe trigger checkout.session.completed

# Simular suscripción creada
stripe trigger customer.subscription.created

# Simular pago exitoso
stripe trigger invoice.payment_succeeded

# Simular pago fallido
stripe trigger invoice.payment_failed

# Simular suscripción cancelada
stripe trigger customer.subscription.deleted
```

### Ver Lista Completa de Eventos

```bash
stripe trigger --help
```

---

## 📊 Comandos Útiles

### Logs de Webhooks

```bash
# Ver eventos de webhook en tiempo real
stripe listen

# Ver solo ciertos tipos de eventos
stripe listen --events payment_intent.succeeded,charge.succeeded
```

### Verificar Configuración

```bash
# Ver cuenta actual
stripe config --list

# Cambiar entre cuentas
stripe login --account <account-name>
```

### Testing de API

```bash
# Crear un customer de prueba
stripe customers create --email test@example.com --name "Test User"

# Listar customers
stripe customers list

# Ver detalles de un customer
stripe customers retrieve cus_xxxxx

# Crear un precio
stripe prices create --unit-amount 2900 --currency eur --recurring[interval]=month --product prod_xxxxx
```

---

## 🔄 Workflow de Desarrollo Típico

### 1. Iniciar Desarrollo Local

```bash
# Terminal 1: Next.js app
pnpm dev

# Terminal 2: Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 2. Testear Flujo de Checkout

```bash
# 1. Crear checkout session desde tu app
# 2. En otra terminal, monitorear eventos
stripe listen --print-json

# 3. Completar checkout en UI
# 4. Ver eventos recibidos en tiempo real
```

### 3. Debug de Webhook

```bash
# Ver último evento recibido
stripe events list --limit 1

# Reenviar un evento específico
stripe events resend evt_xxxxx
```

---

## 🔐 Configuración de Producción

### Crear Webhook Endpoint en Dashboard

```bash
# 1. Ir a Stripe Dashboard → Developers → Webhooks
# 2. Click "Add endpoint"
# 3. URL: https://wallie.pro/api/webhooks/stripe
# 4. Eventos a escuchar:
#    - checkout.session.completed
#    - customer.subscription.created
#    - customer.subscription.updated
#    - customer.subscription.deleted
#    - invoice.payment_succeeded
#    - invoice.payment_failed

# 5. Copiar "Signing secret" → Vercel env var STRIPE_SIGNING_SECRET
```

---

## 🛠️ Alias de PowerShell (Opcional)

Para usar `stripe` sin ruta completa:

```powershell
# Añadir a tu perfil de PowerShell
# Ubicación: $PROFILE (ejecuta `$PROFILE` para ver la ruta)

function stripe { & "C:\Users\Usuario\.local\bin\stripe.exe" $args }
```

**O añadir al PATH permanentemente:**

```powershell
# PowerShell como Administrador
$env:Path += ";C:\Users\Usuario\.local\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::User)
```

---

## 📝 Comandos de Referencia Rápida

| Comando                          | Descripción                     |
| -------------------------------- | ------------------------------- |
| `stripe login`                   | Autenticar con cuenta de Stripe |
| `stripe listen --forward-to URL` | Forward webhooks a localhost    |
| `stripe trigger EVENT`           | Simular evento de Stripe        |
| `stripe events list`             | Ver últimos eventos             |
| `stripe customers list`          | Ver customers                   |
| `stripe prices list`             | Ver precios configurados        |
| `stripe products list`           | Ver productos                   |
| `stripe subscriptions list`      | Ver suscripciones               |
| `stripe invoices list`           | Ver facturas                    |
| `stripe --help`                  | Ver todos los comandos          |

---

## 🐛 Troubleshooting

### Error: "No such webhook endpoint"

**Solución:**

```bash
# Verificar que el endpoint existe
stripe webhook_endpoints list

# O crear uno nuevo para testing
stripe webhook_endpoints create --url http://localhost:3000/api/webhooks/stripe --enabled-events customer.subscription.created
```

### Error: "Invalid signature"

**Causas:**

- ❌ `STRIPE_SIGNING_SECRET` incorrecto en `.env.local`
- ❌ Usando signing secret de test en producción (o viceversa)
- ❌ El secret cambió después de recrear el endpoint

**Solución:**

```bash
# Obtener el signing secret correcto
stripe listen --print-secret

# Actualizar en .env.local
STRIPE_SIGNING_SECRET=whsec_nuevo_valor
```

### Webhook no recibe eventos

**Verificaciones:**

1. ✅ `stripe listen` está corriendo
2. ✅ La app Next.js está corriendo en el puerto correcto
3. ✅ El endpoint `/api/webhooks/stripe/route.ts` existe
4. ✅ No hay firewalls bloqueando localhost

---

## 📚 Recursos Adicionales

- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Webhook Testing Guide](https://stripe.com/docs/webhooks/test)
- [Event Types Reference](https://stripe.com/docs/api/events/types)
- [Stripe Dashboard - Webhooks](https://dashboard.stripe.com/webhooks)

---

**Última actualización:** 04 Enero 2026
**Versión CLI:** 1.34.0
**Estado:** ✅ Instalado y listo para usar
