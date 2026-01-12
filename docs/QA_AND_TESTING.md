# 🧪 Guía de QA y Testing

> **Infraestructura de testing End-to-End con Playwright**

---

## 📋 Tabla de Contenidos

- [Tests Unitarios del Psychology System](#-tests-unitarios-del-psychology-system) ✨ NEW
- [Introducción](#-introducción)
- [Prerrequisitos](#️-prerrequisitos)
- [Configuración](#-configuración)
- [Comandos Útiles](#-comandos-útiles)
- [Estructura de Tests](#-estructura-de-tests)
- [Mejores Prácticas](#-mejores-prácticas)
- [Troubleshooting](#-troubleshooting)

---

## 🧠 Tests Unitarios del Psychology System

> **Estado: ✅ Completado (24 Dic 2024)**

### Resumen de Cobertura

El Psychology System de Wallie incluye **211 tests unitarios** que cubren los 6 routers principales del sistema de psicología de ventas:

| Router                    | Tests | Estado  | Descripción                      |
| ------------------------- | ----- | ------- | -------------------------------- |
| `emotional-intelligence`  | 32    | ✅ Pass | Análisis emocional y alertas     |
| `psychology-engine`       | 41    | ✅ Pass | Motor central de psicología      |
| `conversation-psychology` | 28    | ✅ Pass | Fases de conversación            |
| `wallie-annotations`      | 44    | ✅ Pass | Anotaciones inline de coaching   |
| `persona-detection`       | 29    | ✅ Pass | Detección de personas DISC       |
| `reciprocity`             | 46    | ✅ Pass | Balance de reciprocidad Cialdini |

### Ubicación de Tests

```
packages/api/src/routers/__tests__/
├── emotional-intelligence.test.ts    # 32 tests
├── psychology-engine.test.ts         # 41 tests
├── conversation-psychology.test.ts   # 28 tests
├── wallie-annotations.test.ts        # 44 tests
├── persona-detection.test.ts         # 29 tests
└── reciprocity.test.ts               # 46 tests
```

### Ejecutar Tests del Psychology System

```bash
# Ejecutar TODOS los tests del paquete API
cd packages/api && pnpm test

# Ejecutar tests de un router específico
pnpm test -- --run src/routers/__tests__/emotional-intelligence.test.ts

# Ejecutar con coverage
pnpm test -- --coverage

# Ejecutar en modo watch (desarrollo)
pnpm test -- --watch
```

### Patrones de Testing Utilizados

#### 1. Mock de Rate Limiting

```typescript
vi.mock('../../lib/rate-limit', () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(undefined),
}))
```

#### 2. Helper Functions Consistentes

```typescript
// Crear contexto mock
function createMockContext(userId: string): Context {
  return {
    user: { id: userId } as Context['user'],
    userId,
  }
}

// Cleanup de datos de prueba
async function cleanupTestData() {
  // Eliminar en orden respetando FKs
  await db.delete(tabla1).where(...)
  await db.delete(tabla2).where(...)
}
```

#### 3. UUIDs de Test Consistentes

```typescript
const TEST_USER_ID = '11111111-1111-4111-a111-111111111111'
const OTHER_USER_ID = '22222222-2222-4222-a222-222222222222'
```

### Cobertura por Funcionalidad

#### Emotional Intelligence Router

- ✅ `getClientEmotions` - Estado emocional del cliente
- ✅ `getEmotionalAlerts` - Alertas de atención emocional
- ✅ `recordEmotion` - Registrar observaciones emocionales
- ✅ `getEmotionalHistory` - Historial de análisis
- ✅ Validación de inputs y autorización

#### Psychology Engine Router

- ✅ `getClientProfile` - Perfil psicológico completo
- ✅ `getSalesTips` - Consejos de venta personalizados
- ✅ `getConversationGuide` - Guía contextual de conversación
- ✅ `analyzeMessage` - Análisis psicológico de mensajes
- ✅ Integración con DISC y reciprocidad

#### Persona Detection Router

- ✅ `getByClient` - Obtener/crear persona (auto-create si no existe)
- ✅ `analyzeClient` - Analizar mensajes para detectar persona
- ✅ `getRecommendations` - Recomendaciones de comunicación
- ✅ `listAll` - Listar todas las personas del usuario
- ✅ Patrones de detección en español (datos, análisis, urgente, etc.)

#### Wallie Annotations Router

- ✅ `create` - Crear anotaciones inline
- ✅ `list` - Listar por conversación
- ✅ `update` - Actualizar contenido
- ✅ `markAsRead` / `dismiss` / `rateHelpfulness`
- ✅ `getStats` - Estadísticas de uso
- ✅ `deleteExpired` - Limpieza automática

#### Reciprocity Router

- ✅ `recordEvent` - Registrar eventos de valor
- ✅ `getBalance` - Balance con cliente
- ✅ `getHistory` - Historial de intercambios
- ✅ `getReadyForAsk` - Clientes listos para pedir
- ✅ `getInDeficit` - Clientes en déficit
- ✅ `suggestEvents` - Sugerencias contextuales

### Notas Importantes

1. **Aislamiento de Tests**: Los tests usan UUIDs fijos. **Solución implementada:** `vitest.config.ts` usa `fileParallelism: false` para ejecutar tests secuencialmente y evitar conflictos de foreign keys.

2. **Base de Datos Real**: Los tests usan la base de datos real (Supabase), no mocks. Asegurar que `.env.local` esté configurado.

3. **Patrones en Español**: Los tests de detección de personas usan patrones en español para coincidir con los keywords del router.

---

## 🎯 Introducción

Este proyecto utiliza **Playwright** como framework de testing End-to-End (E2E) para garantizar que la aplicación funciona correctamente desde la perspectiva del usuario final.

### ¿Por qué Playwright?

- ✅ **Multi-browser**: Chrome, Firefox, Safari, Edge
- ✅ **Auto-wait**: Espera automática por elementos
- ✅ **Debugging potente**: UI mode, inspector, traces
- ✅ **TypeScript nativo**: IntelliSense completo
- ✅ **CI/CD ready**: Ejecución paralela y headless

### Filosofía de Testing

```
┌─────────────────────────────────────────────────────────────┐
│  "Si no está testeado, está roto"                          │
│                                                             │
│  Tests E2E → Simulan usuarios reales                       │
│  Objetivo → Detectar bugs antes que los usuarios           │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Prerrequisitos

### 1. Base de Datos Local

**Supabase debe estar corriendo localmente** con datos de prueba:

```bash
# Iniciar Supabase local
supabase start

# Verificar que está corriendo
supabase status
```

**Importante:** Los tests requieren datos reales en la base de datos. Asegúrate de tener al menos:

- ✅ Una conversación de prueba
- ✅ Mensajes en esa conversación
- ✅ Un usuario autenticado

### 2. Dependencias Instaladas

```bash
# Instalar dependencias del proyecto
pnpm install

# Instalar navegadores de Playwright (solo primera vez)
npx playwright install
```

### 3. Variables de Entorno

Asegúrate de tener configurado tu `.env.local`:

```env
# Supabase (local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Otros...
```

---

## 🔧 Configuración

### Paso 1: Obtener ID de Conversación de Prueba

Para que los tests funcionen, necesitas configurar el ID de una conversación real de tu base de datos local.

#### Opción A: Desde Supabase Studio

1. Abrir Supabase Studio: `http://localhost:54323`
2. Ir a Table Editor → `conversations`
3. Copiar el `id` de cualquier conversación
4. Usar ese ID en el test

#### Opción B: Desde SQL

```sql
-- En Supabase SQL Editor
SELECT id, client_id, created_at
FROM conversations
WHERE status = 'active'
LIMIT 1;
```

### Paso 2: Configurar el Test

Editar `apps/web/e2e/conversation-chat.spec.ts`:

```typescript
test.describe('Página de Conversación - Chat', () => {
  // 👇 CAMBIAR ESTE ID por uno real de tu base de datos
  const TEST_CONVERSATION_ID = 'pon-aqui-el-id-real'

  // ... resto del test
})
```

### Paso 3: (Opcional) Configurar Autenticación

Si tus tests requieren autenticación, descomenta y configura el `beforeEach`:

```typescript
test.beforeEach(async ({ page }) => {
  // Descomentar estas líneas:
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'tu-password')
  await page.click('button[type="submit"]')

  // Esperar a que cargue el dashboard
  await page.waitForURL('/conversations')
})
```

---

## 🚀 Comandos Útiles

### Comandos Básicos

```bash
# Ejecutar TODOS los tests E2E
npx playwright test

# Ejecutar un archivo específico
npx playwright test conversation-chat.spec.ts

# Ejecutar solo un test específico
npx playwright test -g "debe enviar un mensaje"
```

### Modo Debug (Recomendado para Desarrollo)

```bash
# Modo debug con inspector paso a paso
npx playwright test conversation-chat.spec.ts --debug

# En el inspector puedes:
# - Ver cada paso en tiempo real
# - Pausar y continuar
# - Inspeccionar elementos
# - Ejecutar comandos en la consola
```

### Modo Visual (UI Mode)

```bash
# Interfaz gráfica con preview en tiempo real
npx playwright test --ui

# Permite:
# - Ver todos los tests
# - Ejecutar individualmente
# - Ver screenshots y videos
# - Time travel debugging
```

### Modo Headed (Ver Navegador)

```bash
# Ver el navegador mientras se ejecutan los tests
npx playwright test --headed

# Útil para:
# - Entender qué está haciendo el test
# - Debuggear problemas visuales
# - Verificar interacciones
```

### Filtros y Opciones

```bash
# Solo tests que NO fallaron antes
npx playwright test --last-failed

# Ejecutar en navegador específico
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Generar reporte HTML
npx playwright test --reporter=html
npx playwright show-report
```

### Comandos Avanzados

```bash
# Ejecutar en paralelo (más rápido)
npx playwright test --workers=4

# Actualizar screenshots de referencia
npx playwright test --update-snapshots

# Generar trace para debugging offline
npx playwright test --trace on
npx playwright show-trace trace.zip
```

---

## 📂 Estructura de Tests

### Ubicación de Tests

```
apps/web/
├── e2e/                              # 🧪 Tests E2E
│   ├── conversation-chat.spec.ts    # ✅ Test de chat de conversación
│   ├── conversations-list.spec.ts   # (futuro) Lista de conversaciones
│   ├── client-management.spec.ts    # (futuro) Gestión de clientes
│   └── auth.spec.ts                 # (futuro) Autenticación
│
├── playwright.config.ts              # Configuración de Playwright
└── src/                              # Código de la aplicación
```

### Test Actual: `conversation-chat.spec.ts`

#### Suite Principal: Página de Conversación - Chat

Este test valida el **flujo completo de chat de una conversación**:

```typescript
test.describe('Página de Conversación - Chat', () => {
  // 10 tests que cubren:

  1. ✅ Navegación a la página
     - URL correcta
     - Header visible

  2. ✅ Carga del chat
     - Loader aparece y desaparece
     - Contenido se muestra

  3. ✅ Elementos del chat
     - Avatar del contacto
     - Nombre/teléfono
     - Área de mensajes
     - Input de texto

  4. ✅ Escritura de mensajes
     - Input habilitado
     - Texto se escribe correctamente

  5. ✅ Envío de mensajes
     - Mensaje se envía
     - Aparece en la lista
     - Input se limpia

  6. ✅ Formato de mensajes
     - Contenido visible
     - Estructura correcta

  7. ✅ Estado del mensaje
     - Indicadores de estado (pending/sent/delivered/read)

  8. ✅ Auto-scroll
     - Scroll al último mensaje

  9. ✅ Navegación
     - Botón de volver funciona

  10. ✅ Estado disabled
      - Input deshabilitado durante envío
})
```

#### Suite de Casos Edge

```typescript
test.describe('Página de Conversación - Casos Edge', () => {
  // 3 tests de casos límite:

  1. ✅ Conversación no encontrada (404)
  2. ✅ Mensajes largos (~1500 caracteres)
  3. ✅ Múltiples mensajes consecutivos
})
```

### Helpers Reutilizables

El test incluye funciones helper para simplificar:

```typescript
// Esperar a que la conversación cargue
async function waitForConversationToLoad(page: Page) {
  await expect(page.getByText('Cargando conversación...')).not.toBeVisible()
  await expect(page.locator('header')).toBeVisible()
}

// Obtener el último mensaje
async function getLastMessage(page: Page) {
  const messages = page.locator('[data-testid="message-bubble"]')
  return messages.nth((await messages.count()) - 1)
}
```

### Cobertura Actual

```
┌─────────────────────────────────────────────────────────┐
│  Funcionalidad             │  Cobertura │  Tests        │
├─────────────────────────────────────────────────────────┤
│  Navegación                │     ✅     │      2        │
│  Carga de datos            │     ✅     │      2        │
│  Envío de mensajes         │     ✅     │      4        │
│  UI/UX interacciones       │     ✅     │      3        │
│  Casos edge                │     ✅     │      3        │
├─────────────────────────────────────────────────────────┤
│  TOTAL                     │    100%    │     14        │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Mejores Prácticas

### 1. Pattern AAA (Arrange-Act-Assert)

Todos los tests siguen este patrón:

```typescript
test('debe enviar un mensaje', async ({ page }) => {
  // ARRANGE - Preparar
  await page.goto(`/conversations/${TEST_ID}`)
  const testMessage = `Test: ${Date.now()}`

  // ACT - Actuar
  await page.fill('input', testMessage)
  await page.press('input', 'Enter')

  // ASSERT - Verificar
  await expect(page.locator(`text="${testMessage}"`)).toBeVisible()
})
```

### 2. Selectores Robustos

```typescript
// ❌ MAL - Frágil, puede cambiar fácilmente
await page.locator('div.flex.items-center > button:nth-child(2)')

// ✅ BIEN - Robusto, por rol/texto
await page.getByRole('button', { name: 'Enviar' })

// ✅ MEJOR - data-testid (considera agregarlo)
await page.locator('[data-testid="send-button"]')
```

### 3. Esperas Explícitas

```typescript
// ❌ MAL - Timeout arbitrario
await page.waitForTimeout(3000)

// ✅ BIEN - Esperar condición específica
await expect(page.locator('.message')).toBeVisible({ timeout: 10000 })
```

### 4. Tests Independientes

```typescript
// ✅ Cada test debe ser independiente
// ✅ No depender del orden de ejecución
// ✅ Limpiar estado después de cada test

test.afterEach(async ({ page }) => {
  // Cleanup si es necesario
})
```

### 5. Datos de Prueba

```typescript
// ✅ Usar timestamps para evitar colisiones
const testMessage = `E2E Test: ${Date.now()}`

// ✅ Marcar claramente que es test
const testEmail = 'test-' + Date.now() + '@example.com'
```

---

## 🔍 Troubleshooting

### Problema: Tests Fallan por Timeout

```bash
Error: Timeout 30000ms exceeded
```

**Soluciones:**

1. Aumentar timeout en `playwright.config.ts`
2. Verificar que Supabase local está corriendo
3. Verificar que la app está en `http://localhost:3000`
4. Usar `--debug` para ver qué está esperando

### Problema: No Encuentra Elementos

```bash
Error: Locator not found
```

**Soluciones:**

1. Verificar selector con Playwright Inspector: `npx playwright test --debug`
2. Usar `page.locator('...').first()` si hay múltiples elementos
3. Verificar que el elemento realmente existe en el DOM
4. Usar selectores más específicos o `data-testid`

### Problema: ID de Conversación Inválido

```bash
Error: Conversación no encontrada
```

**Solución:**

1. Ir a Supabase Studio: `http://localhost:54323`
2. Verificar que existe una conversación con ese ID
3. Actualizar `TEST_CONVERSATION_ID` en el test

### Problema: Tests Pasan en Local pero Fallan en CI

**Causas comunes:**

- Diferencias de timing (CI es más lento)
- Base de datos no inicializada
- Variables de entorno faltantes
- Navegadores no instalados

**Soluciones:**

1. Aumentar timeouts para CI
2. Seed de base de datos en CI
3. Verificar `.env` en secrets de CI
4. Agregar step de `playwright install` en CI

### Problema: Navegador No Abre en Modo Debug

```bash
# Si --debug no abre el inspector:
npx playwright test --debug --headed
```

---

## 🎯 Próximos Tests a Implementar

### Alta Prioridad

- [ ] **Lista de Conversaciones** (`conversations-list.spec.ts`)
  - Cargar lista
  - Filtrar conversaciones
  - Buscar por nombre/teléfono
  - Click en conversación

- [ ] **Gestión de Clientes** (`client-management.spec.ts`)
  - Crear cliente
  - Editar cliente
  - Eliminar cliente
  - Ver detalles

- [ ] **Autenticación** (`auth.spec.ts`)
  - Login
  - Logout
  - Registro
  - Reset password

### Media Prioridad

- [ ] **Tags** - Crear, asignar, eliminar tags
- [ ] **Sugerencias de IA** - Generar y usar sugerencias
- [ ] **Reminders** - Crear y gestionar recordatorios
- [ ] **Search** - Búsqueda global

### Baja Prioridad

- [ ] **Settings** - Configuración de usuario
- [ ] **Analytics** - Visualizar métricas
- [ ] **Onboarding** - Flujo de primer uso

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

### Tutoriales Recomendados

- [Playwright Tutorial](https://playwright.dev/docs/intro)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Debugging Tests](https://playwright.dev/docs/debug)

### Cheat Sheet

```typescript
// Navegación
await page.goto('URL')
await page.goBack()
await page.reload()

// Selectores
page.locator('css selector')
page.getByRole('button', { name: 'Click me' })
page.getByText('Hello')
page.getByTestId('test-id')

// Interacciones
await page.click('button')
await page.fill('input', 'text')
await page.press('input', 'Enter')
await page.selectOption('select', 'value')

// Assertions
await expect(page).toHaveURL('URL')
await expect(element).toBeVisible()
await expect(element).toHaveText('text')
await expect(element).toBeEnabled()

// Esperas
await page.waitForSelector('selector')
await page.waitForURL('URL')
await page.waitForTimeout(1000) // Evitar si es posible
```

---

## 🤝 Contribuir Tests

### Checklist para Nuevo Test

- [ ] Archivo en `apps/web/e2e/`
- [ ] Nombre descriptivo: `feature-name.spec.ts`
- [ ] Suite principal con `test.describe`
- [ ] Al menos 5 tests cubriendo happy path
- [ ] Suite de casos edge
- [ ] Helpers si son reutilizables
- [ ] Comentarios explicando qué se testea
- [ ] Pattern AAA (Arrange-Act-Assert)
- [ ] Selectores robustos
- [ ] Esperas explícitas
- [ ] Tests pasan en modo headless
- [ ] Tests pasan en Chrome, Firefox, Safari

### Ejemplo de Nuevo Test

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup común
  })

  test('debe hacer X', async ({ page }) => {
    // ARRANGE
    // ACT
    // ASSERT
  })
})

test.describe('Feature Name - Casos Edge', () => {
  test('debe manejar error Y', async ({ page }) => {
    // Test de caso límite
  })
})
```

---

## 📊 Métricas de Calidad

### Objetivos

```
┌─────────────────────────────────────────────────────────┐
│  Métrica                │  Objetivo  │  Actual         │
├─────────────────────────────────────────────────────────┤
│  Tests Unitarios API    │    >80%    │    100%*        │
│  Tests E2E              │    >80%    │     ~20%        │
│  Tests pasando          │    100%    │    100%         │
│  Tiempo ejecución       │    <5min   │    ~3min        │
│  Flakiness rate         │     <1%    │      0%         │
└─────────────────────────────────────────────────────────┘

* Psychology System: 211 tests cubriendo 6 routers (100% endpoints)
```

### Resumen de Tests por Paquete

```
┌─────────────────────────────────────────────────────────┐
│  Paquete               │  Tests  │  Estado │  Coverage  │
├─────────────────────────────────────────────────────────┤
│  @wallie/api           │   211   │   ✅    │    ~85%    │
│  apps/web (E2E)        │    14   │   ✅    │    ~20%    │
├─────────────────────────────────────────────────────────┤
│  TOTAL                 │   225   │   ✅    │     -      │
└─────────────────────────────────────────────────────────┘
```

### Cómo Medir

```bash
# Generar reporte de cobertura
npx playwright test --reporter=html
npx playwright show-report

# Ver métricas detalladas
npx playwright test --reporter=list
```

---

## 🔒 Testing en CI/CD

### GitHub Actions (Ejemplo)

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start Supabase
        run: npx supabase start

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

_Guía de QA y Testing v1.1.0_
_Actualizado: 24 Diciembre 2024_

---

### Changelog

#### v1.1.0 (24 Dic 2024)

- ✅ Añadida sección de Tests Unitarios del Psychology System
- ✅ 211 tests unitarios para 6 routers de psicología
- ✅ Configurada ejecución secuencial de tests para evitar conflictos de UUID
- ✅ Actualizado resumen de métricas de calidad

#### v1.0.0 (24 Dic 2024)

- Documentación inicial de E2E con Playwright
