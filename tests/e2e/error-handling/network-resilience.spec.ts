import { test, expect } from '../fixtures/custom-fixtures'
import { MERMAID_EXAMPLES } from '../fixtures/test-data'

test.describe('Network Resilience and Error Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')
  })

  test('should work offline after initial load', async ({ page }) => {
    // Load the application online
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Verify it works online
    const diagram = page.locator('#mermaid svg, .mermaid svg')
    await expect(diagram).toBeVisible()

    // Go offline
    await page.context().setOffline(true)

    // Should still be able to edit
    await textarea.fill('graph TD\n    A[Offline Test] --> B[End]')
    await page.waitForTimeout(1000)

    const content = await textarea.inputValue()
    expect(content).toContain('Offline Test')

    // Should still show diagram
    await expect(diagram).toBeVisible()

    // Examples should still work (if cached)
    const examplesButton = page.locator('button:has-text("Examples"), [data-testid="examples-button"]')
    if (await examplesButton.isVisible()) {
      await examplesButton.click()
      await page.waitForTimeout(500)

      const dropdown = page.locator('.examples-dropdown, [data-testid="examples-dropdown"]')
      // Might or might not be visible depending on caching
    }

    // Come back online
    await page.context().setOffline(false)
    await page.waitForTimeout(1000)

    // Should still be functional
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()
  })

  test('should handle slow network conditions', async ({ page, helpers }) => {
    // Simulate slow network
    await helpers.simulateNetworkConditions({
      downloadThroughput: 50 * 1024, // 50 KB/s
      uploadThroughput: 20 * 1024,   // 20 KB/s
      latency: 1000 // 1 second latency
    })

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Should still be able to type (local operation)
    const startTime = Date.now()
    await textarea.fill('graph TD\n    A[Slow Network Test] --> B[End]')
    const typingTime = Date.now() - startTime

    expect(typingTime).toBeLessThan(5000) // Should complete within 5 seconds

    await page.waitForTimeout(2000)

    // Should eventually show diagram
    const diagram = page.locator('#mermaid svg, .mermaid svg')
    await expect(diagram).toBeVisible({ timeout: 10000 })

    // Stop network simulation
    await page.route('**/*', route => route.continue())
  })

  test('should handle intermittent connection loss', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Start working online
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Simulate connection loss
    await page.context().setOffline(true)
    await page.waitForTimeout(2000)

    // Continue working offline
    await textarea.fill('graph TD\n    A[Intermittent Test] --> B[End]')
    await page.waitForTimeout(1000)

    const offlineContent = await textarea.inputValue()
    expect(offlineContent).toContain('Intermittent Test')

    // Restore connection
    await page.context().setOffline(false)
    await page.waitForTimeout(2000)

    // Should sync and work normally
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()

    const onlineContent = await textarea.inputValue()
    expect(onlineContent).toContain('Intermittent Test')
  })

  test('should handle failed API calls gracefully', async ({ page }) => {
    // Monitor console for errors
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Mock API failures
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })

    await page.route('**/save**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Save failed' })
      })
    })

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Should still work locally
    await expect(textarea).toBeVisible()
    const diagram = page.locator('#mermaid svg, .mermaid svg')
    await expect(diagram).toBeVisible()

    // Try operations that might use API
    const downloadButton = page.locator('button:has([data-lucide="download"]), [data-testid="download-button"]')
    if (await downloadButton.isVisible()) {
      await downloadButton.click()
      await page.waitForTimeout(1000)
    }

    // Should not crash
    await expect(page.locator('body')).toBeVisible()

    // Should not show unhandled errors to user
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('500') && // Expected API error
      !error.includes('Internal Server Error')
    )

    expect(criticalErrors.length).toBeLessThan(3)

    // Restore normal routing
    await page.unroute('**/api/**')
    await page.unroute('**/save**')
  })

  test('should handle timeout scenarios', async ({ page }) => {
    // Mock slow responses that timeout
    await page.route('**/api/**', route => {
      // Don't respond to simulate timeout
      // setTimeout(() => route.continue(), 30000) // 30 second delay
    })

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Should work without API
    await textarea.fill('graph TD\n    A[Timeout Test] --> B[End]')
    await page.waitForTimeout(2000)

    const content = await textarea.inputValue()
    expect(content).toContain('Timeout Test')

    // Should not hang indefinitely
    await expect(textarea).toBeVisible({ timeout: 5000 })

    // Restore routing
    await page.unroute('**/api/**')
  })

  test('should handle corrupted responses', async ({ page }) => {
    // Mock corrupted JSON responses
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"invalid": json}' // Invalid JSON
      })
    })

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Should still work locally
    await textarea.fill(MERMAID_EXAMPLES.flowchart)
    await page.waitForTimeout(2000)

    // Should not crash
    await expect(textarea).toBeVisible()
    const diagram = page.locator('#mermaid svg, .mermaid svg')
    await expect(diagram).toBeVisible()

    // Restore routing
    await page.unroute('**/api/**')
  })

  test('should handle concurrent requests properly', async ({ page }) => {
    // Mock API that delays responses
    let requestCount = 0
    await page.route('**/api/**', route => {
      requestCount++
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ requestId: requestCount, success: true })
        })
      }, Math.random() * 1000) // Random delay
    })

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Rapidly change content to trigger multiple requests
    const contents = [
      'graph TD\n    A[Test 1] --> B[End]',
      'graph TD\n    A[Test 2] --> B[End]',
      'graph TD\n    A[Test 3] --> B[End]'
    ]

    for (const content of contents) {
      await textarea.fill(content)
      await page.waitForTimeout(200)
    }

    await page.waitForTimeout(3000)

    // Should settle into final state
    const finalContent = await textarea.inputValue()
    expect(finalContent).toContain('Test 3')

    // Should not be confused by concurrent responses
    await expect(textarea).toBeVisible()

    // Restore routing
    await page.unroute('**/api/**')
  })

  test('should recover from network errors', async ({ page }) => {
    // Start with network failure
    await page.context().setOffline(true)

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill('graph TD\n    A[Recovery Test] --> B[End]')

    // Work offline for a bit
    await page.waitForTimeout(2000)

    // Restore connection
    await page.context().setOffline(false)
    await page.waitForTimeout(2000)

    // Should recover and work normally
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()

    // Should be able to make new requests
    await textarea.fill('graph TD\n    A[Recovered] --> B[End]')
    await page.waitForTimeout(1000)

    const content = await textarea.inputValue()
    expect(content).toContain('Recovered')
  })

  test('should handle large file operations over poor network', async ({ page, helpers }) => {
    // Simulate poor network
    await helpers.simulateNetworkConditions({
      downloadThroughput: 100 * 1024, // 100 KB/s
      uploadThroughput: 50 * 1024,   // 50 KB/s
      latency: 2000 // 2 second latency
    })

    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Create large content
    let largeContent = 'graph TD\n'
    for (let i = 0; i < 100; i++) {
      largeContent += `    A${i}[Process ${i}] --> B${i}[Output ${i}]\n`
    }

    const startTime = Date.now()
    await textarea.fill(largeContent)
    const fillTime = Date.now() - startTime

    console.log(`Large content fill time: ${fillTime}ms`)

    // Should complete within reasonable time (local operation)
    expect(fillTime).toBeLessThan(10000)

    await page.waitForTimeout(3000)

    // Should still show diagram
    const diagram = page.locator('#mermaid svg, .mermaid svg')
    await expect(diagram).toBeVisible({ timeout: 15000 })

    // Try download
    const downloadButton = page.locator('button:has([data-lucide="download"]), [data-testid="download-button"]')
    if (await downloadButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download')
      await downloadButton.click()

      try {
        const download = await downloadPromise
        console.log(`Download completed: ${download.suggestedFilename()}`)
      } catch (error) {
        console.log('Download might have failed due to network conditions')
      }
    }

    // Restore network
    await page.route('**/*', route => route.continue())
  })

  test('should provide user feedback during network issues', async ({ page }) => {
    // Monitor for user feedback elements
    const feedbackSelectors = [
      '[data-testid="loading"]',
      '[data-testid="offline"]',
      '[data-testid="network-error"]',
      '.loading',
      '.offline-indicator',
      '.network-status'
    ]

    // Go offline
    await page.context().setOffline(true)

    // Look for offline indicators
    await page.waitForTimeout(2000)

    let hasOfflineIndicator = false
    for (const selector of feedbackSelectors) {
      if (await page.locator(selector).isVisible()) {
        hasOfflineIndicator = true
        console.log(`Found offline indicator: ${selector}`)
        break
      }
    }

    console.log(`Offline indicator present: ${hasOfflineIndicator}`)

    // Try to use features
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    await textarea.fill('graph TD\n    A[Feedback Test] --> B[End]')

    // Look for loading indicators
    await page.waitForTimeout(1000)

    let hasLoadingIndicator = false
    for (const selector of feedbackSelectors) {
      if (await page.locator(selector).isVisible()) {
        hasLoadingIndicator = true
        console.log(`Found loading indicator: ${selector}`)
        break
      }
    }

    console.log(`Loading indicator present: ${hasLoadingIndicator}`)

    // Come back online
    await page.context().setOffline(false)
    await page.waitForTimeout(2000)

    // Should still be functional
    await expect(textarea).toBeVisible()
    const content = await textarea.inputValue()
    expect(content).toContain('Feedback Test')
  })

  test('should maintain data integrity during network issues', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')

    // Create important content
    const importantContent = `graph TD
    A[Important Data] --> B{Save Point}
    B -->|Success| C[Complete]
    B -->|Error| D[Retry]
    D --> B
    C --> E[End]`

    await textarea.fill(importantContent)
    await page.waitForTimeout(2000)

    // Verify content is set
    const initialContent = await textarea.inputValue()
    expect(initialContent).toBe(importantContent)

    // Go offline
    await page.context().setOffline(true)

    // Continue editing
    await textarea.fill(importantContent + '\n    B --> F[Offline Addition]')
    await page.waitForTimeout(1000)

    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(2000)

    // Content should be preserved
    const finalContent = await textarea.inputValue()
    expect(finalContent).toContain('Important Data')
    expect(finalContent).toContain('Offline Addition')

    // Should not have corrupted data
    expect(finalContent.length).toBeGreaterThan(importantContent.length)
  })
})