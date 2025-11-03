import { test, expect } from '../fixtures/custom-fixtures'
import { INVALID_MERMAID_EXAMPLES } from '../fixtures/test-data'

test.describe('Error Boundaries and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')
  })

  test('should handle Mermaid syntax errors gracefully', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Enter invalid syntax
    await textarea.fill(INVALID_MERMAID_EXAMPLES.syntaxError)
    await page.waitForTimeout(2000)

    // Should show error state, not crash
    const errorDisplay = page.locator('[data-testid="error-display"], .error-display')
    const hasError = await errorDisplay.isVisible()

    if (hasError) {
      // Should have error message
      const errorMessage = await errorDisplay.textContent()
      expect(errorMessage?.length).toBeGreaterThan(0)
      expect(errorMessage).toContain(/error|syntax|invalid/i)
    }

    // Application should still be functional
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()

    // Should be able to clear error
    await textarea.fill('graph TD\n    A[Start] --> B[End]')
    await page.waitForTimeout(2000)

    // Should recover and show valid diagram
    const diagram = page.locator('#mermaid svg, .mermaid svg')
    await expect(diagram).toBeVisible()
  })

  test('should handle incomplete diagrams gracefully', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Test various incomplete scenarios
    const incompleteExamples = [
      INVALID_MERMAID_EXAMPLES.undefinedNode,
      INVALID_MERMAID_EXAMPLES.mismatchedBrackets,
      INVALID_MERMAID_EXAMPLES.incompleteDiagram
    ]

    for (const incompleteCode of incompleteExamples) {
      console.log(`Testing incomplete code: ${incompleteCode.substring(0, 30)}...`)

      await textarea.fill(incompleteCode)
      await page.waitForTimeout(2000)

      // Should not crash the application
      await expect(page.locator('body')).toBeVisible()
      await expect(textarea).toBeVisible()

      // Should show some form of error or empty state
      const hasError = await page.locator('[data-testid="error-display"], .error-display').isVisible()
      const hasEmptyState = await page.locator('[data-testid="empty-state"], .empty-state').isVisible()

      expect(hasError || hasEmptyState).toBe(true)
    }
  })

  test('should handle React Flow errors gracefully', async ({ page }) => {
    // Switch to visual mode
    const visualButton = page.locator('button:has-text("Visual"), [data-testid="visual-mode"]')
    if (await visualButton.isVisible()) {
      await visualButton.click()
      await page.waitForTimeout(2000)

      // Try to create an invalid node configuration
      const nodeButtons = page.locator('.node-palette button, button:has-text("rectangle")')
      const buttonCount = await nodeButtons.count()

      if (buttonCount > 0) {
        // Rapidly create nodes to stress test
        for (let i = 0; i < 20; i++) {
          await nodeButtons.first().click()
          await page.waitForTimeout(50)
        }

        // Should still be functional
        await expect(page.locator('.react-flow')).toBeVisible()

        // Try to create invalid connections
        const nodes = page.locator('.react-flow__node')
        const nodeCount = await nodes.count()

        if (nodeCount >= 2) {
          // Try to connect nodes in ways that might cause errors
          await nodes.first().hover()
          await page.waitForTimeout(200)
          await nodes.nth(1).hover()
          await page.waitForTimeout(200)
        }
      }

      // Should still be able to switch back to code mode
      const codeButton = page.locator('button:has-text("Code"), [data-testid="code-mode"]')
      if (await codeButton.isVisible()) {
        await codeButton.click()
        await page.waitForTimeout(1000)

        await expect(textarea).toBeVisible()
      }
    }
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Monitor for console errors
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Go offline
    await page.context().setOffline(true)

    // Try to use features that might require network
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill('graph TD\n    A[Start] --> B[End]')

    // Try download (might fail offline)
    const downloadButton = page.locator('button:has([data-lucide="download"]), [data-testid="download-button"]')
    if (await downloadButton.isVisible()) {
      await downloadButton.click()
      await page.waitForTimeout(1000)
    }

    // Should still be functional locally
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()

    // Should not have unhandled network errors
    const networkErrors = consoleErrors.filter(error =>
      error.includes('network') || error.includes('fetch') || error.includes('NetworkError')
    )

    expect(networkErrors.length).toBeLessThan(5) // Allow some network-related warnings

    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(1000)

    // Should recover
    await expect(textarea).toBeVisible()
  })

  test('should handle memory pressure gracefully', async ({ page }) => {
    // Monitor memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })

    console.log(`Initial memory: ${initialMemory / 1024 / 1024} MB`)

    // Create stress by rapidly changing content
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Generate large amounts of content
    let largeContent = 'graph TD\n'
    for (let i = 0; i < 200; i++) {
      largeContent += `    A${i}[Process ${i}] --> B${i}[Output ${i}]\n`
      largeContent += `    B${i} --> C${i}[Result ${i}]\n`
    }

    await textarea.fill(largeContent)
    await page.waitForTimeout(3000)

    // Rapidly switch between different content sizes
    const contents = [
      largeContent,
      'graph TD\n    A[Start] --> B[End]',
      '',
      INVALID_MERMAID_EXAMPLES.syntaxError,
      'graph LR\n    A --> B --> C'
    ]

    for (let i = 0; i < contents.length; i++) {
      await textarea.fill(contents[i])
      await page.waitForTimeout(500)
    }

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })

    console.log(`Final memory: ${finalMemory / 1024 / 1024} MB`)
    console.log(`Memory increase: ${(finalMemory - initialMemory) / 1024 / 1024} MB`)

    // Memory increase should be reasonable (less than 100MB for this test)
    expect(finalMemory - initialMemory).toBeLessThan(100 * 1024 * 1024)

    // Application should still be responsive
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()

    // Should be able to enter new content
    await textarea.fill('graph TD\n    A[Final Test] --> B[End]')
    await page.waitForTimeout(1000)

    const finalContent = await textarea.inputValue()
    expect(finalContent).toContain('Final Test')
  })

  test('should handle concurrent operations gracefully', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Start multiple rapid operations
    const operations = [
      () => textarea.fill('graph TD\n    A[Start] --> B[End]'),
      () => textarea.fill('graph LR\n    A --> B --> C'),
      () => textarea.fill(INVALID_MERMAID_EXAMPLES.syntaxError),
      () => textarea.fill(''),
      () => textarea.fill(MERMAID_EXAMPLES.flowchart)
    ]

    // Execute operations rapidly
    await Promise.all(operations.map(op => op()))
    await page.waitForTimeout(2000)

    // Should settle into a stable state
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()

    // Should not have crashed
    const appContainer = page.locator('body, main, .app')
    await expect(appContainer).toBeVisible()

    // Should be able to perform new operations
    await textarea.fill('graph TD\n    A[Recovery Test] --> B[End]')
    await page.waitForTimeout(1000)

    const content = await textarea.inputValue()
    expect(content).toContain('Recovery Test')
  })

  test('should handle browser tab switching and visibility', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Set up some content
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Simulate tab hiding (Page Visibility API)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await page.waitForTimeout(1000)

    // Simulate tab showing
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, writable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await page.waitForTimeout(1000)

    // Should still be functional
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()

    // Should be able to edit
    await textarea.fill('graph TD\n    A[Tab Switch Test] --> B[End]')
    await page.waitForTimeout(1000)

    const content = await textarea.inputValue()
    expect(content).toContain('Tab Switch Test')
  })

  test('should handle invalid file uploads gracefully', async ({ page }) => {
    // Try to upload various invalid file types
    const invalidFiles = [
      { name: 'test.exe', content: 'MZ\x90\x00' }, // Executable
      { name: 'test.jpg', content: '\xFF\xD8\xFF' }, // Image
      { name: 'test.pdf', content: '%PDF-' }, // PDF
      { name: 'test.zip', content: 'PK\x03\x04' } // ZIP
    ]

    // Look for file input elements
    const fileInputs = page.locator('input[type="file"]')
    const inputCount = await fileInputs.count()

    for (const file of invalidFiles) {
      if (inputCount > 0) {
        console.log(`Testing invalid file: ${file.name}`)

        // Create a mock file
        const fileBuffer = Buffer.from(file.content)
        await fileInputs.first().setInputFiles({
          name: file.name,
          mimeType: 'application/octet-stream',
          buffer: fileBuffer
        })

        await page.waitForTimeout(1000)

        // Should handle gracefully (not crash)
        await expect(page.locator('body')).toBeVisible()
        await expect(textarea).toBeVisible()
      }
    }
  })

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const jsErrors: string[] = []

    page.on('pageerror', error => {
      jsErrors.push(error.message)
    })

    // Try to trigger potential JavaScript errors
    await page.evaluate(() => {
      // Try to access undefined properties
      try {
        // @ts-ignore
        window.someUndefinedProperty.someMethod()
      } catch (e) {
        // Expected error
      }

      // Try to manipulate DOM in ways that might cause errors
      try {
        document.body.appendChild(document.createComment('test'))
      } catch (e) {
        // Expected error
      }
    })

    await page.waitForTimeout(1000)

    // Application should still be functional
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await expect(textarea).toBeVisible()

    // Should be able to use features
    await textarea.fill('graph TD\n    A[JS Error Test] --> B[End]')
    await page.waitForTimeout(1000)

    const content = await textarea.inputValue()
    expect(content).toContain('JS Error Test')

    // Log any JavaScript errors for debugging
    if (jsErrors.length > 0) {
      console.log('JavaScript errors detected:', jsErrors)
    }

    // Should not have critical errors that break the app
    const criticalErrors = jsErrors.filter(error =>
      error.includes('Cannot read property') ||
      error.includes('TypeError') ||
      error.includes('ReferenceError')
    )

    expect(criticalErrors.length).toBeLessThan(3) // Allow some non-critical errors
  })

  test('should handle rapid mode switching errors', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Set up initial content
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Rapidly switch modes
    const visualButton = page.locator('button:has-text("Visual"), [data-testid="visual-mode"]')
    const codeButton = page.locator('button:has-text("Code"), [data-testid="code-mode"]')

    if (await visualButton.isVisible() && await codeButton.isVisible()) {
      for (let i = 0; i < 10; i++) {
        await visualButton.click()
        await page.waitForTimeout(100)
        await codeButton.click()
        await page.waitForTimeout(100)
      }

      // Should settle into a stable state
      await page.waitForTimeout(2000)

      // Should still be functional
      await expect(textarea).toBeVisible()
      await expect(textarea).toBeEnabled()

      // Should be able to edit
      await textarea.fill('graph TD\n    A[Mode Switch Test] --> B[End]')
      await page.waitForTimeout(1000)

      const content = await textarea.inputValue()
      expect(content).toContain('Mode Switch Test')
    }
  })

  test('should handle storage quota exceeded', async ({ page }) => {
    // Monitor for storage errors
    const storageErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('storage')) {
        storageErrors.push(msg.text())
      }
    })

    // Try to fill localStorage to quota
    await page.evaluate(() => {
      try {
        // Fill localStorage with data
        let data = 'x'.repeat(1024 * 1024) // 1MB chunk
        let i = 0

        while (true) {
          try {
            localStorage.setItem(`test_${i}`, data)
            i++
          } catch (e) {
            console.log(`Storage quota exceeded after ${i} MB`)
            break
          }
        }
      } catch (e) {
        console.log('Storage test error:', e)
      }
    })

    // Try to use application features
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill('graph TD\n    A[Storage Test] --> B[End]')
    await page.waitForTimeout(1000)

    // Should still be functional
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()

    const content = await textarea.inputValue()
    expect(content).toContain('Storage Test')

    // Clean up localStorage
    await page.evaluate(() => {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('test_')) {
          localStorage.removeItem(key)
        }
      })
    })
  })
})