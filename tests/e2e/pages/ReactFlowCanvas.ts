import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class ReactFlowCanvas extends BasePage {
  // Locators
  readonly container: Locator
  readonly header: Locator
  readonly title: Locator
  readonly modeToggle: Locator
  readonly codeModeButton: Locator
  readonly visualModeButton: Locator
  readonly exportButton: Locator
  readonly clearButton: Locator
  readonly nodePalette: Locator
  readonly nodeButtons: Locator
  readonly reactFlowWrapper: Locator
  readonly reactFlowCanvas: Locator
  readonly background: Locator
  readonly controls: Locator
  readonly minimap: Locator
  readonly nodes: Locator
  readonly edges: Locator
  readonly panel: Locator
  readonly tipsPanel: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.locator('[data-testid="react-flow-canvas"], .react-flow-canvas')
    this.header = page.locator('[data-testid="react-flow-header"], .react-flow-header')
    this.title = page.locator('[data-testid="react-flow-title"] h3, .react-flow-canvas h3')
    this.modeToggle = page.locator('[data-testid="react-flow-mode-toggle"], .react-flow-mode-toggle')
    this.codeModeButton = page.locator('[data-testid="code-mode"], button:has-text("Code")')
    this.visualModeButton = page.locator('[data-testid="visual-mode"], button:has-text("Visual")')
    this.exportButton = page.locator('button:has-text("Export"), [data-testid="export-button"]')
    this.clearButton = page.locator('button:has-text("Clear"), [data-testid="clear-button"]')
    this.nodePalette = page.locator('[data-testid="node-palette"], .node-palette')
    this.nodeButtons = page.locator('[data-testid="node-button"], .node-palette button')
    this.reactFlowWrapper = page.locator('[data-testid="react-flow-wrapper"], .react-flow-wrapper')
    this.reactFlowCanvas = page.locator('.react-flow')
    this.background = page.locator('.react-flow__background')
    this.controls = page.locator('.react-flow__controls')
    this.minimap = page.locator('.react-flow__minimap')
    this.nodes = page.locator('.react-flow__node')
    this.edges = page.locator('.react-flow__edge')
    this.panel = page.locator('.react-flow__panel')
    this.tipsPanel = page.locator('[data-testid="tips-panel"], .react-flow__panel:has-text("Tips")')
  }

  /**
   * Check if React Flow canvas is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible()
  }

  /**
   * Wait for React Flow to initialize
   */
  async waitForInitialization(): Promise<void> {
    await this.container.waitFor({ state: 'visible' })
    await this.reactFlowCanvas.waitFor({ state: 'visible' })
    await this.background.waitFor({ state: 'visible' })
  }

  /**
   * Get available node types from palette
   */
  async getAvailableNodeTypes(): Promise<string[]> {
    const types = await this.nodeButtons.allInnerTexts()
    return types.map(text => text.trim().toLowerCase())
  }

  /**
   * Add a node by clicking the palette button
   */
  async addNodeByClick(nodeType: string): Promise<void> {
    const button = this.nodeButtons.filter({ hasText: nodeType }).first()
    await button.click()
  }

  /**
   * Add a node by drag and drop
   */
  async addNodeByDragAndDrop(nodeType: string, targetX: number = 400, targetY: number = 300): Promise<void> {
    const sourceButton = this.nodeButtons.filter({ hasText: nodeType }).first()

    // Start drag
    await sourceButton.hover()
    await this.page.mouse.down()

    // Move to target position
    await this.page.mouse.move(targetX, targetY)

    // Drop
    await this.page.mouse.up()
  }

  /**
   * Get current number of nodes
   */
  async getNodeCount(): Promise<number> {
    return await this.nodes.count()
  }

  /**
   * Get current number of edges
   */
  async getEdgeCount(): Promise<number> {
    return await this.edges.count()
  }

  /**
   * Get all node data
   */
  async getNodesData(): Promise<Array<{ id: string; type: string; label: string; position: { x: number; y: number } }>> {
    return await this.page.evaluate(() => {
      const nodeElements = document.querySelectorAll('.react-flow__node')
      return Array.from(nodeElements).map(node => {
        const transform = node.getAttribute('data-transform') || 'translate(0, 0)'
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/)
        const x = match ? parseFloat(match[1]) : 0
        const y = match ? parseFloat(match[2]) : 0

        const labelElement = node.querySelector('div')
        const label = labelElement ? labelElement.textContent || '' : ''

        return {
          id: node.getAttribute('data-id') || '',
          type: node.getAttribute('data-type') || 'default',
          label,
          position: { x, y }
        }
      })
    })
  }

  /**
   * Select a node by its label or index
   */
  async selectNode(selector: string | number): Promise<void> {
    let nodeLocator: Locator

    if (typeof selector === 'number') {
      nodeLocator = this.nodes.nth(selector)
    } else {
      nodeLocator = this.nodes.filter({ hasText: selector }).first()
    }

    await nodeLocator.click()
  }

  /**
   * Drag a node to a new position
   */
  async dragNode(selector: string | number, targetX: number, targetY: number): Promise<void> {
    let nodeLocator: Locator

    if (typeof selector === 'number') {
      nodeLocator = this.nodes.nth(selector)
    } else {
      nodeLocator = this.nodes.filter({ hasText: selector }).first()
    }

    await nodeLocator.hover()
    await this.page.mouse.down()
    await this.page.mouse.move(targetX, targetY)
    await this.page.mouse.up()
  }

  /**
   * Connect two nodes by dragging from source to target
   */
  async connectNodes(sourceNode: string | number, targetNode: string | number): Promise<void> {
    let sourceLocator: Locator
    let targetLocator: Locator

    if (typeof sourceNode === 'number') {
      sourceLocator = this.nodes.nth(sourceNode)
    } else {
      sourceLocator = this.nodes.filter({ hasText: sourceNode }).first()
    }

    if (typeof targetNode === 'number') {
      targetLocator = this.nodes.nth(targetNode)
    } else {
      targetLocator = this.nodes.filter({ hasText: targetNode }).first()
    }

    // Hover over source node to show handles
    await sourceLocator.hover()

    // Look for connection handle (typically appears on hover)
    const handle = sourceLocator.locator('.react-flow__handle').first()
    if (await handle.isVisible()) {
      await handle.hover()
      await this.page.mouse.down()
      await targetLocator.hover()
      await this.page.mouse.up()
    }
  }

  /**
   * Delete a selected node
   */
  async deleteSelectedNode(): Promise<void> {
    await this.page.keyboard.press('Delete')
  }

  /**
   * Delete all nodes
   */
  async clearAll(): Promise<void> {
    await this.clearButton.click()
    // Confirm if there's a confirmation dialog
    if (await this.isVisible('.dialog, .modal, [role="dialog"]')) {
      await this.page.locator('button:has-text("Confirm"), button:has-text("Yes")').click()
    }
  }

  /**
   * Check if minimap is visible
   */
  async hasMinimap(): Promise<boolean> {
    return await this.minimap.isVisible()
  }

  /**
   * Check if controls are visible
   */
  async hasControls(): Promise<boolean> {
    return await this.controls.isVisible()
  }

  /**
   * Zoom in using React Flow controls
   */
  async zoomIn(): Promise<void> {
    await this.controls.locator('button:has([data-lucide="zoom-in"])').click()
  }

  /**
   * Zoom out using React Flow controls
   */
  async zoomOut(): Promise<void> {
    await this.controls.locator('button:has([data-lucide="zoom-out"])').click()
  }

  /**
   * Fit view to show all nodes
   */
  async fitView(): Promise<void> {
    await this.controls.locator('button:has([data-lucide="maximize-2"])').click()
  }

  /**
   * Switch to code mode (export)
   */
  async switchToCodeMode(): Promise<void> {
    await this.codeModeButton.click()
  }

  /**
   * Export current diagram to code
   */
  async exportToCode(): Promise<void> {
    await this.exportButton.click()
  }

  /**
   * Check if tips panel is visible
   */
  async hasTipsPanel(): Promise<boolean> {
    return await this.tipsPanel.isVisible()
  }

  /**
   * Get tips content
   */
  async getTipsContent(): Promise<string[]> {
    const tips = await this.tipsPanel.locator('div').allInnerTexts()
    return tips.map(tip => tip.trim())
  }

  /**
   * Pan the canvas
   */
  async panCanvas(deltaX: number, deltaY: number): Promise<void> {
    await this.reactFlowCanvas.hover()
    await this.page.mouse.down()
    await this.page.mouse.move(deltaX, deltaY)
    await this.page.mouse.up()
  }

  /**
   * Get canvas transform (zoom and pan)
   */
  async getCanvasTransform(): Promise<{ x: number; y: number; zoom: number }> {
    return await this.page.evaluate(() => {
      const viewportElement = document.querySelector('.react-flow__viewport')
      if (!viewportElement) return { x: 0, y: 0, zoom: 1 }

      const transform = viewportElement.getAttribute('transform') || ''
      const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)\s*scale\(([^)]+)\)/)

      if (match) {
        return {
          x: parseFloat(match[1]),
          y: parseFloat(match[2]),
          zoom: parseFloat(match[3])
        }
      }

      return { x: 0, y: 0, zoom: 1 }
    })
  }

  /**
   * Check if canvas has specific background pattern
   */
  async hasBackgroundPattern(): Promise<boolean> {
    return await this.background.isVisible()
  }

  /**
   * Double-click a node to edit it
   */
  async editNode(selector: string | number, newLabel: string): Promise<void> {
    let nodeLocator: Locator

    if (typeof selector === 'number') {
      nodeLocator = this.nodes.nth(selector)
    } else {
      nodeLocator = this.nodes.filter({ hasText: selector }).first()
    }

    await nodeLocator.dblclick()

    // Look for input field that appears
    const input = nodeLocator.locator('input, [contenteditable="true"]')
    if (await input.isVisible()) {
      await input.fill(newLabel)
      await this.page.keyboard.press('Enter')
    }
  }

  /**
   * Take screenshot of the canvas
   */
  async takeCanvasScreenshot(name: string): Promise<void> {
    await this.reactFlowWrapper.screenshot({
      path: `test-results/screenshots/${name}-react-flow.png`
    })
  }

  /**
   * Wait for canvas to be ready
   */
  async waitForReady(): Promise<void> {
    await this.waitForInitialization()
    await this.page.waitForTimeout(1000) // Allow React Flow to fully initialize
  }
}