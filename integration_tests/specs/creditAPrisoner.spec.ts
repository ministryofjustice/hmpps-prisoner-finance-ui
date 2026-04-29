import { expect, test } from '@playwright/test'
import { login, resetStubs, unsignCookie } from '../testUtils'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import CreditToPage from '../pages/creditAPrisoner/creditToPage'
import { createRedisClient, RedisClient } from '../../server/data/redisClient'

test.describe('Credit A Prisoner Pages', () => {
  const prisonNumber = 'ABC123XZ'
  let redisClient: RedisClient

  test.beforeAll(async () => {
    redisClient = await createRedisClient().connect()
  })

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
  })

  test.describe('Credit To Page', () => {
    test('Should display radio buttons and allow selection and progress to next page', async ({ page, context }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      const creditToPage = await CreditToPage.verifyOnPage(page)

      const { radioButtons, continueButton } = creditToPage

      expect(radioButtons).toHaveCount(3)
      expect(await continueButton.textContent()).toContain('Continue')

      await radioButtons.first().click()
      await continueButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)

      const response = await redisClient.get(unsignedCookie as string)
      const parsedData = JSON.parse(response as string)
      expect(parsedData.creditForm).toMatchObject({ creditSubAccountRef: 'spends' })
  })

  test('Remains on credit to page with error message if continue is pressed before an option is selected', async ({
    page,
  }) => {
    await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)

    const creditToPage = await CreditToPage.verifyOnPage(page)

    const { radioButtons, continueButton } = creditToPage

    expect(radioButtons).toHaveCount(3)
    expect(await continueButton.textContent()).toContain('Continue')

    await continueButton.click()

    expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)

    expect(creditToPage.errorMessage).toBeVisible()

    const errorText = creditToPage.errorMessage

    expect(errorText).toContainText('You must select a sub-account before continuing.')
  })

  test('Should rerender previously selected button if user returns to page', async ({ page, context }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      const creditToPage = await CreditToPage.verifyOnPage(page)

      const { radioButtons, continueButton } = creditToPage

      expect(radioButtons).toHaveCount(3)
      expect(await continueButton.textContent()).toContain('Continue')

      await radioButtons.nth(1).click()

      expect(radioButtons.nth(1)).toBeChecked()

      await continueButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)

      const response = await redisClient.get(unsignedCookie as string)
      const parsedData = JSON.parse(response as string)
      expect(parsedData.creditForm).toMatchObject({ creditSubAccountRef: 'savings' })

      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)

      expect(radioButtons.nth(1)).toBeChecked()
    })
  })
})

