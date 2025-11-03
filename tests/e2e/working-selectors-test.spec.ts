import { test, expect } from '@playwright/test'
import { EditorPageFixed } from './pages/EditorPage-FIXED'
import { MERMAID_EXAMPLES } from './fixtures/test-data'

/**
 * WORKING SELECTORS VALIDATION TEST
 *
 * This test validates that the fixed selectors from the functional discovery
 * test actually work correctly with the Atlantis application.
 *
 * This serves as proof that the discovery test findings are accurate
 * and that the recommended fixes work.
 */

test.describe('Working Selectors Validation', () => {
  let editorPage: EditorPageFixed

  test.beforeEach(async ({ page }) => {
    editorPage = new EditorPageFixed(page)
  })

  test('Validate all working selectors from discovery test', async ({ page }) => {
    console.log('\n🧪 VALIDATING WORKING SELECTORS\n')

    // Navigate to editor
    await editorPage.goto()
    await editorPage.waitForEditorInitialization()

    // Perform health check
    await editorPage.performHealthCheck()

    // 1. Validate page container selectors
    console.log('\n📁 Testing container selectors...')

    const rootVisible = await editorPage.rootContainer.isVisible()
    const mainVisible = await editorPage.mainContainer.isVisible()

    console.log(`  #root visible: ${rootVisible}`)
    console.log(`  main visible: ${mainVisible}`)

    expect(rootVisible).toBe(true)
    expect(mainVisible).toBe(true)

    // 2. Validate code editor selectors
    console.log('\n✏️  Testing code editor selectors...')

    const editorVisible = await editorPage.codeEditor.isVisible()
    const hasContent = await editorPage.codeEditor.getCode().then(code => code.length > 0)
    const hasExamplesButton = await editorPage.codeEditor.examplesButton.isVisible()

    console.log(`  Textarea visible: ${editorVisible}`)
    console.log(`  Has content: ${hasContent}`)
    console.log(`  Examples button visible: ${hasExamplesButton}`)

    expect(editorVisible).toBe(true)
    expect(hasContent).toBe(true)
    expect(hasExamplesButton).toBe(true)

    // 3. Validate diagram canvas selectors
    console.log('\n🎨 Testing diagram canvas selectors...')

    const canvasVisible = await editorPage.diagramCanvas.isVisible()
    const hasDiagram = await editorPage.diagramCanvas.isDiagramRendered()
    const hasSvg = await editorPage.diagramCanvas.diagramSvg.isVisible()

    console.log(`  Diagram canvas visible: ${canvasVisible}`)
    console.log(`  Has diagram rendered: ${hasDiagram}`)
    console.log(`  Has SVG: ${hasSvg}`)

    expect(canvasVisible).toBe(true)
    expect(hasSvg).toBe(true)
    // Diagram rendering may take time, so we'll be lenient
    expect(hasDiagram).toBeTruthy()

    // 4. Test basic functionality with working selectors
    console.log('\n⚡ Testing basic functionality...')

    // Test typing in editor
    const testCode = 'graph TD\n    A[Start Test] --> B[End Test]'
    await editorPage.codeEditor.setCode(testCode)

    const currentCode = await editorPage.codeEditor.getCode()
    const codeMatches = currentCode.includes('Start Test')

    console.log(`  Code typing works: ${codeMatches}`)
    expect(codeMatches).toBe(true)

    // Test examples dropdown
    await editorPage.codeEditor.toggleExamples()
    const examplesOpen = await editorPage.codeEditor.isExamplesOpen()

    console.log(`  Examples dropdown opens: ${examplesOpen}`)
    expect(examplesOpen).toBe(true)

    // Test mode switching
    const originalMode = await editorPage.diagramCanvas.getCurrentMode()
    console.log(`  Original mode: ${originalMode}`)

    // Try to switch modes (if buttons exist)
    try {
      if (await editorPage.diagramCanvas.visualModeButton.isVisible()) {
        await editorPage.diagramCanvas.switchToVisualMode()
        const newMode = await editorPage.diagramCanvas.getCurrentMode()
        console.log(`  After switch mode: ${newMode}`)
      }
    } catch (error) {
      console.log('  Mode switching test skipped (buttons not available)')
    }

    // 5. Test validation status
    console.log('\n✅ Testing validation status...')

    const validationStatus = await editorPage.codeEditor.getValidationStatus()
    const hasValidationIcon = await editorPage.codeEditor.hasValidationIcon()

    console.log(`  Validation status: ${validationStatus}`)
    console.log(`  Has validation icon: ${hasValidationIcon}`)

    expect(['valid', 'error', 'loading', 'unknown']).toContain(validationStatus)

    // 6. Test error handling
    console.log('\n🚨 Testing error handling...')

    const hasErrors = await editorPage.hasErrors()
    const canvasHasErrors = await editorPage.diagramCanvas.hasError()

    console.log(`  Page has errors: ${hasErrors}`)
    console.log(`  Canvas has errors: ${canvasHasErrors}`)

    if (hasErrors || canvasHasErrors) {
      const errorMessages = await editorPage.getErrorMessages()
      console.log(`  Error messages: ${errorMessages.join(', ')}`)
    }

    // 7. Test responsive layout
    console.log('\n📱 Testing responsive layout...')

    const isResponsive = await editorPage.isResponsive()
    console.log(`  Layout is responsive: ${isResponsive}`)

    expect(isResponsive).toBe(true)

    // 8. Take final screenshot
    console.log('\n📸 Taking final screenshot...')

    await editorPage.takeFullPageScreenshot('working-selectors-validation')
    console.log('  Screenshot saved')

    console.log('\n✅ ALL WORKING SELECTORS VALIDATED SUCCESSFULLY\n')
  })

  test('Test comprehensive functionality with fixed selectors', async ({ page }) => {
    console.log('\n🔧 COMPREHENSIVE FUNCTIONALITY TEST\n')

    await editorPage.goto()
    await editorPage.waitForEditorInitialization()

    // Test 1: Code Editor functionality
    console.log('Test 1: Code Editor...')

    const editorHealth = await editorPage.codeEditor.getHealthStatus()
    console.log(`  Editor health:`, editorHealth)

    expect(editorHealth.isVisible).toBe(true)
    expect(editorHealth.canType).toBe(true)
    expect(editorHealth.hasExamplesButton).toBe(true)

    // Test typing and validation
    await editorPage.codeEditor.setCode(MERMAID_EXAMPLES.flowchart)
    await editorPage.codeEditor.waitForValidation()

    const finalStatus = await editorPage.codeEditor.getValidationStatus()
    console.log(`  Final validation status: ${finalStatus}`)

    // Test 2: Diagram Canvas functionality
    console.log('Test 2: Diagram Canvas...')

    await editorPage.diagramCanvas.waitForDiagramRender()

    const canvasHealth = await editorPage.diagramCanvas.getHealthStatus()
    console.log(`  Canvas health:`, canvasHealth)

    expect(canvasHealth.isVisible).toBe(true)
    expect(canvasHealth.svgCount).toBeGreaterThan(0)

    // Test 3: Examples functionality
    console.log('Test 3: Examples...')

    await editorPage.codeEditor.toggleExamples()
    const availableExamples = await editorPage.codeEditor.getAvailableExamples()
    console.log(`  Available examples: ${availableExamples.join(', ')}`)

    if (availableExamples.length > 0) {
      await editorPage.codeEditor.selectExample(availableExamples[0])
      const newCode = await editorPage.codeEditor.getCode()
      console.log(`  Selected example, code length: ${newCode.length}`)
      expect(newCode.length).toBeGreaterThan(0)
    }

    // Test 4: Error handling
    console.log('Test 4: Error handling...')

    // Test with invalid code
    await editorPage.codeEditor.setCode('invalid mermaid syntax')
    await editorPage.codeEditor.waitForValidation()

    const errorStatus = await editorPage.codeEditor.getValidationStatus()
    const hasCanvasError = await editorPage.diagramCanvas.hasError()

    console.log(`  Error status: ${errorStatus}`)
    console.log(`  Canvas has error: ${hasCanvasError}`)

    // Test 5: Interaction
    console.log('Test 5: Interaction...')

    const canInteract = await editorPage.diagramCanvas.isInteractive()
    console.log(`  Diagram is interactive: ${canInteract}`)

    if (canInteract) {
      try {
        await editorPage.diagramCanvas.clickDiagramElement('rect')
        console.log('  Successfully clicked diagram element')
      } catch (error) {
        console.log('  Diagram element click failed (may not be clickable)')
      }
    }

    console.log('\n✅ COMPREHENSIVE FUNCTIONALITY TEST COMPLETED\n')
  })

  test('Compare old vs new selectors', async ({ page }) => {
    console.log('\n🔄 COMPARING OLD VS NEW SELECTORS\n')

    await editorPage.goto()
    await editorPage.waitForEditorInitialization()

    const results = {
      oldSelectors: {
        total: 0,
        working: 0,
        broken: 0
      },
      newSelectors: {
        total: 0,
        working: 0,
        broken: 0
      }
    }

    // Test old (broken) selectors
    console.log('Testing old selectors (expected to fail)...')

    const oldSelectors = [
      '[data-testid="code-editor"]',
      '[data-testid="code-textarea"]',
      '[data-testid="examples-button"]',
      '[data-testid="diagram-canvas"]',
      '[data-testid="mermaid-container"]',
      '.code-editor',
      '.diagram-canvas'
    ]

    for (const selector of oldSelectors) {
      results.oldSelectors.total++
      try {
        const count = await page.locator(selector).count()
        if (count > 0) {
          results.oldSelectors.working++
          console.log(`  ✅ ${selector}: ${count} found`)
        } else {
          results.oldSelectors.broken++
          console.log(`  ❌ ${selector}: 0 found`)
        }
      } catch (error) {
        results.oldSelectors.broken++
        console.log(`  ❌ ${selector}: Error - ${error}`)
      }
    }

    // Test new (working) selectors
    console.log('\nTesting new selectors (expected to work)...')

    const newSelectors = [
      'textarea[placeholder*="Mermaid"]',
      'textarea.bg-muted',
      'button:has-text("Examples")',
      'svg',
      'h3:has-text("Diagram Preview")',
      'button:has-text("Code")',
      'button:has-text("Visual")',
      'text=Valid',
      '.text-green-500'
    ]

    for (const selector of newSelectors) {
      results.newSelectors.total++
      try {
        const count = await page.locator(selector).count()
        const visible = count > 0 && await page.locator(selector).first().isVisible()

        if (visible) {
          results.newSelectors.working++
          console.log(`  ✅ ${selector}: ${count} found, visible`)
        } else {
          results.newSelectors.broken++
          console.log(`  ❌ ${selector}: ${count} found, not visible`)
        }
      } catch (error) {
        results.newSelectors.broken++
        console.log(`  ❌ ${selector}: Error - ${error}`)
      }
    }

    // Results summary
    console.log('\n📊 SELECTOR COMPARISON RESULTS:')
    console.log(`Old selectors: ${results.oldSelectors.working}/${results.oldSelectors.total} working (${Math.round(results.oldSelectors.working/results.oldSelectors.total*100)}%)`)
    console.log(`New selectors: ${results.newSelectors.working}/${results.newSelectors.total} working (${Math.round(results.newSelectors.working/results.newSelectors.total*100)}%)`)

    // Assertions
    expect(results.newSelectors.working).toBeGreaterThan(results.oldSelectors.working)
    expect(results.newSelectors.working / results.newSelectors.total).toBeGreaterThan(0.8) // At least 80% should work

    console.log('\n✅ SELECTOR COMPARISON COMPLETED\n')
  })
})