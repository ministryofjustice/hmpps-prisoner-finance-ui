import { expect, test } from '@playwright/test'
import { login, resetStubs, unsignCookie } from '../testUtils'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import CreditToPage from '../pages/creditAPrisoner/creditToPage'
import { createRedisClient, RedisClient } from '../../server/data/redisClient'
import CreditFromPage from '../pages/creditAPrisoner/creditFromPage'
import * as prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import CreditAmountPage from '../pages/creditAPrisoner/creditAmountPage'
import CreditConfirmationPage from '../pages/creditAPrisoner/creditConfirmationPage'
import PrisonerProfilePage from '../pages/prisonerProfilePage'

test.describe('Credit A Prisoner Pages', () => {
  const prisonNumber = 'ABC123XZ'
  let redisClient: RedisClient

  test.beforeAll(async () => {
    redisClient = await createRedisClient().connect()
  })

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test.describe('Crediting a prisoner', () => {
    const prisonerSubAccountReference = 'SUB_ACCOUNT_1'
    const prisonSubAccountReference = 'PRISON_ACCOUNT_1'
    const transactionAmount = '100.10'
    const transactionDescription = 'Credit a prisoner end-to-end test'

    let transactionId: string
    test.beforeEach(async () => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [])

      await prisonerFinanceApi.stubGetPrisonerAccountByReference(prisonNumber, [
        {
          id: 'TESTSUBUUID1',
          reference: prisonerSubAccountReference,
          createdAt: '',
          createdBy: '',
          parentAccountId: 'TESTUUID',
        },
      ])

      await prisonerFinanceApi.stubGetPrisonAccountByReference('LEI', [
        {
          id: 'TESTSUBUUID1',
          reference: prisonSubAccountReference,
          createdAt: '',
          createdBy: '',
          parentAccountId: 'TESTUUID',
        },
      ])

      transactionId = await prisonerFinanceApi.stubPostTransaction({
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID1',
        amount: 100 * parseFloat(transactionAmount),
        description: transactionDescription,
      })
    })

    test('Can credit a prisoner', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.enterTransactionDetails(transactionAmount, transactionDescription)

      const creditConfirmationPage = await CreditConfirmationPage.verifyOnPage(page, prisonNumber)
      await expect(creditConfirmationPage.confirmationPanel).toContainText(transactionId)
      await creditConfirmationPage.financialProfileLink.click()

      await PrisonerProfilePage.verifyOnPage(page, prisonNumber)
    })
  })

  test.describe('Selecting the prisoners sub account to credit', () => {
    const prisonerSubAccountReference = 'SUB_ACCOUNT_2'
    const prisonSubAccountReference = 'PRISON_SUB_ACCOUNT_2'

    test.beforeEach(async () => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)

      await prisonerFinanceApi.stubGetPrisonerAccountByReference(prisonNumber, [
        {
          id: 'TESTSUBUUID2',
          reference: prisonerSubAccountReference,
          createdAt: '',
          createdBy: '',
          parentAccountId: 'TESTUUID',
        },
        {
          id: 'TESTSUBUUID3',
          reference: 'SUB_ACCOUNT_3',
          createdAt: '',
          createdBy: '',
          parentAccountId: 'TESTUUID',
        },
        {
          id: 'TESTSUBUUID4',
          reference: 'SUB_ACCOUNT_4',
          createdAt: '',
          createdBy: '',
          parentAccountId: 'TESTUUID',
        },
      ])

      await prisonerFinanceApi.stubGetPrisonAccountByReference('LEI', [
        {
          id: 'TESTSUBUUID1',
          reference: prisonSubAccountReference,
          createdAt: '',
          createdBy: '',
          parentAccountId: 'TESTUUID',
        },
      ])
    })

    test('Can see all the available sub account options', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)

      expect(creditToPage.subAccountList.locator('.govuk-radios__item')).toContainText([
        prisonerSubAccountReference,
        'SUB_ACCOUNT_3',
        'SUB_ACCOUNT_4',
      ])
    })

    test('Can continue to select the prison account to debit', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      await CreditFromPage.verifyOnPage(page, prisonNumber)
    })

    test('Can see the selected sub account after returning to the page', async ({ page }) => {
      let creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.backLink.click()

      creditToPage = await CreditToPage.verifyOnPage(page, prisonNumber)
      expect(creditToPage.subAccountList.getByRole('radio', { name: prisonerSubAccountReference })).toBeChecked()
    })

    test('Cannot continue if no sub account is selected', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.continueButton.click()

      await CreditToPage.verifyOnPage(page, prisonNumber)
    })

    test('Can see the reason for not continuing', async ({ page }) => {
      let creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.continueButton.click()

      creditToPage = await CreditToPage.verifyOnPage(page, prisonNumber)

      expect(creditToPage.errorMessage).toBeVisible()
      expect(creditToPage.errorMessage).toContainText('You must select a sub-account before continuing.')
    })
  })

  test.describe('Selecting the prison sub account to debit', () => {
    const prisonerSubAccountReference = 'SUB_ACCOUNT_1'
    const prisonSubAccountReference = 'PRISON_ACCOUNT_1'

    test.beforeEach(async () => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [])

      await prisonerFinanceApi.stubGetPrisonerAccountByReference(prisonNumber, [
        {
          id: 'TESTSUBUUID1',
          reference: prisonerSubAccountReference,
          createdAt: '',
          createdBy: '',
          parentAccountId: 'TESTUUID',
        },
      ])

      await prisonerFinanceApi.stubGetPrisonAccountByReference('LEI', [
        {
          id: 'TESTSUBUUID1',
          reference: prisonSubAccountReference,
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
      ])
    })

    test('Can see all the available sub account options', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)

      expect(creditFromPage.subAccountList.locator('.govuk-radios__item')).toContainText([
        prisonSubAccountReference,
        '2002:WONT',
        '2003:SHANT',
      ])
    })

    test('Can continue to select the prison account to debit', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      await CreditAmountPage.verifyOnPage(page, prisonNumber)
    })

    test('Can see the selected sub account after returning to the page', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      let creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.backLink.click()

      creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      expect(creditFromPage.subAccountList.getByRole('radio', { name: prisonSubAccountReference })).toBeChecked()
    })

    test('Cannot continue if no sub account is selected', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.continueButton.click()

      await CreditFromPage.verifyOnPage(page, prisonNumber)
    })

    test('Can see the reason for not continuing', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      let creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.continueButton.click()

      creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)

      expect(creditFromPage.errorMessage).toBeVisible()
      expect(creditFromPage.errorMessage).toContainText('You must select a sub-account before continuing.')
    })

    test('Cannot pick a sub account to debit until a sub account to credit is selected', async ({ page }) => {
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)
      await CreditToPage.verifyOnPage(page, prisonNumber)
    })
  })

  test.describe('Credit Amount Page', () => {
    const prisonerSubAccountReference = 'SUB_ACCOUNT_1'
    const prisonSubAccountReference = 'PRISON_ACCOUNT_1'

    test.beforeEach(async () => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)

      await prisonerFinanceApi.stubGetPrisonerAccountByReference(prisonNumber, [
        {
          id: 'TESTSUBUUID1',
          reference: prisonerSubAccountReference,
          createdAt: '',
          createdBy: '',
          parentAccountId: 'TESTUUID',
        },
      ])

      await prisonerFinanceApi.stubGetPrisonAccountByReference('LEI', [
        {
          id: 'TESTSUBUUID1',
          reference: prisonSubAccountReference,
          createdAt: '',
          createdBy: '',
          parentAccountId: 'TESTUUID',
        },
      ])
    })

    test('should render the credit amount and description fields, and a done button', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)

      expect(creditAmountPage.amountField).toBeVisible()
      expect(creditAmountPage.descriptionField).toBeVisible()
      expect(creditAmountPage.doneButton).toBeVisible()
    })

    test.skip('allows form completion if fields are correctly completed, and clears credit form session', async ({
      page,
      context,
    }) => {
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const { amountField, descriptionField, doneButton } = await CreditAmountPage.verifyOnPage(page, prisonNumber)

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

      const wireMockResponse = await prisonerFinanceApi.getPostTransactionRequests()
      const data = await wireMockResponse.body()
      expect(data.requests.length).toBe(1)
      expect(JSON.parse(data.requests[0].body)).toEqual(reqPayload)
    })

    test.skip('Should redirect to error page if the session data is malformed', async ({ page, context }) => {
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const { amountField, descriptionField, doneButton } = await CreditAmountPage.verifyOnPage(page, prisonNumber)

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

      const wireMockResponse = await prisonerFinanceApi.getPostTransactionRequests()
      const data = await wireMockResponse.body()
      expect(data.requests.length).toBe(0)
    })

    test.skip('Should redirect to error page if post transaction returns an error', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const { amountField, descriptionField, doneButton } = await CreditAmountPage.verifyOnPage(page, prisonNumber)

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

      const wireMockResponse = await prisonerFinanceApi.getPostTransactionRequests()
      const data = await wireMockResponse.body()
      expect(data.requests.length).toBe(1)
      expect(JSON.parse(data.requests[0].body)).toEqual(reqPayload)
    })

    test.skip('does not allow form completion if amount field is incorrectly completed, rendering an amount error instead. Should restore valid description', async ({
      page,
    }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const { amountField, descriptionField, doneButton, amountErrorMessage } = await CreditAmountPage.verifyOnPage(
        page,
        prisonNumber,
      )

      await amountField.fill('banana')
      await descriptionField.fill('test description')
      expect(amountErrorMessage).not.toBeVisible()
      await doneButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)

      expect(amountErrorMessage).toBeVisible()

      expect(await descriptionField.inputValue()).toContain('test description')
    })

    test.skip('does not allow form completion if description field is incorrectly completed, rendering an description error instead. Restores valid amount.', async ({
      page,
    }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const { amountField, descriptionField, doneButton, descriptionErrorMessage } =
        await CreditAmountPage.verifyOnPage(page, prisonNumber)

      await amountField.fill('100')
      await descriptionField.fill('')
      expect(descriptionErrorMessage).not.toBeVisible()
      await doneButton.click()

      expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)

      expect(descriptionErrorMessage).toBeVisible()
      expect(await amountField.inputValue()).toContain('100')
    })

    test.skip('does not allow form completion if description and amount field are incorrectly completed, rendering errors for both.', async ({
      page,
    }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const { amountField, descriptionField, doneButton, amountErrorMessage, descriptionErrorMessage } =
        await CreditAmountPage.verifyOnPage(page, prisonNumber)

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

    test.skip('should start a fresh form if the user navigates to a new prisoner account after partial completion', async ({
      page,
      context,
    }) => {
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      let creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

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

      await prisonerFinanceApi.stubGetPrisonAccountByReference(newPrisonNumber, [
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
      ])

      await page.goto(`/prisoner/${newPrisonNumber}/money/credit-a-prisoner/credit-to`)

      creditToPage = await CreditToPage.verifyOnPage(page, newPrisonNumber)

      const newResponse = await redisClient.get(unsignedCookie as string)
      const newData = JSON.parse(newResponse as string)

      expect(newData.creditForm).toEqual({
        prisonerAccountReference: newPrisonNumber,
      })

      const radioButtons = creditToPage.subAccountList.getByRole('radio')

      expect(await radioButtons.count()).toBe(3)

      expect(radioButtons.nth(0)).not.toBeChecked()
      expect(radioButtons.nth(1)).not.toBeChecked()
      expect(radioButtons.nth(2)).not.toBeChecked()
    })
  })
})
