import { test, expect } from '@playwright/test'
import { MERMAID_EXAMPLES } from '../fixtures/test-data'

/**
 * FUNCTIONAL DISCOVERY TEST
 *
 * This test inspects the actual DOM structure of the Atlantis application
 * to identify discrepancies between test expectations and reality.
 *
 * Key goals:
 * 1. Discover what selectors actually work
 * 2. Document the real DOM structure
 * 3. Test basic functionality manually
 * 4. Identify what UI components actually exist
 * 5. Generate recommendations for fixing test infrastructure
 */

test.describe('Functional Discovery - DOM Structure Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console logging to capture any errors
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`)
    })

    page.on('pageerror', error => {
      console.error(`Page Error: ${error.message}`)
    })
  })

  test('Discover actual application structure and selectors', async ({ page }) => {
    console.log('\n🔍 STARTING FUNCTIONAL DISCOVERY TEST\n')

    // Navigate to editor
    await page.goto('http://localhost:3000/editor')

    // Wait for page to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Additional wait for React to render

    console.log('📍 Basic page information:')
    console.log(`URL: ${page.url()}`)
    console.log(`Title: ${await page.title()}`)

    // 1. Check if page loaded at all
    const bodyContent = await page.locator('body').innerHTML()
    console.log(`\n📄 Body content length: ${bodyContent.length} characters`)

    if (bodyContent.length < 1000) {
      console.log('⚠️  Very little content - page might not have loaded properly')
      console.log('Body content preview:', bodyContent.substring(0, 500))
    }

    // 2. Look for common container elements
    console.log('\n🏗️  Testing common container selectors:')

    const containerSelectors = [
      '#root',
      '.app',
      '[data-testid="app"]',
      'main',
      '.container',
      '.layout'
    ]

    for (const selector of containerSelectors) {
      const visible = await page.locator(selector).isVisible().catch(() => false)
      const count = await page.locator(selector).count()
      console.log(`  ${selector}: ${count} found, visible: ${visible}`)
    }

    // 3. Look for editor-specific elements (based on component analysis)
    console.log('\n✏️  Testing code editor selectors:')

    const editorSelectors = [
      // Based on CodeEditor.tsx component
      'textarea',
      'textarea[placeholder*="Mermaid"]',
      'textarea[placeholder*="diagram"]',
      '.font-mono',
      'textarea.bg-muted',
      'textarea.border',
      'button:has-text("Examples")',
      'button:has-text("Copy")',
      'button:has-text("Download")',
      // Test data-testid selectors (might not exist)
      '[data-testid="code-editor"]',
      '[data-testid="code-textarea"]',
      '[data-testid="examples-button"]',
      // Alternative class selectors
      '.code-editor',
      '.code-textarea'
    ]

    for (const selector of editorSelectors) {
      try {
        const count = await page.locator(selector).count()
        const visible = count > 0 && await page.locator(selector).first().isVisible()
        console.log(`  ${selector}: ${count} found, visible: ${visible}`)

        if (count > 0) {
          const element = page.locator(selector).first()
          console.log(`    - First element classes: ${await element.getAttribute('class')}`)
          console.log(`    - First element placeholder: ${await element.getAttribute('placeholder') || 'N/A'}`)
        }
      } catch (error) {
        console.log(`  ${selector}: ERROR - ${error}`)
      }
    }

    // 4. Look for diagram canvas elements
    console.log('\n🎨 Testing diagram canvas selectors:')

    const canvasSelectors = [
      // Based on DiagramCanvas.tsx component
      'h3:has-text("Diagram Preview")',
      'h3:has-text("Mermaid")',
      'button:has-text("Code")',
      'button:has-text("Visual")',
      'button:has-text("Fit to Screen")',
      'button:has-text("Reset")',
      'svg',
      '#mermaid',
      '.mermaid',
      'div[style*="transform: scale"]',
      // Test data-testid selectors
      '[data-testid="diagram-canvas"]',
      '[data-testid="mermaid-container"]',
      '[data-testid="zoom-controls"]',
      // Alternative selectors
      '.diagram-canvas',
      '.diagram-container'
    ]

    for (const selector of canvasSelectors) {
      try {
        const count = await page.locator(selector).count()
        const visible = count > 0 && await page.locator(selector).first().isVisible()
        console.log(`  ${selector}: ${count} found, visible: ${visible}`)

        if (count > 0 && selector.includes('svg')) {
          const svg = page.locator(selector).first()
          console.log(`    - SVG elements inside: ${await svg.locator('*').count()}`)
        }
      } catch (error) {
        console.log(`  ${selector}: ERROR - ${error}`)
      }
    }

    // 5. Look for status/validation indicators
    console.log('\n✅ Testing validation/status selectors:')

    const statusSelectors = [
      'text=Valid',
      'text=Error',
      'text=Validating',
      'text=Loading...',
      '.text-green-500',
      '.text-destructive',
      '.animate-spin',
      'svg[data-lucide="check-circle"]',
      'svg[data-lucide="alert-circle"]',
      '[data-testid="status-indicator"]',
      '[data-testid="validation-icon"]'
    ]

    for (const selector of statusSelectors) {
      try {
        const count = await page.locator(selector).count()
        const visible = count > 0 && await page.locator(selector).first().isVisible()
        console.log(`  ${selector}: ${count} found, visible: ${visible}`)
      } catch (error) {
        console.log(`  ${selector}: ERROR - ${error}`)
      }
    }

    // 6. Test actual functionality - typing in editor
    console.log('\n⌨️  Testing actual editor functionality:')

    const textareas = await page.locator('textarea').count()
    console.log(`  Found ${textareas} textarea(s)`)

    if (textareas > 0) {
      const textarea = page.locator('textarea').first()

      try {
        // Test if textarea is editable
        await textarea.focus()
        const initialValue = await textarea.inputValue()
        console.log(`  Initial textarea value length: ${initialValue.length}`)

        if (initialValue.length > 0) {
          console.log(`  Initial value preview: ${initialValue.substring(0, 100)}...`)
        }

        // Type some test content
        const testCode = 'graph TD\n    A[Start] --> B[End]'
        await textarea.fill(testCode)

        // Verify the content was set
        const newValue = await textarea.inputValue()
        console.log(`  After typing, value length: ${newValue.length}`)
        console.log(`  Value matches test code: ${newValue.includes('graph TD')}`)

        // Wait a moment for validation
        await page.waitForTimeout(1000)

        // Check if any validation indicators appear
        const validationIndicators = await page.locator('.text-green-500, .text-destructive, .animate-spin').count()
        console.log(`  Validation indicators found: ${validationIndicators}`)

      } catch (error) {
        console.log(`  ❌ Textarea interaction failed: ${error}`)
      }
    } else {
      console.log('  ❌ No textareas found - editor component might not be rendered')
    }

    // 7. Test button functionality
    console.log('\n🔘 Testing button functionality:')

    const buttons = await page.locator('button').count()
    console.log(`  Found ${buttons} button(s)`)

    if (buttons > 0) {
      for (let i = 0; i < Math.min(buttons, 10); i++) {
        const button = page.locator('button').nth(i)
        try {
          const text = await button.textContent()
          const visible = await button.isVisible()
          const enabled = await button.isEnabled()
          console.log(`  Button ${i}: "${text?.trim()}" - visible: ${visible}, enabled: ${enabled}`)
        } catch (error) {
          console.log(`  Button ${i}: ERROR - ${error}`)
        }
      }
    }

    // 8. Capture DOM structure for key areas
    console.log('\n🌳 Capturing DOM structure:')

    try {
      // Get the main layout structure
      const mainStructure = await page.evaluate(() => {
        const body = document.body
        if (!body) return 'No body element found'

        function getElementInfo(element: Element, depth: number = 0): any {
          if (depth > 3) return '...'

          const info = {
            tag: element.tagName.toLowerCase(),
            classes: element.className,
            id: element.id,
            textContent: element.textContent?.substring(0, 50).trim(),
            children: []
          }

          for (let i = 0; i < Math.min(element.children.length, 3); i++) {
            info.children.push(getElementInfo(element.children[i], depth + 1))
          }

          return info
        }

        return getElementInfo(body)
      })

      console.log('  Main DOM structure:', JSON.stringify(mainStructure, null, 2))

    } catch (error) {
      console.log(`  ❌ DOM structure capture failed: ${error}`)
    }

    // 9. Check for error states or loading states
    console.log('\n🚨 Checking for error or loading states:')

    const errorIndicators = [
      'text=error',
      'text=Error',
      'text=failed',
      'text=Failed',
      '.error',
      '[data-testid="error"]',
      'text=loading',
      'text=Loading',
      '.loading',
      '[data-testid="loading"]'
    ]

    for (const selector of errorIndicators) {
      try {
        const count = await page.locator(selector).count()
        if (count > 0) {
          console.log(`  Found ${count} instances of: ${selector}`)
        }
      } catch (error) {
        // Ignore errors for this check
      }
    }

    // 10. Take screenshots for visual inspection
    console.log('\n📸 Taking screenshots for inspection:')

    try {
      await page.screenshot({
        path: 'test-results/discovery-full-page.png',
        fullPage: true
      })
      console.log('  ✅ Full page screenshot saved')

      // Try to get specific component screenshots if they exist
      const textareas = page.locator('textarea')
      if (await textareas.count() > 0) {
        await textareas.first().screenshot({
          path: 'test-results/discovery-textarea.png'
        })
        console.log('  ✅ Textarea screenshot saved')
      }

      const svgs = page.locator('svg')
      if (await svgs.count() > 0) {
        await svgs.first().screenshot({
          path: 'test-results/discovery-svg.png'
        })
        console.log('  ✅ SVG screenshot saved')
      }

    } catch (error) {
      console.log(`  ❌ Screenshot failed: ${error}`)
    }

    console.log('\n🏁 FUNCTIONAL DISCOVERY TEST COMPLETED\n')
  })

  test('Test basic functionality with actual working selectors', async ({ page }) => {
    console.log('\n🧪 TESTING BASIC FUNCTIONALITY\n')

    await page.goto('http://localhost:3000/editor')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Try to find and interact with the editor using multiple selector strategies
    let editorFound = false
    let editorSelector = ''

    const editorSelectorStrategies = [
      'textarea',
      'textarea[placeholder*="Mermaid"]',
      'textarea[placeholder*="diagram"]',
      '.font-mono',
      'textarea.bg-muted'
    ]

    for (const selector of editorSelectorStrategies) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        const visible = await page.locator(selector).first().isVisible()
        if (visible) {
          editorFound = true
          editorSelector = selector
          console.log(`✅ Found editor with selector: ${selector}`)
          break
        }
      }
    }

    if (!editorFound) {
      console.log('❌ No working editor selector found')
      test.skip()
      return
    }

    const editor = page.locator(editorSelector).first()

    // Test 1: Clear and type simple diagram
    console.log('Test 1: Typing simple diagram...')
    await editor.clear()
    await editor.fill('graph TD\n    A[Start] --> B[End]')
    await page.waitForTimeout(1000)

    const currentValue = await editor.inputValue()
    console.log(`  Editor content: ${currentValue}`)

    // Test 2: Look for examples button
    console.log('Test 2: Finding examples button...')
    const exampleButtonSelectors = [
      'button:has-text("Examples")',
      'button:has-text("Example")',
      'button[class*="example"]',
      '[data-testid="examples-button"]'
    ]

    let examplesButtonFound = false
    for (const selector of exampleButtonSelectors) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        const visible = await page.locator(selector).first().isVisible()
        if (visible) {
          examplesButtonFound = true
          console.log(`✅ Found examples button with selector: ${selector}`)

          // Try clicking it
          try {
            await page.locator(selector).first().click()
            await page.waitForTimeout(500)
            console.log('  ✅ Examples button clicked successfully')

            // Look for dropdown content
            const dropdownSelectors = [
              '.dropdown',
              '.menu',
              '[data-testid="examples-dropdown"]',
              'div[class*="example"]'
            ]

            for (const dropdownSelector of dropdownSelectors) {
              const count = await page.locator(dropdownSelector).count()
              if (count > 0) {
                console.log(`  ✅ Found examples dropdown with selector: ${dropdownSelector}`)
                break
              }
            }

          } catch (error) {
            console.log(`  ❌ Examples button click failed: ${error}`)
          }
          break
        }
      }
    }

    if (!examplesButtonFound) {
      console.log('❌ No examples button found')
    }

    // Test 3: Look for diagram rendering area
    console.log('Test 3: Finding diagram rendering area...')
    const diagramSelectors = [
      'svg',
      '#mermaid',
      '.mermaid',
      'div[style*="transform"]',
      'h3:has-text("Diagram")'
    ]

    let diagramFound = false
    for (const selector of diagramSelectors) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        const visible = await page.locator(selector).first().isVisible()
        if (visible) {
          diagramFound = true
          console.log(`✅ Found diagram area with selector: ${selector}`)

          if (selector === 'svg') {
            const svgContent = await page.locator(selector).first().innerHTML()
            console.log(`  SVG content length: ${svgContent.length} characters`)
          }
          break
        }
      }
    }

    if (!diagramFound) {
      console.log('❌ No diagram rendering area found')
    }

    // Test 4: Look for mode switching
    console.log('Test 4: Finding mode switching controls...')
    const modeSelectors = [
      'button:has-text("Code")',
      'button:has-text("Visual")',
      'button:has-text("Preview")',
      '[data-testid="mode-toggle"]'
    ]

    let modeControlsFound = false
    for (const selector of modeSelectors) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        const visible = await page.locator(selector).first().isVisible()
        if (visible) {
          modeControlsFound = true
          console.log(`✅ Found mode controls with selector: ${selector}`)
          break
        }
      }
    }

    if (!modeControlsFound) {
      console.log('❌ No mode controls found')
    }

    console.log('\n🏁 BASIC FUNCTIONALITY TEST COMPLETED\n')
  })

  test('Generate comprehensive selector report', async ({ page }) => {
    console.log('\n📊 GENERATING SELECTOR REPORT\n')

    await page.goto('http://localhost:3000/editor')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const report = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      pageContent: {
        bodyLength: 0,
        hasContent: false
      },
      workingSelectors: {
        containers: [],
        editors: [],
        buttons: [],
        diagrams: [],
        status: []
      },
      brokenSelectors: {
        containers: [],
        editors: [],
        buttons: [],
        diagrams: [],
        status: []
      },
      functionality: {
        typing: false,
        buttonsClickable: false,
        diagramRenders: false,
        modeSwitching: false
      }
    }

    // Analyze page content
    const bodyContent = await page.locator('body').innerHTML()
    report.pageContent.bodyLength = bodyContent.length
    report.pageContent.hasContent = bodyContent.length > 1000

    // Test selectors systematically
    const selectorTests = {
      containers: [
        '#root',
        '.app',
        'main',
        '[data-testid="app"]',
        '.container',
        '.layout'
      ],
      editors: [
        'textarea',
        'textarea[placeholder*="Mermaid"]',
        '[data-testid="code-editor"]',
        '.code-editor',
        '.font-mono textarea'
      ],
      buttons: [
        'button',
        'button:has-text("Examples")',
        'button:has-text("Code")',
        'button:has-text("Visual")',
        '[data-testid="examples-button"]'
      ],
      diagrams: [
        'svg',
        '#mermaid',
        '.mermaid',
        '[data-testid="diagram-canvas"]',
        '.diagram-canvas'
      ],
      status: [
        '.text-green-500',
        '.text-destructive',
        '[data-testid="status-indicator"]',
        'text=Valid',
        'text=Error'
      ]
    }

    for (const [category, selectors] of Object.entries(selectorTests)) {
      for (const selector of selectors) {
        try {
          const count = await page.locator(selector).count()
          const visible = count > 0 && await page.locator(selector).first().isVisible()

          if (count > 0 && visible) {
            report.workingSelectors[category].push({
              selector,
              count,
              hasAttributes: await page.locator(selector).first().evaluate(el =>
                Object.keys(el.attributes).length > 0
              )
            })
          } else {
            report.brokenSelectors[category].push({
              selector,
              count,
              reason: count === 0 ? 'not found' : 'not visible'
            })
          }
        } catch (error) {
          report.brokenSelectors[category].push({
            selector,
            count: 0,
            reason: `error: ${error}`
          })
        }
      }
    }

    // Test basic functionality
    try {
      const textarea = page.locator('textarea').first()
      if (await textarea.isVisible()) {
        await textarea.fill('graph TD\n    A --> B')
        const value = await textarea.inputValue()
        report.functionality.typing = value.includes('graph TD')
      }
    } catch (error) {
      console.log('Typing test failed:', error)
    }

    try {
      const buttons = page.locator('button').filter({ hasText: 'Examples' })
      if (await buttons.count() > 0) {
        await buttons.first().click()
        report.functionality.buttonsClickable = true
      }
    } catch (error) {
      console.log('Button click test failed:', error)
    }

    try {
      const svg = page.locator('svg').first()
      if (await svg.isVisible()) {
        const hasContent = await svg.evaluate(el => el.children.length > 0)
        report.functionality.diagramRenders = hasContent
      }
    } catch (error) {
      console.log('Diagram render test failed:', error)
    }

    // Save report
    const reportPath = 'test-results/selector-report.json'
    await page.evaluate((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'selector-report.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, report)

    console.log('📋 SELECTOR REPORT GENERATED')
    console.log('  Working container selectors:', report.workingSelectors.containers.length)
    console.log('  Working editor selectors:', report.workingSelectors.editors.length)
    console.log('  Working button selectors:', report.workingSelectors.buttons.length)
    console.log('  Working diagram selectors:', report.workingSelectors.diagrams.length)
    console.log('  Working status selectors:', report.workingSelectors.status.length)
    console.log('')
    console.log('  Functionality tests:')
    console.log('    Typing works:', report.functionality.typing)
    console.log('    Buttons clickable:', report.functionality.buttonsClickable)
    console.log('    Diagram renders:', report.functionality.diagramRenders)

    // Write report to file system for persistence
    const fs = require('fs')
    const path = require('path')
    const reportDir = path.dirname(reportPath)

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`  Report saved to: ${reportPath}`)

    console.log('\n🏁 SELECTOR REPORT COMPLETED\n')
  })
})