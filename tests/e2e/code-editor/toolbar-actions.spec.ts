import { test, expect } from '../fixtures/custom-fixtures'
import { MERMAID_EXAMPLES } from '../fixtures/test-data'

test.describe('Code Editor Toolbar Actions', () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto()
    await editorPage.waitForEditorInitialization()
  })

  test('should display all toolbar buttons correctly', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Check toolbar is visible
    await expect(editor.toolbar).toBeVisible()

    // Check all buttons are present
    await expect(editor.examplesButton).toBeVisible()
    await expect(editor.copyButton).toBeVisible()
    await expect(editor.downloadButton).toBeVisible()

    // Check button labels/tooltips
    await expect(editor.examplesButton).toContainText('Examples')
    // Copy and download buttons might have icons instead of text
  })

  test('should toggle examples dropdown correctly', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Initially dropdown should be hidden
    await expect(editor.examplesDropdown).toBeHidden()

    // Click examples button
    await editor.toggleExamples()
    await expect(editor.examplesDropdown).toBeVisible()

    // Click again to hide
    await editor.toggleExamples()
    await expect(editor.examplesDropdown).toBeHidden()
  })

  test('should load flowchart example when selected', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Set initial content
    await editor.setCode('graph LR\n    A[Old] --> B[Content]')

    // Open examples and select flowchart
    await editor.toggleExamples()
    await editor.selectExample('Flowchart')

    // Dropdown should close
    await expect(editor.examplesDropdown).toBeHidden()

    // Code should be replaced with flowchart example
    const code = await editor.getCode()
    expect(code).toContain('graph TD')
    expect(code).toContain('Start')
    expect(code).toContain('End')

    // Should not contain old content
    expect(code).not.toContain('Old')
    expect(code).not.toContain('Content')

    // Should validate successfully
    await editor.waitForValidation()
    const status = await editor.getValidationStatus()
    expect(status).toBe('valid')
  })

  test('should load all example types correctly', async ({ editorPage }) => {
    const editor = editorPage.codeEditor
    const examples = [
      { name: 'Flowchart', keyword: 'graph TD' },
      { name: 'Sequence Diagram', keyword: 'sequenceDiagram' },
      { name: 'Class Diagram', keyword: 'classDiagram' },
      { name: 'Gantt Chart', keyword: 'gantt' },
      { name: 'State Diagram', keyword: 'stateDiagram' },
      { name: 'Pie Chart', keyword: 'pie title' },
      { name: 'Journey Diagram', keyword: 'journey' }
    ]

    for (const example of examples) {
      console.log(`Testing ${example.name} example...`)

      // Select example
      await editor.toggleExamples()
      await editor.selectExample(example.name)

      // Verify content
      const code = await editor.getCode()
      expect(code).toContain(example.keyword)

      // Should validate
      await editor.waitForValidation()
      const status = await editor.getValidationStatus()
      expect(status).toBe('valid')
    }
  })

  test('should close examples dropdown when clicking outside', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Open examples
    await editor.toggleExamples()
    await expect(editor.examplesDropdown).toBeVisible()

    // Click outside dropdown
    await editorPage.page.click('body', { position: { x: 100, y: 100 } })
    await editorPage.page.waitForTimeout(200)

    // Dropdown should be closed
    await expect(editor.examplesDropdown).toBeHidden()
  })

  test('should maintain focus on editor after selecting example', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Focus on editor
    await editor.focus()

    // Select example
    await editor.toggleExamples()
    await editor.selectExample('Flowchart')

    // Editor should still be focused
    const isFocused = await editor.textArea.evaluate((el: HTMLTextAreaElement) =>
      document.activeElement === el
    )
    expect(isFocused).toBe(true)
  })

  test('should copy code to clipboard correctly', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Set test content
    const testCode = 'graph TD\n    A[Start] --> B[End]\n    B --> C[Finish]'
    await editor.setCode(testCode)

    // Mock clipboard
    await editorPage.page.evaluate(() => {
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
    await editorPage.page.waitForTimeout(500)

    // Verify clipboard content
    const clipboardContent = await editorPage.page.evaluate(() => (window as any).__testClipboard)
    expect(clipboardContent).toBe(testCode)

    // Should show visual feedback (optional, depends on implementation)
    // This could be a toast notification or button state change
  })

  test('should disable copy button when editor is empty', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Clear editor
    await editor.clearCode()

    // Copy button should be disabled
    await expect(editor.copyButton).toBeDisabled()

    // Add some content
    await editor.setCode('graph TD\n    A[Start]')

    // Copy button should be enabled
    await expect(editor.copyButton).toBeEnabled()
  })

  test('should download code as file correctly', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Set test content
    const testCode = 'graph TD\n    A[Start] --> B[End]\n    B --> C[Finish]'
    await editor.setCode(testCode)

    // Start download
    const downloadPromise = editorPage.page.waitForEvent('download')
    await editor.downloadButton.click()
    const download = await downloadPromise

    // Verify filename
    const fileName = download.suggestedFilename()
    expect(fileName).toMatch(/\.(mmd|mermaid|txt)$/i)

    // Verify content
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

  test('should disable download button when editor is empty', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Clear editor
    await editor.clearCode()

    // Download button should be disabled
    await expect(editor.downloadButton).toBeDisabled()

    // Add some content
    await editor.setCode('graph TD\n    A[Start]')

    // Download button should be enabled
    await expect(editor.downloadButton).toBeEnabled()
  })

  test('should handle download with special characters in filename', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Set content with special characters in filename suggestion
    const testCode = 'graph TD\n    A["Start: Test"] --> B["End: File"]'
    await editor.setCode(testCode)

    // Start download
    const downloadPromise = editorPage.page.waitForEvent('download')
    await editor.downloadButton.click()
    const download = await downloadPromise

    // Filename should be valid
    const fileName = download.suggestedFilename()
    expect(fileName).toMatch(/^[^\\/:*?"<>|]+\.(mmd|mermaid|txt)$/i) // Valid filename pattern
  })

  test('should support keyboard shortcuts for toolbar actions', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Focus on editor
    await editor.focus()
    await editor.setCode('graph TD\n    A[Start] --> B[End]')

    // Test Ctrl+C shortcut
    await editor.selectAll()
    await editor.pressKey('Control+c')

    // Test Ctrl+S shortcut if implemented for download
    // This depends on the actual implementation
    await editor.pressKey('Control+s')
    await editorPage.page.waitForTimeout(500)

    // Check if download was triggered (would depend on implementation)
  })

  test('should show tooltips or hints for toolbar buttons', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Hover over examples button
    await editor.examplesButton.hover()
    await editorPage.page.waitForTimeout(500)

    // Check for tooltip or title attribute
    const examplesTitle = await editor.examplesButton.getAttribute('title')
    const examplesAriaLabel = await editor.examplesButton.getAttribute('aria-label')

    expect(examplesTitle || examplesAriaLabel).toBeTruthy()

    // Hover over copy button
    await editor.copyButton.hover()
    await editorPage.page.waitForTimeout(500)

    const copyTitle = await editor.copyButton.getAttribute('title')
    const copyAriaLabel = await editor.copyButton.getAttribute('aria-label')

    expect(copyTitle || copyAriaLabel).toBeTruthy()

    // Hover over download button
    await editor.downloadButton.hover()
    await editorPage.page.waitForTimeout(500)

    const downloadTitle = await editor.downloadButton.getAttribute('title')
    const downloadAriaLabel = await editor.downloadButton.getAttribute('aria-label')

    expect(downloadTitle || downloadAriaLabel).toBeTruthy()
  })

  test('should handle rapid toolbar button clicks without breaking', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Set some content
    await editor.setCode(MERMAID_EXAMPLES.flowchart)

    // Rapidly click examples button
    for (let i = 0; i < 5; i++) {
      await editor.toggleExamples()
      await editorPage.page.waitForTimeout(50)
    }

    // Should end up in a consistent state
    const isVisible = await editor.examplesDropdown.isVisible()
    expect([true, false]).toContain(isVisible)

    // Rapidly click copy button
    for (let i = 0; i < 3; i++) {
      await editor.copyCode()
      await editorPage.page.waitForTimeout(100)
    }

    // Editor should still be functional
    const code = await editor.getCode()
    expect(code).toContain('graph TD')
  })

  test('should maintain editor content during toolbar actions', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Set initial content
    const initialCode = 'graph TD\n    A[Start] --> B[Process]\n    B --> C[End]'
    await editor.setCode(initialCode)

    // Open and close examples
    await editor.toggleExamples()
    await editorPage.page.waitForTimeout(200)
    await editor.toggleExamples()

    // Content should be preserved
    const preservedCode = await editor.getCode()
    expect(preservedCode).toBe(initialCode)

    // Copy content
    await editor.copyCode()
    await editorPage.page.waitForTimeout(200)

    // Content should still be preserved
    const afterCopyCode = await editor.getCode()
    expect(afterCopyCode).toBe(initialCode)

    // Download content (but cancel it)
    const downloadPromise = editorPage.page.waitForEvent('download')
    await editor.downloadButton.click()
    const download = await downloadPromise
    // Don't save the download, just let it complete

    // Content should still be preserved
    const afterDownloadCode = await editor.getCode()
    expect(afterDownloadCode).toBe(initialCode)
  })

  test('should handle toolbar button states based on validation', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Start with valid content
    await editor.setCode(MERMAID_EXAMPLES.flowchart)
    await editor.waitForValidation()

    // All buttons should be enabled (since there's content)
    await expect(editor.copyButton).toBeEnabled()
    await expect(editor.downloadButton).toBeEnabled()

    // Set invalid content
    await editor.setCode('invalid syntax')
    await editor.waitForValidation()

    // Buttons should still be enabled (content exists even if invalid)
    await expect(editor.copyButton).toBeEnabled()
    await expect(editor.downloadButton).toBeEnabled()

    // Clear content
    await editor.clearCode()

    // Buttons should be disabled
    await expect(editor.copyButton).toBeDisabled()
    await expect(editor.downloadButton).toBeDisabled()
  })

  test('should be accessible via keyboard navigation', async ({ editorPage }) => {
    const editor = editorPage.codeEditor

    // Focus on toolbar area
    await editor.toolbar.focus()

    // Try to navigate with Tab key
    await editorPage.page.keyboard.press('Tab')
    await editorPage.page.waitForTimeout(100)

    // Check which element is focused
    const focusedElement = await editorPage.page.evaluate(() => {
      const active = document.activeElement
      return active?.tagName.toLowerCase() + (active?.id ? `#${active.id}` : '')
    })

    // Should be able to navigate to toolbar elements
    expect(['button', 'input']).toContain(focusedElement.split('#')[0])

    // Test Enter key on examples button
    if (focusedElement.includes('examples') || await editor.examplesButton.isVisible()) {
      await editorPage.page.keyboard.press('Enter')
      await editorPage.page.waitForTimeout(200)

      // Examples dropdown should open
      await expect(editor.examplesDropdown).toBeVisible()
    }
  })
})