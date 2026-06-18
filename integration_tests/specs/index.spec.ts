import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login } from '../testUtils'
import IndexPage from '../pages/indexPage'

test.describe('Index Page', () => {
  test('Should display prisoner finance title and view prisoner finances card', async ({ page }) => {
    await login(page)

    const index = await IndexPage.verifyOnPage(page)
    expect(index.heading).toBeVisible()
    expect(index.heading).toContainText('Prisoner Finance')

    expect(index.viewPrisonerFinanceCard).toBeVisible()
    expect(index.viewPrisonerFinanceCard.locator('h2')).toContainText('View prisoner finances')
    expect(index.viewPrisonerFinanceCard.locator('p')).toContainText(
      "View transactions and balances for a prisoner's accounts.",
    )
    expect(index.viewPrisonerFinanceCard.locator('a')).toHaveAttribute('href', '/prisoner')
  })

  test('Should not have any automatically detectable WCAG A or AA violations', async ({ page }) => {
    await login(page)

    await IndexPage.verifyOnPage(page)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Should display grant bonus to prisoner card', async ({ page }) => {
    await login(page)

    const index = await IndexPage.verifyOnPage(page)

    expect(index.grantBonusToPrisonersCard).toBeVisible()
    expect(index.grantBonusToPrisonersCard.locator('h2')).toContainText('Grant a bonus to prisoners')
    expect(index.grantBonusToPrisonersCard.locator('p')).toContainText(
      'Batch process a bonus grant to all prisoners in your caseload.',
    )
    expect(index.grantBonusToPrisonersCard.locator('a')).toHaveAttribute('href', '/grant-bonus-to-prisoners')
  })
})
