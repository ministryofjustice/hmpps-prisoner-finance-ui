import { expect, test } from '@playwright/test'
import { login, resetStubs } from '../testUtils'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import CreditToPage from '../pages/creditAPrisoner/creditToPage'

test.describe('Credit A Prisoner Pages', () => {
  const prisonNumber = 'ABC123XZ'
  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
  })

  test.describe('Credit To Page', () => {
    test('Should display radio buttons and allow selection and progress to next page', async ({ page }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)

      const creditToPage = await CreditToPage.verifyOnPage(page)

      const { radioButtons, continueButton } = creditToPage

      expect(radioButtons).toHaveCount(3)
      expect(await continueButton.textContent()).toContain('Continue')

      await radioButtons.first().click()
      await continueButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)
    })
  })
})
