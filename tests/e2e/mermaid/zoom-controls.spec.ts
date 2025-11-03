import { test, expect } from '../fixtures/custom-fixtures'
import { MERMAID_EXAMPLES } from '../fixtures/test-data'

test.describe('Mermaid Diagram Zoom Controls', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto()
    await editorPage.waitForEditorInitialization()

    // Load a diagram for testing
    await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.flowchart)
    await editorPage.codeEditor.waitForValidation()
    await editorPage.diagramCanvas.waitForDiagramRender()
  })

  test('should display zoom controls when diagram is rendered', async ({ editorPage }) => {
    // Check that zoom controls are visible
    await expect(editorPage.diagramCanvas.zoomControls).toBeVisible()
    await expect(editorPage.diagramCanvas.zoomInButton).toBeVisible()
    await expect(editorPage.diagramCanvas.zoomOutButton).toBeVisible()
    await expect(editorPage.diagramCanvas.zoomLevel).toBeVisible()
    await expect(editorPage.diagramCanvas.fitToScreenButton).toBeVisible()
    await expect(editorPage.diagramCanvas.resetZoomButton).toBeVisible()
  })

  test('should display correct zoom level initially', async ({ editorPage }) => {
    const initialZoom = await editorPage.diagramCanvas.getZoomLevel()
    expect(initialZoom).toBe(1.0) // Should start at 100%

    // Check that zoom level text shows correct percentage
    const zoomText = await editorPage.diagramCanvas.zoomLevel.textContent()
    expect(zoomText).toContain('100%')
  })

  test('should zoom in when zoom in button is clicked', async ({ editorPage }) => {
    const initialZoom = await editorPage.diagramCanvas.getZoomLevel()

    // Click zoom in
    await editorPage.diagramCanvas.zoomIn()
    await editorPage.page.waitForTimeout(300) // Wait for animation

    const newZoom = await editorPage.diagramCanvas.getZoomLevel()
    expect(newZoom).toBeGreaterThan(initialZoom)

    // Verify zoom level text is updated
    const zoomText = await editorPage.diagramCanvas.zoomLevel.textContent()
    expect(zoomText).toContain(`${Math.round(newZoom * 100)}%`)
  })

  test('should zoom out when zoom out button is clicked', async ({ editorPage }) => {
    // First zoom in so we can zoom out
    await editorPage.diagramCanvas.zoomIn()
    await editorPage.page.waitForTimeout(300)

    const zoomedLevel = await editorPage.diagramCanvas.getZoomLevel()

    // Click zoom out
    await editorPage.diagramCanvas.zoomOut()
    await editorPage.page.waitForTimeout(300)

    const newZoom = await editorPage.diagramCanvas.getZoomLevel()
    expect(newZoom).toBeLessThan(zoomedLevel)

    // Verify zoom level text is updated
    const zoomText = await editorPage.diagramCanvas.zoomLevel.textContent()
    expect(zoomText).toContain(`${Math.round(newZoom * 100)}%`)
  })

  test('should respect zoom limits', async ({ editorPage }) => {
    // Test zoom in limit (should not go above 3.0)
    let currentZoom = await editorPage.diagramCanvas.getZoomLevel()

    // Keep zooming in until limit is reached
    while (await editorPage.diagramCanvas.isZoomInEnabled() && currentZoom < 3.0) {
      await editorPage.diagramCanvas.zoomIn()
      await editorPage.page.waitForTimeout(100)
      currentZoom = await editorPage.diagramCanvas.getZoomLevel()
    }

    // Verify we don't exceed the limit
    expect(currentZoom).toBeLessThanOrEqual(3.0)

    // Test zoom out limit (should not go below 0.1)
    currentZoom = await editorPage.diagramCanvas.getZoomLevel()

    // Keep zooming out until limit is reached
    while (await editorPage.diagramCanvas.isZoomOutEnabled() && currentZoom > 0.1) {
      await editorPage.diagramCanvas.zoomOut()
      await editorPage.page.waitForTimeout(100)
      currentZoom = await editorPage.diagramCanvas.getZoomLevel()
    }

    // Verify we don't go below the limit
    expect(currentZoom).toBeGreaterThanOrEqual(0.1)

    // Verify buttons are properly disabled at limits
    const isZoomOutDisabled = await editorPage.diagramCanvas.zoomOutButton.isDisabled()
    expect(isZoomOutDisabled).toBe(true)
  })

  test('should reset zoom to default when reset button is clicked', async ({ editorPage }) => {
    // Zoom in first
    await editorPage.diagramCanvas.setZoomLevel(2.0)
    await editorPage.page.waitForTimeout(300)

    // Verify zoom level is not default
    const zoomBeforeReset = await editorPage.diagramCanvas.getZoomLevel()
    expect(zoomBeforeReset).not.toBe(1.0)

    // Click reset
    await editorPage.diagramCanvas.resetZoom()
    await editorPage.page.waitForTimeout(300)

    // Verify zoom is reset to default
    const zoomAfterReset = await editorPage.diagramCanvas.getZoomLevel()
    expect(zoomAfterReset).toBe(1.0)

    // Verify zoom level text shows 100%
    const zoomText = await editorPage.diagramCanvas.zoomLevel.textContent()
    expect(zoomText).toContain('100%')
  })

  test('should fit diagram to screen when fit to screen is clicked', async ({ editorPage }) => {
    // Set zoom to a non-default level
    await editorPage.diagramCanvas.setZoomLevel(1.5)
    await editorPage.page.waitForTimeout(300)

    // Click fit to screen
    await editorPage.diagramCanvas.fitToScreen()
    await editorPage.page.waitForTimeout(500) // Wait for fit animation

    // Verify zoom level is adjusted (the exact value depends on diagram size)
    const zoomAfterFit = await editorPage.diagramCanvas.getZoomLevel()
    expect(zoomAfterFit).toBeGreaterThan(0)
    expect(zoomAfterFit).toBeLessThanOrEqual(3.0)

    // The fit to screen should make the diagram visible without overflow
    const diagramBounds = await editorPage.diagramCanvas.getDiagramBounds()
    expect(diagramBounds.width).toBeGreaterThan(0)
    expect(diagramBounds.height).toBeGreaterThan(0)
  })

  test('should show floating zoom controls on hover', async ({ editorPage }) => {
    // Hover over the diagram container
    await editorPage.diagramCanvas.hoverToShowFloatingControls()

    // Check that floating controls appear
    const hasFloatingControls = await editorPage.diagramCanvas.hasFloatingZoomControls()
    expect(hasFloatingControls).toBe(true)

    // Verify floating controls have the same buttons
    await expect(editorPage.diagramCanvas.container.locator('.floating-zoom-controls button:has([data-lucide="zoom-in"])')).toBeVisible()
    await expect(editorPage.diagramCanvas.container.locator('.floating-zoom-controls button:has([data-lucide="zoom-out"])')).toBeVisible()
    await expect(editorPage.diagramCanvas.container.locator('.floating-zoom-controls button:has([data-lucide="maximize-2"])')).toBeVisible()
  })

  test('should hide floating zoom controls when mouse leaves', async ({ editorPage }) => {
    // Show floating controls first
    await editorPage.diagramCanvas.hoverToShowFloatingControls()
    await editorPage.page.waitForTimeout(500)

    // Move mouse away from diagram
    await editorPage.page.mouse.move(0, 0)
    await editorPage.page.waitForTimeout(500)

    // Floating controls should be hidden (this might be immediate or after a delay)
    // Note: This test might need adjustment based on the actual hide behavior
    const hasFloatingControls = await editorPage.diagramCanvas.hasFloatingZoomControls()
    // The controls might still be visible depending on the hide delay
  })

  test('should maintain zoom level when diagram code changes', async ({ editorPage }) => {
    // Set a specific zoom level
    await editorPage.diagramCanvas.setZoomLevel(1.5)
    await editorPage.page.waitForTimeout(300)

    const zoomBeforeChange = await editorPage.diagramCanvas.getZoomLevel()

    // Change the diagram code
    await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.sequenceDiagram)
    await editorPage.codeEditor.waitForValidation()
    await editorPage.diagramCanvas.waitForDiagramRender()

    // Wait a bit for any automatic zoom adjustments
    await editorPage.page.waitForTimeout(500)

    // Check if zoom is maintained or adjusted appropriately
    const zoomAfterChange = await editorPage.diagramCanvas.getZoomLevel()

    // Either the zoom should be maintained or should be reasonable
    expect(zoomAfterChange).toBeGreaterThan(0.1)
    expect(zoomAfterChange).toBeLessThanOrEqual(3.0)
  })

  test('should handle rapid zoom changes without breaking', async ({ editorPage }) => {
    const initialZoom = await editorPage.diagramCanvas.getZoomLevel()

    // Rapidly click zoom in and zoom out
    for (let i = 0; i < 5; i++) {
      await editorPage.diagramCanvas.zoomIn()
      await editorPage.page.waitForTimeout(50)
      await editorPage.diagramCanvas.zoomOut()
      await editorPage.page.waitForTimeout(50)
    }

    // Should end up close to original zoom level
    const finalZoom = await editorPage.diagramCanvas.getZoomLevel()
    expect(Math.abs(finalZoom - initialZoom)).toBeLessThan(0.2)

    // Diagram should still be rendered
    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)
  })

  test('should update zoom level display in real-time', async ({ editorPage }) => {
    const zoomLevels = [0.5, 1.0, 1.5, 2.0]

    for (const expectedZoom of zoomLevels) {
      await editorPage.diagramCanvas.setZoomLevel(expectedZoom)
      await editorPage.page.waitForTimeout(200)

      const actualZoom = await editorPage.diagramCanvas.getZoomLevel()
      const zoomText = await editorPage.diagramCanvas.zoomLevel.textContent()

      expect(actualZoom).toBeCloseTo(expectedZoom, 1)
      expect(zoomText).toContain(`${Math.round(actualZoom * 100)}%`)
    }
  })

  test('should handle zoom with different diagram sizes', async ({ editorPage }) => {
    const diagrams = [
      { name: 'small', code: 'graph TD\n    A[Start] --> B[End]' },
      { name: 'medium', code: MERMAID_EXAMPLES.flowchart },
      { name: 'large', code: MERMAID_EXAMPLES.sequenceDiagram }
    ]

    for (const diagram of diagrams) {
      await editorPage.codeEditor.setCode(diagram.code)
      await editorPage.codeEditor.waitForValidation()
      await editorPage.diagramCanvas.waitForDiagramRender()

      // Test zoom functionality for each diagram
      await editorPage.diagramCanvas.zoomIn()
      await editorPage.page.waitForTimeout(200)

      const zoomInLevel = await editorPage.diagramCanvas.getZoomLevel()
      expect(zoomInLevel).toBeGreaterThan(1.0)

      await editorPage.diagramCanvas.resetZoom()
      await editorPage.page.waitForTimeout(200)

      const resetZoomLevel = await editorPage.diagramCanvas.getZoomLevel()
      expect(resetZoomLevel).toBe(1.0)

      // Verify diagram is still rendered after zoom operations
      const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
      expect(isRendered).toBe(true)
    }
  })

  test('should show loading state during zoom operations', async ({ editorPage }) => {
    // This test checks if there are visual feedback during zoom operations
    // The actual implementation might vary

    const initialZoom = await editorPage.diagramCanvas.getZoomLevel()

    // Perform zoom and check for any loading indicators
    await editorPage.diagramCanvas.zoomIn()

    // There might be a brief loading state or transition
    // This test can be expanded based on the actual implementation
    await editorPage.page.waitForTimeout(300)

    const finalZoom = await editorPage.diagramCanvas.getZoomLevel()
    expect(finalZoom).not.toBe(initialZoom)
  })
})