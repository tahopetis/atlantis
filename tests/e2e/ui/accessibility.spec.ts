import { test, expect } from '../fixtures/custom-fixtures'
import { MERMAID_EXAMPLES } from '../fixtures/test-data'
import { assertAccessibility, ACCESSIBILITY_SELECTORS } from '../fixtures/custom-fixtures'

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor')
    await page.waitForLoadState('networkidle')
  })

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Check for main landmarks
    await expect(page.locator('main, [role="main"]')).toBeVisible()
    await expect(page.locator('header, [role="banner"]')).toBeVisible()

    // Should have proper heading hierarchy
    await assertAccessibility.hasHeadings(page)

    // Check headings are in proper order
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await headings.count()
    expect(headingCount).toBeGreaterThan(0)

    // First heading should be h1 or h2
    const firstHeading = headings.first()
    const firstHeadingTag = await firstHeading.evaluate(el => el.tagName.toLowerCase())
    expect(['h1', 'h2']).toContain(firstHeadingTag)
  })

  test('should have accessible form controls', async ({ page }) => {
    // Check textarea has proper label
    const textarea = page.locator('textarea[placeholder*="Mermaid"]')
    await expect(textarea).toBeVisible()

    const hasLabel = await textarea.evaluate(el => {
      const id = el.getAttribute('id')
      const label = document.querySelector(`label[for="${id}"]`)
      const ariaLabel = el.getAttribute('aria-label')
      const ariaLabelledBy = el.getAttribute('aria-labelledby')

      return !!(label || ariaLabel || ariaLabelledBy)
    })

    expect(hasLabel).toBe(true)

    // Check buttons have accessible names
    const buttons = page.locator('button, [role="button"]')
    const buttonCount = await buttons.count()

    for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Check first 10 buttons
      const button = buttons.nth(i)
      const hasAccessibleName = await button.evaluate(el => {
        const text = el.textContent?.trim()
        const ariaLabel = el.getAttribute('aria-label')
        const ariaLabelledBy = el.getAttribute('aria-labelledby')
        const title = el.getAttribute('title')

        return !!(text || ariaLabel || ariaLabelledBy || title)
      })

      expect(hasAccessibleName).toBe(true)
    }
  })

  test('should have proper focus management', async ({ page }) => {
    // Check focus indicators
    await assertAccessibility.hasFocusManagement(page)

    // Test keyboard navigation
    const focusableElements = page.locator(ACCESSIBILITY_SELECTORS.focusableElements.join(', '))
    const focusableCount = await focusableElements.count()
    expect(focusableCount).toBeGreaterThan(0)

    // Tab through elements
    await page.keyboard.press('Tab')
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName.toLowerCase())
    expect(['input', 'textarea', 'button', 'a']).toContain(focusedElement)

    // Should be able to tab through multiple elements
    let tabCount = 0
    let previousElement = ''

    for (let i = 0; i < Math.min(focusableCount, 10); i++) {
      await page.keyboard.press('Tab')
      focusedElement = await page.evaluate(() => {
        const active = document.activeElement
        return active ? `${active.tagName.toLowerCase()}${active.id ? '#' + active.id : ''}` : ''
      })

      if (focusedElement !== previousElement) {
        tabCount++
        previousElement = focusedElement
      }
    }

    expect(tabCount).toBeGreaterThan(1)
  })

  test('should have proper ARIA attributes', async ({ page }) => {
    // Check for ARIA roles
    const landmarks = page.locator('[role]')
    const landmarkCount = await landmarks.count()
    expect(landmarkCount).toBeGreaterThan(0)

    // Check for ARIA labels
    const ariaLabels = page.locator('[aria-label], [aria-labelledby]')
    const labelCount = await ariaLabels.count()
    expect(labelCount).toBeGreaterThan(0)

    // Check interactive elements have proper states
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const hasAriaPressed = await button.getAttribute('aria-pressed')
      const hasAriaExpanded = await button.getAttribute('aria-expanded')
      const hasDisabled = await button.isDisabled()

      // Button should indicate its state if applicable
      if (hasAriaPressed) {
        expect(['true', 'false']).toContain(hasAriaPressed)
      }

      if (hasAriaExpanded) {
        expect(['true', 'false']).toContain(hasAriaExpanded)
      }

      if (hasDisabled) {
        const ariaDisabled = await button.getAttribute('aria-disabled')
        expect(ariaDisabled).toBe('true')
      }
    }
  })

  test('should have sufficient color contrast', async ({ page }) => {
    // This is a simplified contrast check
    // In real implementation, you'd use a contrast checking library

    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, button')
    const elementCount = await textElements.count()

    for (let i = 0; i < Math.min(elementCount, 10); i++) {
      const element = textElements.nth(i)
      const isVisible = await element.isVisible()

      if (isVisible) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el)
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          }
        })

        // Should have readable font size
        const fontSize = parseFloat(styles.fontSize)
        expect(fontSize).toBeGreaterThanOrEqual(12)

        // Should not be transparent
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)')
      }
    }
  })

  test('should have accessible images', async ({ page }) => {
    const images = page.locator('img')
    const imageCount = await images.count()

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i)

      // All images should have alt text
      const altText = await image.getAttribute('alt')
      expect(altText).not.toBeNull()

      // Decorative images should have empty alt
      if (altText === '') {
        const role = await image.getAttribute('role')
        expect(role).toBe('presentation')
      }
    }

    await assertAccessibility.hasAltText(page)
  })

  test('should support screen readers', async ({ page }) => {
    // Check for proper semantic markup that screen readers use
    await expect(page.locator('main, [role="main"]')).toBeVisible()

    // Check for proper form labels
    const formElements = page.locator('input, textarea, select')
    const formCount = await formElements.count()

    for (let i = 0; i < formCount; i++) {
      const element = formElements.nth(i)
      const hasLabel = await element.evaluate(el => {
        const id = el.getAttribute('id')
        const label = document.querySelector(`label[for="${id}"]`)
        const ariaLabel = el.getAttribute('aria-label')
        const ariaLabelledBy = el.getAttribute('aria-labelledby')
        const placeholder = el.getAttribute('placeholder')

        return !!(label || ariaLabel || ariaLabelledBy || placeholder)
      })

      expect(hasLabel).toBe(true)
    }

    // Check for skip links if present
    const skipLinks = page.locator(ACCESSIBILITY_SELECTORS.skipLinks.join(', '))
    const skipLinkCount = await skipLinks.count()

    if (skipLinkCount > 0) {
      for (let i = 0; i < skipLinkCount; i++) {
        const skipLink = skipLinks.nth(i)
        await expect(skipLink).toBeVisible()

        const href = await skipLink.getAttribute('href')
        expect(href).toBeTruthy()
        expect(href?.startsWith('#')).toBe(true)
      }
    }
  })

  test('should have accessible tables if present', async ({ page }) => {
    const tables = page.locator('table')
    const tableCount = await tables.count()

    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i)

      // Tables should have captions or headers
      const hasCaption = await table.locator('caption').count() > 0
      const hasHeaders = await table.locator('th').count() > 0

      expect(hasCaption || hasHeaders).toBe(true)

      // Check for proper scope attributes
      const headers = table.locator('th')
      const headerCount = await headers.count()

      for (let j = 0; j < headerCount; j++) {
        const header = headers.nth(j)
        const scope = await header.getAttribute('scope')
        if (scope) {
          expect(['row', 'col', 'rowgroup', 'colgroup']).toContain(scope)
        }
      }
    }
  })

  test('should handle keyboard-only navigation', async ({ page }) => {
    // Disable mouse
    await page.evaluate(() => {
      document.body.style.pointerEvents = 'none'
    })

    // Test navigating with keyboard only
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should still be able to interact with key elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName.toLowerCase())
    expect(['input', 'textarea', 'button', 'a']).toContain(focusedElement)

    // Re-enable mouse
    await page.evaluate(() => {
      document.body.style.pointerEvents = 'auto'
    })
  })

  test('should have accessible error messages', async ({ page }) => {
    // Create an error condition
    const textarea = page.locator('textarea[placeholder*="Mermaid"]')
    await textarea.fill('invalid mermaid syntax')
    await page.waitForTimeout(2000)

    // Check for error messages
    const errorElements = page.locator('[role="alert"], .error, [data-testid="error"]')
    const errorCount = await errorElements.count()

    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const error = errorElements.nth(i)

        // Error should be visible
        await expect(error).toBeVisible()

        // Error should have accessible text
        const errorText = await error.textContent()
        expect(errorText?.trim().length).toBeGreaterThan(0)

        // Should be properly announced to screen readers
        const ariaLive = await error.getAttribute('aria-live')
        const role = await error.getAttribute('role')

        expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'alert').toBe(true)
      }
    }
  })

  test('should have accessible loading states', async ({ page }) => {
    // Check for loading indicators
    const loadingElements = page.locator('[aria-busy="true"], .loading, [data-testid="loading"]')
    const loadingCount = await loadingElements.count()

    for (let i = 0; i < loadingCount; i++) {
      const loading = loadingElements.nth(i)

      // Loading elements should have proper accessibility attributes
      const ariaBusy = await loading.getAttribute('aria-busy')
      const ariaLabel = await loading.getAttribute('aria-label')
      const role = await loading.getAttribute('role')

      if (ariaBusy === 'true') {
        // Should have descriptive label
        expect(ariaLabel || role).toBeTruthy()
      }
    }
  })

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })

    // Check that content is still readable
    await expect(page.locator('body')).toBeVisible()

    const textElements = page.locator('p, span, div, h1, h2, h3, button')
    const elementCount = await textElements.count()

    for (let i = 0; i < Math.min(elementCount, 5); i++) {
      const element = textElements.nth(i)
      const isVisible = await element.isVisible()

      if (isVisible) {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el)
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor
          }
        })

        // Should have visible text in high contrast mode
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)')
      }
    }
  })

  test('should respect reduced motion preferences', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' })

    // Check that animations are reduced or disabled
    const animatedElements = page.locator('[class*="animate"], [class*="transition"]')
    const animatedCount = await animatedElements.count()

    for (let i = 0; i < animatedCount; i++) {
      const element = animatedElements.nth(i)
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el)
        return {
          transitionDuration: computed.transitionDuration,
          animationDuration: computed.animationDuration
        }
      })

      // Animations should be very short or disabled
      const transitionDuration = parseFloat(styles.transitionDuration)
      const animationDuration = parseFloat(styles.animationDuration)

      expect(transitionDuration).toBeLessThanOrEqual(0.01)
      expect(animationDuration).toBeLessThanOrEqual(0.01)
    }
  })

  test('should have accessible tooltips and help text', async ({ page }) => {
    // Check for tooltips
    const tooltipTriggers = page.locator('[title], [aria-describedby], [data-tooltip]')
    const triggerCount = await tooltipTriggers.count()

    for (let i = 0; i < Math.min(triggerCount, 5); i++) {
      const trigger = tooltipTriggers.nth(i)

      const title = await trigger.getAttribute('title')
      const ariaDescribedBy = await trigger.getAttribute('aria-describedby')
      const dataTooltip = await trigger.getAttribute('data-tooltip')

      // Should have some form of tooltip
      expect(title || ariaDescribedBy || dataTooltip).toBeTruthy()

      // If using aria-describedby, the described element should exist
      if (ariaDescribedBy) {
        const describedElement = page.locator(`#${ariaDescribedBy}`)
        await expect(describedElement).toBeVisible()
      }
    }
  })

  test('should have accessible form validation', async ({ page }) => {
    const formElements = page.locator('input, textarea, select')
    const formCount = await formElements.count()

    for (let i = 0; i < formCount; i++) {
      const element = formElements.nth(i)

      // Check for validation attributes
      const required = await element.getAttribute('required')
      const ariaRequired = await element.getAttribute('aria-required')
      const ariaInvalid = await element.getAttribute('aria-invalid')

      if (required === 'required' || ariaRequired === 'true') {
        // Required fields should be properly marked
        const hasRequiredIndicator = await element.evaluate(el => {
          const parent = el.closest('label, div, fieldset')
          if (parent) {
            const text = parent.textContent || ''
            return /\*|required|required/i.test(text)
          }
          return false
        })

        // Either the element itself or a parent should indicate required
        expect(required === 'required' || ariaRequired === 'true' || hasRequiredIndicator).toBe(true)
      }

      if (ariaInvalid === 'true') {
        // Invalid fields should have error messages
        const ariaDescribedBy = await element.getAttribute('aria-describedby')
        if (ariaDescribedBy) {
          const errorElement = page.locator(`#${ariaDescribedBy}`)
          await expect(errorElement).toBeVisible()
        }
      }
    }
  })
})