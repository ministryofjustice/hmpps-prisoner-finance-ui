import { expect, test } from '@playwright/test'
import { resetStubs } from '../mockApis/wiremock'
import { login } from '../testUtils'
import prisonRegisterApi from '../mockApis/prisonRegisterApi'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import * as prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import TransactionPrintPreviewPage from '../pages/prisonerTransactionPrintPreviewPage'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import prisonApi from '../mockApis/prisonApi'
import PrisonerTransactionsPage from '../pages/prisonerTransactionsPage'
import * as prisonerFinanceHoldsApi from '../mockApis/prisonerFinanceHoldsApi'
import PrisonerPrivateCashPage from '../pages/prisonerPrivateCashPage'
import PrisonerSpendsPage from '../pages/prisonerSpendsPage'
import PrisonerSavingsPage from '../pages/prisonerSavingsPage'
import { AccountBalanceResponse } from '../../server/interfaces/AccountBalanceResponse'

const transactionPayload: PrisonerTransactionResponse[] = [
  {
    date: '2026-03-10T10:48:28.094Z',
    legacyTransactionId: 1,
    description: 'test',
    credit: 0,
    debit: 10,
    location: 'LEI',
    accountType: 'CASH',
    subAccountBalance: 10,
    accountBalance: null,
  },
  {
    date: '2026-02-10T10:47:28.094Z',
    legacyTransactionId: 2,
    description: '',
    credit: 20,
    debit: 0,
    location: 'MDI',
    accountType: 'SAVINGS',
    subAccountBalance: 20,
    accountBalance: null,
  },
  {
    date: '2026-02-10T10:46:28.094Z',
    legacyTransactionId: 3,
    description: 'Cash to Savings Transfer',
    credit: 0,
    debit: 10,
    location: 'LEI',
    accountType: 'CASH',
    subAccountBalance: 30,
    accountBalance: null,
  },
  {
    date: '2026-01-10T10:45:28.194Z',
    legacyTransactionId: 4,
    description: 'Transaction in secret prison',
    credit: 10,
    debit: 0,
    location: 'XXX', // not included in get prisonNames from register, testing if returns default caseloadId
    accountType: 'SAVINGS',
    subAccountBalance: null,
    accountBalance: null,
  },
]

const prisonNumber = 'A124XZ'

