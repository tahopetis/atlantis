import { test as base, expect } from '@playwright/test'
import { HomePage } from '../pages/HomePage'
import { EditorPage } from '../pages/EditorPage'
import { TestHelpers } from './test-helpers'
import { MERMAID_EXAMPLES, VIEWPORTS } from './test-data'

// Define custom fixture types
type CustomFixtures = {
  homePage: HomePage
  editorPage: EditorPage
  helpers: TestHelpers
  mermaidExamples: typeof MERMAID_EXAMPLES
  viewports: typeof VIEWPORTS
}

// Extend base test with custom fixtures
export const test = base.extend<CustomFixtures>({
  // Home page fixture
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page)
    await use(homePage)
  },

  // Editor page fixture
  editorPage: async ({ page }, use) => {
    const editorPage = new EditorPage(page)
    await use(editorPage)
  },

  // Test helpers fixture
  helpers: async ({ page }, use) => {
    const helpers = new TestHelpers(page)
    await use(helpers)
  },

  // Test data fixtures
  mermaidExamples: MERMAID_EXAMPLES,
  viewports: VIEWPORTS
})

// Export expect for convenience
export { expect }

// Test hooks setup
test.beforeEach(async ({ page }) => {
  // Set up global test configurations
  await page.setViewportSize({ width: 1280, height: 720 })

  // Handle any potential alerts/modals
  page.on('dialog', async dialog => {
    await dialog.accept()
  })

  // Monitor for console errors in non-chrome browsers
  if (process.env.CI) {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.warn(`Console error: ${msg.text()}`)
      }
    })
  }
})

test.afterEach(async ({ page, helpers }, testInfo) => {
  // Take screenshot on test failure
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: `test-results/screenshots/${testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}-failed.png`,
      fullPage: true
    })
  }

  // Clean up test environment
  await helpers.cleanup()
})

// Global setup
export async function globalSetup() {
  // Ensure test directories exist
  TestHelpers.ensureTestDirectories()

  // Any global setup logic here
  console.log('Setting up Playwright tests...')
}

// Global teardown
export async function globalTeardown() {
  // Any global cleanup logic here
  console.log('Cleaning up Playwright tests...')
}

// Test annotations for better organization
export const annotations = {
  smoke: { tag: '@smoke' },
  regression: { tag: '@regression' },
  accessibility: { tag: '@accessibility' },
  performance: { tag: '@performance' },
  responsive: { tag: '@responsive' },
  mobile: { tag: '@mobile' },
  desktop: { tag: '@desktop' },
  critical: { tag: '@critical' },
  flaky: { tag: '@flaky' }
}

// Test groups
export const testGroups = {
  mermaid: {
    tag: '@mermaid',
    description: 'Tests for Mermaid.js integration'
  },
  reactFlow: {
    tag: '@reactflow',
    description: 'Tests for React Flow canvas functionality'
  },
  codeEditor: {
    tag: '@editor',
    description: 'Tests for code editor functionality'
  },
  ui: {
    tag: '@ui',
    description: 'Tests for UI/UX features'
  },
  api: {
    tag: '@api',
    description: 'Tests for API integration'
  }
}

// Performance assertions
export const assertPerformance = {
  renderTime: (actual: number, expected: number) => {
    expect(actual).toBeLessThan(expected)
  },
  validationTime: (actual: number, expected: number) => {
    expect(actual).toBeLessThan(expected)
  },
  responseTime: (actual: number, expected: number) => {
    expect(actual).toBeLessThan(expected)
  }
}

// Accessibility assertions
export const assertAccessibility = {
  hasHeadings: async (page: any) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count()
    expect(headings).toBeGreaterThan(0)
  },
  hasAltText: async (page: any) => {
    const imagesWithoutAlt = await page.locator('img:not([alt])').count()
    expect(imagesWithoutAlt).toBe(0)
  },
  hasFocusManagement: async (page: any) => {
    const focusableElements = await page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').count()
    expect(focusableElements).toBeGreaterThan(0)
  }
}

// Accessibility selectors for common elements
export const ACCESSIBILITY_SELECTORS = {
  headings: 'h1, h2, h3, h4, h5, h6',
  images: 'img',
  imagesWithoutAlt: 'img:not([alt])',
  focusableElements: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  landmarks: 'header, nav, main, footer, section, article, aside',
  buttons: 'button, [role="button"]',
  links: 'a[href]',
  forms: 'form, input, textarea, select',
  labels: 'label, [aria-label], [aria-labelledby]'
}