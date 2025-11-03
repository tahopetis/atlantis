import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'
import { CodeEditor } from './CodeEditor'
import { DiagramCanvas } from './DiagramCanvas'
import { ReactFlowCanvas } from './ReactFlowCanvas'

export class EditorPage extends BasePage {
  readonly codeEditor: CodeEditor
  readonly diagramCanvas: DiagramCanvas
  readonly reactFlowCanvas: ReactFlowCanvas

  // Locators
  readonly pageTitle: Locator
  readonly modeToggle: Locator
  readonly codeModeButton: Locator
  readonly visualModeButton: Locator
  readonly resizeHandle: Locator
  readonly errorBoundary: Locator

  constructor(page: Page) {
    super(page)
    this.codeEditor = new CodeEditor(page)
    this.diagramCanvas = new DiagramCanvas(page)
    this.reactFlowCanvas = new ReactFlowCanvas(page)

    this.pageTitle = page.locator('h1, h2, h3').first()
    this.modeToggle = page.locator('[data-testid="mode-toggle"], .mode-toggle')
    this.codeModeButton = page.locator('button:has-text("Code"), [data-testid="code-mode"]')
    this.visualModeButton = page.locator('button:has-text("Visual"), [data-testid="visual-mode"]')
    this.resizeHandle = page.locator('.resize-handle, [data-testid="resize-handle"]')
    this.errorBoundary = page.locator('.error-boundary, [data-testid="error-boundary"]')
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
   * Check if editor page is loaded
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForElement('[data-testid="code-editor"], .code-editor', 10000)
      return true
    } catch {
      return false
    }
  }

  /**
   * Switch to code mode
   */
  async switchToCodeMode(): Promise<void> {
    await this.codeModeButton.click()
    await this.expectVisible('[data-testid="code-editor"]')
  }

  /**
   * Switch to visual mode
   */
  async switchToVisualMode(): Promise<void> {
    await this.visualModeButton.click()
    await this.expectVisible('[data-testid="react-flow-canvas"]')
  }

  /**
   * Get current mode
   */
  async getCurrentMode(): Promise<'code' | 'visual'> {
    const isCodeMode = await this.codeModeButton.getAttribute('aria-selected')
    return isCodeMode === 'true' ? 'code' : 'visual'
  }

  /**
   * Resize the editor panels
   */
  async resizePanel(fromWidth: number, toWidth: number): Promise<void> {
    const handle = this.resizeHandle.first()
    await handle.hover()
    await this.page.mouse.down()
    await this.page.mouse.move(toWidth, 0)
    await this.page.mouse.up()
  }

  /**
   * Check if there are any errors
   */
  async hasErrors(): Promise<boolean> {
    return await this.exists('.error-boundary, .error-message, [data-testid="error"]')
  }

  /**
   * Get error messages
   */
  async getErrorMessages(): Promise<string[]> {
    const errorElements = this.page.locator('.error-message, [data-testid="error-message"]')
    const count = await errorElements.count()
    const errors: string[] = []

    for (let i = 0; i < count; i++) {
      const text = await errorElements.nth(i).textContent()
      if (text) {
        errors.push(text.trim())
      }
    }

    return errors
  }

  /**
   * Wait for editor to be fully initialized
   */
  async waitForEditorInitialization(): Promise<void> {
    await this.waitForElement('[data-testid="code-editor"], .code-editor')
    await this.waitForElement('[data-testid="diagram-canvas"], .diagram-canvas')

    // Wait for any loading states to complete
    await this.page.waitForTimeout(1000)

    // Ensure no loading spinners are visible
    const loadingElements = this.page.locator('.animate-spin, [data-testid="loading"]')
    await loadingElements.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // If loading elements don't exist or don't hide, continue
    })
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
   * Check if layout is responsive
   */
  async isResponsive(): Promise<boolean> {
    const originalViewport = this.page.viewportSize()

    // Test mobile view
    await this.page.setViewportSize({ width: 375, height: 667 })
    const mobileResponsive = await this.isVisible('.code-editor, .diagram-canvas')

    // Test tablet view
    await this.page.setViewportSize({ width: 768, height: 1024 })
    const tabletResponsive = await this.isVisible('.code-editor, .diagram-canvas')

    // Test desktop view
    await this.page.setViewportSize(originalViewport || { width: 1280, height: 720 })
    const desktopResponsive = await this.isVisible('.code-editor, .diagram-canvas')

    return mobileResponsive && tabletResponsive && desktopResponsive
  }
}