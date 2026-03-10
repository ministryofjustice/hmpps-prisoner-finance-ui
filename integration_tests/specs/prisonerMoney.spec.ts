import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login } from '../testUtils'
import PrisonerMoneyPage from '../pages/prisonerMoneyPage'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'

test.describe('Prisoner Money', () => {
  const payload: Array<PrisonerTransactionResponse> = [
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

  const prisonNumber = 'ABC123XZ'
  test.beforeEach(async ({ page }) => {
    await login(page)
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, payload)
  })

  test('Should display Header and Transactions table', async ({ page }) => {
    await page.goto(`/prisoner/${prisonNumber}/money`)

    const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)
    expect(prisonerMoneyPage.heading).toBeVisible()
    expect(prisonerMoneyPage.heading).toContainText("Prisoner's Transactions")
    expect(prisonerMoneyPage.tableTransactions).toBeVisible()
    expect(prisonerMoneyPage.tableTransactions.locator('thead tr th')).toHaveCount(6)

    const rows = prisonerMoneyPage.tableTransactions.locator('tbody tr')
    expect(rows).toHaveCount(payload.length)

    expect(page.locator('[data-testid=row-date]').first()).toHaveText('10/03/2026')
    expect(page.locator('[data-testid=row-description]').first()).toHaveText(payload[0].description)
    expect(page.locator('[data-testid=row-credit]').first()).toHaveText('£0.00')
    expect(page.locator('[data-testid=row-debit]').first()).toHaveText('£0.10')
    expect(page.locator('[data-testid=row-location]').first()).toHaveText(payload[0].location)
    expect(page.locator('[data-testid=row-account-type]').first()).toHaveText(payload[0].accountType)
  })

  test('Backlink should render and return to index', async ({ page }) => {
    await page.goto(`/prisoner/${prisonNumber}/money`)

    const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

    expect(prisonerMoneyPage.backButton).toBeVisible()

    await prisonerMoneyPage.backButton.click()

    expect(new URL(page.url()).pathname).toBe('/')
  })

  test('Should handle 404 and render error', async ({ page }) => {
    const notFoundPrisonNumber = 'XXXXX'

    await prisonerSearchApi.stubGetPrisoner(notFoundPrisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumberNotFound(notFoundPrisonNumber)

    const response = await page.goto(`/prisoner/${notFoundPrisonNumber}/money`)

    expect(response?.status()).toBe(404)
    expect(page.locator('[data-testid="error-page-message"]')).toContainText('Account not found')
    expect(page.locator('[data-testid="error-page-status"]')).toContainText('404')
  })

  test('Should handle 500 and render error', async ({ page }) => {
    await prisonerFinanceApi.stubGetPrisonerTransactionsInternalServerError(prisonNumber)

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
    await page.goto(`/prisoner/${prisonNumber}/money`)
    await PrisonerMoneyPage.verifyOnPage(page)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
