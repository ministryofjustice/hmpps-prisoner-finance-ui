import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login } from '../testUtils'
import IndexPage from '../pages/indexPage'

test.describe('Index Page', () => {
  test('Should display prisoner finance title and card', async ({ page }) => {
    await login(page)

    const index = await IndexPage.verifyOnPage(page)
    expect(index.heading).toBeVisible()
    expect(index.heading).toContainText('Prisoner Finance')

    expect(index.card).toBeVisible()
    expect(index.card.locator('h2')).toContainText('View prisoner finances')
    expect(index.card.locator('p')).toContainText("View transactions and balances for a prisoner's accounts.")
    expect(index.card.locator('a')).toHaveAttribute('href', '/404')
  })

  test('Should not have any automatically detectable WCAG A or AA violations', async ({ page }) => {
    await login(page)

    await IndexPage.verifyOnPage(page)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
