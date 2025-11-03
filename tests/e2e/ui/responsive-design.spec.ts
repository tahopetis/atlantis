import { test, expect } from '../fixtures/custom-fixtures'
import { VIEWPORTS, MERMAID_EXAMPLES } from '../fixtures/test-data'

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')
  })

  test('should adapt to desktop viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.waitForTimeout(500)

    // Check main components are visible
    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()

    // Should have horizontal layout (side by side)
    const editorContainer = page.locator('.code-editor, [data-testid="code-editor"]')
    const canvasContainer = page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')

    const editorBounds = await editorContainer.boundingBox()
    const canvasBounds = await canvasContainer.boundingBox()

    expect(editorBounds).toBeTruthy()
    expect(canvasBounds).toBeTruthy()

    // Both should be visible and have reasonable width
    if (editorBounds && canvasBounds) {
      expect(editorBounds.width).toBeGreaterThan(200)
      expect(canvasBounds.width).toBeGreaterThan(200)
    }

    // Should not have horizontal scrollbars
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('should adapt to laptop viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.laptop)
    await page.waitForTimeout(500)

    // Check components adapt properly
    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()

    // Should still be usable
    const editorContainer = page.locator('.code-editor, [data-testid="code-editor"]')
    const canvasContainer = page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')

    await expect(editorContainer).toBeVisible()
    await expect(canvasContainer).toBeVisible()

    // Check for overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('should adapt to tablet viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet)
    await page.waitForTimeout(500)

    // Check main components
    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()

    // Might have stacked layout on tablet
    const editorBounds = await page.locator('.code-editor, [data-testid="code-editor"]').boundingBox()
    const canvasBounds = await page.locator('.diagram-canvas, [data-testid="diagram-canvas"]').boundingBox()

    expect(editorBounds).toBeTruthy()
    expect(canvasBounds).toBeTruthy()

    // Should not have horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.waitForTimeout(500)

    // Check components are still visible but possibly stacked
    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()

    // Should not overflow horizontally
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalScroll).toBe(false)

    // Mobile might have vertical stacking or tabs
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight)
    expect(bodyHeight).toBeGreaterThan(VIEWPORTS.mobile.height)
  })

  test('should adapt to large mobile viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobileLarge)
    await page.waitForTimeout(500)

    // Should handle larger mobile screens
    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()

    // No horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('should handle orientation changes', async ({ page }) => {
    // Start with portrait mobile
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.waitForTimeout(500)

    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()

    // Switch to landscape
    const landscapeViewport = {
      width: VIEWPORTS.mobile.height,
      height: VIEWPORTS.mobile.width
    }
    await page.setViewportSize(landscapeViewport)
    await page.waitForTimeout(500)

    // Should adapt to landscape
    await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    await expect(page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')).toBeVisible()

    // No overflow in landscape
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('should handle responsive text in code editor', async ({ page }) => {
    const viewports = [VIEWPORTS.desktop, VIEWPORTS.tablet, VIEWPORTS.mobile]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(300)

      const editor = page.locator('.code-editor, [data-testid="code-editor"]')
      await expect(editor).toBeVisible()

      // Check if text is readable
      const textArea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
      await expect(textArea).toBeVisible()

      // Check font size is reasonable
      const fontSize = await textArea.evaluate((el: HTMLTextAreaElement) => {
        return window.getComputedStyle(el).fontSize
      })
      const fontSizeValue = parseInt(fontSize)
      expect(fontSizeValue).toBeGreaterThan(8) // At least 8px
      expect(fontSizeValue).toBeLessThan(32) // Not too large
    }
  })

  test('should handle responsive diagram canvas', async ({ page }) => {
    // Set up a diagram
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.waitForTimeout(500)

    const editor = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await editor.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(1000)

    // Test different viewports
    const viewports = [VIEWPORTS.desktop, VIEWPORTS.tablet, VIEWPORTS.mobile]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(500)

      const canvas = page.locator('.diagram-canvas, [data-testid="diagram-canvas"]')
      await expect(canvas).toBeVisible()

      // Check diagram fits within viewport
      const diagramBounds = await canvas.locator('#mermaid svg, .mermaid svg').boundingBox()
      const canvasBounds = await canvas.boundingBox()

      if (diagramBounds && canvasBounds) {
        // Diagram should not overflow canvas significantly
        expect(diagramBounds.width).toBeLessThanOrEqual(canvasBounds.width + 100)
        expect(diagramBounds.height).toBeLessThanOrEqual(canvasBounds.height + 100)
      }
    }
  })

  test('should handle responsive controls and buttons', async ({ page }) => {
    const viewports = [VIEWPORTS.desktop, VIEWPORTS.mobile]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(300)

      // Check toolbar buttons
      const toolbarButtons = page.locator('.code-editor-toolbar button, .toolbar button')
      const buttonCount = await toolbarButtons.count()

      for (let i = 0; i < buttonCount; i++) {
        const button = toolbarButtons.nth(i)
        await expect(button).toBeVisible()

        // Button should be large enough to tap
        const bounds = await button.boundingBox()
        if (bounds) {
          expect(bounds.width).toBeGreaterThanOrEqual(32) // At least 32px for touch
          expect(bounds.height).toBeGreaterThanOrEqual(32)
        }
      }

      // Check zoom controls
      const zoomControls = page.locator('.zoom-controls button, [data-testid="zoom-in"], [data-testid="zoom-out"]')
      const zoomCount = await zoomControls.count()

      for (let i = 0; i < zoomCount; i++) {
        const zoomButton = zoomControls.nth(i)
        await expect(zoomButton).toBeVisible()

        const bounds = await zoomButton.boundingBox()
        if (bounds) {
          expect(bounds.width).toBeGreaterThanOrEqual(32)
          expect(bounds.height).toBeGreaterThanOrEqual(32)
        }
      }
    }
  })

  test('should handle responsive mode switching', async ({ page }) => {
    // Test mode switching on different viewports
    const viewports = [VIEWPORTS.desktop, VIEWPORTS.mobile]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(500)

      // Look for mode toggle buttons
      const modeToggle = page.locator('button:has-text("Code"), button:has-text("Visual")')
      const toggleCount = await modeToggle.count()

      if (toggleCount > 0) {
        // Should be able to see and click mode buttons
        for (let i = 0; i < toggleCount; i++) {
          const button = modeToggle.nth(i)
          await expect(button).toBeVisible()

          const bounds = await button.boundingBox()
          if (bounds) {
            expect(bounds.width).toBeGreaterThanOrEqual(32)
            expect(bounds.height).toBeGreaterThanOrEqual(32)
          }
        }
      }
    }
  })

  test('should handle responsive examples dropdown', async ({ page }) => {
    const viewports = [VIEWPORTS.desktop, VIEWPORTS.mobile]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(300)

      // Find and click examples button
      const examplesButton = page.locator('button:has-text("Examples"), [data-testid="examples-button"]')
      if (await examplesButton.isVisible()) {
        await examplesButton.click()
        await page.waitForTimeout(300)

        // Examples dropdown should be visible
        const dropdown = page.locator('.examples-dropdown, [data-testid="examples-dropdown"]')
        await expect(dropdown).toBeVisible()

        // Should fit within viewport
        const dropdownBounds = await dropdown.boundingBox()
        const viewportWidth = viewport.width
        const viewportHeight = viewport.height

        if (dropdownBounds) {
          expect(dropdownBounds.x).toBeGreaterThanOrEqual(0)
          expect(dropdownBounds.y).toBeGreaterThanOrEqual(0)
          expect(dropdownBounds.x + dropdownBounds.width).toBeLessThanOrEqual(viewportWidth)
          expect(dropdownBounds.y + dropdownBounds.height).toBeLessThanOrEqual(viewportHeight + 100) // Allow some overflow
        }

        // Close dropdown
        await examplesButton.click()
        await page.waitForTimeout(200)
      }
    }
  })

  test('should handle responsive scrolling', async ({ page }) => {
    // Test on mobile where scrolling is more likely
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.waitForTimeout(500)

    // Should not have horizontal scrolling
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalScroll).toBe(false)

    // May have vertical scrolling on mobile
    const hasVerticalScroll = await page.evaluate(() => {
      return document.body.scrollHeight > window.innerHeight
    })

    // If there's vertical scroll, should be smooth
    if (hasVerticalScroll) {
      // Test scrolling
      await page.evaluate(() => {
        window.scrollTo(0, 200)
      })
      await page.waitForTimeout(300)

      await page.evaluate(() => {
        window.scrollTo(0, 0)
      })
      await page.waitForTimeout(300)

      // Should still work after scrolling
      await expect(page.locator('.code-editor, [data-testid="code-editor"]')).toBeVisible()
    }
  })

  test('should maintain functionality across viewports', async ({ page }) => {
    const viewports = [VIEWPORTS.desktop, VIEWPORTS.tablet, VIEWPORTS.mobile]

    for (const viewport of viewports) {
      console.log(`Testing functionality on ${viewport.width}x${viewport.height}`)

      await page.setViewportSize(viewport)
      await page.waitForTimeout(500)

      // Test code editor functionality
      const editor = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
      await editor.fill(MERMAID_EXAMPLES.flowchart)
      await page.waitForTimeout(1000)

      // Test diagram rendering
      const diagram = page.locator('#mermaid svg, .mermaid svg')
      await expect(diagram).toBeVisible()

      // Test zoom controls
      const zoomIn = page.locator('button:has([data-lucide="zoom-in"]), [data-testid="zoom-in"]')
      if (await zoomIn.isVisible()) {
        await zoomIn.click()
        await page.waitForTimeout(300)

        // Should still be functional
        await expect(diagram).toBeVisible()
      }

      // Test examples
      const examplesButton = page.locator('button:has-text("Examples"), [data-testid="examples-button"]')
      if (await examplesButton.isVisible()) {
        await examplesButton.click()
        await page.waitForTimeout(300)

        const dropdown = page.locator('.examples-dropdown, [data-testid="examples-dropdown"]')
        await expect(dropdown).toBeVisible()

        await examplesButton.click()
        await page.waitForTimeout(200)
      }
    }
  })

  test('should handle responsive React Flow canvas', async ({ page }) => {
    // Switch to visual mode first
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.waitForTimeout(500)

    // Find mode toggle
    const visualButton = page.locator('button:has-text("Visual"), [data-testid="visual-mode"]')
    if (await visualButton.isVisible()) {
      await visualButton.click()
      await page.waitForTimeout(1000)

      // Test React Flow responsiveness
      const viewports = [VIEWPORTS.desktop, VIEWPORTS.tablet, VIEWPORTS.mobile]

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.waitForTimeout(500)

        // React Flow canvas should be visible
        const reactFlow = page.locator('.react-flow')
        await expect(reactFlow).toBeVisible()

        // Should fit within viewport
        const bounds = await reactFlow.boundingBox()
        if (bounds) {
          expect(bounds.x).toBeGreaterThanOrEqual(0)
          expect(bounds.y).toBeGreaterThanOrEqual(0)
          expect(bounds.width).toBeLessThanOrEqual(viewport.width)
          expect(bounds.height).toBeLessThanOrEqual(viewport.height + 100)
        }

        // Controls should be accessible
        const controls = page.locator('.react-flow__controls')
        if (await controls.isVisible()) {
          const controlBounds = await controls.boundingBox()
          if (controlBounds) {
            expect(controlBounds.width).toBeGreaterThanOrEqual(40)
            expect(controlBounds.height).toBeGreaterThanOrEqual(100)
          }
        }
      }
    }
  })
})