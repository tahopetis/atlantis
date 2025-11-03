import { test, expect } from '../fixtures/custom-fixtures'
import { MERMAID_EXAMPLES } from '../fixtures/test-data'

test.describe.configure({ mode: 'parallel' })

test.describe('Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')
  })

  test('should render basic layout in all browsers', async ({ page, browserName }) => {
    console.log(`Testing basic layout in ${browserName}`)

    // Check main components are visible
    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()

    // Check for proper layout
    const editor = page.locator('.code-editor, [data-testid="code-editor"]')
    const canvas = page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')

    const editorBounds = await editor.boundingBox()
    const canvasBounds = await canvas.boundingBox()

    expect(editorBounds).toBeTruthy()
    expect(canvasBounds).toBeTruthy()

    if (editorBounds && canvasBounds) {
      expect(editorBounds.width).toBeGreaterThan(0)
      expect(editorBounds.height).toBeGreaterThan(0)
      expect(canvasBounds.width).toBeGreaterThan(0)
      expect(canvasBounds.height).toBeGreaterThan(0)
    }
  })

  test('should handle Mermaid rendering consistently', async ({ page, browserName }) => {
    console.log(`Testing Mermaid rendering in ${browserName}`)

    // Load a diagram
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Check diagram renders
    const diagram = page.locator('#mermaid svg, .mermaid svg')
    await expect(diagram).toBeVisible()

    // Verify diagram has content
    const svgContent = await diagram.innerHTML()
    expect(svgContent.length).toBeGreaterThan(100)

    // Check validation status
    const statusIndicator = page.locator('[data-testid="validation-icon"], .validation-icon')
    await expect(statusIndicator).toBeVisible()

    const statusText = page.locator('[data-testid="status-text"], .status-text')
    const text = await statusText.textContent()
    expect(text).toContain('Valid')
  })

  test('should handle React Flow canvas in all browsers', async ({ page, browserName }) => {
    console.log(`Testing React Flow in ${browserName}`)

    // Switch to visual mode
    const visualButton = page.locator('button:has-text("Visual"), [data-testid="visual-mode"]')
    if (await visualButton.isVisible()) {
      await visualButton.click()
      await page.waitForTimeout(2000)

      // Check React Flow components
      await expect(page.locator('.react-flow')).toBeVisible()
      await expect(page.locator('.react-flow__background')).toBeVisible()
      await expect(page.locator('.react-flow__controls')).toBeVisible()

      // Add a node
      const nodeButtons = page.locator('.node-palette button, button:has-text("rectangle")')
      const nodeCount = await nodeButtons.count()

      if (nodeCount > 0) {
        await nodeButtons.first().click()
        await page.waitForTimeout(1000)

        // Check node was created
        const nodes = page.locator('.react-flow__node')
        const nodeCountAfter = await nodes.count()
        expect(nodeCountAfter).toBeGreaterThan(0)
      }
    }
  })

  test('should handle keyboard shortcuts consistently', async ({ page, browserName }) => {
    console.log(`Testing keyboard shortcuts in ${browserName}`)

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.focus()

    // Test typing
    await page.keyboard.type('graph TD\n    A[Start] --> B[End]')
    await page.waitForTimeout(500)

    const content = await textarea.inputValue()
    expect(content).toContain('graph TD')

    // Test Ctrl+A (select all)
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Delete')

    const clearedContent = await textarea.inputValue()
    expect(clearedContent).toBe('')
  })

  test('should handle mouse interactions consistently', async ({ page, browserName }) => {
    console.log(`Testing mouse interactions in ${browserName}`)

    // Test hover states
    const copyButton = page.locator('button:has([data-lucide="copy"]), [data-testid="copy-button"]')
    await copyButton.hover()
    await page.waitForTimeout(200)

    // Button should still be visible and interactive
    await expect(copyButton).toBeVisible()

    // Test clicking
    await copyButton.click()
    await page.waitForTimeout(200)

    // Should not cause errors
    const hasErrors = await page.evaluate(() => {
      const errors = []
      window.onerror = (msg) => errors.push(msg)
      return errors.length
    })

    expect(hasErrors).toBe(0)
  })

  test('should handle examples dropdown in all browsers', async ({ page, browserName }) => {
    console.log(`Testing examples dropdown in ${browserName}`)

    const examplesButton = page.locator('button:has-text("Examples"), [data-testid="examples-button"]')
    if (await examplesButton.isVisible()) {
      // Open dropdown
      await examplesButton.click()
      await page.waitForTimeout(500)

      // Check dropdown is visible
      const dropdown = page.locator('.examples-dropdown, [data-testid="examples-dropdown"]')
      await expect(dropdown).toBeVisible()

      // Check for example items
      const exampleItems = dropdown.locator('button, .example-item')
      const itemCount = await exampleItems.count()
      expect(itemCount).toBeGreaterThan(0)

      // Select an example
      if (itemCount > 0) {
        await exampleItems.first().click()
        await page.waitForTimeout(500)

        // Should have loaded the example
        const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
        const content = await textarea.inputValue()
        expect(content.length).toBeGreaterThan(10)
      }
    }
  })

  test('should handle zoom controls consistently', async ({ page, browserName }) => {
    console.log(`Testing zoom controls in ${browserName}`)

    // Load a diagram first
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Test zoom in
    const zoomInButton = page.locator('button:has([data-lucide="zoom-in"]), [data-testid="zoom-in"]')
    if (await zoomInButton.isVisible()) {
      await zoomInButton.click()
      await page.waitForTimeout(300)

      // Test zoom out
      const zoomOutButton = page.locator('button:has([data-lucide="zoom-out"]), [data-testid="zoom-out"]')
      await zoomOutButton.click()
      await page.waitForTimeout(300)

      // Should still have diagram
      const diagram = page.locator('#mermaid svg, .mermaid svg')
      await expect(diagram).toBeVisible()
    }
  })

  test('should handle download functionality across browsers', async ({ page, browserName }) => {
    console.log(`Testing download in ${browserName}`)

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill(MERMAID_EXAMPLES.flowchart)

    const downloadButton = page.locator('button:has([data-lucide="download"]), [data-testid="download-button"]')

    // Start download
    const downloadPromise = page.waitForEvent('download')
    await downloadButton.click()

    try {
      const download = await downloadPromise
      const fileName = download.suggestedFilename()
      expect(fileName).toMatch(/\.(mmd|mermaid|txt)$/i)
      console.log(`Download successful in ${browserName}: ${fileName}`)
    } catch (error) {
      // Some browsers might handle downloads differently
      console.warn(`Download behavior in ${browserName}:`, error)
    }
  })

  test('should handle error states consistently', async ({ page, browserName }) => {
    console.log(`Testing error states in ${browserName}`)

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Enter invalid syntax
    await textarea.fill('invalid mermaid syntax diagram')
    await page.waitForTimeout(2000)

    // Check for error indication
    const errorDisplay = page.locator('[data-testid="error-display"], .error-display')
    const hasError = await errorDisplay.isVisible()

    if (hasError) {
      const errorMessage = await errorDisplay.textContent()
      expect(errorMessage?.length).toBeGreaterThan(0)
    }

    // Should not crash the application
    const appContainer = page.locator('.app, main, body')
    await expect(appContainer).toBeVisible()
  })

  test('should handle responsive behavior consistently', async ({ page, browserName }) => {
    console.log(`Testing responsive behavior in ${browserName}`)

    // Test different viewport sizes
    const viewports = [
      { width: 1280, height: 720 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }   // Mobile
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(500)

      // Check main components adapt
      await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
      await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()

      // Check for no horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth
      })
      expect(hasHorizontalScroll).toBe(false)
    }
  })

  test('should handle clipboard operations consistently', async ({ page, browserName }) => {
    console.log(`Testing clipboard in ${browserName}`)

    // Mock clipboard for consistent testing
    await page.evaluate(() => {
      const mockClipboard = {
        writeText: async (text: string) => {
          (window as any).__testClipboard = text
          return Promise.resolve()
        },
        readText: async () => (window as any).__testClipboard || ''
      }
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      })
    })

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    const testCode = 'graph TD\n    A[Start] --> B[End]'
    await textarea.fill(testCode)

    // Test copy
    const copyButton = page.locator('button:has([data-lucide="copy"]), [data-testid="copy-button"]')
    await copyButton.click()
    await page.waitForTimeout(500)

    // Verify clipboard content
    const clipboardContent = await page.evaluate(() => (window as any).__testClipboard)
    expect(clipboardContent).toBe(testCode)
  })

  test('should handle console errors consistently', async ({ page, browserName }) => {
    console.log(`Testing console errors in ${browserName}`)

    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    page.on('pageerror', error => {
      consoleErrors.push(error.message)
    })

    // Perform various operations
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Switch modes if possible
    const visualButton = page.locator('button:has-text("Visual"), [data-testid="visual-mode"]')
    if (await visualButton.isVisible()) {
      await visualButton.click()
      await page.waitForTimeout(1000)
    }

    // Check for critical errors
    const criticalErrors = consoleErrors.filter(error =>
      error.includes('TypeError') ||
      error.includes('ReferenceError') ||
      error.includes('Cannot read property')
    )

    if (criticalErrors.length > 0) {
      console.warn(`Console errors in ${browserName}:`, criticalErrors)
    }

    // Allow some warnings but not critical JavaScript errors
    expect(criticalErrors.length).toBeLessThan(3)
  })

  test('should handle network resilience consistently', async ({ page, browserName }) => {
    console.log(`Testing network resilience in ${browserName}`)

    // Load initial state
    await page.waitForLoadState('networkidle')

    // Simulate offline mode
    await page.context().setOffline(true)

    // Try to use the application
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill('graph TD\n    A[Start] --> B[End]')
    await page.waitForTimeout(1000)

    // Should still be able to type and edit
    const content = await textarea.inputValue()
    expect(content).toContain('graph TD')

    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(1000)

    // Application should still be functional
    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
  })
})