test.describe('', () => {
  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
    await prisonRegisterApi.stubGetPrisonNames()
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
  })

  test.describe('Showing transactions print preview', () => {
    test.beforeEach(async () => {
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
        pageSize: '999999',
      })

      const mockBalance: AccountBalanceResponse = {
        balanceDateTime: '2026-03-15T10:48:28.094Z',
        accountId: '',
        amount: 1010,
      }
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber, mockBalance)
    })

    test('Should show transaction preview', async ({ page }) => {
      const printPreviewPage = await TransactionPrintPreviewPage.load(page, prisonNumber)

      expect(printPreviewPage.prisonNumber).toContainText(prisonNumber)
      expect(printPreviewPage.prisonerName).toContainText('John Smith')
      expect(printPreviewPage.startDate).toContainText('10 January 2026')
      expect(printPreviewPage.endDate).toContainText('10 March 2026')
      expect(printPreviewPage.statementBalance).toContainText('£10.10')
      expect(printPreviewPage.statementDate).toContainText('15 March 2026')

      expect(printPreviewPage.csvButton).toBeVisible()
      expect(printPreviewPage.printButton).toBeVisible()

      expect(printPreviewPage.transactionList).toContainText(
        [
          'Date Transaction ID Description Amount Balance Account Location',
          '10/03/202610:48 1 test -0.10 - Private cash Leeds (HMP)',
          '10/02/202610:47 2 0.20 - Savings Moorland (HMP & YOI)',
          '10/02/202610:46 3 Cash to Savings Transfer -0.10 - Private cash Leeds (HMP)',
          '10/01/202610:45 4 Transaction in secret prison 0.10 - Savings XXX',
        ].join('\n'),
      )
    })

    test('Should click to print button and print page', async ({ page }) => {
      const printPreviewPage = await TransactionPrintPreviewPage.load(page, prisonNumber)

      await printPreviewPage.printButton.click()

      await page.waitForFunction('window.print')
    })

    test('Should click the download csv button and download a file', async ({ page }) => {
      const printPreviewPage = await TransactionPrintPreviewPage.load(page, prisonNumber)

      const downloadPromise = page.waitForEvent('download')

      await printPreviewPage.csvButton.click()

      const downloadComplete = await downloadPromise

      expect(downloadComplete.suggestedFilename()).toContain('.csv')
    })
  })

  test.describe('Access print preview page from all accounts transaction page', () => {
    test('Should click to print button and redirect to print preview page with transactions present', async ({
      page,
    }) => {
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
        pageSize: '999999',
      })
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [], {})
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)
      await prisonerFinanceHoldsApi.stubGetHoldsBalance(prisonNumber)

      const transactionsPage = await PrisonerTransactionsPage.load(page, prisonNumber)

      await transactionsPage.printTransactionsButton.click()

      await page.waitForURL(`**/prisoner/${prisonNumber}/account/print-preview**`)
    })

    test('Should return to the previews page in the correct state when back button is clicked', async ({ page }) => {
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [], {})
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)
      await prisonerFinanceHoldsApi.stubGetHoldsBalance(prisonNumber)

      const transactionsPage = await PrisonerTransactionsPage.load(page, prisonNumber)

      const descriptionFilter = 'test'
      await transactionsPage.searchDescriptionFilter.fill(descriptionFilter)

      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [], {
        description: descriptionFilter,
      })

      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
        pageSize: '999999',
        description: descriptionFilter,
      })
      await transactionsPage.applyFilterButton.click()

      await page.waitForURL(`**/prisoner/${prisonNumber}/account?**description=test**`, { timeout: 2000 })

      const filteredTransactionsUrl = page.url().split('#')[0] // removing page location from url [# fragment identifier]

      await transactionsPage.printTransactionsButton.click()

      await page.waitForURL(`**/prisoner/${prisonNumber}/account/print-preview?**`, { timeout: 2000 })

      const printPreviewPage = await TransactionPrintPreviewPage.verifyOnPage(page, prisonNumber)

      printPreviewPage.backLink.click()

      await page.waitForURL(filteredTransactionsUrl, { timeout: 2000 })
    })
  })

  const sut = [
    {
      subAccountReference: 'CASH',
      caseName: 'Private cash',
      urlSubAccount: 'private-cash',
      pageModel: PrisonerPrivateCashPage,
    },
    {
      subAccountReference: 'SPENDS',
      caseName: 'Spends',
      urlSubAccount: 'spends',
      pageModel: PrisonerSpendsPage,
    },
    {
      subAccountReference: 'SAVINGS',
      caseName: 'Savings',
      urlSubAccount: 'savings',
      pageModel: PrisonerSavingsPage,
    },
  ]

  sut.forEach(testCase => {
    test.describe(`Access print preview page from ${testCase.caseName} transaction page`, () => {
      test(`Should click to print button from ${testCase.caseName} and redirect to print preview page with transactions present`, async ({
        page,
      }) => {
        await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, testCase.subAccountReference)

        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
          pageSize: '999999',
          subAccountReference: testCase.subAccountReference,
        })
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [], {
          subAccountReference: testCase.subAccountReference,
        })
        await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, testCase.subAccountReference)
        await prisonerFinanceHoldsApi.stubGetHoldsBalanceForSubAccount(prisonNumber, testCase.subAccountReference)

        const transactionsPage = await testCase.pageModel.load(page, prisonNumber)

        await transactionsPage.printTransactionsButton.click()

        await page.waitForURL(
          `**/prisoner/${prisonNumber}/account/print-preview**subAccount=${testCase.subAccountReference}**`,
        )
      })

      test(`Should return to the previews ${testCase.subAccountReference} page in the correct state when back button is clicked`, async ({
        page,
      }) => {
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [], {
          subAccountReference: testCase.subAccountReference,
        })
        await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, testCase.subAccountReference)
        await prisonerFinanceHoldsApi.stubGetHoldsBalanceForSubAccount(prisonNumber, testCase.subAccountReference)

        const transactionsPage = await testCase.pageModel.load(page, prisonNumber)

        const descriptionFilter = 'test'
        await transactionsPage.searchDescriptionFilter.fill(descriptionFilter)

        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [], {
          description: descriptionFilter,
          subAccountReference: testCase.subAccountReference,
        })

        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
          pageSize: '999999',
          description: descriptionFilter,
          subAccountReference: testCase.subAccountReference,
        })
        await transactionsPage.applyFilterButton.click()

        await page.waitForURL(`**/prisoner/${prisonNumber}/account/${testCase.urlSubAccount}?**description=test**`, {
          timeout: 2000,
        })

        const filteredTransactionsUrl = page.url().split('#')[0] // removing page location from url [# fragment identifier]

        await transactionsPage.printTransactionsButton.click()

        await page.waitForURL(
          `**/prisoner/${prisonNumber}/account/print-preview?**subAccount=${testCase.subAccountReference}**`,
          { timeout: 2000 },
        )

        const printPreviewPage = await TransactionPrintPreviewPage.verifyOnPage(page, prisonNumber)

        printPreviewPage.backLink.click()

        await page.waitForURL(filteredTransactionsUrl, { timeout: 2000 })
      })
    })
  })
})
