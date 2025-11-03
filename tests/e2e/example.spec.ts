import { test, expect } from '../fixtures/custom-fixtures'
import { MERMAID_EXAMPLES } from '../fixtures/test-data'

test('Example test - demonstrates test structure', async ({ editorPage }) => {
  await editorPage.goto()
  await editorPage.waitForEditorInitialization()

  // Load a simple diagram
  await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.flowchart)

  // Wait for validation
  await editorPage.codeEditor.waitForValidation()

  // Verify it's valid
  const status = await editorPage.codeEditor.getValidationStatus()
  expect(status).toBe('valid')

  // Verify diagram renders
  const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
  expect(isRendered).toBe(true)

  // Test zoom
  await editorPage.diagramCanvas.zoomIn()
  const zoomLevel = await editorPage.diagramCanvas.getZoomLevel()
  expect(zoomLevel).toBeGreaterThan(1.0)

  // Test mode switching
  await editorPage.switchToVisualMode()
  const currentMode = await editorPage.getCurrentMode()
  expect(currentMode).toBe('visual')
})