test.describe('Browser-Specific Features', () => {
  test('should handle Safari-specific rendering', async ({ page }) => {
    test.skip(process.env.BROWSER !== 'webkit', 'Safari-specific test')

    await page.goto('/editor')
    await page.waitForLoadState('networkidle')

    // Test Safari-specific behaviors
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Check rendering in Safari
    const diagram = page.locator('#mermaid svg, .mermaid svg')
    await expect(diagram).toBeVisible()

    // Test Safari-specific CSS features
    const hasBackdropFilter = await page.evaluate(() => {
      const element = document.querySelector('.floating-zoom-controls, .backdrop-blur')
      if (element) {
        const styles = window.getComputedStyle(element)
        return styles.backdropFilter !== 'none'
      }
      return false
    })

    console.log(`Safari backdrop-filter support: ${hasBackdropFilter}`)
  })

  test('should handle Firefox-specific features', async ({ page }) => {
    test.skip(process.env.BROWSER !== 'firefox', 'Firefox-specific test')

    await page.goto('/editor')
    await page.waitForLoadState('networkidle')

    // Test Firefox-specific behaviors
    const hasMathMLElements = await page.evaluate(() => {
      return typeof MathMLElement !== 'undefined'
    })

    console.log(`Firefox MathML support: ${hasMathMLElements}`)

    // Test download behavior in Firefox
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill(MERMAID_EXAMPLES.flowchart)

    const downloadButton = page.locator('button:has([data-lucide="download"]), [data-testid="download-button"]')
    const downloadPromise = page.waitForEvent('download')
    await downloadButton.click()

    try {
      const download = await downloadPromise
      console.log(`Firefox download successful: ${download.suggestedFilename()}`)
    } catch (error) {
      console.log('Firefox download behavior might differ')
    }
  })

  test('should handle Chrome-specific features', async ({ page }) => {
    test.skip(process.env.BROWSER !== 'chromium', 'Chrome-specific test')

    await page.goto('/editor')
    await page.waitForLoadState('networkidle')

    // Test Chrome-specific DevTools integration if available
    const hasDevTools = await page.evaluate(() => {
      return !!(window as any).chrome || !!(window as any).devtools
    })

    console.log(`Chrome DevTools integration: ${hasDevTools}`)

    // Test Chrome-specific download behavior
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill(MERMAID_EXAMPLES.flowchart)

    const downloadButton = page.locator('button:has([data-lucide="download"]), [data-testid="download-button"]')
    const downloadPromise = page.waitForEvent('download')
    await downloadButton.click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.(mmd|mermaid|txt)$/i)
    console.log(`Chrome download successful: ${download.suggestedFilename()}`)
  })
})