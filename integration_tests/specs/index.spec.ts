import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login } from '../testUtils'

test.describe('Index Page', () => {
  test('Should display prisoner finance title and card', async ({ page }) => {
    await login(page)

    const heading = page.locator('h1')
    const card = page.locator('[data-qa="view-prisoner-finance-card"]')

    expect(heading).toBeVisible()
    expect(heading).toContainText('Prisoner Finance')
    expect(card).toBeVisible()
    expect(card.locator('h2')).toContainText('View prisoner finances')
    expect(card.locator('p')).toContainText("View transactions and balances for a prisoner's accounts.")
    expect(card.locator('a')).toHaveAttribute('href', '/404')
  })

  test('Should not have any automatically detectable WCAG A or AA violations', async ({ page }) => {
    await login(page)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
