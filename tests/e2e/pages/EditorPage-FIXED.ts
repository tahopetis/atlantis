import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { CodeEditorFixed } from './CodeEditor-FIXED'
import { DiagramCanvasFixed } from './DiagramCanvas-FIXED'

/**
 * FIXED VERSION - EditorPage with working selectors based on functional discovery
 *
 * This version uses selectors that were verified to work in the functional discovery test.
 * All data-testid selectors have been replaced with working alternatives.
 */
export class EditorPageFixed extends BasePage {
  readonly codeEditor: CodeEditorFixed
  readonly diagramCanvas: DiagramCanvasFixed

  // Working selectors based on discovery test results
  readonly pageTitle: Locator
  readonly mainContainer: Locator
  readonly rootContainer: Locator

  constructor(page: Page) {
    super(page)
    this.codeEditor = new CodeEditorFixed(page)
    this.diagramCanvas = new DiagramCanvasFixed(page)

    // Working container selectors
    this.rootContainer = page.locator('#root')
    this.mainContainer = page.locator('main')
    this.pageTitle = page.locator('h1, h2, h3').first()
  }

  /**
   * Navigate to the editor page
   */
  async goto(id?: string): Promise<void> {
    const path = id ? `/editor/${id}` : '/editor'
    await super.goto(path)
    await this.waitForPageLoad()
  }

  /**
   * Check if editor page is loaded using working selectors
   */
  async isLoaded(): Promise<boolean> {
    try {
      // Use working selectors from discovery test
      await this.waitForElement('textarea[placeholder*="Mermaid"]', 10000)
      await this.waitForElement('svg', 10000)
      return true
    } catch {
      return false
    }
  }

  /**
   * Wait for editor to be fully initialized using working selectors
   */
  async waitForEditorInitialization(): Promise<void> {
    console.log('Waiting for editor initialization with working selectors...')

    // Wait for core components that we know exist
    await this.waitForElement('textarea[placeholder*="Mermaid"]')
    await this.waitForElement('svg')

    // Wait for any loading states to complete
    await this.page.waitForTimeout(1000)

    // Check for loading indicators (may not exist, but check anyway)
    const loadingElements = this.page.locator('.animate-spin')
    await loadingElements.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // If loading elements don't exist or don't hide, continue
      console.log('No loading indicators found or they did not hide')
    })

    console.log('Editor initialization complete')
  }

  /**
   * Check if layout is responsive using working selectors
   */
  async isResponsive(): Promise<boolean> {
    const originalViewport = this.page.viewportSize()

    try {
      // Test mobile view
      await this.page.setViewportSize({ width: 375, height: 667 })
      const mobileResponsive = await this.page.locator('textarea[placeholder*="Mermaid"]').isVisible()

      // Test tablet view
      await this.page.setViewportSize({ width: 768, height: 1024 })
      const tabletResponsive = await this.page.locator('textarea[placeholder*="Mermaid"]').isVisible()

      // Test desktop view
      await this.page.setViewportSize(originalViewport || { width: 1280, height: 720 })
      const desktopResponsive = await this.page.locator('textarea[placeholder*="Mermaid"]').isVisible()

      return mobileResponsive && tabletResponsive && desktopResponsive
    } catch (error) {
      console.log('Responsive test failed:', error)
      return false
    }
  }

  /**
   * Check if there are any errors using working selectors
   */
  async hasErrors(): Promise<boolean> {
    try {
      // Check for text-based error indicators
      const errorText = await this.page.locator('text=Error').isVisible()
      const errorDestructive = await this.page.locator('.text-destructive').isVisible()

      return errorText || errorDestructive
    } catch {
      return false
    }
  }

  /**
   * Get error messages using working selectors
   */
  async getErrorMessages(): Promise<string[]> {
    const errors: string[] = []

    try {
      // Check for text-based error messages
      const errorElements = this.page.locator('text=Error, .text-destructive')
      const count = await errorElements.count()

      for (let i = 0; i < count; i++) {
        const text = await errorElements.nth(i).textContent()
        if (text) {
          errors.push(text.trim())
        }
      }
    } catch (error) {
      console.log('Error getting error messages:', error)
    }

    return errors
  }

  /**
   * Take a full page screenshot
   */
  async takeFullPageScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-full.png`,
      fullPage: true
    })
  }

  /**
   * Get page health status
   */
  async getPageHealth(): Promise<{
    title: string
    url: string
    hasTextarea: boolean
    hasSvg: boolean
    hasButtons: boolean
    hasErrors: boolean
    editorContent: string
  }> {
    const title = await this.page.title()
    const url = this.page.url()
    const hasTextarea = await this.page.locator('textarea[placeholder*="Mermaid"]').isVisible()
    const hasSvg = await this.page.locator('svg').isVisible()
    const hasButtons = await this.page.locator('button').count() > 0
    const hasErrors = await this.hasErrors()

    let editorContent = ''
    try {
      editorContent = await this.page.locator('textarea[placeholder*="Mermaid"]').inputValue()
    } catch {
      editorContent = 'Failed to get editor content'
    }

    return {
      title,
      url,
      hasTextarea,
      hasSvg,
      hasButtons,
      hasErrors,
      editorContent
    }
  }

  /**
   * Perform basic health check of the editor
   */
  async performHealthCheck(): Promise<void> {
    console.log('🔍 Performing editor health check...')

    const health = await this.getPageHealth()

    console.log('📊 Editor Health Status:')
    console.log(`  Title: ${health.title}`)
    console.log(`  URL: ${health.url}`)
    console.log(`  Has textarea: ${health.hasTextarea}`)
    console.log(`  Has SVG: ${health.hasSvg}`)
    console.log(`  Has buttons: ${health.hasButtons}`)
    console.log(`  Has errors: ${health.hasErrors}`)
    console.log(`  Editor content length: ${health.editorContent.length} chars`)

    if (health.editorContent.length > 0) {
      console.log(`  Editor preview: ${health.editorContent.substring(0, 100)}...`)
    }

    if (!health.hasTextarea) {
      console.log('❌ CRITICAL: Editor textarea not found')
    }

    if (!health.hasSvg) {
      console.log('⚠️  WARNING: No SVG elements found')
    }

    if (health.hasErrors) {
      console.log('❌ CRITICAL: Errors detected on page')
      const errors = await this.getErrorMessages()
      console.log('  Errors:', errors)
    }

    if (health.hasTextarea && health.hasSvg && !health.hasErrors) {
      console.log('✅ Editor appears healthy')
    }
  }
}