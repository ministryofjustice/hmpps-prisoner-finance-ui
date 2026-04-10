import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login, resetStubs } from '../testUtils'
import PrisonerMoneyPage from '../pages/prisonerMoneyPage'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../../server/interfaces/AccountBalanceResponse'
import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import prisonRegisterApi from '../mockApis/prisonRegisterApi'
import { Page } from '../../server/interfaces/Pageable'

test.describe('Prisoner Money', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  const transactionPayload: Array<PrisonerTransactionResponse> = [
    {
      date: '2026-03-10T10:43:28.094Z',
      description: 'test',
      credit: 0,
      debit: 10,
      location: 'LEI',
      accountType: 'CASH',
    },
    {
      date: '2026-03-11T10:43:28.094Z',
      description: '',
      credit: 20,
      debit: 0,
      location: 'MDI',
      accountType: 'SAVINGS',
    },
    {
      date: '2026-03-10T10:46:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
    },
    {
      date: '2026-03-10T10:43:28.194Z',
      description: 'Transaction in secret prison',
      credit: 10,
      debit: 0,
      location: 'XXX',
      accountType: 'SAVINGS',
    },
  ]

  const pageTransactionsResponse: Page<PrisonerTransactionResponse> = {
    content: transactionPayload,
    totalElements: transactionPayload.length,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 99,
    isLastPage: true,
  }

  const emptyPageTransactionsResponse: Page<PrisonerTransactionResponse> = {
    content: [],
    totalElements: 0,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 99,
    isLastPage: true,
  }

  const balancePayload: AccountBalanceResponse = {
    accountId: '123456',
    balanceDateTime: '12:34:56',
    amount: 1234,
  }

  const prisonNumber = 'ABC123XZ'

  const baseStubs = async () => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse)
    await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber, balancePayload)
    await prisonRegisterApi.stubGetPrisonNames()
  }

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test('Should display Header and Transactions table', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)

    const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)
    expect(prisonerMoneyPage.heading).toBeVisible()
    expect(prisonerMoneyPage.heading).toContainText('Prisoner Transactions')
    expect(prisonerMoneyPage.tableTransactions).toBeVisible()
    expect(prisonerMoneyPage.tableTransactions.locator('thead tr th')).toHaveCount(6)

    const rows = prisonerMoneyPage.tableTransactions.locator('tbody tr')

    expect(rows).toHaveCount(transactionPayload.length)

    // Row 1
    let cells = rows.nth(0).locator('td')
    await expect(cells.nth(0)).toHaveText('10/03/2026')
    await expect(cells.nth(1)).toHaveText('test')
    await expect(cells.nth(2)).toHaveText('£0.00')
    await expect(cells.nth(3)).toHaveText('£0.10')
    await expect(cells.nth(4)).toHaveText('Leeds (HMP)')
    await expect(cells.nth(5)).toHaveText('CASH')

    // Row 2
    cells = rows.nth(1).locator('td')
    await expect(cells.nth(0)).toHaveText('11/03/2026')
    await expect(cells.nth(1)).toHaveText('')
    await expect(cells.nth(2)).toHaveText('£0.20')
    await expect(cells.nth(3)).toHaveText('£0.00')
    await expect(cells.nth(4)).toHaveText('Moorland (HMP & YOI)')
    await expect(cells.nth(5)).toHaveText('SAVINGS')

    // Row 3
    cells = rows.nth(2).locator('td')
    await expect(cells.nth(0)).toHaveText('10/03/2026')
    await expect(cells.nth(1)).toHaveText('Cash to Savings Transfer')
    await expect(cells.nth(2)).toHaveText('£0.00')
    await expect(cells.nth(3)).toHaveText('£0.10')
    await expect(cells.nth(4)).toHaveText('')
    await expect(cells.nth(5)).toHaveText('CASH')

    // Row 4
    cells = rows.nth(3).locator('td')
    await expect(cells.nth(0)).toHaveText('10/03/2026')
    await expect(cells.nth(1)).toHaveText('Transaction in secret prison')
    await expect(cells.nth(2)).toHaveText('£0.10')
    await expect(cells.nth(3)).toHaveText('£0.00')
    await expect(cells.nth(4)).toHaveText('XXX')
    await expect(cells.nth(5)).toHaveText('SAVINGS')
  })

  test('Should display the balance card with the total amount', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)
    const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

    expect(prisonerMoneyPage.balanceCard).toBeVisible()
    const { balanceCard } = prisonerMoneyPage

    expect(balanceCard.locator('h3')).toContainText('Total')
    expect(balanceCard.locator('h2')).toContainText('Total')
    expect(balanceCard.locator('.hmpps-balance-card__amount')).toContainText('£12.34')
  })

  test('Backlink should render and return to profile page', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)

    const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

    expect(prisonerMoneyPage.backButton).toBeVisible()

    await prisonerMoneyPage.backButton.click()

    expect(new URL(page.url()).pathname).toBe(`/prisoner/${prisonNumber}`)
  })

  test('Should handle 404 and render error', async ({ page }) => {
    const notFoundPrisonNumber = 'XXXXX'

    await prisonerSearchApi.stubGetPrisoner(notFoundPrisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumberNotFound(notFoundPrisonNumber)
    await prisonRegisterApi.stubGetPrisonNames()

    const response = await page.goto(`/prisoner/${notFoundPrisonNumber}/money`)

    expect(response?.status()).toBe(404)
    expect(page.locator('[data-testid="error-page-message"]')).toContainText('Account not found')
    expect(page.locator('[data-testid="error-page-status"]')).toContainText('404')
  })

  test('Should handle 500 and render error', async ({ page }) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber, balancePayload)
    await prisonerFinanceApi.stubGetPrisonerTransactionsInternalServerError(prisonNumber)
    await prisonRegisterApi.stubGetPrisonNames()

    const response = await page.goto(`/prisoner/${prisonNumber}/money`)

    expect(response?.status()).toBe(500)
    expect(page.locator('[data-testid="error-page-message"]')).toContainText('Internal Server Error')
    expect(page.locator('[data-testid="error-page-status"]')).toContainText('500')
  })

  test('Should redirect to sign-out when prisoner is outside user caseload', async ({ page }) => {
    const mismatchedPrisonNumber = 'G1234HH'
    await prisonerSearchApi.stubGetPrisonerOutsideCaseload(mismatchedPrisonNumber)
    await page.goto(`/prisoner/${mismatchedPrisonNumber}/money`)
    await expect(page).toHaveURL(/.*\/sign-out/)
  })

  test('Should not have any automatically detectable WCAG A or AA violations', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)
    await PrisonerMoneyPage.verifyOnPage(page)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Should display prisoner information header', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)
    const { prisonerInformationHeader } = await PrisonerMoneyPage.verifyOnPage(page)

    expect(prisonerInformationHeader).toBeVisible()
    expect(page.locator('[data-testid="prisonerName"]')).toContainText('Smith, John')
    expect(page.locator('[data-testid="prisonerNumber"]')).toContainText(prisonNumber)
    expect(page.locator('[data-testid="cell-location"]')).toContainText('RECP')
    expect(page.locator('[data-testid="category"]')).toContainText('C')
    expect(page.locator('[data-testid="csra"]')).toContainText('Standard')
    expect(page.locator('[data-testid="incentive-level"]')).toContainText('Enhanced')
  })

  test('should display the prisoner information tab', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)
    await PrisonerMoneyPage.verifyOnPage(page)

    const profileTabs = page.locator('[data-testid="profile-tabs"]')
    const overviewTabLink = profileTabs.locator('li a').first()
    await expect(overviewTabLink).toHaveAttribute(
      'href',
      `https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/${prisonNumber}`,
    )
  })

  test('should display no transactions', async ({ page }) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, emptyPageTransactionsResponse)
    await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber, balancePayload)
    await prisonRegisterApi.stubGetPrisonNames()

    await page.goto(`/prisoner/${prisonNumber}/money`)

    const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)
    expect(prisonerMoneyPage.tableTransactions).not.toBeVisible()

    const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
    expect(noTransactionsMessage).toBeVisible()
    expect(noTransactionsMessage).toHaveText('No transactions to show')
  })

  test('should display the filter', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)
    await PrisonerMoneyPage.verifyOnPage(page)

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
      action: async (page: PrisonerMoneyPage) => {
        await page.startDateFilter.fill('10/10/2010')
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
          startDate: '2010-10-10',
        })
      },
    },
    {
      caseName: 'both startDate and endDate',
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=10%2F10%2F2010&endDate=10%2F10%2F2020#filterForm`,
      action: async (page: PrisonerMoneyPage) => {
        await page.startDateFilter.fill('10/10/2010')
        await page.endDateFilter.fill('10/10/2020')
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
          startDate: '2010-10-10',
          endDate: '2020-10-10',
        })
      },
    },
    {
      caseName: 'just endDate',
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=&endDate=10%2F10%2F2020#filterForm`,
      action: async (page: PrisonerMoneyPage) => {
        await page.endDateFilter.fill('10/10/2020')
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
          endDate: '2020-10-10',
        })
      },
    },
    {
      caseName: 'just debit',
      debit: 'true',
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=&endDate=&debit=true#filterForm`,
      action: async (page: PrisonerMoneyPage) => {
        await page.debitFilter.click()
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
          debit: 'true',
        })
      },
    },
    {
      caseName: 'just credit',
      credit: 'true',
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=&endDate=&credit=true#filterForm`,
      action: async (page: PrisonerMoneyPage) => {
        await page.creditFilter.click()
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
          credit: 'true',
        })
      },
    },
    {
      caseName: 'both debit and credit',
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=&endDate=&credit=true&debit=true#filterForm`,
      action: async (page: PrisonerMoneyPage) => {
        await page.creditFilter.click()
        await page.debitFilter.click()
        await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
          debit: 'true',
          credit: 'true',
        })
      },
    },
  ]
  for (const { caseName, expectedUrl, action } of casesValidFilters) {
    test(`should filter by ${caseName}`, async ({ page }) => {
      await baseStubs()
      await page.goto(`/prisoner/${prisonNumber}/money`)
      const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

      await expect(prisonerMoneyPage.startDateFilter).toBeVisible()
      await expect(prisonerMoneyPage.endDateFilter).toBeVisible()
      await expect(prisonerMoneyPage.creditFilter).toBeVisible()
      await expect(prisonerMoneyPage.debitFilter).toBeVisible()

      await action(prisonerMoneyPage)
      await prisonerMoneyPage.applyFilterButton.click()

      const endDateError = page.locator('[id="endDate-error"]')
      const startDateError = page.locator('[id="startDate-error"]')
      const creditError = page.locator('[id="credit-error"]')
      const debitError = page.locator('[id="debit-error"]')

      await expect(endDateError).not.toBeVisible()
      await expect(startDateError).not.toBeVisible()
      await expect(creditError).not.toBeVisible()
      await expect(debitError).not.toBeVisible()

      await expect(prisonerMoneyPage.startDateFilter).toBeVisible()
      await expect(prisonerMoneyPage.endDateFilter).toBeVisible()
      await expect(prisonerMoneyPage.creditFilter).toBeVisible()
      await expect(prisonerMoneyPage.debitFilter).toBeVisible()

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
      action: async (page: PrisonerMoneyPage) => {
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
      action: async (page: PrisonerMoneyPage) => {
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
      action: async (page: PrisonerMoneyPage) => {
        await page.endDateFilter.fill('99/99/9999')
        await page.applyFilterButton.click()
      },
    },
    {
      caseName: 'endate earlier than startDate',
      endDateErrorMessage: 'End date cannot be earlier than start date',
      startUrl: `/prisoner/${prisonNumber}/money#filterForm`,
      expectedUrl: `/prisoner/${prisonNumber}/money?startDate=10%2F10%2F2020&endDate=10%2F10%2F2010#filterForm`,
      action: async (page: PrisonerMoneyPage) => {
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
      action: async (_page: PrisonerMoneyPage) => {},
    },
    {
      caseName: 'invalid credit',
      creditErrorMessage: 'Credit must be true or false\n',
      startUrl: `/prisoner/${prisonNumber}/money?credit=xxxx#filterForm`,
      expectedUrl: `/prisoner/${prisonNumber}/money?credit=xxxx#filterForm`,
      action: async (_page: PrisonerMoneyPage) => {},
    },
    {
      caseName: 'invalid debit and credit',
      debitErrorMessage: 'Debit must be true or false\n',
      creditErrorMessage: 'Credit must be true or false\n',
      startUrl: `/prisoner/${prisonNumber}/money?credit=xxxx&debit=xxxx#filterForm`,
      expectedUrl: `/prisoner/${prisonNumber}/money?credit=xxxx&debit=xxxx#filterForm`,
      action: async (_page: PrisonerMoneyPage) => {},
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
    test(`should show validation errors on ${caseName}`, async ({ page }) => {
      await baseStubs()

      await page.goto(startUrl)

      const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

      await expect(prisonerMoneyPage.startDateFilter).toBeVisible()
      await expect(prisonerMoneyPage.endDateFilter).toBeVisible()
      await expect(prisonerMoneyPage.creditFilter).toBeVisible()
      await expect(prisonerMoneyPage.debitFilter).toBeVisible()

      await action(prisonerMoneyPage)

      const endDateError = page.locator('[id="endDate-error"]')
      const startDateError = page.locator('[id="startDate-error"]')
      const creditDebitError = page.locator('[id="creditDebit-error"]')

      for (const { errorMessage, errorComponent } of [
        { errorMessage: startDateErrorMessage, errorComponent: startDateError },
        { errorMessage: endDateErrorMessage, errorComponent: endDateError },
        { errorMessage: `${creditErrorMessage ?? ''}${debitErrorMessage ?? ''}`, errorComponent: creditDebitError },
      ]) {
        if (errorMessage) {
          // eslint-disable-next-line no-await-in-loop
          await expect(errorComponent).toContainText(errorMessage)
        } else {
          // eslint-disable-next-line no-await-in-loop
          await expect(errorComponent).not.toBeVisible()
        }
      }

      const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
      expect(noTransactionsMessage).toBeVisible()
      expect(noTransactionsMessage).toHaveText("Please fix the filter's errors to view transactions")

      expect(page).toHaveURL(expectedUrl)
    })
  }

  test('should be able to remove selected filters', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)
    await PrisonerMoneyPage.verifyOnPage(page)

    const startDateFilter = page.locator('input[id="startDate"]')
    const endDateFilter = page.locator('input[id="endDate"]')
    const applyFilterButton = page.locator('[data-test-id="submit-button"]')

    expect(startDateFilter).toBeVisible()
    expect(endDateFilter).toBeVisible()

    const startDateVal = '10/10/2010'
    const endDateVal = '10/12/2010'

    await startDateFilter.fill(startDateVal)
    await endDateFilter.fill(endDateVal)

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
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

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
      endDate: '2010-12-10',
    })

    await startDatefilterTag.click()
    await expect(page).toHaveURL(`/prisoner/${prisonNumber}/money?endDate=${encodeURIComponent(endDateVal)}#filterForm`)
    expect(await endDateFilter.inputValue()).toBe(endDateVal)
    expect(await startDateFilter.textContent()).toHaveLength(0)
  })

  test('Should clear all filters', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)
    const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

    const applyFilterButton = page.locator('[data-test-id="submit-button"]')

    expect(prisonerMoneyPage.startDateFilter).toBeVisible()
    expect(prisonerMoneyPage.endDateFilter).toBeVisible()
    expect(prisonerMoneyPage.creditFilter).toBeVisible()
    expect(prisonerMoneyPage.debitFilter).toBeVisible()

    const startDateVal = '10/10/2010'
    const endDateVal = '10/12/2010'

    await prisonerMoneyPage.startDateFilter.fill(startDateVal)
    await prisonerMoneyPage.endDateFilter.fill(endDateVal)
    await prisonerMoneyPage.creditFilter.click()
    await prisonerMoneyPage.debitFilter.click()

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, pageTransactionsResponse, {
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

    expect(page).toHaveURL(`/prisoner/${prisonNumber}/money?#filterForm`)

    expect(await prisonerMoneyPage.startDateFilter.textContent()).toHaveLength(0)
    expect(await prisonerMoneyPage.endDateFilter.textContent()).toHaveLength(0)
    expect(await prisonerMoneyPage.creditFilter).not.toBeChecked()
    expect(await prisonerMoneyPage.debitFilter).not.toBeChecked()
  })
})
