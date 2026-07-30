import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login, resetStubs } from '../testUtils'
import * as prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import prisonRegisterApi from '../mockApis/prisonRegisterApi'
import prisonApi from '../mockApis/prisonApi'
import InternalServerErrorPage from '../pages/internalServerErrorPage'
import IndexPage from '../pages/indexPage'

test.describe('Internal server error', () => {
  const prisonNumber = 'A1234BC'
  const errorPath = `/prisoner/${prisonNumber}/money`

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)

    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
    await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsInternalServerError(prisonNumber)
    await prisonRegisterApi.stubGetPrisonNames()
  })

  test('shows a user-friendly 500 page without technical details when an error occurs', async ({ page }) => {
    const response = await page.goto(errorPath)
    expect(response?.status()).toBe(500)

    const internalServerErrorPage = await InternalServerErrorPage.verifyOnPage(page, errorPath)
    await expect(internalServerErrorPage.heading).toBeVisible()

    await expect(page.getByText('Try again later.')).toBeVisible()

    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('[data-testid="error-page-stack"]')).toHaveCount(0)
  })

  test('does not show prisoner information on the generic error page', async ({ page }) => {
    await page.goto(errorPath)
    await InternalServerErrorPage.verifyOnPage(page, errorPath)

    await expect(page.locator('body')).not.toContainText(prisonNumber)
    await expect(page.locator('.hmpps-profile-banner')).toHaveCount(0)
  })

  test('provides a continue button back to the home page', async ({ page }) => {
    await page.goto(errorPath)
    const internalServerErrorPage = await InternalServerErrorPage.verifyOnPage(page, errorPath)

    await internalServerErrorPage.continueButton.click()
    await IndexPage.verifyOnPage(page)
  })

  test('Should not have any automatically detectable WCAG A or AA violations', async ({ page }) => {
    await page.goto(errorPath)
    await InternalServerErrorPage.verifyOnPage(page, errorPath)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
