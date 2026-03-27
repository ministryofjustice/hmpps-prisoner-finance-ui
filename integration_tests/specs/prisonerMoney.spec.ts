import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login, resetStubs } from '../testUtils'
import PrisonerMoneyPage from '../pages/prisonerMoneyPage'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../../server/interfaces/AccountBalanceResponse'
import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import prisonRegisterApi from '../mockApis/prisonRegisterApi'

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
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
    },
  ]

  const balancePayload: AccountBalanceResponse = {
    accountId: '123456',
    balanceDateTime: '12:34:56',
    amount: 1234,
  }

  const prisonNumber = 'ABC123XZ'

  const baseStubs = async () => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
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
    await expect(cells.nth(1)).toHaveText('Cash to Savings Transfer')
    await expect(cells.nth(2)).toHaveText('£0.10')
    await expect(cells.nth(3)).toHaveText('£0.00')
    await expect(cells.nth(4)).toHaveText('')
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
    expect(overviewTabLink).toHaveAttribute(
      'href',
      `https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/${prisonNumber}`,
    )
  })

  test('should display no transactions', async ({ page }) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [])
    await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber, balancePayload)
    await prisonRegisterApi.stubGetPrisonNames()

    await page.goto(`/prisoner/${prisonNumber}/money`)

    const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)
    expect(prisonerMoneyPage.tableTransactions).not.toBeVisible()

    const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
    expect(noTransactionsMessage).toBeVisible()
    expect(noTransactionsMessage).toHaveText('No transactions to show')
  })
})
