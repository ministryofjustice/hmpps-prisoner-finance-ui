import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login, resetStubs } from '../testUtils'
import PrisonerTransactionsPage from '../pages/prisonerTransactionsPage'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import * as prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import prisonRegisterApi from '../mockApis/prisonRegisterApi'
import InternalServerErrorPage from '../pages/internalServerErrorPage'
import PrisonerFinancialProfilePage from '../pages/prisonerFinancialProfilePage'
import accountNotFoundErrorPage from '../pages/accountNotFoundErrorPage'
import IndexPage from '../pages/indexPage'
import prisonApi from '../mockApis/prisonApi'
import componentsApi from '../mockApis/componentsApi'

test.describe('Showing transactions for all sub accounts', () => {
  const transactionPayload: PrisonerTransactionResponse[] = [
    {
      date: '2026-03-10T10:48:28.094Z',
      description: 'test',
      credit: 0,
      debit: 10,
      location: 'LEI',
      accountType: 'CASH',
      subAccountBalance: 0,
      accountBalance: 30,
    },
    {
      date: '2026-03-10T10:47:28.094Z',
      description: '',
      credit: 20,
      debit: 0,
      location: 'MDI',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 30,
    },
    {
      date: '2026-03-10T10:46:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
      subAccountBalance: 10,
      accountBalance: 10,
    },
    {
      date: '2026-03-10T10:45:28.194Z',
      description: 'Transaction in secret prison',
      credit: 10,
      debit: 0,
      location: 'XXX',
      accountType: 'SAVINGS',
      subAccountBalance: null,
      accountBalance: null,
    },
  ]

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test.describe('Viewing a prisoners account details', () => {
    test(`Can view prisoner information`, async ({ page }) => {
      const prisonNumber = 'DD1234D'

      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await componentsApi.stubComponents()
      await prisonApi.stubGetPrisonerImage()
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
      await prisonRegisterApi.stubGetPrisonNames()
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)

      const prisonerTransactionsPage = await PrisonerTransactionsPage.load(page, prisonNumber)

      await expect(prisonerTransactionsPage.profileHeader).toBeVisible()
      await expect(prisonerTransactionsPage.profileHeader).toContainText(`Smith, John ${prisonNumber}`)
    })

    test(`Can view current balance of account`, async ({ page }) => {
      const prisonNumber = 'AA1234A'

      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonApi.stubGetPrisonerImage()
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
      await prisonRegisterApi.stubGetPrisonNames()
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber, {
        accountId: '123456',
        balanceDateTime: '12:34:56',
        amount: 1234,
      })

      const prisonerTransactionsPage = await PrisonerTransactionsPage.load(page, prisonNumber)

      await expect(prisonerTransactionsPage.currentBalanceCard).toBeVisible()
      await expect(prisonerTransactionsPage.currentBalanceCard).toContainText('Current balance Total £12.34')
    })

    test.skip(`Can view total balance of account`, async ({ page }) => {
      const prisonNumber = 'BB1234B'

      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonApi.stubGetPrisonerImage()
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
      await prisonRegisterApi.stubGetPrisonNames()
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber, {
        accountId: '123456',
        balanceDateTime: '12:34:56',
        amount: 5678,
      })

      const prisonerTransactionsPage = await PrisonerTransactionsPage.load(page, prisonNumber)

      await expect(prisonerTransactionsPage.totalBalanceCard).toBeVisible()
      await expect(prisonerTransactionsPage.totalBalanceCard).toContainText('Total balance Total £56.78')
    })

    test('Can go back to the prisoners financial profile', async ({ page }) => {
      const prisonNumber = 'CC1234C'

      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonApi.stubGetPrisonerImage()
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
      await prisonRegisterApi.stubGetPrisonNames()
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)

      const prisonerTransactionsPage = await PrisonerTransactionsPage.load(page, prisonNumber)

      await expect(prisonerTransactionsPage.backLink).toBeVisible()
      await prisonerTransactionsPage.backLink.click()

      await PrisonerFinancialProfilePage.verifyOnPage(page, prisonNumber)
    })

    test(`Should not have any automatically detectable WCAG A or AA violations`, async ({ page }) => {
      const prisonNumber = 'JJ1234J'

      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonApi.stubGetPrisonerImage()
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
      await prisonRegisterApi.stubGetPrisonNames()
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)

      await PrisonerTransactionsPage.load(page, prisonNumber)

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Requesting details of an account that does not exist', () => {
    test(`Should explain that the account cannot be found`, async ({ page }) => {
      const prisonNumber = 'FF1234F'

      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonApi.stubGetPrisonerImage()
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumberNotFound(prisonNumber)
      await prisonRegisterApi.stubGetPrisonNames()

      await page.goto(`/prisoner/${prisonNumber}/money`)

      await accountNotFoundErrorPage.verifyOnPage(page, prisonNumber)
    })

    test('Should allow user to continue to use the service', async ({ page }) => {
      const prisonNumber = 'GG1234G'

      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonApi.stubGetPrisonerImage()
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumberNotFound(prisonNumber)
      await prisonRegisterApi.stubGetPrisonNames()

      await page.goto(`/prisoner/${prisonNumber}/money`)

      const prisonerAccountNotFoundErrorPage = await accountNotFoundErrorPage.verifyOnPage(page, prisonNumber)
      await prisonerAccountNotFoundErrorPage.backLink.click()

      await IndexPage.verifyOnPage(page)
    })
  })

  test.describe('Requesting details of an account that has errors', () => {
    test(`Can see that an error has occured`, async ({ page }) => {
      const prisonNumber = 'II1234I'

      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonApi.stubGetPrisonerImage()
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsInternalServerError(prisonNumber)
      await prisonRegisterApi.stubGetPrisonNames()

      await page.goto(`/prisoner/${prisonNumber}/money`)
      await InternalServerErrorPage.verifyOnPage(page, `/prisoner/${prisonNumber}/money`)
    })

    test('Should allow user to continue to use the service', async ({ page }) => {
      const prisonNumber = 'GG1234G'

      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonApi.stubGetPrisonerImage()
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsInternalServerError(prisonNumber)
      await prisonRegisterApi.stubGetPrisonNames()

      await page.goto(`/prisoner/${prisonNumber}/money`)

      const internalServerErrorPage = await InternalServerErrorPage.verifyOnPage(
        page,
        `/prisoner/${prisonNumber}/money`,
      )
      await internalServerErrorPage.backLink.click()

      await IndexPage.verifyOnPage(page)
    })
  })

  test.describe('Requesting details of an account outside the caseload', () => {
    test(`Can sign in with different credentials`, async ({ page }) => {
      const prisonNumber = 'HH1234H'

      await prisonerSearchApi.stubGetPrisonerOutsideCaseload(prisonNumber)

      await page.goto(`/prisoner/${prisonNumber}/money`)

      await expect(page).toHaveURL(/.*\/sign-out/)
    })
  })

  test.describe('Viewing a list of all the prisoners transactions', () => {
    test('Can view all sub account transactions', async ({ page }) => {
      const prisonNumber = 'EE1234E'

      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonApi.stubGetPrisonerImage()
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
      await prisonRegisterApi.stubGetPrisonNames()
      await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)

      const prisonerTransactionsPage = await PrisonerTransactionsPage.load(page, prisonNumber)

      await expect(prisonerTransactionsPage.transactionList).toBeVisible()
      await expect(prisonerTransactionsPage.transactionList).toContainText(
        [
          'Date Transaction description Amount Balance Account Location',
          '10/03/2026\n10:48 test -0.10 0.30 Private cash Leeds (HMP)',
          '10/03/2026\n10:47 0.20 0.30 Savings Moorland (HMP & YOI)',
          '10/03/2026\n10:46 Cash to Savings Transfer -0.10 0.10 Private cash ',
          '10/03/2026\n10:45 Transaction in secret prison 0.10 - Savings XXX',
        ].join('\n'),
      )
    })
  })

  /*

  test(`Should handle page out of bound and redirect to a 404`, async ({ page }) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumberReturnsPageOutOfBound(prisonNumber, {
      pageNumber: '999',
      pageSize: '25',
    })

    await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)
    await prisonRegisterApi.stubGetPrisonNames()

    await page.goto(`/prisoner/${prisonNumber}/money?page=999`)
    await PageNotFoundErrorPage.verifyOnPage(page, prisonNumber)
  })

  test(`Should not have any automatically detectable WCAG A or AA violations`, async ({ page }) => {
    await baseStubs()

    await PrisonerTransactionsPage.load(page, prisonNumber)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test(`Should display no transactions`, async ({ page }) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [], {})
    await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber)
    await prisonRegisterApi.stubGetPrisonNames()

    const prisonerTransactionsPage = await PrisonerTransactionsPage.load(page, prisonNumber)
    await expect(prisonerTransactionsPage.transactionList).not.toBeVisible()

    const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
    await expect(noTransactionsMessage).toBeVisible()
    await expect(noTransactionsMessage).toHaveText('No transactions to show')
  })

  test(`Should display the filter`, async ({ page }) => {
    await baseStubs()

    await PrisonerTransactionsPage.load(page, prisonNumber)

    const filterComponent = page.locator('[data-module="moj-filter"]')
    const filterSelected = page.locator('[class="moj-filter__selected"]')
    const filterOptions = page.locator('[class="moj-filter__options"]')

    await expect(filterSelected).toBeVisible()
    await expect(filterComponent).toBeVisible()
    await expect(filterOptions).toBeVisible()
  })

  const casesValidFilters = [
    {
      caseName: 'just startDate',
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=10%2F10%2F2010&endDate=#filterForm`,
      action: async (page: PrisonerTransactionsPage) => {
        await page.startDateFilter.fill('10/10/2010')
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
          startDate: '2010-10-10',
        })
      },
    },
    {
      caseName: 'both startDate and endDate',
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=10%2F10%2F2010&endDate=10%2F10%2F2020#filterForm`,
      action: async (page: PrisonerTransactionsPage) => {
        await page.startDateFilter.fill('10/10/2010')
        await page.endDateFilter.fill('10/10/2020')
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
          startDate: '2010-10-10',
          endDate: '2020-10-10',
        })
      },
    },
    {
      caseName: 'just endDate',
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=&endDate=10%2F10%2F2020#filterForm`,
      action: async (page: PrisonerTransactionsPage) => {
        await page.endDateFilter.fill('10/10/2020')
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
          endDate: '2020-10-10',
        })
      },
    },
    {
      caseName: 'just debit',
      debit: 'true',
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=&endDate=&debit=true#filterForm`,
      action: async (page: PrisonerTransactionsPage) => {
        await page.debitFilter.click()
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
          debit: 'true',
        })
      },
    },
    {
      caseName: 'just credit',
      credit: 'true',
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=&endDate=&credit=true#filterForm`,
      action: async (page: PrisonerTransactionsPage) => {
        await page.creditFilter.click()
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
          credit: 'true',
        })
      },
    },
    {
      caseName: 'both debit and credit',
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=&endDate=&credit=true&debit=true#filterForm`,
      action: async (page: PrisonerTransactionsPage) => {
        await page.creditFilter.click()
        await page.debitFilter.click()
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
          debit: 'true',
          credit: 'true',
        })
      },
    },
  ]

  for (const { caseName, expectedUrl, action } of casesValidFilters) {
    test(`Should filter by ${caseName}`, async ({ page }) => {
      await baseStubs()

      const prisonerTransactionsPage = await PrisonerTransactionsPage.load(page, prisonNumber)

      await expect(prisonerTransactionsPage.startDateFilter).toBeVisible()
      await expect(prisonerTransactionsPage.endDateFilter).toBeVisible()
      await expect(prisonerTransactionsPage.creditFilter).toBeVisible()
      await expect(prisonerTransactionsPage.debitFilter).toBeVisible()

      await action(prisonerTransactionsPage)
      await prisonerTransactionsPage.applyFilterButton.click()

      const endDateError = page.locator('[id="endDate-error"]')
      const startDateError = page.locator('[id="startDate-error"]')
      const creditError = page.locator('[id="credit-error"]')
      const debitError = page.locator('[id="debit-error"]')

      await expect(endDateError).not.toBeVisible()
      await expect(startDateError).not.toBeVisible()
      await expect(creditError).not.toBeVisible()
      await expect(debitError).not.toBeVisible()

      await expect(prisonerTransactionsPage.startDateFilter).toBeVisible()
      await expect(prisonerTransactionsPage.endDateFilter).toBeVisible()
      await expect(prisonerTransactionsPage.creditFilter).toBeVisible()
      await expect(prisonerTransactionsPage.debitFilter).toBeVisible()

      const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
      await expect(noTransactionsMessage).not.toBeVisible()

      await expect(page).toHaveURL(expectedUrl)
    })
  }

  const casesInvalidFilters = [
    {
      caseName: 'invalid startDate',
      startDateErrorMessage: 'Start date must be a real date, like 18/01/2026',
      startUrl: `/prisoner/${prisonNumber}/money#filterForm`,
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=XXXX&endDate=#filterForm`,
      action: async (page: PrisonerTransactionsPage) => {
        await page.startDateFilter.fill('XXXX')
        await page.applyFilterButton.click()
      },
    },
    {
      caseName: 'invalid startDate and endDate',
      startDateErrorMessage: 'Start date must be a real date, like 18/01/2026',
      endDateErrorMessage: 'End date must be a real date, like 18/01/2026',
      startUrl: `/prisoner/${prisonNumber}/money#filterForm`,
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=XXXX&endDate=XXXX#filterForm`,
      action: async (page: PrisonerTransactionsPage) => {
        await page.startDateFilter.fill('XXXX')
        await page.endDateFilter.fill('XXXX')
        await page.applyFilterButton.click()
      },
    },
    {
      caseName: 'invalid endDate',
      endDateErrorMessage: 'End date must be a real date, like 18/01/2026',
      startUrl: `/prisoner/${prisonNumber}/money#filterForm`,
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=&endDate=99%2F99%2F9999#filterForm`,
      action: async (page: PrisonerTransactionsPage) => {
        await page.endDateFilter.fill('99/99/9999')
        await page.applyFilterButton.click()
      },
    },
    {
      caseName: 'endate earlier than startDate',
      endDateErrorMessage: 'End date cannot be earlier than start date',
      startUrl: `/prisoner/${prisonNumber}/money#filterForm`,
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=10%2F10%2F2020&endDate=10%2F10%2F2010#filterForm`,
      action: async (page: PrisonerTransactionsPage) => {
        await page.startDateFilter.fill('10/10/2020')
        await page.endDateFilter.fill('10/10/2010')
        await page.applyFilterButton.click()
      },
    },
    {
      caseName: 'invalid debit',
      debitErrorMessage: 'Debit must be true or false\n',
      startUrl: `/prisoner/${prisonNumber}/money?debit=xxxx#filterForm`,
      expectedUrl: `/prisoner/${prisonNumber}/money?debit=xxxx#filterForm`,
      action: async (_page: PrisonerTransactionsPage) => {},
    },
    {
      caseName: 'invalid credit',
      creditErrorMessage: 'Credit must be true or false\n',
      startUrl: `/prisoner/${prisonNumber}/money?credit=xxxx#filterForm`,
      expectedUrl: `/prisoner/${prisonNumber}/money?credit=xxxx#filterForm`,
      action: async (_page: PrisonerTransactionsPage) => {},
    },
    {
      caseName: 'invalid debit and credit',
      debitErrorMessage: 'Debit must be true or false\n',
      creditErrorMessage: 'Credit must be true or false\n',
      startUrl: `/prisoner/${prisonNumber}/money?credit=xxxx&debit=xxxx#filterForm`,
      expectedUrl: `/prisoner/${prisonNumber}/money?credit=xxxx&debit=xxxx#filterForm`,
      action: async (_page: PrisonerTransactionsPage) => {},
    },
  ]
  for (const {
    caseName,
    startDateErrorMessage,
    endDateErrorMessage,
    debitErrorMessage,
    creditErrorMessage,
    startUrl,
    expectedUrl,
    action,
  } of casesInvalidFilters) {
    test(`Should show validation errors on ${caseName}`, async ({ page }) => {
      await baseStubs()

      await page.goto(startUrl)

      const prisonerTransactionsPage = await PrisonerTransactionsPage.verifyOnPage(page, prisonNumber)

      await expect(prisonerTransactionsPage.startDateFilter).toBeVisible()
      await expect(prisonerTransactionsPage.endDateFilter).toBeVisible()
      await expect(prisonerTransactionsPage.creditFilter).toBeVisible()
      await expect(prisonerTransactionsPage.debitFilter).toBeVisible()

      await action(prisonerTransactionsPage)

      const endDateError = page.locator('[id="endDate-error"]')
      const startDateError = page.locator('[id="startDate-error"]')
      const creditDebitError = page.locator('[id="creditDebit-error"]')

      const checkMessages = []
      for (const { errorMessage, errorComponent } of [
        { errorMessage: startDateErrorMessage, errorComponent: startDateError },
        { errorMessage: endDateErrorMessage, errorComponent: endDateError },
        { errorMessage: `${creditErrorMessage ?? ''}${debitErrorMessage ?? ''}`, errorComponent: creditDebitError },
      ]) {
        if (errorMessage) {
          checkMessages.push(expect(errorComponent).toContainText(errorMessage))
        } else {
          checkMessages.push(expect(errorComponent).not.toBeVisible())
        }
      }
      await Promise.all(checkMessages)

      const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
      await expect(noTransactionsMessage).toBeVisible()
      await expect(noTransactionsMessage).toHaveText("Please fix the filter's errors to view transactions")

      await expect(page).toHaveURL(expectedUrl)
    })
  }

  test(`Should be able to remove selected filters`, async ({ page }) => {
    await baseStubs()

    await PrisonerTransactionsPage.load(page, prisonNumber)

    const startDateFilter = page.locator('input[id="startDate"]')
    const endDateFilter = page.locator('input[id="endDate"]')
    const applyFilterButton = page.locator('[data-test-id="submit-button"]')

    await expect(startDateFilter).toBeVisible()
    await expect(endDateFilter).toBeVisible()

    const startDateVal = '10/10/2010'
    const endDateVal = '10/12/2010'

    await startDateFilter.fill(startDateVal)
    await endDateFilter.fill(endDateVal)

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
      startDate: '2010-10-10',
      endDate: '2010-12-10',
    })

    await applyFilterButton.click()

    await expect(page).toHaveURL(
      `/prisoner/${prisonNumber}/money?startDate=${encodeURIComponent(startDateVal)}&endDate=${encodeURIComponent(endDateVal)}#filterForm`,
    )

    await expect(startDateFilter).toBeVisible()
    await expect(endDateFilter).toBeVisible()

    const startDatefilterTag = page.getByRole('link', { name: 'Start date' })

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
      endDate: '2010-12-10',
    })

    await startDatefilterTag.click()
    await expect(page).toHaveURL(
      `/prisoner/${prisonNumber}/money?endDate=${encodeURIComponent(endDateVal)}&page=1#filterForm`,
    )
    expect(await endDateFilter.inputValue()).toBe(endDateVal)
    expect(await startDateFilter.textContent()).toHaveLength(0)
  })

  test(`Should clear all filters`, async ({ page }) => {
    await baseStubs()

    const prisonerTransactionsPage = await PrisonerTransactionsPage.load(page, prisonNumber)

    const applyFilterButton = page.locator('[data-test-id="submit-button"]')

    await expect(prisonerTransactionsPage.startDateFilter).toBeVisible()
    await expect(prisonerTransactionsPage.endDateFilter).toBeVisible()
    await expect(prisonerTransactionsPage.creditFilter).toBeVisible()
    await expect(prisonerTransactionsPage.debitFilter).toBeVisible()

    const startDateVal = '10/10/2010'
    const endDateVal = '10/12/2010'

    await prisonerTransactionsPage.startDateFilter.fill(startDateVal)
    await prisonerTransactionsPage.endDateFilter.fill(endDateVal)
    await prisonerTransactionsPage.creditFilter.click()
    await prisonerTransactionsPage.debitFilter.click()

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
      startDate: '2010-10-10',
      endDate: '2010-12-10',
      credit: 'true',
      debit: 'true',
    })

    await applyFilterButton.click()

    await expect(page).toHaveURL(
      `/prisoner/${prisonNumber}/money?startDate=${encodeURIComponent(startDateVal)}&endDate=${encodeURIComponent(endDateVal)}&credit=true&debit=true#filterForm`,
    )

    const clearFilters = page.getByText('Clear Filters')

    await clearFilters.click()

    await expect(page).toHaveURL(`/prisoner/${prisonNumber}/money?#filterForm`)

    expect(await prisonerTransactionsPage.startDateFilter.textContent()).toHaveLength(0)
    expect(await prisonerTransactionsPage.endDateFilter.textContent()).toHaveLength(0)
    await expect(prisonerTransactionsPage.creditFilter).not.toBeChecked()
    await expect(prisonerTransactionsPage.debitFilter).not.toBeChecked()
  })

  test(`Should render pagination component and allow progression`, async ({ page }) => {
    await baseStubs()

    await prisonerFinanceApi.stubGetPagedPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, 10, {
      startDate: '2026-04-09',
      endDate: '2026-04-12',
      pageNumber: '10',
      pageSize: '25',
      credit: 'true',
      debit: 'true',
    })

    const buildQueriesForPage = (pageNumber: number) =>
      `?startDate=${encodeURIComponent('09/04/2026')}&endDate=${encodeURIComponent('12/04/2026')}&page=${pageNumber}&credit=true&debit=true`

    await page.goto(`/prisoner/${prisonNumber}/money${buildQueriesForPage(10)}`)

    const { topPagination, bottomPagination } = await PrisonerTransactionsPage.verifyOnPage(page, prisonNumber)
    await expect(topPagination).toBeVisible()
    await expect(bottomPagination).toBeVisible()

    const topNavButton = topPagination.locator("[aria-label='Page 9']")
    await expect(topNavButton).toBeVisible()
    expect(await topNavButton.getAttribute('href')).toBe(buildQueriesForPage(9))

    await baseStubs()
    await prisonerFinanceApi.stubGetPagedPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, 9, {
      startDate: '2026-04-09',
      endDate: '2026-04-12',
      pageNumber: '9',
      pageSize: '25',
      credit: 'true',
      debit: 'true',
    })

    await topNavButton.click()

    expect(page.url()).toContain(buildQueriesForPage(9))

    const topResultText = topPagination.locator('.moj-pagination__results')
    await expect(topResultText).toBeVisible()

    expect(await topResultText.innerText()).toBe('Showing 201 to 225 of 500 total results')

    const bottomResultText = bottomPagination.locator('.moj-pagination__results')
    await expect(bottomResultText).toBeVisible()

    expect(await bottomResultText.innerText()).toBe('Showing 201 to 225 of 500 total results')

    const topCurrentPageLi = topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('9')

    const bottomCurrentPageLi = bottomPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('9')
  })

  test(`Should allow progression with next button`, async ({ page }) => {
    await baseStubs()

    await prisonerFinanceApi.stubGetPagedPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, 10, {
      startDate: '2026-04-09',
      endDate: '2026-04-12',
      pageNumber: '10',
      pageSize: '25',
      credit: 'true',
      debit: 'true',
    })

    const buildQueriesForPage = (pageNumber: number) =>
      `?startDate=${encodeURIComponent('09/04/2026')}&endDate=${encodeURIComponent('12/04/2026')}&page=${pageNumber}&credit=true&debit=true`

    await page.goto(`/prisoner/${prisonNumber}/money${buildQueriesForPage(10)}`)

    const { topPagination, bottomPagination } = await PrisonerTransactionsPage.verifyOnPage(page, prisonNumber)

    await expect(topPagination).toBeVisible()
    await expect(bottomPagination).toBeVisible()

    const nextNavButton = topPagination.locator("[rel='next']")
    await expect(nextNavButton).toBeVisible()
    expect(await nextNavButton.getAttribute('href')).toBe(buildQueriesForPage(11))

    await baseStubs()
    await prisonerFinanceApi.stubGetPagedPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, 11, {
      startDate: '2026-04-09',
      endDate: '2026-04-12',
      pageNumber: '11',
      pageSize: '25',
      credit: 'true',
      debit: 'true',
    })

    await nextNavButton.click()

    expect(page.url()).toContain(buildQueriesForPage(11))

    const topResultText = topPagination.locator('.moj-pagination__results')
    await expect(topResultText).toBeVisible()

    expect(await topResultText.innerText()).toBe('Showing 251 to 275 of 500 total results')

    const bottomResultText = bottomPagination.locator('.moj-pagination__results')
    await expect(bottomResultText).toBeVisible()

    expect(await bottomResultText.innerText()).toBe('Showing 251 to 275 of 500 total results')

    const topCurrentPageLi = topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('11')

    const bottomCurrentPageLi = bottomPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('11')
  })

  test(`Should allow progression with previous button`, async ({ page }) => {
    await baseStubs()

    await prisonerFinanceApi.stubGetPagedPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, 10, {
      startDate: '2026-04-09',
      endDate: '2026-04-12',
      pageNumber: '10',
      pageSize: '25',
      credit: 'true',
      debit: 'true',
    })

    const buildQueriesForPage = (pageNumber: number) =>
      `?startDate=${encodeURIComponent('09/04/2026')}&endDate=${encodeURIComponent('12/04/2026')}&page=${pageNumber}&credit=true&debit=true`

    await page.goto(`/prisoner/${prisonNumber}/money${buildQueriesForPage(10)}`)

    const { topPagination, bottomPagination } = await PrisonerTransactionsPage.verifyOnPage(page, prisonNumber)

    await expect(topPagination).toBeVisible()
    await expect(bottomPagination).toBeVisible()

    const prevNavButton = topPagination.locator("[rel='prev']")
    await expect(prevNavButton).toBeVisible()
    expect(await prevNavButton.getAttribute('href')).toBe(buildQueriesForPage(9))

    await baseStubs()
    await prisonerFinanceApi.stubGetPagedPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, 9, {
      startDate: '2026-04-09',
      endDate: '2026-04-12',
      pageNumber: '9',
      pageSize: '25',
      credit: 'true',
      debit: 'true',
    })

    await prevNavButton.click()

    expect(page.url()).toContain(buildQueriesForPage(9))

    const topResultText = topPagination.locator('.moj-pagination__results')
    await expect(topResultText).toBeVisible()

    expect(await topResultText.innerText()).toBe('Showing 201 to 225 of 500 total results')

    const bottomResultText = bottomPagination.locator('.moj-pagination__results')
    await expect(bottomResultText).toBeVisible()

    expect(await bottomResultText.innerText()).toBe('Showing 201 to 225 of 500 total results')

    const topCurrentPageLi = topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('9')

    const bottomCurrentPageLi = bottomPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('9')
  })
    */
})
