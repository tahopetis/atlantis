import { Page, Locator, expect } from '@playwright/test'

export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Navigate to a specific URL
   */
  async goto(path: string = ''): Promise<void> {
    await this.page.goto(path)
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` })
  }

  /**
   * Check if an element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible()
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<Locator> {
    return await this.page.locator(selector).waitFor({ state: 'visible', timeout })
  }

  /**
   * Click an element and wait for navigation if needed
   */
  async clickAndWait(selector: string, waitForNavigation: boolean = false): Promise<void> {
    if (waitForNavigation) {
      await Promise.all([
        this.page.waitForNavigation(),
        this.page.locator(selector).click()
      ])
    } else {
      await this.page.locator(selector).click()
    }
  }

  /**
   * Fill a form field
   */
  async fillField(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).fill(value)
  }

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || ''
  }

  /**
   * Check if element has specific class
   */
  async hasClass(selector: string, className: string): Promise<boolean> {
    const element = this.page.locator(selector)
    const classes = await element.getAttribute('class')
    return classes?.includes(className) || false
  }

  /**
   * Wait for and assert element is visible
   */
  async expectVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible()
  }

  /**
   * Wait for and assert element is hidden
   */
  async expectHidden(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeHidden()
  }

  /**
   * Assert element has specific text
   */
  async expectText(selector: string, text: string | RegExp): Promise<void> {
    await expect(this.page.locator(selector)).toHaveText(text)
  }

  /**
   * Assert element is disabled
   */
  async expectDisabled(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeDisabled()
  }

  /**
   * Assert element is enabled
   */
  async expectEnabled(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeEnabled()
  }

  /**
   * Hover over an element
   */
  async hover(selector: string): Promise<void> {
    await this.page.locator(selector).hover()
  }

  /**
   * Type text with delay between keystrokes
   */
  async typeSlowly(selector: string, text: string, delay: number = 100): Promise<void> {
    await this.page.locator(selector).type(text, { delay })
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key)
  }

  /**
   * Upload file
   */
  async uploadFile(selector: string, filePath: string): Promise<void> {
    await this.page.locator(selector).setInputFiles(filePath)
  }

  /**
   * Get attribute value
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.locator(selector).getAttribute(attribute)
  }

  /**
   * Check if element exists
   */
  async exists(selector: string): Promise<boolean> {
    return await this.page.locator(selector).count() > 0
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded()
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle(timeout: number = 30000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout })
  }

  /**
   * Execute JavaScript in the page context
   */
  async evaluate<T>(fn: () => T): Promise<T> {
    return await this.page.evaluate(fn)
  }

  /**
   * Check if page has any console errors
   */
  async checkForConsoleErrors(): Promise<void> {
    const errors: string[] = []

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Wait a bit to collect any pending errors
    await this.page.waitForTimeout(1000)

    if (errors.length > 0) {
      throw new Error(`Console errors detected: ${errors.join(', ')}`)
    }
  }
}