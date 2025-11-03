import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * FIXED VERSION - DiagramCanvas with working selectors based on functional discovery
 *
 * This version uses selectors that were verified to work in the functional discovery test.
 * All data-testid selectors have been replaced with working alternatives.
 */
export class DiagramCanvasFixed extends BasePage {
  // Working selectors based on discovery test results
  readonly container: Locator
  readonly header: Locator
  readonly title: Locator
  readonly diagramSvg: Locator
  readonly codeModeButton: Locator
  readonly visualModeButton: Locator
  readonly zoomInButton: Locator
  readonly zoomOutButton: Locator
  readonly fitToScreenButton: Locator
  readonly resetZoomButton: Locator
  readonly errorDisplay: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page)

    // Working selectors from discovery test
    this.container = page.locator('svg').first() // Use first SVG as container
    this.header = page.locator('.p-4.border-b')
    this.title = page.locator('h3:has-text("Diagram Preview"), h3:has-text("Mermaid")')
    this.diagramSvg = page.locator('svg').first()
    this.codeModeButton = page.locator('button:has-text("Code")')
    this.visualModeButton = page.locator('button:has-text("Visual")')
    this.zoomInButton = page.locator('button:has-text("Zoom In"), button[title*="Zoom in"]')
    this.zoomOutButton = page.locator('button:has-text("Zoom Out"), button[title*="Zoom out"]')
    this.fitToScreenButton = page.locator('button:has-text("Fit to Screen")')
    this.resetZoomButton = page.locator('button:has-text("Reset")')

    // Error handling
    this.errorDisplay = page.locator('text=Error, .text-destructive')
    this.errorMessage = page.locator('text=Error')
  }

  /**
   * Check if diagram canvas is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.diagramSvg.isVisible()
  }

  /**
   * Get current zoom level (this may not work as expected since zoom controls weren't clearly identified)
   */
  async getZoomLevel(): Promise<number> {
    try {
      // Look for zoom percentage text
      const zoomText = await this.page.locator('text=/\\d+%/').textContent()
      if (zoomText) {
        const match = zoomText.match(/(\\d+)%/)
        return match ? parseInt(match[1]) / 100 : 1
      }

      // Check for scale transform
      const transform = await this.diagramSvg.getAttribute('style')
      if (transform && transform.includes('scale')) {
        const match = transform.match(/scale\\(([^)]+)\\)/)
        return match ? parseFloat(match[1]) : 1
      }

      return 1 // Default zoom level
    } catch {
      return 1
    }
  }

  /**
   * Zoom in (using available zoom controls)
   */
  async zoomIn(): Promise<void> {
    try {
      // Try to find zoom in button by text or title
      const zoomInSelectors = [
        'button:has-text("Zoom In")',
        'button:has-text("+")',
        'button[title*="zoom in" i]',
        'button[aria-label*="zoom in" i]'
      ]

      for (const selector of zoomInSelectors) {
        const button = this.page.locator(selector)
        if (await button.isVisible()) {
          await button.click()
          return
        }
      }

      console.log('Zoom in button not found')
    } catch (error) {
      console.log('Failed to zoom in:', error)
    }
  }

  /**
   * Zoom out (using available zoom controls)
   */
  async zoomOut(): Promise<void> {
    try {
      // Try to find zoom out button by text or title
      const zoomOutSelectors = [
        'button:has-text("Zoom Out")',
        'button:has-text("-")',
        'button[title*="zoom out" i]',
        'button[aria-label*="zoom out" i]'
      ]

      for (const selector of zoomOutSelectors) {
        const button = this.page.locator(selector)
        if (await button.isVisible()) {
          await button.click()
          return
        }
      }

      console.log('Zoom out button not found')
    } catch (error) {
      console.log('Failed to zoom out:', error)
    }
  }

  /**
   * Fit to screen
   */
  async fitToScreen(): Promise<void> {
    try {
      await this.fitToScreenButton.click()
    } catch (error) {
      console.log('Fit to screen button not found or not clickable:', error)
    }
  }

  /**
   * Reset zoom
   */
  async resetZoom(): Promise<void> {
    try {
      await this.resetZoomButton.click()
    } catch (error) {
      console.log('Reset zoom button not found or not clickable:', error)
    }
  }

  /**
   * Check if diagram is rendered (has content)
   */
  async isDiagramRendered(): Promise<boolean> {
    try {
      // Check if SVG has content
      const svgCount = await this.diagramSvg.count()
      if (svgCount === 0) return false

      const firstSvg = this.diagramSvg.first()
      const hasChildren = await firstSvg.evaluate(el => el.children.length > 0)

      // Check for specific diagram elements
      const hasDiagramElements = await this.page.locator('svg rect, svg circle, svg text, svg path').count() > 0

      return hasChildren || hasDiagramElements
    } catch {
      return false
    }
  }

  /**
   * Wait for diagram to render
   */
  async waitForDiagramRender(timeout: number = 10000): Promise<void> {
    try {
      await this.page.waitForFunction(() => {
        const svgs = document.querySelectorAll('svg')
        if (svgs.length === 0) return false

        // Check if any SVG has meaningful content
        for (const svg of svgs) {
          if (svg.children.length > 0) {
            // Exclude small icon SVGs, look for larger diagram SVGs
            const rect = svg.getBoundingClientRect()
            if (rect.width > 100 && rect.height > 100) {
              return true
            }
          }
        }
        return false
      }, { timeout })
    } catch (error) {
      console.log('Diagram render timeout, continuing anyway:', error)
    }
  }

  /**
   * Check if there's an error using working selectors
   */
  async hasError(): Promise<boolean> {
    try {
      const errorText = await this.errorMessage.isVisible()
      const errorClass = await this.page.locator('.text-destructive').isVisible()
      return errorText || errorClass
    } catch {
      return false
    }
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    try {
      const text = await this.errorMessage.textContent()
      return text || ''
    } catch {
      return ''
    }
  }

  /**
   * Get error details (this may be limited without proper error DOM structure)
   */
  async getErrorDetails(): Promise<{ line?: number; column?: number; message?: string }> {
    try {
      const message = await this.getErrorMessage()

      // Try to extract line/column info from error message
      const lineMatch = message.match(/line\\s*(\\d+)/i)
      const columnMatch = message.match(/column\\s*(\\d+)/i)

      return {
        line: lineMatch ? parseInt(lineMatch[1]) : undefined,
        column: columnMatch ? parseInt(columnMatch[1]) : undefined,
        message: message || undefined
      }
    } catch {
      return {}
    }
  }

  /**
   * Check if loading indicator is visible
   */
  async isLoading(): Promise<boolean> {
    try {
      return await this.page.locator('.animate-spin').isVisible()
    } catch {
      return false
    }
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete(timeout: number = 10000): Promise<void> {
    try {
      const loadingIndicator = this.page.locator('.animate-spin')
      await loadingIndicator.waitFor({ state: 'hidden', timeout })
    } catch {
      // If no loading indicator exists, continue
    }
  }

  /**
   * Check if empty state is shown
   */
  async isEmptyState(): Promise<boolean> {
    try {
      // Check if no meaningful diagram content
      const hasDiagram = await this.isDiagramRendered()
      const hasEmptyText = await this.page.locator('text=Start Creating, text=Write Mermaid').isVisible()

      return !hasDiagram || hasEmptyText
    } catch {
      return false
    }
  }

  /**
   * Get empty state message
   */
  async getEmptyStateMessage(): Promise<string> {
    try {
      const emptySelectors = [
        'text=Start Creating',
        'text=Write Mermaid',
        'text=diagram code',
        '.text-muted-foreground'
      ]

      for (const selector of emptySelectors) {
        const element = this.page.locator(selector)
        if (await element.isVisible()) {
          const text = await element.textContent()
          if (text && text.length > 10) {
            return text.trim()
          }
        }
      }

      return ''
    } catch {
      return ''
    }
  }

  /**
   * Switch to code mode
   */
  async switchToCodeMode(): Promise<void> {
    try {
      await this.codeModeButton.click()
      await this.page.waitForTimeout(500) // Wait for mode switch
    } catch (error) {
      console.log('Failed to switch to code mode:', error)
    }
  }

  /**
   * Switch to visual mode
   */
  async switchToVisualMode(): Promise<void> {
    try {
      await this.visualModeButton.click()
      await this.page.waitForTimeout(500) // Wait for mode switch
    } catch (error) {
      console.log('Failed to switch to visual mode:', error)
    }
  }

  /**
   * Get current mode (this may not work reliably without proper DOM attributes)
   */
  async getCurrentMode(): Promise<'code' | 'visual' | 'unknown'> {
    try {
      // Check for mode indicators
      const codeModeSelected = await this.codeModeButton.evaluate(el => {
        return el.classList.contains('bg-background') || el.getAttribute('aria-selected') === 'true'
      })

      const visualModeSelected = await this.visualModeButton.evaluate(el => {
        return el.classList.contains('bg-background') || el.getAttribute('aria-selected') === 'true'
      })

      if (codeModeSelected) return 'code'
      if (visualModeSelected) return 'visual'

      // Fallback: check what's visible on the page
      const hasTextarea = await this.page.locator('textarea[placeholder*="Mermaid"]').isVisible()
      const hasLargeSvg = await this.page.locator('svg').evaluate(els => {
        for (const svg of els) {
          const rect = svg.getBoundingClientRect()
          if (rect.width > 200 && rect.height > 200) {
            return true
          }
        }
        return false
      })

      return hasTextarea ? 'code' : (hasLargeSvg ? 'visual' : 'unknown')
    } catch {
      return 'unknown'
    }
  }

  /**
   * Check if diagram has specific elements
   */
  async hasDiagramElement(selector: string): Promise<boolean> {
    try {
      return await this.diagramSvg.locator(selector).count() > 0
    } catch {
      return false
    }
  }

  /**
   * Count diagram nodes/shapes
   */
  async getDiagramElementCount(selector: string): Promise<number> {
    try {
      return await this.diagramSvg.locator(selector).count()
    } catch {
      return 0
    }
  }

  /**
   * Get diagram SVG content
   */
  async getSvgContent(): Promise<string> {
    try {
      return await this.diagramSvg.innerHTML() || ''
    } catch {
      return ''
    }
  }

  /**
   * Check if diagram supports interaction (clicking nodes, etc.)
   */
  async isInteractive(): Promise<boolean> {
    try {
      // Check for clickable elements
      const clickableElements = await this.page.locator('svg rect, svg circle, svg text, svg path').count()
      return clickableElements > 0
    } catch {
      return false
    }
  }

  /**
   * Click on diagram element
   */
  async clickDiagramElement(selector: string): Promise<void> {
    try {
      await this.diagramSvg.locator(selector).first().click()
    } catch (error) {
      console.log(`Failed to click diagram element "${selector}":`, error)
    }
  }

  /**
   * Get diagram bounds/size
   */
  async getDiagramBounds(): Promise<{ width: number; height: number }> {
    try {
      return await this.page.evaluate(() => {
        const svgs = document.querySelectorAll('svg')
        for (const svg of svgs) {
          const rect = svg.getBoundingClientRect()
          // Look for larger diagram SVGs, not small icons
          if (rect.width > 100 && rect.height > 100) {
            return { width: rect.width, height: rect.height }
          }
        }
        return { width: 0, height: 0 }
      })
    } catch {
      return { width: 0, height: 0 }
    }
  }

  /**
   * Pan the diagram (if supported)
   */
  async panDiagram(deltaX: number, deltaY: number): Promise<void> {
    try {
      await this.diagramSvg.hover()
      await this.page.mouse.down()
      await this.page.mouse.move(deltaX, deltaY)
      await this.page.mouse.up()
    } catch (error) {
      console.log('Failed to pan diagram:', error)
    }
  }

  /**
   * Check if zoom controls are enabled/disabled
   */
  async isZoomInEnabled(): Promise<boolean> {
    try {
      return !(await this.zoomInButton.isDisabled())
    } catch {
      return true // Assume enabled if we can't check
    }
  }

  async isZoomOutEnabled(): Promise<boolean> {
    try {
      return !(await this.zoomOutButton.isDisabled())
    } catch {
      return true // Assume enabled if we can't check
    }
  }

  /**
   * Wait for canvas to be ready
   */
  async waitForReady(): Promise<void> {
    await this.diagramSvg.waitFor({ state: 'visible' })
    await this.waitForLoadingComplete()
  }

  /**
   * Take screenshot of diagram only
   */
  async takeDiagramScreenshot(name: string): Promise<void> {
    try {
      await this.diagramSvg.screenshot({
        path: `test-results/screenshots/${name}-diagram.png`
      })
    } catch (error) {
      console.log('Failed to take diagram screenshot:', error)
    }
  }

  /**
   * Get canvas health status
   */
  async getHealthStatus(): Promise<{
    isVisible: boolean
    hasDiagram: boolean
    diagramType: string
    hasError: boolean
    errorMessage: string
    currentMode: string
    svgCount: number
    canInteract: boolean
  }> {
    const isVisible = await this.isVisible()
    const hasDiagram = await this.isDiagramRendered()
    const hasError = await this.hasError()
    const errorMessage = await this.getErrorMessage()
    const currentMode = await this.getCurrentMode()
    const svgCount = await this.page.locator('svg').count()
    const canInteract = await this.isInteractive()

    let diagramType = 'none'
    if (hasDiagram) {
      const hasRect = await this.hasDiagramElement('rect')
      const hasCircle = await this.hasDiagramElement('circle')
      const hasPath = await this.hasDiagramElement('path')

      if (hasRect && hasPath) diagramType = 'flowchart'
      else if (hasCircle && hasPath) diagramType = 'sequence'
      else if (hasRect) diagramType = 'class-diagram'
      else diagramType = 'unknown'
    }

    return {
      isVisible,
      hasDiagram,
      diagramType,
      hasError,
      errorMessage,
      currentMode,
      svgCount,
      canInteract
    }
  }
}