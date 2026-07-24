import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login, resetStubs } from '../testUtils'
import PageNotFoundErrorPage from '../pages/pageNotFoundErrorPage'

test.describe('Page not found', () => {
  const unknownPath = '/this-page-does-not-exist'

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test('shows the Page not found page for an unmatched route', async ({ page }) => {
    const response = await page.goto(unknownPath)
    expect(response?.status()).toBe(404)

    await PageNotFoundErrorPage.verifyOnPage(page, unknownPath)

    const backLink = page.getByRole('link', { name: 'Back', exact: true })
    await expect(backLink).toHaveAttribute('href', '/')

    await expect(page.getByText('If you typed the web address, check it is correct.')).toBeVisible()
    await expect(page.getByText('If you pasted the web address, check you copied it correctly.')).toBeVisible()

    const continueButton = page.getByRole('button', { name: 'Continue', exact: true })
    await expect(continueButton).toHaveAttribute('href', '/')

    await continueButton.click()
    await expect(page).toHaveURL('/')
  })

  test('Should not have any automatically detectable WCAG A or AA violations', async ({ page }) => {
    await page.goto(unknownPath)
    await PageNotFoundErrorPage.verifyOnPage(page, unknownPath)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
