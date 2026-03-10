import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login } from '../testUtils'
import PrisonerMoneyPage from '../pages/prisonerMoneyPage'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'

test.describe('Prisoner Money', () => {
  const payload: Array<PrisonerTransactionResponse> = [
    {
      date: new Date('10/10/10'),
      description: 'test',
      credit: 0,
      debit: 10,
      location: 'LEI',
      accountType: 'CASH',
    },
    {
      date: new Date('10/11/10'),
      description: '',
      credit: 20,
      debit: 0,
      location: 'MDI',
      accountType: 'SAVINGS',
    },
    {
      date: new Date('10/12/10'),
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
    },
    {
      date: new Date('10/12/10'),
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
    },
  ]

  const prisonNumber = 'ABC123XZ'

  test('Should display Header and Transactions table', async ({ page }) => {
    await login(page)

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, payload)

    await page.goto(`/prisoner/${prisonNumber}/money`)

    const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)
    expect(prisonerMoneyPage.heading).toBeVisible()
    expect(prisonerMoneyPage.heading).toContainText("Prisoner's Transactions")
    expect(prisonerMoneyPage.tableTransactions).toBeVisible()
    expect(prisonerMoneyPage.tableTransactions.locator('thead tr th')).toHaveCount(6)

    const rows = prisonerMoneyPage.tableTransactions.locator('tbody tr')
    expect(rows).toHaveCount(payload.length)

    expect(page.locator('[data-testid=row-date]').first()).toHaveText('10/10/2010')
    expect(page.locator('[data-testid=row-description]').first()).toHaveText(payload[0].description)
    expect(page.locator('[data-testid=row-credit]').first()).toHaveText('£0.00')
    expect(page.locator('[data-testid=row-debit]').first()).toHaveText('£0.10')
    expect(page.locator('[data-testid=row-location]').first()).toHaveText(payload[0].location)
    expect(page.locator('[data-testid=row-account-type]').first()).toHaveText(payload[0].accountType)
  })

  test('Backlink should render and return to index', async ({ page }) => {
    await login(page)

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, payload)

    await page.goto(`/prisoner/${prisonNumber}/money`)

    const prisonerMoneyPage = await PrisonerMoneyPage.verifyOnPage(page)

    expect(prisonerMoneyPage.backButton).toBeVisible()

    await prisonerMoneyPage.backButton.click()

    expect(new URL(page.url()).pathname).toBe('/')
  })

  test('Should handle 404 and render error', async ({ page }) => {
    await login(page)

    const notFoundPrisonNumber = 'XXXXX'

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumberNotFound(notFoundPrisonNumber)

    const response = await page.goto(`/prisoner/${notFoundPrisonNumber}/money`)

    expect(response?.status()).toBe(404)
    expect(page.locator('[data-testid="error-page-message"]')).toContainText('Account not found')
    expect(page.locator('[data-testid="error-page-status"]')).toContainText('404')
  })

  test('Should handle 500 and render error', async ({ page }) => {
    await login(page)

    await prisonerFinanceApi.stubGetPrisonerTransactionsInternalServerError(prisonNumber)

    const response = await page.goto(`/prisoner/${prisonNumber}/money`)

    expect(response?.status()).toBe(500)
    expect(page.locator('[data-testid="error-page-message"]')).toContainText('Internal Server Error')
    expect(page.locator('[data-testid="error-page-status"]')).toContainText('500')
  })

  test('Should not have any automatically detectable WCAG A or AA violations', async ({ page }) => {
    await login(page)

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, payload)

    await page.goto(`/prisoner/${prisonNumber}/money`)

    await PrisonerMoneyPage.verifyOnPage(page)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
