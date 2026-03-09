import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login } from '../testUtils'
import PrisonerTransactionsPage from '../pages/prisonerTransactionsPage'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'

test.describe('Prisoner Money', () => {
  const payload: Array<PrisonerTransactionResponse> = [
    {
      date: new Date('10/10/10'),
      description: '',
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

    const index = await PrisonerTransactionsPage.verifyOnPage(page)
    expect(index.heading).toBeVisible()
    expect(index.heading).toContainText("Prisoner's Transactions")
    expect(index.tableTransactions).toBeVisible()
    expect(index.tableTransactions.locator('thead tr th')).toHaveCount(6)
    expect(index.tableTransactions.locator('tbody tr')).toHaveCount(payload.length)
  })

  test.skip('Should not have any automatically detectable WCAG A or AA violations', async ({ page }) => {
    await login(page)

    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, payload)

    await page.goto(`/prisoner/${prisonNumber}/money`)

    await PrisonerTransactionsPage.verifyOnPage(page)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
