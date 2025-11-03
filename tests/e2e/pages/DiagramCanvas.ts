import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class DiagramCanvas extends BasePage {
  // Locators
  readonly container: Locator
  readonly header: Locator
  readonly title: Locator
  readonly modeToggle: Locator
  readonly codeModeButton: Locator
  readonly visualModeButton: Locator
  readonly zoomControls: Locator
  readonly zoomInButton: Locator
  readonly zoomOutButton: Locator
  readonly zoomLevel: Locator
  readonly fitToScreenButton: Locator
  readonly resetZoomButton: Locator
  readonly diagramContainer: Locator
  readonly mermaidContainer: Locator
  readonly errorDisplay: Locator
  readonly errorMessage: Locator
  readonly errorDetails: Locator
  readonly loadingIndicator: Locator
  readonly emptyState: Locator
  readonly floatingZoomControls: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.locator('[data-testid="diagram-canvas"], .diagram-canvas')
    this.header = page.locator('[data-testid="diagram-header"], .diagram-header')
    this.title = page.locator('[data-testid="diagram-title"] h3, .diagram-canvas h3')
    this.modeToggle = page.locator('[data-testid="diagram-mode-toggle"], .diagram-mode-toggle')
    this.codeModeButton = page.locator('[data-testid="code-mode"], button:has-text("Code")')
    this.visualModeButton = page.locator('[data-testid="visual-mode"], button:has-text("Visual")')
    this.zoomControls = page.locator('[data-testid="zoom-controls"], .zoom-controls')
    this.zoomInButton = page.locator('button:has([data-lucide="zoom-in"]), [data-testid="zoom-in"]')
    this.zoomOutButton = page.locator('button:has([data-lucide="zoom-out"]), [data-testid="zoom-out"]')
    this.zoomLevel = page.locator('[data-testid="zoom-level"], .zoom-level')
    this.fitToScreenButton = page.locator('button:has-text("Fit to Screen"), [data-testid="fit-to-screen"]')
    this.resetZoomButton = page.locator('button:has([data-lucide="rotate-ccw"]), [data-testid="reset-zoom"]')
    this.diagramContainer = page.locator('[data-testid="diagram-container"], .diagram-container')
    this.mermaidContainer = page.locator('[data-testid="mermaid-container"], #mermaid, .mermaid')
    this.errorDisplay = page.locator('[data-testid="error-display"], .error-display')
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message')
    this.errorDetails = page.locator('[data-testid="error-details"], .error-details')
    this.loadingIndicator = page.locator('[data-testid="loading-indicator"], .loading-indicator')
    this.emptyState = page.locator('[data-testid="empty-state"], .empty-state')
    this.floatingZoomControls = page.locator('[data-testid="floating-zoom-controls"], .floating-zoom-controls')
  }

  /**
   * Check if diagram canvas is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible()
  }

  /**
   * Get current zoom level
   */
  async getZoomLevel(): Promise<number> {
    const zoomText = await this.zoomLevel.textContent()
    const match = zoomText?.match(/(\d+)%/)
    return match ? parseInt(match[1]) / 100 : 1
  }

  /**
   * Zoom in
   */
  async zoomIn(): Promise<void> {
    await this.zoomInButton.click()
  }

  /**
   * Zoom out
   */
  async zoomOut(): Promise<void> {
    await this.zoomOutButton.click()
  }

  /**
   * Set zoom to specific level (by clicking buttons multiple times)
   */
  async setZoomLevel(targetLevel: number): Promise<void> {
    const currentLevel = await this.getZoomLevel()
    const difference = targetLevel - currentLevel
    const steps = Math.abs(Math.round(difference / 0.1)) // Each click changes zoom by ~10%

    if (difference > 0) {
      for (let i = 0; i < steps; i++) {
        await this.zoomIn()
        await this.page.waitForTimeout(100)
      }
    } else {
      for (let i = 0; i < steps; i++) {
        await this.zoomOut()
        await this.page.waitForTimeout(100)
      }
    }
  }

  /**
   * Fit to screen
   */
  async fitToScreen(): Promise<void> {
    await this.fitToScreenButton.click()
  }

  /**
   * Reset zoom
   */
  async resetZoom(): Promise<void> {
    await this.resetZoomButton.click()
  }

  /**
   * Check if diagram is rendered (has content)
   */
  async isDiagramRendered(): Promise<boolean> {
    // Check for various indicators that diagram is rendered
    const hasSvg = await this.exists('#mermaid svg, .mermaid svg')
    const hasContent = await this.exists('[data-testid="diagram-container"] svg *')
    return hasSvg || hasContent
  }

  /**
   * Wait for diagram to render
   */
  async waitForDiagramRender(timeout: number = 10000): Promise<void> {
    await this.page.waitForFunction(() => {
      const mermaidElement = document.querySelector('#mermaid svg, .mermaid svg')
      return mermaidElement && mermaidElement.children.length > 0
    }, { timeout })
  }

  /**
   * Check if there's an error
   */
  async hasError(): Promise<boolean> {
    return await this.errorDisplay.isVisible()
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || ''
  }

  /**
   * Get error details (line/column info)
   */
  async getErrorDetails(): Promise<{ line?: number; column?: number; message?: string }> {
    const detailsText = await this.errorDetails.textContent()

    const lineMatch = detailsText?.match(/Line:\s*(\d+)/)
    const columnMatch = detailsText?.match(/Column:\s*(\d+)/)
    const messageMatch = detailsText?.match(/(.+)/)

    return {
      line: lineMatch ? parseInt(lineMatch[1]) : undefined,
      column: columnMatch ? parseInt(columnMatch[1]) : undefined,
      message: messageMatch ? messageMatch[1].trim() : undefined
    }
  }

  /**
   * Check if loading indicator is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingIndicator.isVisible()
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete(timeout: number = 10000): Promise<void> {
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout })
  }

  /**
   * Check if empty state is shown
   */
  async isEmptyState(): Promise<boolean> {
    return await this.emptyState.isVisible()
  }

  /**
   * Get empty state message
   */
  async getEmptyStateMessage(): Promise<string> {
    return await this.emptyState.textContent() || ''
  }

  /**
   * Switch to code mode
   */
  async switchToCodeMode(): Promise<void> {
    await this.codeModeButton.click()
  }

  /**
   * Switch to visual mode
   */
  async switchToVisualMode(): Promise<void> {
    await this.visualModeButton.click()
  }

  /**
   * Get current mode
   */
  async getCurrentMode(): Promise<'code' | 'visual'> {
    const codeModeSelected = await this.codeModeButton.getAttribute('aria-selected')
    return codeModeSelected === 'true' ? 'code' : 'visual'
  }

  /**
   * Check if floating zoom controls are visible
   */
  async hasFloatingZoomControls(): Promise<boolean> {
    return await this.floatingZoomControls.isVisible()
  }

  /**
   * Hover over diagram to show floating controls
   */
  async hoverToShowFloatingControls(): Promise<void> {
    await this.diagramContainer.hover()
    await this.page.waitForTimeout(500) // Wait for controls to appear
  }

  /**
   * Check if diagram has specific elements
   */
  async hasDiagramElement(selector: string): Promise<boolean> {
    return await this.mermaidContainer.locator(selector).isVisible()
  }

  /**
   * Count diagram nodes/shapes
   */
  async getDiagramElementCount(selector: string): Promise<number> {
    return await this.mermaidContainer.locator(selector).count()
  }

  /**
   * Get diagram SVG content
   */
  async getSvgContent(): Promise<string> {
    const svg = this.mermaidContainer.locator('svg').first()
    return await svg.innerHTML() || ''
  }

  /**
   * Check if diagram supports interaction (clicking nodes, etc.)
   */
  async isInteractive(): Promise<boolean> {
    // Check for clickable elements
    const clickableElements = await this.mermaidContainer.locator('rect, circle, text, path').count()
    return clickableElements > 0
  }

  /**
   * Click on diagram element
   */
  async clickDiagramElement(selector: string): Promise<void> {
    await this.mermaidContainer.locator(selector).first().click()
  }

  /**
   * Get diagram bounds/size
   */
  async getDiagramBounds(): Promise<{ width: number; height: number }> {
    return await this.page.evaluate(() => {
      const svg = document.querySelector('#mermaid svg, .mermaid svg')
      if (!svg) return { width: 0, height: 0 }

      const rect = svg.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    })
  }

  /**
   * Pan the diagram (if supported)
   */
  async panDiagram(deltaX: number, deltaY: number): Promise<void> {
    await this.diagramContainer.hover()
    await this.page.mouse.down()
    await this.page.mouse.move(deltaX, deltaY)
    await this.page.mouse.up()
  }

  /**
   * Check if zoom controls are enabled/disabled
   */
  async isZoomInEnabled(): Promise<boolean> {
    return !(await this.zoomInButton.isDisabled())
  }

  async isZoomOutEnabled(): Promise<boolean> {
    return !(await this.zoomOutButton.isDisabled())
  }

  /**
   * Wait for canvas to be ready
   */
  async waitForReady(): Promise<void> {
    await this.container.waitFor({ state: 'visible' })
    await this.waitForLoadingComplete()
  }

  /**
   * Take screenshot of diagram only
   */
  async takeDiagramScreenshot(name: string): Promise<void> {
    await this.diagramContainer.screenshot({
      path: `test-results/screenshots/${name}-diagram.png`
    })
  }
}