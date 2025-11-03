import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class CodeEditor extends BasePage {
  // Locators
  readonly container: Locator
  readonly header: Locator
  readonly title: Locator
  readonly statusIndicator: Locator
  readonly statusText: Locator
  readonly validationIcon: Locator
  readonly toolbar: Locator
  readonly examplesButton: Locator
  readonly copyButton: Locator
  readonly downloadButton: Locator
  readonly examplesDropdown: Locator
  readonly exampleItems: Locator
  readonly textArea: Locator
  readonly lineNumbers: Locator
  readonly footer: Locator
  readonly lineCount: Locator
  readonly characterCount: Locator

  constructor(page: Page) {
    super(page)
    this.container = page.locator('[data-testid="code-editor"], .code-editor')
    this.header = page.locator('[data-testid="code-editor-header"], .code-editor-header')
    this.title = page.locator('[data-testid="code-editor-title"] h3, .code-editor h3')
    this.statusIndicator = page.locator('[data-testid="status-indicator"], .status-indicator')
    this.statusText = page.locator('[data-testid="status-text"], .status-text')
    this.validationIcon = page.locator('[data-testid="validation-icon"], .validation-icon')
    this.toolbar = page.locator('[data-testid="code-editor-toolbar"], .code-editor-toolbar')
    this.examplesButton = page.locator('button:has-text("Examples"), [data-testid="examples-button"]')
    this.copyButton = page.locator('button:has([data-lucide="copy"]), [data-testid="copy-button"]')
    this.downloadButton = page.locator('button:has([data-lucide="download"]), [data-testid="download-button"]')
    this.examplesDropdown = page.locator('[data-testid="examples-dropdown"], .examples-dropdown')
    this.exampleItems = page.locator('[data-testid="example-item"], .example-item')
    this.textArea = page.locator('textarea[placeholder*="Mermaid"], [data-testid="code-textarea"]')
    this.lineNumbers = page.locator('[data-testid="line-numbers"], .line-numbers')
    this.footer = page.locator('[data-testid="code-editor-footer"], .code-editor-footer')
    this.lineCount = page.locator('[data-testid="line-count"], .line-count')
    this.characterCount = page.locator('[data-testid="character-count"], .character-count')
  }

  /**
   * Check if code editor is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible()
  }

  /**
   * Get current code content
   */
  async getCode(): Promise<string> {
    return await this.textArea.inputValue()
  }

  /**
   * Set code content
   */
  async setCode(code: string): Promise<void> {
    await this.textArea.fill(code)
  }

  /**
   * Type code with human-like typing
   */
  async typeCode(code: string, delay: number = 50): Promise<void> {
    await this.textArea.type(code, { delay })
  }

  /**
   * Append code to existing content
   */
  async appendCode(code: string): Promise<void> {
    const currentCode = await this.getCode()
    await this.setCode(currentCode + code)
  }

  /**
   * Clear all code
   */
  async clearCode(): Promise<void> {
    await this.textArea.fill('')
  }

  /**
   * Get validation status
   */
  async getValidationStatus(): Promise<'valid' | 'error' | 'loading'> {
    const statusText = await this.statusText.textContent()
    if (statusText?.includes('Valid')) return 'valid'
    if (statusText?.includes('Error')) return 'error'
    if (statusText?.includes('Validating')) return 'loading'
    return 'error' // Default fallback
  }

  /**
   * Wait for validation to complete
   */
  async waitForValidation(timeout: number = 5000): Promise<void> {
    await this.page.waitForFunction(() => {
      const statusText = document.querySelector('[data-testid="status-text"], .status-text')
      return statusText?.textContent?.includes('Valid') ||
             statusText?.textContent?.includes('Error')
    }, { timeout })
  }

  /**
   * Toggle examples dropdown
   */
  async toggleExamples(): Promise<void> {
    await this.examplesButton.click()
  }

  /**
   * Check if examples dropdown is open
   */
  async isExamplesOpen(): Promise<boolean> {
    return await this.examplesDropdown.isVisible()
  }

  /**
   * Select an example by name
   */
  async selectExample(exampleName: string): Promise<void> {
    if (!await this.isExamplesOpen()) {
      await this.toggleExamples()
    }
    await this.page.locator(`.example-item:has-text("${exampleName}"), button:has-text("${exampleName}")`).click()
  }

  /**
   * Get available example names
   */
  async getAvailableExamples(): Promise<string[]> {
    const examples = await this.exampleItems.allInnerTexts()
    return examples.map(text => text.trim())
  }

  /**
   * Copy code to clipboard
   */
  async copyCode(): Promise<void> {
    await this.copyButton.click()
  }

  /**
   * Download code
   */
  async downloadCode(): Promise<void> {
    // Start download
    const downloadPromise = this.page.waitForEvent('download')
    await this.downloadButton.click()
    const download = await downloadPromise

    // Wait for download to complete
    await download.saveAs(`test-results/downloads/${download.suggestedFilename()}`)
  }

  /**
   * Get line count
   */
  async getLineCount(): Promise<number> {
    const text = await this.lineCount.textContent()
    const match = text?.match(/(\d+)\s+lines/)
    return match ? parseInt(match[1]) : 0
  }

  /**
   * Get character count
   */
  async getCharacterCount(): Promise<number> {
    const text = await this.characterCount.textContent()
    const match = text?.match(/(\d+)\s+characters/)
    return match ? parseInt(match[1]) : 0
  }

  /**
   * Check if validation icon is visible
   */
  async hasValidationIcon(): Promise<boolean> {
    return await this.validationIcon.isVisible()
  }

  /**
   * Get validation icon type
   */
  async getValidationIconType(): Promise<'check' | 'error' | 'loading'> {
    const isValid = await this.page.locator('[data-lucide="check-circle"], .text-green-500').isVisible()
    const isError = await this.page.locator('[data-lucide="alert-circle"], .text-destructive').isVisible()
    const isLoading = await this.page.locator('.animate-spin').isVisible()

    if (isLoading) return 'loading'
    if (isValid) return 'check'
    if (isError) return 'error'
    return 'error'
  }

  /**
   * Focus on the code editor
   */
  async focus(): Promise<void> {
    await this.textArea.focus()
  }

  /**
   * Insert text at cursor position
   */
  async insertText(text: string): Promise<void> {
    await this.textArea.type(text)
  }

  /**
   * Press keyboard shortcut
   */
  async pressKey(key: string): Promise<void> {
    await this.textArea.press(key)
  }

  /**
   * Select all text
   */
  async selectAll(): Promise<void> {
    await this.textArea.fill('') // Clear first to ensure focus
    await this.textArea.press('Control+a')
  }

  /**
   * Get cursor position
   */
  async getCursorPosition(): Promise<{ line: number; column: number }> {
    return await this.page.evaluate(() => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement
      if (!textarea) return { line: 0, column: 0 }

      const text = textarea.value
      const position = textarea.selectionStart || 0
      const lines = text.substring(0, position).split('\n')

      return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1
      }
    })
  }

  /**
   * Check if syntax highlighting is working (by checking for specific classes)
   */
  async hasSyntaxHighlighting(): Promise<boolean> {
    // This is a simplified check - in reality, syntax highlighting
    // might be implemented with different libraries
    return await this.exists('.code-editor .line-numbers, .code-editor [class*="line"]')
  }

  /**
   * Wait for editor to be ready
   */
  async waitForReady(): Promise<void> {
    await this.container.waitFor({ state: 'visible' })
    await this.textArea.waitFor({ state: 'visible' })
    await this.waitForValidation()
  }
}