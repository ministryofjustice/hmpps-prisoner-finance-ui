import { expect, test } from '@playwright/test'
import { login, resetStubs, unsignCookie } from '../testUtils'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import CreditToPage from '../pages/creditAPrisoner/creditToPage'
import { createRedisClient, RedisClient } from '../../server/data/redisClient'
import CreditFromPage from '../pages/creditAPrisoner/creditFromPage'
import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import CreditAmountPage from '../pages/creditAPrisoner/creditAmountPage'

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
      await prisonerFinanceApi.stubGetAccountByReference(prisonNumber, {
        id: 'TESTUUID',
        reference: prisonNumber,
        createdAt: '',
        createdBy: '',
        type: 'PRISONER',
        subAccounts: [
          {
            id: 'TESTSUBUUID1',
            reference: 'Spends',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
          {
            id: 'TESTSUBUUID2',
            reference: 'Savings',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
          {
            id: 'TESTSUBUUID3',
            reference: 'Cash',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
        ],
      })
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
      expect(parsedData.creditForm).toMatchObject({ creditSubAccountId: 'TESTSUBUUID1' })
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

      expect(radioButtons).toHaveCount(3)

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
      expect(parsedData.creditForm).toMatchObject({ creditSubAccountId: 'TESTSUBUUID2' })

      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)

      expect(radioButtons.nth(1)).toBeChecked()
    })
  })
  test.describe('Credit From Page', () => {
    test.beforeEach(async ({ page }) => {
      await resetStubs()
      await login(page)
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetAccountByReference(prisonNumber, {
        id: 'TESTUUID',
        reference: prisonNumber,
        createdAt: '',
        createdBy: '',
        type: 'PRISONER',
        subAccounts: [
          {
            id: 'TESTSUBUUID1',
            reference: 'Spends',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
          {
            id: 'TESTSUBUUID2',
            reference: 'Savings',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
          {
            id: 'TESTSUBUUID3',
            reference: 'Cash',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
        ],
      })
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

      // creditSubAccountId is coming from CredittoPage.completeAndMoveOn
      expect(parsedData.creditForm).toMatchObject({
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID1',
      })
    })

    test('should render an error message and not allow progression if no radio button is selected', async ({
      page,
    }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      const creditFromPage = await CreditFromPage.verifyOnPage(page)

      const { continueButton, radioButtons } = creditFromPage

      await continueButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)

      expect(radioButtons).toHaveCount(3)

      expect(await creditFromPage.errorMessage.textContent()).toContain(
        'You must select a sub-account before continuing.',
      )
    })

    test('if use progresses and returns, the form should remember the previously selected option', async ({
      page,
      context,
    }) => {
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      const creditFromPage = await CreditFromPage.verifyOnPage(page)

      const { radioButtons, continueButton } = creditFromPage

      await radioButtons.nth(1).click()

      expect(radioButtons.nth(1)).toBeChecked()

      await continueButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)

      const response = await redisClient.get(unsignedCookie as string)
      const parsedData = JSON.parse(response as string)

      // creditSubAccountRef is coming from CredittoPage.completeAndMoveOn
      expect(parsedData.creditForm).toMatchObject({
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID2',
      })

      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)

      expect(radioButtons.nth(1)).toBeChecked()
    })

    test('should return to credit-to page if user arrives without credit-to account in session storage', async ({
      page,
    }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)
      await CreditToPage.verifyOnPage(page)

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
    })
  })
  test.describe('Credit Amount Page', () => {
    test.beforeEach(async ({ page }) => {
      await resetStubs()
      await login(page)
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetAccountByReference(prisonNumber, {
        id: 'TESTUUID',
        reference: prisonNumber,
        createdAt: '',
        createdBy: '',
        type: 'PRISONER',
        subAccounts: [
          {
            id: 'TESTSUBUUID1',
            reference: 'Spends',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
          {
            id: 'TESTSUBUUID2',
            reference: 'Savings',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
          {
            id: 'TESTSUBUUID3',
            reference: 'Cash',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
        ],
      })
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
    test('should render the credit amount and description fields, and a done button', async ({ page }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      await CreditFromPage.completeAndMoveOn(page)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page)

      expect(creditAmountPage.amountField).toBeVisible()
      expect(creditAmountPage.descriptionField).toBeVisible()
      expect(creditAmountPage.doneButton).toBeVisible()
    })
    test('allows form completion if fields are correctly completed, and clears credit form session', async ({
      page,
      context,
      request,
    }) => {
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      await CreditFromPage.completeAndMoveOn(page)

      const { amountField, descriptionField, doneButton } = await CreditAmountPage.verifyOnPage(page)

      const reqPayload = {
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID1',
        amount: 10010,
        description: 'test description',
      }

      await prisonerFinanceApi.stubPostTransaction(reqPayload, {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        createdBy: 'test',
        createdAt: '2026-05-08T11:03:15.786Z',
        reference: 'TEXT',
        description: 'test description',
        timestamp: '2026-05-05T09:40:05.531Z',
        amount: 10010,
        entrySequence: 1,
        postings: [],
      })

      let response = await redisClient.get(unsignedCookie as string)
      let parsedData = JSON.parse(response as string)

      // refs are coming from complete and move on calls
      expect(parsedData.creditForm).toMatchObject({
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID1',
      })

      await amountField.fill('100.10')
      await descriptionField.fill('test description')
      await doneButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-confirmation`)

      response = await redisClient.get(unsignedCookie as string)
      parsedData = JSON.parse(response as string)

      expect(parsedData.creditForm).toEqual({})

      const wireMockResponse = await prisonerFinanceApi.getWiremockPostTransactionRequest(request)
      expect(wireMockResponse.status()).toBe(200)
      const data = await wireMockResponse.json()
      expect(data.requests.length).toBe(1)
      expect(JSON.parse(data.requests[0].body)).toEqual(reqPayload)
    })
    test('Should redirect to error page if the session data is malformed', async ({ page, context, request }) => {
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      await CreditFromPage.completeAndMoveOn(page)

      const { amountField, descriptionField, doneButton } = await CreditAmountPage.verifyOnPage(page)

      const reqPayload = {
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID1',
        amount: 10010,
        description: 'test description',
      }

      await prisonerFinanceApi.stubPostTransaction(reqPayload, {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        createdBy: 'test',
        createdAt: '2026-05-08T11:03:15.786Z',
        reference: 'TEXT',
        description: 'test description',
        timestamp: '2026-05-05T09:40:05.531Z',
        amount: 10010,
        entrySequence: 1,
        postings: [],
      })

      // overriding cookie with malformed data
      const response = await redisClient.get(unsignedCookie as string)
      const parsedData = JSON.parse(response as string)
      parsedData.creditForm = {}
      await redisClient.set(unsignedCookie as string, JSON.stringify(parsedData))

      await amountField.fill('100.10')
      await descriptionField.fill('test description')
      const responsePromise = page.waitForResponse(btnResponse => btnResponse.status() === 500)

      await doneButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)
      expect((await responsePromise).status()).toBe(500)

      const wireMockResponse = await prisonerFinanceApi.getWiremockPostTransactionRequest(request)
      expect(wireMockResponse.status()).toBe(200)
      const data = await wireMockResponse.json()
      expect(data.requests.length).toBe(0)
    })
    test('Should redirect to error page if post transaction returns an error', async ({ page, request }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      await CreditFromPage.completeAndMoveOn(page)

      const { amountField, descriptionField, doneButton } = await CreditAmountPage.verifyOnPage(page)

      const reqPayload = {
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID1',
        amount: 10010,
        description: 'test description',
      }

      await prisonerFinanceApi.stubPostTransactionReturnError(reqPayload)

      await amountField.fill('100.10')
      await descriptionField.fill('test description')
      const responsePromise = page.waitForResponse(btnResponse => btnResponse.status() === 500)

      await doneButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)
      expect((await responsePromise).status()).toBe(500)

      const wireMockResponse = await prisonerFinanceApi.getWiremockPostTransactionRequest(request)
      expect(wireMockResponse.status()).toBe(200)
      const data = await wireMockResponse.json()
      expect(data.requests.length).toBe(1)
      expect(JSON.parse(data.requests[0].body)).toEqual(reqPayload)
    })
    test('does not allow form completion if amount field is incorrectly completed, rendering an amount error instead. Should restore valid description', async ({
      page,
    }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      await CreditFromPage.completeAndMoveOn(page)

      const { amountField, descriptionField, doneButton, amountErrorMessage } =
        await CreditAmountPage.verifyOnPage(page)

      await amountField.fill('banana')
      await descriptionField.fill('test description')
      expect(amountErrorMessage).not.toBeVisible()
      await doneButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)

      expect(amountErrorMessage).toBeVisible()

      expect(await descriptionField.inputValue()).toContain('test description')
    })
    test('does not allow form completion if description field is incorrectly completed, rendering an description error instead. Restores valid amount.', async ({
      page,
    }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      await CreditFromPage.completeAndMoveOn(page)

      const { amountField, descriptionField, doneButton, descriptionErrorMessage } =
        await CreditAmountPage.verifyOnPage(page)

      await amountField.fill('100')
      await descriptionField.fill('')
      expect(descriptionErrorMessage).not.toBeVisible()
      await doneButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)

      expect(descriptionErrorMessage).toBeVisible()
      expect(await amountField.inputValue()).toContain('100')
    })
    test('does not allow form completion if description and amount field are incorrectly completed, rendering errors for both.', async ({
      page,
    }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      await CreditFromPage.completeAndMoveOn(page)

      const { amountField, descriptionField, doneButton, amountErrorMessage, descriptionErrorMessage } =
        await CreditAmountPage.verifyOnPage(page)

      await amountField.fill('banana')
      await descriptionField.fill('')
      expect(amountErrorMessage).not.toBeVisible()
      expect(descriptionErrorMessage).not.toBeVisible()

      await doneButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)

      expect(amountErrorMessage).toBeVisible()
      expect(descriptionErrorMessage).toBeVisible()
      expect(await descriptionField.inputValue()).toContain('')
      expect(await amountField.inputValue()).toContain('banana')
    })
    test('should start a fresh form if the user navigates to a new prisoner account after partial completion', async ({
      page,
      context,
    }) => {
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
      await CreditFromPage.completeAndMoveOn(page)

      const response = await redisClient.get(unsignedCookie as string)
      const parsedData = JSON.parse(response as string)

      // refs are coming from complete and move on calls
      expect(parsedData.creditForm).toEqual({
        prisonerAccountReference: prisonNumber,
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID1',
      })

      const newPrisonNumber = 'ZZZZ123'

      await prisonerSearchApi.stubGetPrisoner(newPrisonNumber)
      await prisonerFinanceApi.stubGetAccountByReference(newPrisonNumber, {
        id: 'TESTUUID',
        reference: newPrisonNumber,
        createdAt: '',
        createdBy: '',
        type: 'PRISONER',
        subAccounts: [
          {
            id: 'TESTSUBUUID1',
            reference: 'Spends',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
          {
            id: 'TESTSUBUUID2',
            reference: 'Savings',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
          {
            id: 'TESTSUBUUID3',
            reference: 'Cash',
            createdAt: '',
            createdBy: '',
            parentAccountId: 'TESTUUID',
          },
        ],
      })

      await page.goto(`/prisoner/${newPrisonNumber}/money/credit-a-prisoner/credit-to`)

      const creditToPage = await CreditToPage.verifyOnPage(page)

      const newResponse = await redisClient.get(unsignedCookie as string)
      const newData = JSON.parse(newResponse as string)

      expect(newData.creditForm).toEqual({
        prisonerAccountReference: newPrisonNumber,
      })

      const { radioButtons } = creditToPage

      expect(await radioButtons.count()).toBe(3)

      expect(radioButtons.nth(0)).not.toBeChecked()
      expect(radioButtons.nth(1)).not.toBeChecked()
      expect(radioButtons.nth(2)).not.toBeChecked()
    })
  })
})
