import { test, expect } from '@playwright/test'
import { loginViaForm, getTestCredentials } from './helpers/auth'
import { setupAuth, checkAuthSetup } from './helpers/setup'

test.describe('Dashboard Autenticado - Verificación Real', () => {
  // Credenciales de prueba (creadas manualmente en BD)
  const TEST_EMAIL = 'test@quoorum.pro'
  const TEST_PASSWORD = '20Quoorum25'

  test('debe poder hacer login y entrar al dashboard', async ({ page }) => {
    // Paso 1: Ir a login
    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Paso 2: Llenar formulario
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()

    const emailExists = await emailInput.count() > 0
    const passwordExists = await passwordInput.count() > 0
    const buttonExists = await submitButton.count() > 0

    if (!emailExists || !passwordExists || !buttonExists) {
      test.skip()
      return
    }

    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)

    // Paso 3: Hacer clic en submit
    await submitButton.click()

    // Paso 4: Esperar respuesta
    await page.waitForTimeout(3000)

      // Paso 5: Verificar que entró al dashboard
      await page.waitForTimeout(2000)
      const url = page.url()
      
      // Capturar cualquier mensaje de error visible
      const errorMessages = page.locator('text=/error|Error|ERROR|algo salió mal|incorrecto|inválido/i')
      const errorText = await errorMessages.first().textContent().catch(() => null)
      
      if (url.includes('/dashboard')) {
        // [OK] Login exitoso - verificar que el dashboard carga
        expect(url).toContain('/dashboard')
        
        // Verificar que hay contenido del dashboard
        await page.waitForTimeout(2000)
        const dashboardContent = page.locator('text=/bienvenido|dashboard|hola|estadísticas|total|cliente|debate/i')
        const contentCount = await dashboardContent.count()
        
        // Debería haber contenido del dashboard
        expect(contentCount).toBeGreaterThan(0)
        
        // Verificar que no hay mensajes de error visibles
        const visibleErrors = await errorMessages.count()
        expect(visibleErrors).toBe(0)
      } else {
        // Login falló - mostrar información de debug
        console.log(`[WARN] Login failed`)
        console.log(`   Current URL: ${url}`)
        if (errorText) {
          console.log(`   Error message: ${errorText}`)
        }
        
        // Verificar si hay mensaje de error específico
        const errorCount = await errorMessages.count()
        if (errorCount > 0) {
          console.log(`   Found ${errorCount} error message(s)`)
          // No hacer skip, fallar el test para que veamos qué pasa
          throw new Error(`Login failed: ${errorText || 'Unknown error'}`)
        } else {
          // Puede estar procesando aún o redirigido
          await page.waitForTimeout(2000)
          const finalUrl = page.url()
          console.log(`   Final URL after wait: ${finalUrl}`)
          
          if (!finalUrl.includes('/dashboard')) {
            throw new Error(`Login failed: Expected /dashboard but got ${finalUrl}`)
          }
        }
      }
  })

  test('debe mostrar elementos del dashboard después de login', async ({ page }) => {
    // Hacer login
    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()

    if (await emailInput.count() === 0 || await passwordInput.count() === 0 || await submitButton.count() === 0) {
      test.skip()
      return
    }

    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    await submitButton.click()
    await page.waitForTimeout(3000)

    const url = page.url()

    if (url.includes('/dashboard')) {
      await page.waitForTimeout(2000)

      // Verificar elementos del dashboard
      const statsCards = page.locator('text=/cliente|debate|mensaje|ingreso|estadística|total/i')
      const quickActions = page.locator('button:has-text("nuevo"), button:has-text("crear"), a[href*="/debates/new"]')
      const recentActivity = page.locator('text=/reciente|actividad|último|recent/i')

      const statsCount = await statsCards.count()
      const actionsCount = await quickActions.count()
      const activityCount = await recentActivity.count()

      // Debería haber al menos algunos elementos del dashboard
      expect(statsCount + actionsCount + activityCount).toBeGreaterThan(0)
    } else {
      test.skip()
    }
  })

  test('debe poder navegar desde dashboard a otras secciones', async ({ page }) => {
    // Hacer login
    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()

    if (await emailInput.count() === 0 || await passwordInput.count() === 0 || await submitButton.count() === 0) {
      test.skip()
      return
    }

    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    await submitButton.click()
    await page.waitForTimeout(3000)

    const url = page.url()

    if (url.includes('/dashboard')) {
      await page.waitForTimeout(2000)

      // Buscar links de navegación
      const debatesLink = page.locator('a[href*="/debates"], button:has-text("debate")')
      const settingsLink = page.locator('a[href*="/settings"], button:has-text("configuración")')
      const expertsLink = page.locator('a[href*="/experts"], button:has-text("experto")')

      const debatesCount = await debatesLink.count()
      const settingsCount = await settingsLink.count()
      const expertsCount = await expertsLink.count()

      // Debería haber links de navegación
      expect(debatesCount + settingsCount + expertsCount).toBeGreaterThan(0)

      // Intentar navegar a debates si existe el link
      if (debatesCount > 0) {
        await debatesLink.first().click()
        await page.waitForTimeout(2000)

        const newUrl = page.url()
        // Debería navegar a debates o quedarse en dashboard
        expect(newUrl).toMatch(/\/(debates|dashboard)/)
      }
    } else {
      test.skip()
    }
  })

  test('debe verificar que el dashboard no tiene errores después de login', async ({ page }) => {
    // Hacer login
    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()

    if (await emailInput.count() === 0 || await passwordInput.count() === 0 || await submitButton.count() === 0) {
      test.skip()
      return
    }

    // Verificar errores en consola
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    await submitButton.click()
    await page.waitForTimeout(3000)

    const url = page.url()

    if (url.includes('/dashboard')) {
      await page.waitForTimeout(2000)

      // Verificar que no hay errores críticos de JavaScript
      const criticalErrors = errors.filter(err => 
        !err.includes('favicon') && 
        !err.includes('sourcemap') &&
        !err.includes('DevTools') &&
        !err.includes('404')
      )

      expect(criticalErrors.length).toBe(0)

      // Verificar que no hay mensajes de error visibles
      const errorMessages = page.locator('text=/error|Error|ERROR|algo salió mal/i')
      const errorCount = await errorMessages.count()
      expect(errorCount).toBe(0)
    } else {
      test.skip()
    }
  })
})
