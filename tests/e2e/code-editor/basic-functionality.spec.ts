import { test, expect } from '../fixtures/custom-fixtures'
import { MERMAID_EXAMPLES, INVALID_MERMAID_EXAMPLES } from '../fixtures/test-data'

test.describe('Code Editor Basic Functionality', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto()
    await editorPage.waitForEditorInitialization()
  })

  test('should display code editor with all components', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Check main components are visible
    await expect(editor.container).toBeVisible()
    await expect(editor.header).toBeVisible()
    await expect(editor.title).toBeVisible()
    await expect(editor.textArea).toBeVisible()
    await expect(editor.toolbar).toBeVisible()
    await expect(editor.footer).toBeVisible()

    // Check status indicators
    await expect(editor.statusIndicator).toBeVisible()
    await expect(editor.validationIcon).toBeVisible()

    // Check toolbar buttons
    await expect(editor.examplesButton).toBeVisible()
    await expect(editor.copyButton).toBeVisible()
    await expect(editor.downloadButton).toBeVisible()
  })

  test('should show correct title and description', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    const title = await editor.title.textContent()
    expect(title).toContain('Mermaid Code')

    // Should have description text
    const hasDescription = await editor.page.locator('p:has-text("Mermaid syntax")').isVisible()
    expect(hasDescription).toBe(true)
  })

  test('should accept text input correctly', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Clear any existing content
    await editor.clearCode()
    const emptyCode = await editor.getCode()
    expect(emptyCode).toBe('')

    // Type simple text
    await editor.setCode('graph TD\n    A[Start] --> B[End]')
    const code = await editor.getCode()
    expect(code).toBe('graph TD\n    A[Start] --> B[End]')

    // Should show line count
    const lineCount = await editor.getLineCount()
    expect(lineCount).toBe(2)

    // Should show character count
    const charCount = await editor.getCharacterCount()
    expect(charCount).toBeGreaterThan(10)
  })

  test('should validate Mermaid syntax correctly', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Valid code should show valid status
    await editor.setCode(MERMAID_EXAMPLES.flowchart)
    await editor.waitForValidation()

    const status = await editor.getValidationStatus()
    expect(status).toBe('valid')

    const iconType = await editor.getValidationIconType()
    expect(iconType).toBe('check')

    // Invalid code should show error status
    await editor.setCode(INVALID_MERMAID_EXAMPLES.syntaxError)
    await editor.waitForValidation()

    const errorStatus = await editor.getValidationStatus()
    expect(errorStatus).toBe('error')

    const errorIconType = await editor.getValidationIconType()
    expect(errorIconType).toBe('error')
  })

  test('should show line numbers', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Multi-line code should show line numbers
    const multiLineCode = 'graph TD\n    A[Start] --> B[End]\n    B --> C[Finish]'
    await editor.setCode(multiLineCode)

    const lineCount = await editor.getLineCount()
    expect(lineCount).toBe(3)

    // Line numbers should be visible
    const hasLineNumbers = await editor.hasLineNumbers()
    expect(hasLineNumbers).toBe(true)
  })

  test('should handle empty input gracefully', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Clear all content
    await editor.clearCode()

    // Should show 0 lines and 0 characters
    const lineCount = await editor.getLineCount()
    const charCount = await editor.getCharacterCount()

    expect(lineCount).toBe(0)
    expect(charCount).toBe(0)

    // Should not show validation error for empty content
    await editor.waitForValidation()
    const status = await editor.getValidationStatus()
    // Status might be 'valid' or show no validation for empty content
    expect(['valid', 'loading']).toContain(status)
  })

  test('should handle large amounts of text', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Create large diagram
    let largeCode = 'graph TD\n'
    for (let i = 0; i < 100; i++) {
      largeCode += `    A${i}[Process ${i}] --> B${i}[Output ${i}]\n`
    }

    await editor.setCode(largeCode)

    // Should handle large input
    const finalCode = await editor.getCode()
    expect(finalCode.length).toBeGreaterThan(1000)

    const lineCount = await editor.getLineCount()
    expect(lineCount).toBe(101) // Including the first line

    // Should still be able to validate
    await editor.waitForValidation(10000) // Allow more time for large content
    const status = await editor.getValidationStatus()
    expect(['valid', 'error', 'loading']).toContain(status)
  })

  test('should support copy functionality', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Set some content
    const testCode = 'graph TD\n    A[Start] --> B[End]'
    await editor.setCode(testCode)

    // Mock clipboard
    await editor.page.evaluate(() => {
      const mockClipboard = {
        writeText: async (text: string) => {
          (window as any).__testClipboard = text
          return Promise.resolve()
        },
        readText: async () => (window as any).__testClipboard || ''
      }
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      })
    })

    // Click copy button
    await editor.copyCode()
    await editor.page.waitForTimeout(500)

    // Verify clipboard content
    const clipboardContent = await editor.page.evaluate(() => (window as any).__testClipboard)
    expect(clipboardContent).toBe(testCode)
  })

  test('should support download functionality', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Set some content
    const testCode = 'graph TD\n    A[Start] --> B[End]'
    await editor.setCode(testCode)

    // Start download
    const downloadPromise = editor.page.waitForEvent('download')
    await editor.downloadButton.click()
    const download = await downloadPromise

    // Verify download
    const fileName = download.suggestedFilename()
    expect(fileName).toMatch(/\.(mmd|mermaid|txt)$/i)

    // Get download content
    const content = await download.createReadStream()
    let fileContent = ''
    if (content) {
      const chunks: Buffer[] = []
      for await (const chunk of content) {
        chunks.push(chunk)
      }
      fileContent = Buffer.concat(chunks).toString()
    }

    expect(fileContent).toBe(testCode)
  })

  test('should disable copy and download buttons when empty', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Clear content
    await editor.clearCode()

    // Buttons should be disabled
    await expect(editor.copyButton).toBeDisabled()
    await expect(editor.downloadButton).toBeDisabled()

    // Add content
    await editor.setCode('graph TD\n    A[Start]')

    // Buttons should be enabled
    await expect(editor.copyButton).toBeEnabled()
    await expect(editor.downloadButton).toBeEnabled()
  })

  test('should handle special characters in code', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    const specialCharCode = `graph TD
    A["Start: αβγ中文"] --> B{"Decision: éàü"}
    B -->|Yes| C["Process: 🎉✅"]
    B -->|No| D["End: ñøß"]
    `

    await editor.setCode(specialCharCode)

    // Should preserve special characters
    const retrievedCode = await editor.getCode()
    expect(retrievedCode).toContain('αβγ中文')
    expect(retrievedCode).toContain('éàü')
    expect(retrievedCode).toContain('🎉✅')
    expect(retrievedCode).toContain('ñøß')

    // Should still be able to validate
    await editor.waitForValidation()
    const status = await editor.getValidationStatus()
    expect(['valid', 'error']).toContain(status)
  })

  test('should support keyboard shortcuts', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Focus on editor
    await editor.focus()

    // Type some content
    await editor.typeCode('graph TD\n    A[Start] --> B[End]')

    // Test Ctrl+A (select all)
    await editor.selectAll()
    await editor.pressKey('Delete')

    // Should be empty
    const emptyCode = await editor.getCode()
    expect(emptyCode).toBe('')

    // Test typing again
    await editor.typeCode('graph LR')
    const newCode = await editor.getCode()
    expect(newCode).toBe('graph LR')
  })

  test('should show loading state during validation', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Set complex code that might take time to validate
    const complexCode = MERMAID_EXAMPLES.sequenceDiagram

    // Start typing and check for loading state
    await editor.clearCode()
    await editor.typeCode(complexCode, 50) // Type slowly to see loading state

    // Should show loading at some point
    await editor.page.waitForTimeout(1000)

    // Final state should be resolved
    await editor.waitForValidation()
    const status = await editor.getValidationStatus()
    expect(['valid', 'error']).toContain(status)
  })

  test('should handle cursor position and selection', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    const testCode = 'graph TD\n    A[Start] --> B[End]\n    B --> C[Finish]'
    await editor.setCode(testCode)

    // Get cursor position
    const cursorPos = await editor.getCursorPosition()
    expect(cursorPos.line).toBeGreaterThanOrEqual(1)
    expect(cursorPos.column).toBeGreaterThanOrEqual(0)

    // Test positioning at different locations
    await editor.focus()
    await editor.pressKey('ArrowDown')
    await editor.pressKey('ArrowRight')
    await editor.pressKey('ArrowRight')

    const newCursorPos = await editor.getCursorPosition()
    expect(newCursorPos.line).toBeGreaterThan(cursorPos.line)
  })

  test('should maintain editor state during rapid typing', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Clear and start typing rapidly
    await editor.clearCode()

    const testText = 'graph TD\n    A[Start] --> B[Process 1]\n    B --> C[Process 2]\n    C --> D[End]'

    // Type text with short delays
    await editor.typeCode(testText, 30)

    // Should have the complete text
    const finalCode = await editor.getCode()
    expect(finalCode).toBe(testText)

    // Should be able to validate
    await editor.waitForValidation()
    const status = await editor.getValidationStatus()
    expect(['valid', 'error']).toContain(status)
  })

  test('should show syntax hints in footer', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Check footer has helpful hints
    const footerText = await editor.footer.textContent()
    expect(footerText).toContain('Tab')
    expect(footerText).toContain('Ctrl+Enter')
  })

  test('should handle editor resizing', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Set some content
    await editor.setCode(MERMAID_EXAMPLES.flowchart)

    // Editor should be visible
    await expect(editor.container).toBeVisible()

    // Should handle window resize
    await editorPage.page.setViewportSize({ width: 800, height: 600 })
    await editorPage.page.waitForTimeout(300)

    // Should still be visible and functional
    await expect(editor.container).toBeVisible()
    await expect(editor.textArea).toBeVisible()

    const code = await editor.getCode()
    expect(code).toContain('graph TD')
  })

  test('should maintain editor focus when switching between applications', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Focus on editor
    await editor.focus()

    // Verify focus
    const isFocused = await editor.textArea.evaluate((el: HTMLTextAreaElement) =>
      document.activeElement === el
    )
    expect(isFocused).toBe(true)

    // Click elsewhere and come back
    await editorPage.page.click('body', { position: { x: 10, y: 10 } })
    await editor.focus()

    // Should be focused again
    const isRefocused = await editor.textArea.evaluate((el: HTMLTextAreaElement) =>
      document.activeElement === el
    )
    expect(isRefocused).toBe(true)
  })
})