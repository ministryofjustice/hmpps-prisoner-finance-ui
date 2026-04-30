import { expect, test } from '@playwright/test'
import { login, resetStubs, unsignCookie } from '../testUtils'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import CreditToPage from '../pages/creditAPrisoner/creditToPage'
import { createRedisClient, RedisClient } from '../../server/data/redisClient'
import CreditFromPage from '../pages/creditAPrisoner/creditFromPage'
import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'

test.describe('Credit A Prisoner Pages', () => {
  const prisonNumber = 'ABC123XZ'
  let redisClient: RedisClient

  test.beforeAll(async () => {
    redisClient = await createRedisClient().connect()
  })

  test.describe('Credit To Page', () => {
    test.beforeEach(async ({ page }) => {
      await resetStubs()
      await login(page)
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    })

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
  test.describe('Credit From Page', () => {
    test.beforeEach(async ({ page }) => {
      await resetStubs()
      await login(page)
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetAccountByReference('LEI', {
        id: 'TESTUUID',
        reference: 'LEI',
        createdAt: '',
        createdBy: '',
        type: 'PRISON',
        subAccounts: [
          {
            id: 'TESTSUBUUID1',
            reference: '2001:CANT',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
          {
            id: 'TESTSUBUUID2',
            reference: '2002:WONT',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
          {
            id: 'TESTSUBUUID3',
            reference: '2003:SHANT',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
        ],
      })
    })
    test('should render a set of radio buttons based on the subaccounts available for a prison', async ({ page }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      const creditFromPage = await CreditFromPage.verifyOnPage(page)

      const { radioButtons, continueButton } = creditFromPage

      expect(radioButtons).toHaveCount(3)
      expect(await continueButton.textContent()).toContain('Continue')
    })

    test('should render clickable radios, which when clicked are added to the session storage and allow progression', async ({
      page,
      context,
    }) => {
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      const creditFromPage = await CreditFromPage.verifyOnPage(page)

      const { radioButtons, continueButton } = creditFromPage

      await radioButtons.first().click()
      await continueButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)

      const response = await redisClient.get(unsignedCookie as string)
      const parsedData = JSON.parse(response as string)

      // creditSubAccountRef is coming from CredittoPage.completeAndMoveOn
      expect(parsedData.creditForm).toMatchObject({ creditSubAccountRef: 'spends', debitSubAccountId: 'TESTSUBUUID1' })
    })

    test('should render an error message and not allow progression if no radio button is selected', async ({
      page,
    }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      const creditFromPage = await CreditFromPage.verifyOnPage(page)

      const { continueButton } = creditFromPage

      await continueButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)

      expect(await creditFromPage.errorMessage.textContent()).toContain(
        'You must select a sub-account before continuing.',
      )
    })

    test('should return to credit-to page if user arrives without credit-to account in session storage', async ({
      page,
    }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)
      await CreditToPage.verifyOnPage(page)

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
    })
  })
})
