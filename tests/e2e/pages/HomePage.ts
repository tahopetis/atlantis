import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class HomePage extends BasePage {
  // Locators
  readonly headerTitle: Locator
  readonly editorLink: Locator
  readonly navigationMenu: Locator
  readonly featuresSection: Locator

  constructor(page: Page) {
    super(page)
    this.headerTitle = page.locator('h1, .main-title')
    this.editorLink = page.locator('a[href*="editor"], button:has-text("Start Creating"), .editor-link')
    this.navigationMenu = page.locator('nav, .navigation')
    this.featuresSection = page.locator('.features, [data-testid="features"]')
  }

  /**
   * Navigate to the home page
   */
  async goto(): Promise<void> {
    await this.goto('')
    await this.waitForPageLoad()
  }

  /**
   * Check if home page is loaded
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForElement('body', 5000)
      return await this.isVisible('body')
    } catch {
      return false
    }
  }

  /**
   * Navigate to the editor
   */
  async navigateToEditor(): Promise<void> {
    await this.clickAndWait('[href*="editor"], button:has-text("Start Creating")', true)
  }

  /**
   * Get the main title text
   */
  async getTitle(): Promise<string> {
    return await this.getText('h1')
  }

  /**
   * Check if navigation menu is present
   */
  async hasNavigation(): Promise<boolean> {
    return await this.exists('nav, .navigation')
  }

  /**
   * Check if features section is present
   */
  async hasFeaturesSection(): Promise<boolean> {
    return await this.exists('.features, [data-testid="features"]')
  }

  /**
   * Click on a specific feature card
   */
  async clickFeatureCard(featureName: string): Promise<void> {
    await this.page.locator(`.feature-card:has-text("${featureName}")`).click()
  }

  /**
   * Get list of available features
   */
  async getAvailableFeatures(): Promise<string[]> {
    const featureCards = this.page.locator('.feature-card, .feature-item')
    const count = await featureCards.count()
    const features: string[] = []

    for (let i = 0; i < count; i++) {
      const text = await featureCards.nth(i).textContent()
      if (text) {
        features.push(text.trim())
      }
    }

    return features
  }
}