import { FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...')

  try {
    // Log test completion
    const testEndTime = new Date().toISOString()
    console.log(`✅ Tests completed at: ${testEndTime}`)

    // Clean up temporary files
    const tempDirs = [
      path.join(process.cwd(), 'test-results/temp'),
      path.join(process.cwd(), 'test-results/cache')
    ]

    tempDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        try {
          fs.rmSync(dir, { recursive: true, force: true })
          console.log(`🗑️ Cleaned up temporary directory: ${dir}`)
        } catch (error) {
          console.warn(`⚠️ Could not clean up directory ${dir}:`, error instanceof Error ? error.message : 'Unknown error')
        }
      }
    })

    // Generate test summary report
    await generateTestSummary(config)

    // Clean up environment variables
    delete process.env.TEST_STARTED_AT
    delete process.env.TEST_RUN_ID

    console.log('✅ Global teardown completed successfully')

  } catch (error) {
    console.error('❌ Global teardown failed:', error instanceof Error ? error.message : 'Unknown error')
    // Don't throw error in teardown to avoid masking test failures
  }
}

async function generateTestSummary(config: FullConfig) {
  try {
    const reportDir = path.join(process.cwd(), 'test-results/reports')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const summary = {
      testRunId: process.env.TEST_RUN_ID || 'unknown',
      startTime: process.env.TEST_STARTED_AT || 'unknown',
      endTime: new Date().toISOString(),
      config: {
        browserName: config.projects?.[0]?.use?.browserName || 'unknown',
        headless: config.projects?.[0]?.use?.headless !== false,
        timeout: config.timeout || 60000,
        retries: config.retries || 0
      },
      artifacts: {
        screenshots: path.join(process.cwd(), 'test-results/screenshots'),
        downloads: path.join(process.cwd(), 'test-results/downloads'),
        videos: path.join(process.cwd(), 'test-results/videos'),
        traces: path.join(process.cwd(), 'test-results/traces')
      }
    }

    const summaryPath = path.join(reportDir, 'test-summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    console.log(`📊 Test summary generated: ${summaryPath}`)

  } catch (error) {
    console.warn('⚠️ Could not generate test summary:', error instanceof Error ? error.message : 'Unknown error')
  }
}

export default globalTeardown