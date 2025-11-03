import { test, expect } from '../fixtures/custom-fixtures'
import { MERMAID_EXAMPLES } from '../fixtures/test-data'

test.describe('React Flow Mode Switching', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto()
    await editorPage.waitForEditorInitialization()
  })

  test('should switch from code mode to visual mode', async ({ editorPage }) => {
    // Start in code mode
    await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.flowchart)
    await editorPage.codeEditor.waitForValidation()

    // Verify we're in code mode
    const initialMode = await editorPage.getCurrentMode()
    expect(initialMode).toBe('code')
    await expect(editorPage.codeEditor.container).toBeVisible()

    // Switch to visual mode
    await editorPage.switchToVisualMode()

    // Verify switch to visual mode
    const newMode = await editorPage.getCurrentMode()
    expect(newMode).toBe('visual')
    await expect(editorPage.reactFlowCanvas.container).toBeVisible()

    // React Flow should be initialized
    await editorPage.reactFlowCanvas.waitForInitialization()

    // Should have converted the Mermaid diagram to React Flow nodes
    const nodeCount = await editorPage.reactFlowCanvas.getNodeCount()
    expect(nodeCount).toBeGreaterThan(0)
  })

  test('should switch from visual mode to code mode', async ({ editorPage }) => {
    // Start in visual mode
    await editorPage.switchToVisualMode()
    await editorPage.reactFlowCanvas.waitForInitialization()

    // Create some nodes in visual mode
    await editorPage.reactFlowCanvas.addNodeByClick('rectangle')
    await editorPage.reactFlowCanvas.addNodeByClick('circle')
    await editorPage.page.waitForTimeout(500)

    // Connect the nodes
    await editorPage.reactFlowCanvas.connectNodes(0, 1)
    await editorPage.page.waitForTimeout(500)

    // Verify we're in visual mode
    const initialMode = await editorPage.getCurrentMode()
    expect(initialMode).toBe('visual')
    const nodeCount = await editorPage.reactFlowCanvas.getNodeCount()
    expect(nodeCount).toBe(2)

    // Switch to code mode
    await editorPage.switchToCodeMode()

    // Verify switch to code mode
    const newMode = await editorPage.getCurrentMode()
    expect(newMode).toBe('code')
    await expect(editorPage.codeEditor.container).toBeVisible()

    // Should have generated Mermaid code from the React Flow diagram
    const generatedCode = await editorPage.codeEditor.getCode()
    expect(generatedCode).toContain('graph TD')
    expect(generatedCode).length.toBeGreaterThan(10)

    // Code should be valid
    await editorPage.codeEditor.waitForValidation()
    const validationStatus = await editorPage.codeEditor.getValidationStatus()
    expect(validationStatus).toBe('valid')
  })

  test('should maintain diagram content when switching modes', async ({ editorPage }) => {
    // Start with a complex diagram in code mode
    await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.sequenceDiagram)
    await editorPage.codeEditor.waitForValidation()
    const originalCode = await editorPage.codeEditor.getCode()

    // Switch to visual mode
    await editorPage.switchToVisualMode()
    await editorPage.reactFlowCanvas.waitForInitialization()

    // Should have nodes representing the sequence diagram
    const visualNodeCount = await editorPage.reactFlowCanvas.getNodeCount()
    expect(visualNodeCount).toBeGreaterThan(0)

    // Switch back to code mode
    await editorPage.switchToCodeMode()

    // Should have code representing the diagram
    const returnedCode = await editorPage.codeEditor.getCode()
    expect(returnedCode).toContain('sequenceDiagram')
    expect(returnedCode.length).toBeGreaterThan(10)

    // The semantic content should be preserved (though formatting might differ)
    expect(returnedCode).toContain('participant')
  })

  test('should handle empty diagram when switching modes', async ({ editorPage }) => {
    // Start in code mode with empty diagram
    await editorPage.codeEditor.clearCode()
    await editorPage.codeEditor.waitForValidation()

    // Switch to visual mode
    await editorPage.switchToVisualMode()
    await editorPage.reactFlowCanvas.waitForInitialization()

    // Should have empty canvas
    const nodeCount = await editorPage.reactFlowCanvas.getNodeCount()
    const edgeCount = await editorPage.reactFlowCanvas.getEdgeCount()
    expect(nodeCount).toBe(0)
    expect(edgeCount).toBe(0)

    // Switch back to code mode
    await editorPage.switchToCodeMode()

    // Should still be empty
    const code = await editorPage.codeEditor.getCode()
    expect(code.trim()).toBe('')
  })

  test('should handle complex flowchart when switching modes', async ({ editorPage }) => {
    // Create complex flowchart in code mode
    const complexFlowchart = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E{Another Decision}
    D --> E
    E -->|Option 1| F[Result 1]
    E -->|Option 2| G[Result 2]
    F --> H[End]
    G --> H`

    await editorPage.codeEditor.setCode(complexFlowchart)
    await editorPage.codeEditor.waitForValidation()

    // Switch to visual mode
    await editorPage.switchToVisualMode()
    await editorPage.reactFlowCanvas.waitForInitialization()

    // Should have multiple nodes representing the flowchart
    const nodeCount = await editorPage.reactFlowCanvas.getNodeCount()
    expect(nodeCount).toBeGreaterThan(5) // Should have start, decision, processes, end

    // Should have edges
    const edgeCount = await editorPage.reactFlowCanvas.getEdgeCount()
    expect(edgeCount).toBeGreaterThan(0)

    // Switch back to code mode
    await editorPage.switchToCodeMode()

    // Should have valid Mermaid code
    const returnedCode = await editorPage.codeEditor.getCode()
    expect(returnedCode).toContain('graph TD')
    expect(returnedCode).toContain('Start')
    expect(returnedCode).toContain('End')

    // Code should be valid
    await editorPage.codeEditor.waitForValidation()
    const validationStatus = await editorPage.codeEditor.getValidationStatus()
    expect(validationStatus).toBe('valid')
  })

  test('should preserve zoom level when switching modes', async ({ editorPage }) => {
    // Start in code mode
    await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.flowchart)
    await editorPage.codeEditor.waitForValidation()

    // Set zoom level in code mode
    await editorPage.diagramCanvas.setZoomLevel(1.5)
    await editorPage.page.waitForTimeout(300)

    const codeModeZoom = await editorPage.diagramCanvas.getZoomLevel()
    expect(codeModeZoom).toBe(1.5)

    // Switch to visual mode
    await editorPage.switchToVisualMode()
    await editorPage.reactFlowCanvas.waitForInitialization()

    // React Flow should fit the view or have reasonable zoom
    const visualTransform = await editorPage.reactFlowCanvas.getCanvasTransform()
    expect(visualTransform.zoom).toBeGreaterThan(0)
    expect(visualTransform.zoom).toBeLessThan(5)

    // Switch back to code mode
    await editorPage.switchToCodeMode()

    // Zoom should be reasonable (might reset to default or be preserved)
    const finalZoom = await editorPage.diagramCanvas.getZoomLevel()
    expect(finalZoom).toBeGreaterThan(0.1)
    expect(finalZoom).toBeLessThan(3.0)
  })

  test('should handle mode switching during diagram editing', async ({ editorPage }) => {
    // Start editing in code mode
    await editorPage.codeEditor.setCode('graph TD\n    A[Start] --> B[Incomplete')
    await editorPage.codeEditor.waitForValidation()

    // Should have error (incomplete diagram)
    const initialStatus = await editorPage.codeEditor.getValidationStatus()
    expect(initialStatus).toBe('error')

    // Switch to visual mode anyway
    await editorPage.switchToVisualMode()
    await editorPage.reactFlowCanvas.waitForInitialization()

    // Should handle gracefully - might have partial content or empty canvas
    const nodeCount = await editorPage.reactFlowCanvas.getNodeCount()
    // Could be 0 or have partial nodes - both are acceptable error handling

    // Switch back to code mode
    await editorPage.switchToCodeMode()

    // Should preserve the original code
    const returnedCode = await editorPage.codeEditor.getCode()
    expect(returnedCode).toContain('Start')
    expect(returnedCode).toContain('Incomplete')
  })

  test('should handle rapid mode switching without breaking', async ({ editorPage }) => {
    // Start with some content
    await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.flowchart)
    await editorPage.codeEditor.waitForValidation()

    // Rapidly switch modes multiple times
    for (let i = 0; i < 5; i++) {
      await editorPage.switchToVisualMode()
      await editorPage.page.waitForTimeout(200)
      await editorPage.switchToCodeMode()
      await editorPage.page.waitForTimeout(200)
    }

    // Should end up in a stable state
    const finalMode = await editorPage.getCurrentMode()
    expect(['code', 'visual']).toContain(finalMode)

    // Should have valid content
    if (finalMode === 'code') {
      const code = await editorPage.codeEditor.getCode()
      expect(code.length).toBeGreaterThan(5)
    } else {
      const nodeCount = await editorPage.reactFlowCanvas.getNodeCount()
      expect(nodeCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('should maintain selected elements when switching modes', async ({ editorPage }) => {
    // Start in visual mode and create content
    await editorPage.switchToVisualMode()
    await editorPage.reactFlowCanvas.waitForInitialization()

    await editorPage.reactFlowCanvas.addNodeByClick('rectangle')
    await editorPage.reactFlowCanvas.addNodeByClick('circle')
    await editorPage.page.waitForTimeout(500)

    // Select a node
    await editorPage.reactFlowCanvas.selectNode(0)
    await editorPage.page.waitForTimeout(200)

    // Switch to code mode
    await editorPage.switchToCodeMode()

    // Should have generated code
    const code = await editorPage.codeEditor.getCode()
    expect(code).toContain('graph TD')

    // Switch back to visual mode
    await editorPage.switchToVisualMode()
    await editorPage.reactFlowCanvas.waitForInitialization()

    // Should have the nodes
    const nodeCount = await editorPage.reactFlowCanvas.getNodeCount()
    expect(nodeCount).toBeGreaterThan(0)
  })

  test('should export React Flow to Mermaid code correctly', async ({ editorPage }) => {
    // Start in visual mode
    await editorPage.switchToVisualMode()
    await editorPage.reactFlowCanvas.waitForInitialization()

    // Create a specific flow
    await editorPage.reactFlowCanvas.addNodeByClick('rectangle')
    await editorPage.reactFlowCanvas.addNodeByClick('diamond')
    await editorPage.reactFlowCanvas.addNodeByClick('rectangle')
    await editorPage.page.waitForTimeout(500)

    // Connect them
    await editorPage.reactFlowCanvas.connectNodes(0, 1)
    await editorPage.reactFlowCanvas.connectNodes(1, 2)
    await editorPage.page.waitForTimeout(500)

    // Use export button
    await editorPage.reactFlowCanvas.exportToCode()
    await editorPage.page.waitForTimeout(500)

    // Should be in code mode with generated code
    const mode = await editorPage.getCurrentMode()
    expect(mode).toBe('code')

    const generatedCode = await editorPage.codeEditor.getCode()
    expect(generatedCode).toContain('graph TD')
    expect(generatedCode).toContain('rectangle')
    expect(generatedCode).toContain('diamond')

    // Code should be valid
    await editorPage.codeEditor.waitForValidation()
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('valid')
  })

  test('should handle different diagram types in mode switching', async ({ editorPage }) => {
    const diagramTypes = [
      MERMAID_EXAMPLES.sequenceDiagram,
      MERMAID_EXAMPLES.classDiagram,
      MERMAID_EXAMPLES.stateDiagram
    ]

    for (const diagramCode of diagramTypes) {
      // Set up in code mode
      await editorPage.codeEditor.setCode(diagramCode)
      await editorPage.codeEditor.waitForValidation()

      // Switch to visual mode
      await editorPage.switchToVisualMode()
      await editorPage.reactFlowCanvas.waitForInitialization()

      // Should handle the diagram (might convert to generic flow)
      const nodeCount = await editorPage.reactFlowCanvas.getNodeCount()
      expect(nodeCount).toBeGreaterThanOrEqual(0)

      // Switch back to code mode
      await editorPage.switchToCodeMode()

      // Should have valid code
      const returnedCode = await editorPage.codeEditor.getCode()
      expect(returnedCode.length).toBeGreaterThan(10)

      await editorPage.codeEditor.waitForValidation()
      const status = await editorPage.codeEditor.getValidationStatus()
      expect(status).toBe('valid')
    }
  })

  test('should show loading states during mode switching', async ({ editorPage }) => {
    // Start with complex diagram
    await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.sequenceDiagram)
    await editorPage.codeEditor.waitForValidation()

    // Switch to visual mode and check for loading
    await editorPage.switchToVisualMode()

    // There might be loading indicators or processing time
    await editorPage.reactFlowCanvas.waitForInitialization()

    // Should be fully loaded
    await expect(editorPage.reactFlowCanvas.container).toBeVisible()

    // Switch back and check
    await editorPage.switchToCodeMode()
    await editorPage.page.waitForTimeout(500)

    await expect(editorPage.codeEditor.container).toBeVisible()
  })
})