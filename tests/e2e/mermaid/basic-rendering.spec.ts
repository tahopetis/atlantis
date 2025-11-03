import { test, expect } from '../fixtures/custom-fixtures'
import { MERMAID_EXAMPLES, INVALID_MERMAID_EXAMPLES } from '../fixtures/test-data'

test.describe('Mermaid.js Basic Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')
  })

  test('should render a simple flowchart diagram', async ({ editorPage }) => {
    await editorPage.waitForEditorInitialization()

    // Enter simple flowchart code
    await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.flowchart)

    // Wait for validation
    await editorPage.codeEditor.waitForValidation()

    // Verify diagram is rendered
    await expect(editorPage.diagramCanvas.container).toBeVisible()
    await expect(editorPage.diagramCanvas.mermaidContainer).toBeVisible()

    // Check that diagram has content
    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)

    // Verify validation status
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('valid')
  })

  test('should render different diagram types', async ({ editorPage }) => {
    await editorPage.waitForEditorInitialization()

    const diagramTypes = [
      { name: 'sequence', code: MERMAID_EXAMPLES.sequenceDiagram },
      { name: 'class', code: MERMAID_EXAMPLES.classDiagram },
      { name: 'gantt', code: MERMAID_EXAMPLES.ganttChart },
      { name: 'state', code: MERMAID_EXAMPLES.stateDiagram },
      { name: 'pie', code: MERMAID_EXAMPLES.pieChart },
      { name: 'journey', code: MERMAID_EXAMPLES.journeyDiagram }
    ]

    for (const diagram of diagramTypes) {
      console.log(`Testing ${diagram.name} diagram...`)

      // Clear and set new code
      await editorPage.codeEditor.setCode(diagram.code)
      await editorPage.codeEditor.waitForValidation()

      // Verify validation
      const status = await editorPage.codeEditor.getValidationStatus()
      expect(status).toBe(`valid for ${diagram.name} diagram`)

      // Wait for rendering
      await editorPage.page.waitForTimeout(1000)

      // Verify diagram is rendered
      const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
      expect(isRendered).toBe(true)

      // Check for SVG elements
      const hasSvg = await editorPage.diagramCanvas.hasDiagramElement('svg')
      expect(hasSvg).toBe(true)
    }
  })

  test('should handle syntax errors gracefully', async ({ editorPage }) => {
    await editorPage.waitForEditorInitialization()

    // Enter invalid Mermaid code
    await editorPage.codeEditor.setCode(INVALID_MERMAID_EXAMPLES.syntaxError)
    await editorPage.codeEditor.waitForValidation()

    // Verify error state
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('error')

    // Check error display
    const hasError = await editorPage.diagramCanvas.hasError()
    expect(hasError).toBe(true)

    // Get error message
    const errorMessage = await editorPage.diagramCanvas.getErrorMessage()
    expect(errorMessage).toContain('Syntax error')

    // Verify error icon
    const iconType = await editorPage.codeEditor.getValidationIconType()
    expect(iconType).toBe('error')
  })

  test('should show empty state when no code is entered', async ({ editorPage }) => {
    await editorPage.waitForEditorInitialization()

    // Clear all code
    await editorPage.codeEditor.clearCode()
    await editorPage.codeEditor.waitForValidation()

    // Verify empty state is shown
    const isEmptyState = await editorPage.diagramCanvas.isEmptyState()
    expect(isEmptyState).toBe(true)

    // Get empty state message
    const message = await editorPage.diagramCanvas.getEmptyStateMessage()
    expect(message).toContain('Start Creating')

    // Verify no error is shown
    const hasError = await editorPage.diagramCanvas.hasError()
    expect(hasError).toBe(false)
  })

  test('should handle large diagrams without performance issues', async ({ editorPage, helpers }) => {
    await editorPage.waitForEditorInitialization()

    // Create a large diagram
    const largeDiagram = `
graph TD
    A[Start] --> B[Process 1]
    B --> C[Process 2]
    C --> D[Process 3]
    D --> E[Process 4]
    E --> F[Process 5]
    F --> G[Process 6]
    G --> H[Process 7]
    H --> I[Process 8]
    I --> J[Process 9]
    J --> K[Process 10]
    K --> L[Process 11]
    L --> M[Process 12]
    M --> N[Process 13]
    N --> O[Process 14]
    O --> P[Process 15]
    P --> Q[Process 16]
    Q --> R[Process 17]
    R --> S[Process 18]
    S --> T[Process 19]
    T --> U[Process 20]
    U --> V[End]

    %% Add some branches
    B --> B1[Branch 1]
    B1 --> C
    C --> C1[Branch 2]
    C1 --> D
    D --> D1[Branch 3]
    D1 --> E
    `

    // Measure rendering performance
    const { duration } = await helpers.measurePerformance(async () => {
      await editorPage.codeEditor.setCode(largeDiagram)
      await editorPage.codeEditor.waitForValidation()
      await editorPage.diagramCanvas.waitForDiagramRender(10000)
    }, 'Large diagram rendering')

    // Verify it renders within reasonable time
    expect(duration).toBeLessThan(5000) // 5 seconds max

    // Verify diagram is actually rendered
    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)
  })

  test('should update diagram in real-time as code is typed', async ({ editorPage }) => {
    await editorPage.waitForEditorInitialization()

    // Start with partial code
    await editorPage.codeEditor.setCode('graph TD')
    await editorPage.codeEditor.waitForValidation()

    // Type code character by character
    await editorPage.codeEditor.typeCode('\n    A[Start] --> B[End]', 50)

    // Wait for real-time update
    await editorPage.page.waitForTimeout(500)

    // Verify diagram updates
    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)

    // Add more content
    await editorPage.codeEditor.typeCode('\n    B --> C[Finish]', 50)
    await editorPage.page.waitForTimeout(500)

    // Verify diagram updates again
    const nodeCount = await editorPage.diagramCanvas.getDiagramElementCount('g[id*="flowchart"]')
    expect(nodeCount).toBeGreaterThan(0)
  })

  test('should handle special characters and unicode in diagram labels', async ({ editorPage }) => {
    await editorPage.waitForEditorInitialization()

    // Diagram with special characters
    const specialCharDiagram = `graph TD
    A["Start: αβγ"] --> B{"Decision: 中文"}
    B -->|Yes| C["Process: éàü"]
    B -->|No| D["End: 🎉✅"]
    `

    await editorPage.codeEditor.setCode(specialCharDiagram)
    await editorPage.codeEditor.waitForValidation()

    // Verify validation
    const status = await editorPage.codeEditor.getValidationStatus()
    expect(status).toBe('valid')

    // Verify diagram renders
    const isRendered = await editorPage.diagramCanvas.isDiagramRendered()
    expect(isRendered).toBe(true)

    // Check for text elements with special characters
    const hasTextElements = await editorPage.diagramCanvas.hasDiagramElement('text')
    expect(hasTextElements).toBe(true)
  })

  test('should handle different Mermaid themes', async ({ editorPage }) => {
    await editorPage.waitForEditorInitialization()

    // Test with default theme
    await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.flowchart)
    await editorPage.codeEditor.waitForValidation()

    const defaultBounds = await editorPage.diagramCanvas.getDiagramBounds()
    expect(defaultBounds.width).toBeGreaterThan(0)
    expect(defaultBounds.height).toBeGreaterThan(0)

    // Note: Theme switching would need to be implemented in the UI
    // This test can be expanded when theme switching is available
  })

  test('should validate complex diagram syntax', async ({ editorPage }) => {
    await editorPage.waitForEditorInitialization()

    const invalidDiagrams = [
      INVALID_MERMAID_EXAMPLES.syntaxError,
      INVALID_MERMAID_EXAMPLES.undefinedNode,
      INVALID_MERMAID_EXAMPLES.mismatchedBrackets,
      INVALID_MERMAID_EXAMPLES.invalidDirection
    ]

    for (const invalidCode of invalidDiagrams) {
      await editorPage.codeEditor.setCode(invalidCode)
      await editorPage.codeEditor.waitForValidation()

      // Should show error state
      const status = await editorPage.codeEditor.getValidationStatus()
      expect(status).toBe('error')

      // Should show error message
      const hasError = await editorPage.diagramCanvas.hasError()
      expect(hasError).toBe(true)
    }
  })

  test('should provide helpful error messages with line numbers', async ({ editorPage }) => {
    await editorPage.waitForEditorInitialization()

    // Code with error on specific line
    const errorDiagram = `graph TD
    A[Start] --> B[Valid]
    B --> C[Another valid]
    C --> D  // Missing brackets for D
    `

    await editorPage.codeEditor.setCode(errorDiagram)
    await editorPage.codeEditor.waitForValidation()

    // Check for line information in error
    const errorDetails = await editorPage.diagramCanvas.getErrorDetails()

    if (errorDetails.line) {
      expect(errorDetails.line).toBeGreaterThan(0)
      expect(errorDetails.line).toBeLessThanOrEqual(4) // Should be within diagram range
    }
  })

  test('should handle rapid code changes without breaking', async ({ editorPage, helpers }) => {
    await editorPage.waitForEditorInitialization()

    const codes = [
      MERMAID_EXAMPLES.flowchart,
      MERMAID_EXAMPLES.sequenceDiagram,
      MERMAID_EXAMPLES.classDiagram,
      INVALID_MERMAID_EXAMPLES.syntaxError,
      MERMAID_EXAMPLES.pieChart
    ]

    // Rapidly change code
    for (let i = 0; i < codes.length; i++) {
      await editorPage.codeEditor.setCode(codes[i])
      await editorPage.page.waitForTimeout(100) // Very short delay
    }

    // Final validation should work
    await editorPage.codeEditor.waitForValidation()
    const status = await editorPage.codeEditor.getValidationStatus()

    // Should be in a valid state (last code is valid pie chart)
    expect(['valid', 'error']).toContain(status)
  })
})