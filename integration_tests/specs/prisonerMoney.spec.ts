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

  test('should filter by valid start and end Date', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)
    await PrisonerMoneyPage.verifyOnPage(page)

    const startDateFilter = page.locator('input[id="startDate"]')
    const endDateFilter = page.locator('input[id="endDate"]')
    const applyFilterButton = page.locator('[data-test-id="submit-button"]')

    await expect(startDateFilter).toBeVisible()
    await expect(endDateFilter).toBeVisible()

    const startDateVal = '10/10/2010'
    const endDateVal = '10/12/2010'

    await startDateFilter.fill(startDateVal)
    await endDateFilter.fill(endDateVal)

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
      prisonNumber,
      pageTransactionsResponse,
      '2010-10-10',
      '2010-12-10',
    )

    await applyFilterButton.click()

    const endDateError = page.locator('[id="endDate-error"]')
    const startDateError = page.locator('[id="startDate-error"]')

    await expect(endDateError).not.toBeVisible()
    await expect(startDateError).not.toBeVisible()

    await expect(startDateFilter).toBeVisible()
    await expect(endDateFilter).toBeVisible()

    const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
    await expect(noTransactionsMessage).not.toBeVisible()

    await expect(page).toHaveURL(
      `/prisoner/${prisonNumber}/money?startDate=${encodeURIComponent(startDateVal)}&endDate=${encodeURIComponent(endDateVal)}#filterForm`,
    )
  })

  test('should show validation errors on start and end date', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)
    await PrisonerMoneyPage.verifyOnPage(page)

    const startDateFilter = page.locator('input[id="startDate"]')
    const endDateFilter = page.locator('input[id="endDate"]')
    const applyFilterButton = page.locator('[data-test-id="submit-button"]')

    await expect(startDateFilter).toBeVisible()
    await expect(endDateFilter).toBeVisible()

    const startDateVal = 'NotAdate'
    const endDateVal = '99/99/99999'

    await startDateFilter.fill(startDateVal)
    await endDateFilter.fill(endDateVal)

    await applyFilterButton.click()

    const endDateError = page.locator('[id="endDate-error"]')
    const startDateError = page.locator('[id="startDate-error"]')

    await expect(endDateError).toContainText('End date must be a real date, like 18/01/2026')
    await expect(startDateError).toContainText('Start date must be a real date, like 18/01/2026')

    const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
    expect(noTransactionsMessage).toBeVisible()
    expect(noTransactionsMessage).toHaveText("Please fix the filter's errors to view transactions")

    await expect(page).toHaveURL(
      `/prisoner/${prisonNumber}/money?startDate=${encodeURIComponent(startDateVal)}&endDate=${encodeURIComponent(endDateVal)}#filterForm`,
    )
  })

  test('should show validation error when end date is earlier than start date', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}/money`)
    await PrisonerMoneyPage.verifyOnPage(page)

    const startDateFilter = page.locator('input[id="startDate"]')
    const endDateFilter = page.locator('input[id="endDate"]')
    const applyFilterButton = page.locator('[data-test-id="submit-button"]')

    await expect(startDateFilter).toBeVisible()
    await expect(endDateFilter).toBeVisible()

    const startDateVal = '10/11/2011'
    const endDateVal = '10/11/2010'

    await startDateFilter.fill(startDateVal)
    await endDateFilter.fill(endDateVal)

    await applyFilterButton.click()

    const endDateError = page.locator('[id="endDate-error"]')
    const startDateError = page.locator('[id="startDate-error"]')

    await expect(endDateError).toContainText('End date cannot be earlier than start date')
    await expect(startDateError).not.toBeVisible()

    const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
    expect(noTransactionsMessage).toBeVisible()
    expect(noTransactionsMessage).toHaveText("Please fix the filter's errors to view transactions")

    await expect(page).toHaveURL(
      `/prisoner/${prisonNumber}/money?startDate=${encodeURIComponent(startDateVal)}&endDate=${encodeURIComponent(endDateVal)}#filterForm`,
    )
  })

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

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
      prisonNumber,
      pageTransactionsResponse,
      '2010-10-10',
      '2010-12-10',
    )

    await applyFilterButton.click()

    await expect(page).toHaveURL(
      `/prisoner/${prisonNumber}/money?startDate=${encodeURIComponent(startDateVal)}&endDate=${encodeURIComponent(endDateVal)}#filterForm`,
    )

    await expect(startDateFilter).toBeVisible()
    await expect(endDateFilter).toBeVisible()

    const startDatefilterTag = page.getByRole('link', { name: 'Start date' })

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
      prisonNumber,
      pageTransactionsResponse,
      undefined,
      '2010-12-10',
    )

    await startDatefilterTag.click()
    await expect(page).toHaveURL(`/prisoner/${prisonNumber}/money?endDate=${encodeURIComponent(endDateVal)}#filterForm`)
    expect(await endDateFilter.inputValue()).toBe(endDateVal)
    expect(await startDateFilter.textContent()).toHaveLength(0)
  })

  test('Should clear all filters', async ({ page }) => {
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

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
      prisonNumber,
      pageTransactionsResponse,
      '2010-10-10',
      '2010-12-10',
    )

    await applyFilterButton.click()

    await expect(page).toHaveURL(
      `/prisoner/${prisonNumber}/money?startDate=${encodeURIComponent(startDateVal)}&endDate=${encodeURIComponent(endDateVal)}#filterForm`,
    )

    const clearFilters = page.getByText('Clear Filters')

    await clearFilters.click()

    expect(page).toHaveURL(`/prisoner/${prisonNumber}/money?#filterForm`)

    expect(await startDateFilter.textContent()).toHaveLength(0)
    expect(await endDateFilter.textContent()).toHaveLength(0)
  })

  test('Should render pagination component and allow progression', async ({ page }) => {
    await baseStubs()

    const createPageTransactionResponse = (pageNumber: number): Page<PrisonerTransactionResponse> => {
      return {
        content: transactionPayload,
        totalElements: 100,
        totalPages: 20,
        pageNumber,
        pageSize: 5,
        isLastPage: pageNumber === 20,
      }
    }

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
      prisonNumber,
      createPageTransactionResponse(10),
      '2026-04-09',
      '2026-04-12',
      '10',
      '25',
    )

    const buildQueriesForPage = (pageNumber: number) =>
      `?startDate=${encodeURIComponent('09/04/2026')}&endDate=${encodeURIComponent('12/04/2026')}&page=${pageNumber}`

    await page.goto(`/prisoner/${prisonNumber}/money${buildQueriesForPage(10)}`)

    const { topPagination, bottomPagination } = await PrisonerMoneyPage.verifyOnPage(page)

    await expect(topPagination).toBeVisible()
    await expect(bottomPagination).toBeVisible()

    const topNavButton = topPagination.locator("[aria-label='Page 9']")
    await expect(topNavButton).toBeVisible()
    expect(await topNavButton.getAttribute('href')).toBe(buildQueriesForPage(9))

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(
      prisonNumber,
      createPageTransactionResponse(9),
      '2026-04-09',
      '2026-04-12',
      '9',
      '25',
    )

    await topNavButton.click()

    expect(page.url()).toContain(buildQueriesForPage(9))

    const topResultText = topPagination.locator('.moj-pagination__results')
    await expect(topResultText).toBeVisible()

    expect(await topResultText.innerText()).toBe('Showing 41 to 45 of 100 total results')

    const bottomResultText = bottomPagination.locator('.moj-pagination__results')
    await expect(bottomResultText).toBeVisible()

    expect(await bottomResultText.innerText()).toBe('Showing 41 to 45 of 100 total results')

    const topCurrentPageLi = topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('9')

    const bottomCurrentPageLi = bottomPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('9')
  })
})
