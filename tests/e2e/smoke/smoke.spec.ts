import { test, expect } from '../fixtures/custom-fixtures'
import { MERMAID_EXAMPLES } from '../fixtures/test-data'

test.describe.configure({ mode: 'parallel' })

test.describe('Smoke Tests - Critical Path Verification', () => {
  test('should load and render basic diagram', async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')

    // Check main components
    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()

    // Load a diagram
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Verify diagram renders
    const diagram = page.locator('#mermaid svg, .mermaid svg')
    await expect(diagram).toBeVisible()

    // Verify validation works
    const statusText = page.locator('[data-testid="status-text"], .status-text')
    await expect(statusText).toContainText('Valid')
  })

  test('should handle mode switching', async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')

    // Set up diagram in code mode
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Switch to visual mode
    const visualButton = page.locator('button:has-text("Visual"), [data-testid="visual-mode"]')
    if (await visualButton.isVisible()) {
      await visualButton.click()
      await page.waitForTimeout(2000)

      // Verify React Flow loads
      await expect(page.locator('.react-flow')).toBeVisible()

      // Switch back to code mode
      const codeButton = page.locator('button:has-text("Code"), [data-testid="code-mode"]')
      await codeButton.click()
      await page.waitForTimeout(1000)

      // Verify code editor is back
      await expect(textarea).toBeVisible()
    }
  })

  test('should handle examples and templates', async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')

    const examplesButton = page.locator('button:has-text("Examples"), [data-testid="examples-button"]')
    if (await examplesButton.isVisible()) {
      await examplesButton.click()
      await page.waitForTimeout(500)

      // Select an example
      const dropdown = page.locator('.examples-dropdown, [data-testid="examples-dropdown"]')
      await expect(dropdown).toBeVisible()

      const firstExample = dropdown.locator('button, .example-item').first()
      await firstExample.click()
      await page.waitForTimeout(1000)

      // Verify content loaded
      const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
      const content = await textarea.inputValue()
      expect(content.length).toBeGreaterThan(10)
    }
  })

  test('should handle basic operations', async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')

    // Test typing
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill('graph TD\n    A[Start] --> B[End]')
    await page.waitForTimeout(1000)

    // Test zoom
    const zoomInButton = page.locator('button:has([data-lucide="zoom-in"]), [data-testid="zoom-in"]')
    if (await zoomInButton.isVisible()) {
      await zoomInButton.click()
      await page.waitForTimeout(300)

      const zoomOutButton = page.locator('button:has([data-lucide="zoom-out"]), [data-testid="zoom-out"]')
      await zoomOutButton.click()
      await page.waitForTimeout(300)
    }

    // Test copy
    const copyButton = page.locator('button:has([data-lucide="copy"]), [data-testid="copy-button"]')
    if (await copyButton.isVisible()) {
      await copyButton.click()
      await page.waitForTimeout(200)
    }

    // Verify everything still works
    await expect(textarea).toBeVisible()
    const content = await textarea.inputValue()
    expect(content).toContain('Start')
  })

  test('should handle responsive layout', async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)

    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()

    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForTimeout(500)

    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()
  })

  test('should handle error conditions', async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')

    // Test invalid syntax
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill('invalid mermaid syntax')
    await page.waitForTimeout(2000)

    // Should show error or empty state, not crash
    const errorDisplay = page.locator('[data-testid="error-display"], .error-display')
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state')

    const hasError = await errorDisplay.isVisible()
    const hasEmpty = await emptyState.isVisible()

    expect(hasError || hasEmpty).toBe(true)

    // Should recover with valid input
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    const diagram = page.locator('#mermaid svg, .mermaid svg')
    await expect(diagram).toBeVisible()
  })

  test('should handle network resilience', async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')

    // Work offline
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill('graph TD\n    A[Offline] --> B[End]')

    // Should still work locally
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()

    const content = await textarea.inputValue()
    expect(content).toContain('Offline')

    // Come back online
    await page.context().setOffline(false)
    await page.waitForTimeout(1000)

    await expect(textarea).toBeVisible()
  })
})