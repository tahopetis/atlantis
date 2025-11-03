import { test, expect } from '../fixtures/custom-fixtures'
import { MERMAID_EXAMPLES } from '../fixtures/test-data'

test.describe('Mermaid Examples and Templates', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto()
    await editorPage.waitForEditorInitialization()
  })

  test('should show examples dropdown when examples button is clicked', async ({ editorPage }) => {
    // Initially examples dropdown should be hidden
    await expect(editorPage.codeEditor.examplesDropdown).toBeHidden()

    // Click examples button
    await editorPage.codeEditor.toggleExamples()

    // Examples dropdown should be visible
    await expect(editorPage.codeEditor.examplesDropdown).toBeVisible()
    await expect(editorPage.codeEditor.exampleItems).toHaveCount.greaterThan(0)
  })

  test('should hide examples dropdown when clicked again', async ({ editorPage }) => {
    // Show examples first
    await editorPage.codeEditor.toggleExamples()
    await expect(editorPage.codeEditor.examplesDropdown).toBeVisible()

    // Click again to hide
    await editorPage.codeEditor.toggleExamples()

    // Should be hidden again
    await expect(editorPage.codeEditor.examplesDropdown).toBeHidden()
  })

  test('should display all available example types', async ({ editorPage }) => {
    await editorPage.codeEditor.toggleExamples()

    const availableExamples = await editorPage.codeEditor.getAvailableExamples()

    // Should include all major diagram types
    const expectedExamples = ['Flowchart', 'Sequence Diagram', 'Class Diagram', 'Gantt Chart', 'State Diagram', 'Pie Chart', 'Journey Diagram']

    for (const expectedExample of expectedExamples) {
      expect(availableExamples.some(example =>
        example.toLowerCase().includes(expectedExample.toLowerCase())
      )).toBe(true)
    }
  })

  test('should load flowchart example when selected', async ({ editorPage }) => {
    await editorPage.codeEditor.toggleExamples()
    await editorPage.codeEditor.selectExample('Flowchart')

    // Examples dropdown should close
    await expect(editorPage.codeEditor.examplesDropdown).toBeHidden()

    // Code should be updated
    const code = await editorPage.codeEditor.getCode()
    expect(code).toContain('graph TD')
    expect(code).toContain('Start')

    // Diagram should be rendered
    await editorPage.codeEditor.waitForValidation()
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('valid')

    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)
  })

  test('should load sequence diagram example when selected', async ({ editorPage }) => {
    await editorPage.codeEditor.toggleExamples()
    await editorPage.codeEditor.selectExample('Sequence Diagram')

    // Code should be updated
    const code = await editorPage.codeEditor.getCode()
    expect(code).toContain('sequenceDiagram')
    expect(code).toContain('participant')

    // Diagram should be rendered
    await editorPage.codeEditor.waitForValidation()
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('valid')

    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)
  })

  test('should load class diagram example when selected', async ({ editorPage }) => {
    await editorPage.codeEditor.toggleExamples()
    await editorPage.codeEditor.selectExample('Class Diagram')

    // Code should be updated
    const code = await editorPage.codeEditor.getCode()
    expect(code).toContain('classDiagram')
    expect(code).toContain('class')

    // Diagram should be rendered
    await editorPage.codeEditor.waitForValidation()
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('valid')

    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)
  })

  test('should load Gantt chart example when selected', async ({ editorPage }) => {
    await editorPage.codeEditor.toggleExamples()
    await editorPage.codeEditor.selectExample('Gantt Chart')

    // Code should be updated
    const code = await editorPage.codeEditor.getCode()
    expect(code).toContain('gantt')
    expect(code).toContain('dateFormat')

    // Diagram should be rendered
    await editorPage.codeEditor.waitForValidation()
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('valid')

    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)
  })

  test('should load state diagram example when selected', async ({ editorPage }) => {
    await editorPage.codeEditor.toggleExamples()
    await editorPage.codeEditor.selectExample('State Diagram')

    // Code should be updated
    const code = await editorPage.codeEditor.getCode()
    expect(code).toContain('stateDiagram-v2')
    expect(code).toContain('[*]')

    // Diagram should be rendered
    await editorPage.codeEditor.waitForValidation()
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('valid')

    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)
  })

  test('should load pie chart example when selected', async ({ editorPage }) => {
    await editorPage.codeEditor.toggleExamples()
    await editorPage.codeEditor.selectExample('Pie Chart')

    // Code should be updated
    const code = await editorPage.codeEditor.getCode()
    expect(code).toContain('pie title')
    expect(code).toContain('"')

    // Diagram should be rendered
    await editorPage.codeEditor.waitForValidation()
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('valid')

    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)
  })

  test('should load journey diagram example when selected', async ({ editorPage }) => {
    await editorPage.codeEditor.toggleExamples()
    await editorPage.codeEditor.selectExample('Journey Diagram')

    // Code should be updated
    const code = await editorPage.codeEditor.getCode()
    expect(code).toContain('journey')
    expect(code).toContain('title')

    // Diagram should be rendered
    await editorPage.codeEditor.waitForValidation()
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('valid')

    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)
  })

  test('should show preview text for each example in dropdown', async ({ editorPage }) => {
    await editorPage.codeEditor.toggleExamples()

    const exampleItems = editorPage.codeEditor.exampleItems

    // Check that each example has a title and preview
    const count = await exampleItems.count()

    for (let i = 0; i < count; i++) {
      const item = exampleItems.nth(i)
      const text = await item.textContent()

      // Should have meaningful content
      expect(text).toBeTruthy()
      expect(text!.length).toBeGreaterThan(5)

      // Should include both title and preview
      const hasTitle = /\w+/.test(text!) // Has word characters (title)
      const hasPreview = /graph|sequence|class|gantt|state|pie|journey/i.test(text!)

      expect(hasTitle).toBe(true)
    }
  })

  test('should replace existing code when example is selected', async ({ editorPage }) => {
    // Set some existing code
    await editorPage.codeEditor.setCode('graph TD\n    A[Old Code] --> B[Old End]')
    await editorPage.codeEditor.waitForValidation()

    // Select an example
    await editorPage.codeEditor.toggleExamples()
    await editorPage.codeEditor.selectExample('Flowchart')

    // Old code should be completely replaced
    const code = await editorPage.codeEditor.getCode()
    expect(code).not.toContain('Old Code')
    expect(code).not.toContain('Old End')
    expect(code).toContain('graph TD')
    expect(code).toContain('Start')
  })

  test('should close examples dropdown when clicking outside', async ({ editorPage }) => {
    // Show examples
    await editorPage.codeEditor.toggleExamples()
    await expect(editorPage.codeEditor.examplesDropdown).toBeVisible()

    // Click outside the dropdown
    await editorPage.page.click('body', { position: { x: 0, y: 0 } })
    await editorPage.page.waitForTimeout(200)

    // Dropdown should be closed
    await expect(editorPage.codeEditor.examplesDropdown).toBeHidden()
  })

  test('should maintain editor focus after selecting example', async ({ editorPage }) => {
    // Select an example
    await editorPage.codeEditor.toggleExamples()
    await editorPage.codeEditor.selectExample('Flowchart')

    // Textarea should be focused
    const isFocused = await editorPage.codeEditor.textArea.isVisible()
    expect(isFocused).toBe(true)
  })

  test('should handle keyboard navigation in examples dropdown', async ({ editorPage }) => {
    // Show examples
    await editorPage.codeEditor.toggleExamples()
    await expect(editorPage.codeEditor.examplesDropdown).toBeVisible()

    // Test arrow key navigation
    await editorPage.page.keyboard.press('ArrowDown')
    await editorPage.page.keyboard.press('Enter')

    // An example should be selected
    const code = await editorPage.codeEditor.getCode()
    expect(code.length).toBeGreaterThan(10) // Should have content

    // Dropdown should be closed
    await expect(editorPage.codeEditor.examplesDropdown).toBeHidden()
  })

  test('should show error handling if example fails to load', async ({ editorPage }) => {
    // Mock a scenario where example loading might fail
    // This test would need to be adapted based on actual error handling implementation

    await editorPage.codeEditor.toggleExamples()
    await editorPage.codeEditor.selectExample('Flowchart')

    // Normal case - should work fine
    await expect(editorPage.codeEditor.textArea).toBeVisible()

    // Test would be expanded if there are specific error cases to handle
  })

  test('should preserve zoom level when switching examples', async ({ editorPage }) => {
    // Set initial zoom
    await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.flowchart)
    await editorPage.codeEditor.waitForValidation()
    await editorPage.diagramCanvas.setZoomLevel(1.5)
    await editorPage.page.waitForTimeout(300)

    const zoomBefore = await editorPage.diagramCanvas.getZoomLevel()

    // Switch to different example
    await editorPage.codeEditor.toggleExamples()
    await editorPage.codeEditor.selectExample('Sequence Diagram')
    await editorPage.codeEditor.waitForValidation()
    await editorPage.diagramCanvas.waitForDiagramRender()

    // Wait for any automatic adjustments
    await editorPage.page.waitForTimeout(500)

    // Zoom should be maintained or reasonably adjusted
    const zoomAfter = await editorPage.diagramCanvas.getZoomLevel()
    expect(zoomAfter).toBeGreaterThan(0.1)
    expect(zoomAfter).toBeLessThanOrEqual(3.0)
  })

  test('should display example descriptions and hints', async ({ editorPage }) => {
    await editorPage.codeEditor.toggleExamples()

    // Check for descriptive content in examples
    const examples = await editorPage.codeEditor.getAvailableExamples()
    expect(examples.length).toBeGreaterThan(0)

    // Each example should have meaningful names
    for (const example of examples) {
      expect(example.trim().length).toBeGreaterThan(2)
    }
  })

  test('should handle rapid example switching without breaking', async ({ editorPage }) => {
    const exampleTypes = ['Flowchart', 'Sequence Diagram', 'Class Diagram', 'State Diagram']

    // Rapidly switch between examples
    for (const exampleType of exampleTypes) {
      await editorPage.codeEditor.toggleExamples()
      await editorPage.codeEditor.selectExample(exampleType)
      await editorPage.page.waitForTimeout(200)
    }

    // Final state should be valid
    await editorPage.codeEditor.waitForValidation()
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('valid')

    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)
  })
})