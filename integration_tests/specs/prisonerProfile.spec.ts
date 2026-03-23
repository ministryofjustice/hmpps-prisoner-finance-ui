import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login, resetStubs } from '../testUtils'
import PrisonerProfilePage from '../pages/prisonerProfilePage'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import { SubAccountBalanceResponse } from '../../server/interfaces/SubAccountBalanceResponse'

import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'

test.describe('Prisoner Profile', () => {
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
    {
      date: '2026-03-10T10:43:28.194Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
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

  const balancePayload: SubAccountBalanceResponse[] = [
    { subAccountId: '', balanceDateTime: '', amount: 1234 },
    { subAccountId: '', balanceDateTime: '', amount: 3456 },
    { subAccountId: '', balanceDateTime: '', amount: 0 },
  ]

  const baseStubs = async () => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', balancePayload[0])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', balancePayload[1])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', balancePayload[2])
  }
  const prisonNumber = 'ABC123XZ'
  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test('Should display Header and Transactions table', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}`)

    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page)
    expect(prisonerProfilePage.heading).toBeVisible()
    expect(prisonerProfilePage.heading).toContainText('Finances')
    expect(prisonerProfilePage.tableTransactions).toBeVisible()
    expect(prisonerProfilePage.tableTransactions.locator('thead tr th')).toHaveCount(5)

    const rows = prisonerProfilePage.tableTransactions.locator('tbody tr')

    expect(rows).toHaveCount(5)

    const cells = rows.first().locator('td')
    expect(cells.nth(0)).toHaveText('10/03/2026')
    expect(cells.nth(1)).toHaveText(transactionPayload[0].description)
    expect(cells.nth(2)).toHaveText(transactionPayload[0].accountType)
    expect(cells.nth(3)).toHaveText('£0.00')
    expect(cells.nth(4)).toHaveText('£0.10')
  })

  test("Should display prisoner's profile header", async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}`)

    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page)
    expect(prisonerProfilePage.profileHeader).toBeVisible()
  })

  test('Should display the sub account balance cards', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}`)

    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page)
    const spendsCard = prisonerProfilePage.balanceCards.locator('[data-testid="spends-card"]')
    expect(spendsCard.locator('[data-testid="container_heading"]')).toContainText('Spends')
    expect(spendsCard.locator('.hmpps-balance-card__amount')).toContainText('£12.34')

    const privateCashCard = prisonerProfilePage.balanceCards.locator('[data-testid="private-cash-card"]')
    expect(privateCashCard.locator('[data-testid="container_heading"]')).toContainText('Private Cash')
    expect(privateCashCard.locator('.hmpps-balance-card__amount')).toContainText('£34.56')

    const savingsCard = prisonerProfilePage.balanceCards.locator('[data-testid="savings-card"]')
    expect(savingsCard.locator('[data-testid="container_heading"]')).toContainText('Savings')
    expect(savingsCard.locator('.hmpps-balance-card__amount')).toContainText('£0.00')
  })

  test('Should contain a link to the expanded transactions link', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}`)

    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page)
    const { transactionsLink } = prisonerProfilePage
    expect(transactionsLink).toBeVisible()
    expect(transactionsLink).toHaveAttribute('href', `/prisoner/${prisonNumber}/money`)
    expect(transactionsLink).toContainText('View all transactions')
  })

  test('Backlink should render and return to index', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}`)

    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page)
    expect(prisonerProfilePage.backButton).toBeVisible()
    await prisonerProfilePage.backButton.click()

    expect(new URL(page.url()).pathname).toBe('/')
  })

  test('Should handle 404 and render error', async ({ page }) => {
    const notFoundPrisonNumber = 'XXXXX'

    await prisonerSearchApi.stubGetPrisoner(notFoundPrisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumberNotFound(notFoundPrisonNumber)

    const response = await page.goto(`/prisoner/${notFoundPrisonNumber}`)

    expect(response?.status()).toBe(404)
    expect(page.locator('[data-testid="error-page-message"]')).toContainText('Account not found')
    expect(page.locator('[data-testid="error-page-status"]')).toContainText('404')
  })

  test('Should handle 500 and render error', async ({ page }) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsInternalServerError(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', balancePayload[0])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', balancePayload[1])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', balancePayload[2])

    const response = await page.goto(`/prisoner/${prisonNumber}`)

    expect(response?.status()).toBe(500)
    expect(page.locator('[data-testid="error-page-message"]')).toContainText('Internal Server Error')
    expect(page.locator('[data-testid="error-page-status"]')).toContainText('500')
  })

  test('Should redirect to sign-out when prisoner is outside user caseload', async ({ page }) => {
    await baseStubs()
    const mismatchedPrisonNumber = 'G1234HH'
    await prisonerSearchApi.stubGetPrisonerOutsideCaseload(mismatchedPrisonNumber)
    await page.goto(`/prisoner/${mismatchedPrisonNumber}`)
    await expect(page).toHaveURL(/.*\/sign-out/)
  })

  test('Should not have any automatically detectable WCAG A or AA violations', async ({ page }) => {
    await baseStubs()
    await page.goto(`/prisoner/${prisonNumber}`)
    await PrisonerProfilePage.verifyOnPage(page)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should display no transactions', async ({ page }) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', balancePayload[0])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', balancePayload[1])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', balancePayload[2])

    await page.goto(`/prisoner/${prisonNumber}`)

    const prisonerProfilePage = await PrisonerProfilePage.verifyOnPage(page)

    expect(prisonerProfilePage.tableTransactions).not.toBeVisible()

    const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
    expect(noTransactionsMessage).toBeVisible()
    expect(noTransactionsMessage).toHaveText('No transactions to show')
  })
})
