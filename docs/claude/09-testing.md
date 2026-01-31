# 🧪 Testing

> **Regla:** No commit sin tests. Coverage mínimo 80%.

---

## 📊 Coverage Mínimo

| Área | Mínimo | Ideal |
|------|--------|-------|
| Backend (routers) | 90% | 95% |
| Services/Lib | 85% | 90% |
| Componentes críticos | 80% | 90% |
| Utils/Helpers | 90% | 95% |
| E2E (happy paths) | 100% flujos críticos | — |

---

## 🏗️ Estructura de Tests

```
packages/
  api/
    src/
      routers/
        clients.ts
        __tests__/
          clients.test.ts      # Unit tests del router
  db/
    src/
      __tests__/
        client.test.ts         # Tests de schema/queries

apps/
  web/
    src/
      components/
        clients/
          __tests__/
            client-card.test.tsx  # Tests de componentes
    tests/
      e2e/
        clients.spec.ts        # Tests E2E
```

---

## ✅ Test de Router tRPC

```typescript
// packages/api/src/routers/__tests__/clients.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createCaller } from '../../root'
import { db } from '@proyecto/db'
import { clients, users } from '@proyecto/db/schema'

const TEST_USER_ID = 'test-user-123'

describe('clients router', () => {
  beforeEach(async () => {
    await createTestUser()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should create a client with valid data', async () => {
    const caller = createCaller({ userId: TEST_USER_ID })

    const client = await caller.clients.create({
      name: 'Juan García',
      email: 'juan@example.com',
    })

    expect(client).toMatchObject({
      name: 'Juan García',
      email: 'juan@example.com',
      userId: TEST_USER_ID,
    })
  })

  it('should reject invalid email', async () => {
    const caller = createCaller({ userId: TEST_USER_ID })

    await expect(
      caller.clients.create({
        name: 'Juan García',
        email: 'invalid-email',
      })
    ).rejects.toThrow('Email inválido')
  })

  it('should NOT return client for non-owner', async () => {
    const ownerCaller = createCaller({ userId: TEST_USER_ID })
    const otherCaller = createCaller({ userId: 'other-user' })

    const created = await ownerCaller.clients.create({ name: 'Test' })

    await expect(
      otherCaller.clients.getById({ id: created.id })
    ).rejects.toThrow('NOT_FOUND')
  })
})
```

---

## ✅ Test de Componente

```typescript
// apps/web/src/components/clients/__tests__/client-card.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClientCard } from '../client-card'

const mockClient = {
  id: '123',
  name: 'Juan García',
  email: 'juan@example.com',
  status: 'ACTIVE' as const,
}

describe('ClientCard', () => {
  it('renders client information correctly', () => {
    render(<ClientCard client={mockClient} />)

    expect(screen.getByText('Juan García')).toBeInTheDocument()
    expect(screen.getByText('juan@example.com')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<ClientCard client={mockClient} onEdit={onEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /editar/i }))

    expect(onEdit).toHaveBeenCalledWith(mockClient)
  })
})
```

---

## ✅ Test E2E (Playwright)

```typescript
// apps/web/tests/e2e/clients.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Clients', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should create a new client', async ({ page }) => {
    await page.goto('/clients')

    await page.click('button:has-text("Nuevo Cliente")')

    await page.fill('[name="name"]', 'Nuevo Cliente')
    await page.fill('[name="email"]', 'nuevo@example.com')

    await page.click('button[type="submit"]')

    await expect(page.locator('text=Nuevo Cliente')).toBeVisible()
  })
})
```

---

## 🧪 Comandos de Testing

```bash
# Tests unitarios
pnpm test

# Tests con coverage
pnpm test --coverage

# Tests E2E
pnpm test:e2e

# Tests en modo watch
pnpm test --watch

# Tests de un archivo específico
pnpm test clients.test.ts
```

---

## ✅ Checklist Pre-Commit

- [ ] Tests pasan localmente
- [ ] Coverage mínimo 80%
- [ ] Tests de autorización (userId) incluidos
- [ ] Tests de validación Zod incluidos
- [ ] Tests E2E para flujos críticos

---

_Ver documentación completa en [CLAUDE.md](../../CLAUDE.md#testing)_
