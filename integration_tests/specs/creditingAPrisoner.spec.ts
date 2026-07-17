import { expect, test } from '@playwright/test'
import { login, resetStubs, getSessionData, setSessionData } from '../testUtils'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import CreditToPage from '../pages/creditAPrisoner/creditToPage'
import CreditFromPage from '../pages/creditAPrisoner/creditFromPage'
import * as prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import CreditAmountPage from '../pages/creditAPrisoner/creditAmountPage'
import CreditConfirmationPage from '../pages/creditAPrisoner/creditConfirmationPage'
import PrisonerFinancialProfilePage from '../pages/prisonerFinancialProfilePage'
import InternalServerErrorPage from '../pages/internalServerErrorPage'
import prisonApi from '../mockApis/prisonApi'

test.describe('Crediting a prisoner', () => {
  const prisonNumber = 'ABC123XZ'

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
      await prisonApi.stubGetPrisonerImage()
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
      const prisonerProfilePage = await PrisonerFinancialProfilePage.visit(page, prisonNumber)
      await prisonerProfilePage.getAction('Credit account').click()

      const creditToPage = await CreditToPage.verifyOnPage(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.enterTransactionDetails(transactionAmount, transactionDescription)

      const creditConfirmationPage = await CreditConfirmationPage.verifyOnPage(page, prisonNumber)
      await expect(creditConfirmationPage.confirmationPanel).toContainText(transactionId)

      await creditConfirmationPage.financialProfileLink.click()
      await PrisonerFinancialProfilePage.verifyOnPage(page, prisonNumber)
    })

    test('Can start with a clean process after completing the process', async ({ page }) => {
      let creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.enterTransactionDetails(transactionAmount, transactionDescription)

      const creditConfirmationPage = await CreditConfirmationPage.verifyOnPage(page, prisonNumber)
      await expect(creditConfirmationPage.confirmationPanel).toContainText(transactionId)
      await creditConfirmationPage.financialProfileLink.click()

      const prisonerProfilePage = await PrisonerFinancialProfilePage.verifyOnPage(page, prisonNumber)
      await prisonerProfilePage.getAction('Credit account').click()

      creditToPage = await CreditToPage.verifyOnPage(page, prisonNumber)
      expect(creditToPage.getSubAccountOption(prisonerSubAccountReference)).not.toBeChecked()
    })

    test('Can credit a new prisoner after partially completing the process for another prisoner', async ({ page }) => {
      const previousPrisonNumber = 'ZZZZ123'

      await prisonerSearchApi.stubGetPrisoner(previousPrisonNumber)
      await prisonApi.stubGetPrisonerImage()
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(previousPrisonNumber, [])

      await prisonerFinanceApi.stubGetPrisonerAccountByReference(previousPrisonNumber, [
        {
          id: 'TESTSUBUUID1',
          reference: prisonerSubAccountReference,
          createdAt: '',
          createdBy: '',
          parentAccountId: 'TESTUUID',
        },
      ])

      const previousCreditToPage = await CreditToPage.load(page, previousPrisonNumber)
      await previousCreditToPage.selectASubAccount(prisonerSubAccountReference)

      const previousCreditFromPage = await CreditFromPage.verifyOnPage(page, previousPrisonNumber)
      await previousCreditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.enterTransactionDetails(transactionAmount, transactionDescription)

      const creditConfirmationPage = await CreditConfirmationPage.verifyOnPage(page, prisonNumber)
      await expect(creditConfirmationPage.confirmationPanel).toContainText(transactionId)
    })
  })

  test.describe('Selecting the prisoners sub account to credit', () => {
    const prisonerSubAccountReference = 'SUB_ACCOUNT_2'
    const prisonSubAccountReference = 'PRISON_SUB_ACCOUNT_2'

    test.beforeEach(async () => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonApi.stubGetPrisonerImage()

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
      await prisonApi.stubGetPrisonerImage()
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
      expect(creditFromPage.getSubAccountOption(prisonSubAccountReference)).toBeChecked()
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

  test.describe('entering the details of the credit to the prisoner', () => {
    const prisonerSubAccountReference = 'SUB_ACCOUNT_1'
    const prisonSubAccountReference = 'PRISON_ACCOUNT_1'
    const transactionAmount = '100.10'
    const transactionDescription = 'Credit a prisoner end-to-end test'

    test.beforeEach(async () => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonApi.stubGetPrisonerImage()

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

    test('Can enter an amount to credit to the prisoner', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.amountField.fill(transactionAmount)

      expect(creditAmountPage.amountField).toHaveValue(transactionAmount)
    })

    test('Cannot continue with no amount entered', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.descriptionField.fill(transactionDescription)
      await creditAmountPage.doneButton.click()

      await CreditAmountPage.verifyOnPage(page, prisonNumber)
    })

    test('Can see why no amount stops them from continuing', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      let creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.descriptionField.fill(transactionDescription)
      await creditAmountPage.doneButton.click()

      creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      expect(creditAmountPage.amountErrorMessage).toContainText('Amount is required')
    })

    test('Can see why zero amount stops them from continuing', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      let creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.amountField.fill('0')
      await creditAmountPage.descriptionField.fill(transactionDescription)
      await creditAmountPage.doneButton.click()

      creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      expect(creditAmountPage.amountErrorMessage).toContainText('Amount must be greater than 0')
    })

    test('Can see why text for the amount stops them from continuing', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      let creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.amountField.fill('Banana')
      await creditAmountPage.descriptionField.fill(transactionDescription)
      await creditAmountPage.doneButton.click()

      creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      expect(creditAmountPage.amountErrorMessage).toContainText('Must be a valid number with up to 2 decimal places')
    })

    test('Can see why a negative amount stops them from continuing', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      let creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.amountField.fill('-100.00')
      await creditAmountPage.descriptionField.fill(transactionDescription)
      await creditAmountPage.doneButton.click()

      creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      expect(creditAmountPage.amountErrorMessage).toContainText('Amount must be greater than 0')
    })

    test('Can add a description of the amount to credit to the prisoner', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.descriptionField.fill(transactionDescription)

      expect(creditAmountPage.descriptionField).toHaveValue(transactionDescription)
    })

    test('Cannot continue with no description entered', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.amountField.fill(transactionAmount)
      await creditAmountPage.doneButton.click()

      await CreditAmountPage.verifyOnPage(page, prisonNumber)
    })

    test('Can see why an empty description is not allowed', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.amountField.fill(transactionAmount)
      await creditAmountPage.doneButton.click()

      await CreditAmountPage.verifyOnPage(page, prisonNumber)
      expect(creditAmountPage.descriptionErrorMessage).toContainText('Description cannot be empty')
    })

    test('Can see why a description that is too long is not allowed', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.amountField.fill(transactionAmount)
      await creditAmountPage.descriptionField.fill('x'.repeat(256))
      await creditAmountPage.doneButton.click()

      await CreditAmountPage.verifyOnPage(page, prisonNumber)
      expect(creditAmountPage.descriptionErrorMessage).toContainText('Description cannot exceed 255 characters')
    })

    test('Can see all entry errors at the same time', async ({ page }) => {
      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.doneButton.click()

      await CreditAmountPage.verifyOnPage(page, prisonNumber)
      expect(creditAmountPage.amountErrorMessage).toContainText('Amount is required')
      expect(creditAmountPage.descriptionErrorMessage).toContainText('Description cannot be empty')
    })

    test('Can continue to complete a credit to a prisoner', async ({ page }) => {
      await prisonerFinanceApi.stubPostTransaction({
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID1',
        amount: 100 * parseFloat(transactionAmount),
        description: transactionDescription,
      })

      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.enterTransactionDetails(transactionAmount, transactionDescription)

      await CreditConfirmationPage.verifyOnPage(page, prisonNumber)
    })

    // TODO: this should be a controller test
    test('Can see that an error occured if the session data is malformed', async ({ page, context }) => {
      await prisonerFinanceApi.stubPostTransaction({
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID1',
        amount: 100 * parseFloat(transactionAmount),
        description: transactionDescription,
      })

      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)

      // overriding cookie with malformed data
      await setSessionData(context, { ...(await getSessionData(context)), creditForm: {} })

      await creditAmountPage.enterTransactionDetails(transactionAmount, transactionDescription)

      await InternalServerErrorPage.verifyOnPage(
        page,
        `/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`,
      )

      const wireMockResponse = await prisonerFinanceApi.getPostTransactionRequests()
      expect(wireMockResponse.status).toBe(200)
      expect(wireMockResponse.body.requests.length).toBe(0)
    })

    // TODO: this should be a controller test
    test('Can see that API was not called if session data is malformed', async ({ page, context }) => {
      await prisonerFinanceApi.stubPostTransaction({
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID1',
        amount: 100 * parseFloat(transactionAmount),
        description: transactionDescription,
      })

      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)

      // overriding cookie with malformed data
      await setSessionData(context, { ...(await getSessionData(context)), creditForm: {} })

      await creditAmountPage.enterTransactionDetails(transactionAmount, transactionDescription)

      const wireMockResponse = await prisonerFinanceApi.getPostTransactionRequests()
      expect(wireMockResponse.status).toBe(200)
      expect(wireMockResponse.body.requests.length).toBe(0)
    })

    // TODO: this should be a controller test
    test('Can see that an error occured if creating the transaction failed', async ({ page }) => {
      await prisonerFinanceApi.stubPostTransactionReturnError({
        creditSubAccountId: 'TESTSUBUUID1',
        debitSubAccountId: 'TESTSUBUUID1',
        amount: 100 * parseFloat(transactionAmount),
        description: transactionDescription,
      })

      const creditToPage = await CreditToPage.load(page, prisonNumber)
      await creditToPage.selectASubAccount(prisonerSubAccountReference)

      const creditFromPage = await CreditFromPage.verifyOnPage(page, prisonNumber)
      await creditFromPage.selectASubAccount(prisonSubAccountReference)

      const creditAmountPage = await CreditAmountPage.verifyOnPage(page, prisonNumber)
      await creditAmountPage.enterTransactionDetails(transactionAmount, transactionDescription)

      await InternalServerErrorPage.verifyOnPage(
        page,
        `/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`,
      )
    })

    test('does not allow form completion if description field is incorrectly completed, rendering an description error instead. Restores valid amount.', async ({
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

    test('does not allow form completion if description and amount field are incorrectly completed, rendering errors for both.', async ({
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
  })
})
