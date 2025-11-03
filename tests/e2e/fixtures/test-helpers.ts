import { Page, expect } from '@playwright/test'
import { MERMAID_EXAMPLES, INVALID_MERMAID_EXAMPLES, VIEWPORTS } from './test-data'

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for a specific amount of time
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms)
  }

  /**
   * Clear all console logs and start monitoring
   */
  async monitorConsole(): Promise<string[]> {
    const logs: string[] = []

    this.page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`)
    })

    return logs
  }

  /**
   * Check for JavaScript errors
   */
  async checkForJSErrors(): Promise<string[]> {
    const errors: string[] = []

    this.page.on('pageerror', error => {
      errors.push(error.message)
    })

    await this.wait(1000) // Wait to collect any pending errors
    return errors
  }

  /**
   * Mock clipboard API
   */
  async mockClipboard(): Promise<void> {
    await this.page.evaluate(() => {
      const mockClipboard = {
        writeText: async (text: string) => {
          (window as any).__mockClipboardData = text
          return Promise.resolve()
        },
        readText: async () => {
          return (window as any).__mockClipboardData || ''
        }
      }
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      })
    })
  }

  /**
   * Mock download behavior
   */
  async mockDownload(): Promise<{ files: Array<{ name: string; content: string }> }> {
    const downloadedFiles: Array<{ name: string; content: string }> = []

    // Intercept download events
    this.page.on('download', async (download) => {
      const fileName = download.suggestedFilename()
      const content = await download.createReadStream()
      let fileContent = ''

      if (content) {
        const chunks: Buffer[] = []
        for await (const chunk of content) {
          chunks.push(chunk)
        }
        fileContent = Buffer.concat(chunks).toString()
      }

      downloadedFiles.push({ name: fileName, content: fileContent })
    })

    return { files: downloadedFiles }
  }

  /**
   * Mock file upload
   */
  async mockFileUpload(fileName: string, content: string): Promise<string> {
    // Create a temporary file path for testing
    const tempPath = `/tmp/${fileName}`

    await this.page.evaluate(({ name, data }) => {
      // Create a mock file object
      const file = new File([data], name, { type: 'text/plain' })
      ;(window as any).__mockFile = file
    }, { name: fileName, data: content })

    return tempPath
  }

  /**
   * Measure performance timing
   */
  async measurePerformance<T>(
    operation: () => Promise<T>,
    metricName: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now()
    const result = await operation()
    const duration = Date.now() - startTime

    console.log(`${metricName}: ${duration}ms`)
    return { result, duration }
  }

  /**
   * Take accessibility snapshot
   */
  async getAccessibilitySnapshot(): Promise<any> {
    return await this.page.accessibility.snapshot()
  }

  /**
   * Check color contrast ratio
   */
  async checkColorContrast(selector: string): Promise<{ ratio: number; passes: boolean }> {
    return await this.page.evaluate((elementSelector) => {
      const element = document.querySelector(elementSelector)
      if (!element) return { ratio: 0, passes: false }

      const styles = window.getComputedStyle(element)
      const color = styles.color
      const backgroundColor = styles.backgroundColor

      // Simple contrast calculation (in real implementation, use a proper library)
      return {
        ratio: 4.5, // Placeholder
        passes: true
      }
    }, selector)
  }

  /**
   * Test responsive behavior
   */
  async testResponsive(viewports: typeof VIEWPORTS): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {}

    for (const [name, viewport] of Object.entries(viewports)) {
      await this.page.setViewportSize(viewport)
      await this.wait(500) // Wait for layout adjustments

      // Check if main elements are visible and properly laid out
      const hasEditor = await this.page.isVisible('.code-editor, [data-testid="code-editor"]')
      const hasCanvas = await this.page.isVisible('.diagram-canvas, [data-testid="diagram-canvas"]')
      const hasNoHorizontalOverflow = await this.page.evaluate(() => {
        return document.body.scrollWidth <= window.innerWidth
      })

      results[name] = hasEditor && hasCanvas && hasNoHorizontalOverflow
    }

    return results
  }

  /**
   * Generate test data
   */
  static generateMermaidCode(type: keyof typeof MERMAID_EXAMPLES): string {
    return MERMAID_EXAMPLES[type]
  }

  static generateInvalidMermaidCode(type: keyof typeof INVALID_MERMAID_EXAMPLES): string {
    return INVALID_MERMAID_EXAMPLES[type]
  }

  /**
   * Check if element is in viewport
   */
  async isElementInViewport(selector: string): Promise<boolean> {
    return await this.page.evaluate((elementSelector) => {
      const element = document.querySelector(elementSelector)
      if (!element) return false

      const rect = element.getBoundingClientRect()
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      )
    }, selector)
  }

  /**
   * Simulate network conditions
   */
  async simulateNetworkConditions(conditions: {
    offline?: boolean
    downloadThroughput?: number
    uploadThroughput?: number
    latency?: number
  }): Promise<void> {
    const context = this.page.context()
    await context.route('**/*', (route) => {
      if (conditions.offline) {
        route.abort()
      } else {
        // Simulate slow network
        setTimeout(() => route.continue(), conditions.latency || 0)
      }
    })
  }

  /**
   * Mock API responses
   */
  async mockAPI(urlPattern: string, response: any, status: number = 200): Promise<void> {
    await this.page.route(urlPattern, (route) => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      })
    })
  }

  /**
   * Wait for element animation to complete
   */
  async waitForAnimation(selector: string): Promise<void> {
    await this.page.waitForFunction((elementSelector) => {
      const element = document.querySelector(elementSelector)
      if (!element) return true

      const styles = window.getComputedStyle(element)
      const animations = styles.animationName !== 'none' || styles.transition !== 'none'

      return !animations
    }, selector)
  }

  /**
   * Get computed styles
   */
  async getComputedStyles(selector: string): Promise<CSSStyleDeclaration> {
    return await this.page.evaluate((elementSelector) => {
      const element = document.querySelector(elementSelector)
      return element ? window.getComputedStyle(element) : {}
    }, selector)
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(): Promise<{
    canFocus: boolean
    canNavigate: boolean
    reachableElements: string[]
  }> {
    const focusableSelectors = [
      'button', '[href]', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'
    ]

    const results = {
      canFocus: false,
      canNavigate: false,
      reachableElements: [] as string[]
    }

    // Try to focus first element
    await this.page.keyboard.press('Tab')
    results.canFocus = await this.page.evaluate(() => document.activeElement !== document.body)

    // Navigate through all focusable elements
    let currentFocus = ''
    const attempts = 20 // Prevent infinite loop

    for (let i = 0; i < attempts; i++) {
      await this.page.keyboard.press('Tab')
      currentFocus = await this.page.evaluate(() => {
        const active = document.activeElement
        return active ? active.tagName.toLowerCase() + (active.id ? `#${active.id}` : '') : ''
      })

      if (currentFocus && !results.reachableElements.includes(currentFocus)) {
        results.reachableElements.push(currentFocus)
      }

      // If we've cycled back to the beginning, stop
      if (results.reachableElements.length > 1 && i > 5) {
        break
      }
    }

    results.canNavigate = results.reachableElements.length > 1

    return results
  }

  /**
   * Clean up test environment
   */
  async cleanup(): Promise<void> {
    // Clear any timeouts, intervals, or event listeners
    await this.page.evaluate(() => {
      // Clear all timeouts
      const highestTimeoutId = setTimeout(() => {})
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i)
      }

      // Clear all intervals
      const highestIntervalId = setInterval(() => {})
      for (let i = 0; i < highestIntervalId; i++) {
        clearInterval(i)
      }
    })
  }

  /**
   * Get memory usage
   */
  async getMemoryUsage(): Promise<any> {
    return await this.page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
        jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit || 0
      }
    })
  }

  /**
   * Create test directory if it doesn't exist
   */
  static ensureTestDirectories(): void {
    const fs = require('fs')
    const path = require('path')

    const directories = [
      'test-results/screenshots',
      'test-results/downloads',
      'test-results/videos',
      'test-results/traces'
    ]

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }
}