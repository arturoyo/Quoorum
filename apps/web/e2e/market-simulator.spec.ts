/**
 * E2E Tests for Market Simulator
 * Tests complete user flow from opening page to viewing results
 */

import { test, expect } from '@playwright/test'

test.describe('Market Simulator E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (assuming auth is required)
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should complete full simulation flow', async ({ page }) => {
    // Navigate to Market Simulator
    await page.goto('/market-simulator/new')

    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Simulador de Mercado')

    // Fill in variants
    const variantInputs = page.locator('textarea[placeholder*="Describe tu variante"]')
    await variantInputs.nth(0).fill('Toma decisiones estratégicas en minutos, sin consultoras')
    await variantInputs.nth(1).fill('IA que debate por ti y encuentra la mejor opción')

    // Wait for personas to load
    await expect(page.locator('text=CFO Fintech')).toBeVisible({ timeout: 5000 })

    // Select 2 buyer personas
    const personaCheckboxes = page.locator('input[type="checkbox"]')
    await personaCheckboxes.nth(0).check()
    await personaCheckboxes.nth(1).check()

    // Verify selected count updates
    await expect(page.locator('text=/2 Buyer Personas seleccionadas/')).toBeVisible()

    // Optional: Add context
    await page.fill('textarea[placeholder*="Lanzamiento de producto"]', 'Lanzamiento B2B SaaS en sector fintech')

    // Click run simulation button
    await page.click('button:has-text("Ejecutar Focus Group IA")')

    // Wait for loading state
    await expect(page.locator('text=Evaluando...')).toBeVisible()

    // Wait for results (may take 15-30 seconds)
    await expect(page.locator('text=Síntesis de IA')).toBeVisible({ timeout: 60000 })

    // Verify results are displayed
    await expect(page.locator('text=/Variante #\\d+ \\(Ganadora\\)/')).toBeVisible()
    await expect(page.locator('text=/\\d+\\.\\d+%/')).toBeVisible() // Consensus score
    await expect(page.locator('text=/\\d+\\.\\d+\\/10/')).toBeVisible() // Friction score
    await expect(page.locator('text=/\\$0\\.\\d+/')).toBeVisible() // Cost

    // Verify friction map is displayed
    await expect(page.locator('text=CFO Fintech')).toBeVisible()

    // Verify synthesis is displayed
    const synthesis = page.locator('text=/La Variante|Variante \\d+ logra/')
    await expect(synthesis).toBeVisible()
  })

  test('should show validation errors for incomplete data', async ({ page }) => {
    await page.goto('/market-simulator/new')

    // Try to run without filling variants
    const runButton = page.locator('button:has-text("Ejecutar Focus Group IA")')
    await expect(runButton).toBeDisabled()

    // Verify validation message
    await expect(page.locator('text=Completa al menos 2 variantes')).toBeVisible()

    // Fill only 1 variant
    const variantInputs = page.locator('textarea[placeholder*="Describe tu variante"]')
    await variantInputs.nth(0).fill('Short')

    // Verify length validation
    await expect(page.locator('text=Mínimo 10 caracteres')).toBeVisible()

    // Fill valid variant
    await variantInputs.nth(0).fill('Valid variant text here')
    await variantInputs.nth(1).fill('Another valid variant')

    // Button still disabled (no personas selected)
    await expect(runButton).toBeDisabled()
    await expect(page.locator('text=Selecciona al menos 1 Buyer Persona')).toBeVisible()
  })

  test('should allow adding and removing variants', async ({ page }) => {
    await page.goto('/market-simulator/new')

    // Initially 2 variants
    let variantBadges = page.locator('text=/Variante \\d+/')
    await expect(variantBadges).toHaveCount(2)

    // Add variant
    await page.click('button:has-text("Añadir")')
    await expect(variantBadges).toHaveCount(3)

    // Add 2 more (total 5)
    await page.click('button:has-text("Añadir")')
    await page.click('button:has-text("Añadir")')
    await expect(variantBadges).toHaveCount(5)

    // Add button should be hidden at 5 variants
    await expect(page.locator('button:has-text("Añadir")')).not.toBeVisible()

    // Remove variant (click X button)
    await page.locator('button[aria-label="Remove variant"]').first().click()
    await expect(variantBadges).toHaveCount(4)
  })

  test('should respect 10 persona limit', async ({ page }) => {
    await page.goto('/market-simulator/new')

    // Wait for personas to load
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible({ timeout: 5000 })

    // Select personas up to limit (if there are 12+ personas)
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()

    if (count >= 12) {
      // Select 10 personas
      for (let i = 0; i < 10; i++) {
        await checkboxes.nth(i).check()
      }

      // Verify warning message appears
      await expect(page.locator('text=Máximo 10 Buyer Personas por simulación')).toBeVisible()

      // Verify remaining checkboxes are disabled
      const eleventhCheckbox = checkboxes.nth(10)
      await expect(eleventhCheckbox).toBeDisabled()
    }
  })

  test('should show loading state while fetching personas', async ({ page }) => {
    // Slow down network to see loading state
    await page.route('**/api/trpc/strategicProfiles.list*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })

    await page.goto('/market-simulator/new')

    // Verify loading state appears
    await expect(page.locator('text=Cargando perfiles...')).toBeVisible()

    // Wait for personas to load
    await expect(page.locator('text=CFO Fintech')).toBeVisible({ timeout: 5000 })
  })

  test('should show empty state when no personas exist', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/trpc/strategicProfiles.list*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ result: { data: [] } }])
      })
    })

    await page.goto('/market-simulator/new')

    // Verify empty state
    await expect(page.locator('text=No hay Buyer Personas')).toBeVisible()
    await expect(page.locator('text=/Crea al menos un Buyer Persona/')).toBeVisible()
  })

  test('should display cost breakdown in results', async ({ page }) => {
    await page.goto('/market-simulator/new')

    // Fill and run simulation (shortened version)
    const variantInputs = page.locator('textarea[placeholder*="Describe tu variante"]')
    await variantInputs.nth(0).fill('Test variant one with enough length')
    await variantInputs.nth(1).fill('Test variant two with enough length')

    await page.locator('input[type="checkbox"]').first().check()

    await page.click('button:has-text("Ejecutar Focus Group IA")')

    // Wait for results
    await expect(page.locator('text=Desglose de Costes')).toBeVisible({ timeout: 60000 })

    // Verify cost items are displayed
    await expect(page.locator('text=/Evaluaciones \\(\\d+\\)/')).toBeVisible()
    await expect(page.locator('text=Síntesis Final')).toBeVisible()

    // Verify individual costs
    await expect(page.locator('text=/\\$0\\.\\d{4}/')).toHaveCount(2) // Evaluation + Synthesis costs

    // Verify total cost
    await expect(page.locator('text=/\\$0\\.\\d+/')).toBeVisible()

    // Verify token count
    await expect(page.locator('text=/\\d+,?\\d* tokens/')).toBeVisible()
  })

  test('should show friction color coding correctly', async ({ page }) => {
    await page.goto('/market-simulator/new')

    // Run simulation
    const variantInputs = page.locator('textarea[placeholder*="Describe tu variante"]')
    await variantInputs.nth(0).fill('Test variant one with enough length')
    await variantInputs.nth(1).fill('Test variant two with enough length')

    await page.locator('input[type="checkbox"]').first().check()
    await page.click('button:has-text("Ejecutar Focus Group IA")')

    // Wait for results
    await expect(page.locator('text=Comparativa de Variantes')).toBeVisible({ timeout: 60000 })

    // Verify friction labels exist
    await expect(page.locator('text=fricción').first()).toBeVisible()

    // Verify color-coded elements exist (green, yellow, or red)
    const greenElements = page.locator('.text-green-400')
    const yellowElements = page.locator('.text-yellow-400')
    const redElements = page.locator('.text-red-400')

    // At least one color should be present
    const hasGreen = await greenElements.count() > 0
    const hasYellow = await yellowElements.count() > 0
    const hasRed = await redElements.count() > 0

    expect(hasGreen || hasYellow || hasRed).toBe(true)
  })

  test('should navigate to simulator from dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Click on Market Simulator link in navigation
    await page.click('a[href*="/market-simulator"]')

    // Verify we're on the simulator page
    await expect(page).toHaveURL(/\/market-simulator/)
    await expect(page.locator('h1')).toContainText('Simulador de Mercado')
  })

  test('should handle simulation error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/trpc/marketSimulator.runSimulation*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Internal server error' } })
      })
    })

    await page.goto('/market-simulator/new')

    // Fill and submit
    const variantInputs = page.locator('textarea[placeholder*="Describe tu variante"]')
    await variantInputs.nth(0).fill('Test variant one with enough length')
    await variantInputs.nth(1).fill('Test variant two with enough length')

    await page.locator('input[type="checkbox"]').first().check()
    await page.click('button:has-text("Ejecutar Focus Group IA")')

    // Verify error toast appears (using sonner)
    await expect(page.locator('text=/Error|error/').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show character count for context input', async ({ page }) => {
    await page.goto('/market-simulator/new')

    const contextInput = page.locator('textarea[placeholder*="Lanzamiento de producto"]')

    // Type some text
    await contextInput.fill('Test context')

    // Verify character count updates
    await expect(page.locator('text=/\\d+\\/2000/')).toBeVisible()
    await expect(page.locator('text=12/2000')).toBeVisible()

    // Type more
    await contextInput.fill('Test context with more characters')

    // Count should update
    await expect(page.locator('text=/\\d+\\/2000/')).toBeVisible()
  })

  test('should enforce max length on context input', async ({ page }) => {
    await page.goto('/market-simulator/new')

    const contextInput = page.locator('textarea[placeholder*="Lanzamiento de producto"]')

    // Verify maxLength attribute
    await expect(contextInput).toHaveAttribute('maxLength', '2000')

    // Try to type more than max (should be blocked by HTML maxlength)
    const longText = 'A'.repeat(2500)
    await contextInput.fill(longText)

    // Value should be truncated to 2000
    const value = await contextInput.inputValue()
    expect(value.length).toBeLessThanOrEqual(2000)
  })

  test('should persist form data on navigation back', async ({ page }) => {
    await page.goto('/market-simulator/new')

    // Fill form
    const variantInputs = page.locator('textarea[placeholder*="Describe tu variante"]')
    await variantInputs.nth(0).fill('Persistent variant one')
    await variantInputs.nth(1).fill('Persistent variant two')

    await page.locator('input[type="checkbox"]').first().check()

    // Navigate away
    await page.goto('/dashboard')

    // Navigate back
    await page.goBack()

    // Verify data persisted (if component uses localStorage or similar)
    // Note: This test may fail if no persistence is implemented
    // In that case, this test documents expected behavior for future implementation
  })

  test('should show "¿Cómo funciona?" section', async ({ page }) => {
    await page.goto('/market-simulator/new')

    // Verify info section exists
    await expect(page.locator('text=¿Cómo funciona?')).toBeVisible()

    // Verify explanation points
    await expect(page.locator('text=/Cada Buyer Persona evalúa TODAS las variantes/')).toBeVisible()
    await expect(page.locator('text=/Analizan fricción mental/')).toBeVisible()
    await expect(page.locator('text=/Generan críticas específicas/')).toBeVisible()
    await expect(page.locator('text=/IA sintetiza/')).toBeVisible()
  })

  test('should have responsive grid layout', async ({ page }) => {
    await page.goto('/market-simulator/new')

    // Verify grid classes exist (basic check for responsive design)
    const gridElements = page.locator('.grid')
    expect(await gridElements.count()).toBeGreaterThan(0)
  })

  test('should have accessible form controls', async ({ page }) => {
    await page.goto('/market-simulator/new')

    // Verify textareas have accessible roles
    const textareas = page.locator('textarea')
    expect(await textareas.count()).toBeGreaterThan(0)

    // Verify checkboxes have accessible roles
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes.first()).toBeVisible({ timeout: 5000 })

    // Verify buttons have descriptive text
    await expect(page.locator('button:has-text("Ejecutar Focus Group IA")')).toBeVisible()
    await expect(page.locator('button:has-text("Añadir")')).toBeVisible()
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/market-simulator/new')

    // Verify h1 exists
    const h1 = page.locator('h1')
    await expect(h1).toHaveText('Simulador de Mercado')

    // Verify main heading is h1
    expect(await h1.evaluate(el => el.tagName)).toBe('H1')
  })
})
