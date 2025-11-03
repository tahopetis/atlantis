import { chromium, FullConfig } from '@playwright/test'
import path from 'path'
import fs from 'fs'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...')

  // Get browser configuration
  const browserName = config.projects?.[0]?.use?.browserName || 'chromium'

  // Launch browser for setup tasks
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate to the application to ensure it's running
    const baseURL = config.webServer?.url || 'http://localhost:3000'
    console.log(`🌐 Checking application at ${baseURL}`)

    await page.goto(baseURL, { waitUntil: 'networkidle' })

    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded')

    // Check if the application is properly loaded
    const title = await page.title()
    console.log(`📱 Application loaded: ${title}`)

    // Verify critical elements are present
    const hasMainContent = await page.locator('body').isVisible()
    if (!hasMainContent) {
      throw new Error('Application did not load properly')
    }

    console.log('✅ Application is ready for testing')

    // Pre-warm the application by visiting key pages
    console.log('🔥 Pre-warming application caches...')

    try {
      await page.goto(`${baseURL}/editor`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
      console.log('✅ Editor page pre-warmed')
    } catch (error) {
      console.warn('⚠️ Could not pre-warm editor page:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Create test data directories
    console.log('📁 Creating test directories...')
    const testDirs = [
      'test-results',
      'test-results/screenshots',
      'test-results/downloads',
      'test-results/videos',
      'test-results/traces',
      'test-results/reports'
    ]

    testDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir)
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
        console.log(`📁 Created directory: ${dir}`)
      }
    })

    // Set up any global state or environment variables
    process.env.TEST_STARTED_AT = new Date().toISOString()
    process.env.TEST_RUN_ID = `test-${Date.now()}`

    console.log('✅ Global setup completed successfully')

  } catch (error) {
    console.error('❌ Global setup failed:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

export default globalSetup