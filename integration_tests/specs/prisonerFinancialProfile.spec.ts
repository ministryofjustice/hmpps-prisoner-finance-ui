import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login, resetStubs } from '../testUtils'

import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import { SubAccountBalanceResponse } from '../../server/interfaces/SubAccountBalanceResponse'
import { AccountBalanceResponse } from '../../server/interfaces/AccountBalanceResponse'

import * as prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import prisonRegisterApi from '../mockApis/prisonRegisterApi'

import PrisonerProfilePage from '../pages/prisonerProfilePage'
import PrisonerMoneyPage from '../pages/prisonerMoneyPage'
import FindPrisonerPage from '../pages/findPrisonerPage'
import PrisonerNotFoundErrorPage from '../pages/prisonerNotFoundErrorPage'
import InternalServerErrorPage from '../pages/internalServerErrorPage'

test.describe('Prisoner financial profile', () => {
  const transactionPayload: Array<PrisonerTransactionResponse> = [
    {
      date: '2026-03-10T10:48:28.094Z',
      description: 'test',
      credit: 0,
      debit: 10,
      location: 'LEI',
      accountType: 'CASH',
      subAccountBalance: 0,
      accountBalance: 11,
    },
    {
      date: '2026-03-11T10:47:28.094Z',
      description: '',
      credit: 20,
      debit: 0,
      location: 'MDI',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 1000,
    },
    {
      date: '2026-03-10T10:46:28.094Z',
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
      subAccountBalance: 10,
      accountBalance: 40,
    },
    {
      date: '2026-03-10T10:45:28.194Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 50,
    },
    {
      date: '2026-03-10T10:44:28.194Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
      subAccountBalance: 30,
      accountBalance: 30,
    },
    {
      date: '2026-03-10T10:43:28.194Z',
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 20,
    },
  ]

  const balancePayload: SubAccountBalanceResponse[] = [
    { subAccountId: '', balanceDateTime: '', amount: 1234 },
    { subAccountId: '', balanceDateTime: '', amount: 3456 },
    { subAccountId: '', balanceDateTime: '', amount: 0 },
  ]

  const prisonNumber = 'ABC123XZ'

  const setupPrisonerProfileStubs = async () => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', balancePayload[0])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', balancePayload[1])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', balancePayload[2])
  }

  const setupPrisonerMoniesStubs = async () => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
    await prisonRegisterApi.stubGetPrisonNames()
    await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber, {
      accountId: '',
      balanceDateTime: '',
      amount: 1800,
    } as AccountBalanceResponse)
  }

  const setupPrisonerMoniesSubAccountStubs = async (subAccountRef: string) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload, {
      subAccountReference: subAccountRef,
    })
    await prisonRegisterApi.stubGetPrisonNames()
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, subAccountRef, {
      subAccountId: '',
      balanceDateTime: '',
      amount: 2800,
    } as SubAccountBalanceResponse)
  }

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test.describe('Viewing a prisoners financial profile', async () => {
    test('Should display a prisoners financial profile', async ({ page }) => {
      await setupPrisonerProfileStubs()

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)

      expect(prisonerProfilePage.profileHeader).toContainText('Smith, John')
      expect(prisonerProfilePage.profileHeader).toContainText(prisonNumber)
    })

    test('Should display the savings sub account balance', async ({ page }) => {
      await setupPrisonerProfileStubs()

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)
      await expect(prisonerProfilePage.getBalanceCardFor('Savings')).toContainText('Account total £0.00')
    })

    test('Should be able to view all savings sub account transactions', async ({ page }) => {
      await setupPrisonerProfileStubs()
      await setupPrisonerMoniesSubAccountStubs('SAVINGS')

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)

      await prisonerProfilePage.getBalanceCardFor('Savings').getByRole('link', { name: 'Savings transactions' }).click()
      await PrisonerMoneyPage.verifyOnPage(page, prisonNumber, 'Savings transactions', 'savings')
    })

    test('Should display the spends sub account balance', async ({ page }) => {
      await setupPrisonerProfileStubs()

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)
      await expect(prisonerProfilePage.getBalanceCardFor('Spends')).toContainText('Account total £12.34')
    })

    test('Should be able to view all spends sub account transactions', async ({ page }) => {
      await setupPrisonerProfileStubs()
      await setupPrisonerMoniesSubAccountStubs('SPENDS')

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)

      await prisonerProfilePage.getBalanceCardFor('Spends').getByRole('link', { name: 'Spends transactions' }).click()
      await PrisonerMoneyPage.verifyOnPage(page, prisonNumber, 'Spends transactions', 'spends')
    })

    test('Should display the private cash sub account balance', async ({ page }) => {
      await setupPrisonerProfileStubs()

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)
      await expect(prisonerProfilePage.getBalanceCardFor('Private cash')).toContainText('Account total £34.56')
    })

    test('Should be able to view all private cash sub account transactions', async ({ page }) => {
      await setupPrisonerProfileStubs()
      await setupPrisonerMoniesSubAccountStubs('CASH')

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)

      await prisonerProfilePage
        .getBalanceCardFor('Private cash')
        .getByRole('link', { name: 'Private cash transactions' })
        .click()
      await PrisonerMoneyPage.verifyOnPage(page, prisonNumber, 'Private cash transactions', 'private-cash')
    })

    test('Should be able to go back to find a prisoner', async ({ page }) => {
      await setupPrisonerProfileStubs()

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)

      await prisonerProfilePage.backLink.click()
      await FindPrisonerPage.verifyOnPage(page)
    })

    test('Should show the actions that can be performed', async ({ page }) => {
      await setupPrisonerProfileStubs()

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)

      await expect(prisonerProfilePage.actionMenuBlock.getByRole('link', { name: 'Credit account' })).toBeVisible()
      await expect(prisonerProfilePage.actionMenuBlock.getByRole('link', { name: 'Debit account' })).toBeVisible()
      await expect(
        prisonerProfilePage.actionMenuBlock.getByRole('link', { name: 'Sub account transfer' }),
      ).toBeVisible()
      await expect(prisonerProfilePage.actionMenuBlock.getByRole('link', { name: 'Adjudications' })).toBeVisible()
      await expect(prisonerProfilePage.actionMenuBlock.getByRole('link', { name: 'Export statement' })).toBeVisible()
      await expect(prisonerProfilePage.actionMenuBlock.getByRole('link', { name: 'Close account' })).toBeVisible()
    })
  })

  test.describe('Viewing a summary of the prisoners most recent transactions', async () => {
    test('Should display a list of recent transactions', async ({ page }) => {
      await setupPrisonerProfileStubs()

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)
      await expect(prisonerProfilePage.recentTransactionsList).toBeVisible()
      await expect(prisonerProfilePage.recentTransactionsList.locator('thead tr th')).toHaveCount(5)

      const headers = prisonerProfilePage.recentTransactionsList.locator('thead')
      await expect(headers).toHaveText(['Date', 'Transaction description', 'Amount', 'Balance', 'Account'].join(' '))

      const rows = prisonerProfilePage.recentTransactionsList.locator('tbody tr')
      await expect(rows).toHaveCount(5)

      await expect(rows.first()).toHaveText(
        ['10/03/2026\n10:48', transactionPayload[0].description, '-0.10', '0.11', 'Private cash'].join(' '),
      )

      await expect(rows.nth(1)).toHaveText(
        ['11/03/2026\n10:47', transactionPayload[1].description, '0.20', '10.00', 'Savings'].join(' '),
      )
      await expect(rows.nth(1).locator('td').nth(2)).toHaveCSS('font-weight', '400')
    })

    test('Should be able to view all transactions', async ({ page }) => {
      await setupPrisonerProfileStubs()
      await setupPrisonerMoniesStubs()

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)

      await prisonerProfilePage.viewAllTransactionsLink.click()
      await PrisonerMoneyPage.verifyOnPage(page, prisonNumber, 'Transactions for all sub accounts')
    })
  })

  test.describe('Viewing a summary of the prisoners most recent transactions when there are no transactions', async () => {
    test('should inform the user that there are no transactions to show', async ({ page }) => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [])
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', balancePayload[0])
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', balancePayload[1])
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', balancePayload[2])

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)
      expect(prisonerProfilePage.recentTransactionsList).not.toBeVisible()

      const noTransactionsMessage = page.locator('[data-testid="no-transactions-message"]')
      await expect(noTransactionsMessage).toBeVisible()
      await expect(noTransactionsMessage).toContainText('No transactions to show')
    })
  })

  test.describe('Viewing sub account transactions', async () => {
    test(`Should be able to view their spends transactions `, async ({ page }) => {
      await setupPrisonerProfileStubs()
      await setupPrisonerMoniesSubAccountStubs('SPENDS')

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)
      await prisonerProfilePage.getBalanceCardFor('Spends').getByRole('link').click()
      await PrisonerMoneyPage.verifyOnPage(page, prisonNumber, `Spends transactions`, 'spends')
    })

    test(`Should be able to view their Private cash transactions `, async ({ page }) => {
      await setupPrisonerProfileStubs()
      await setupPrisonerMoniesSubAccountStubs('CASH')

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)
      await prisonerProfilePage.getBalanceCardFor('Private cash').getByRole('link').click()
      await PrisonerMoneyPage.verifyOnPage(page, prisonNumber, `Private cash transactions`, 'private-cash')
    })

    test(`Should be able to view their Savings transactions `, async ({ page }) => {
      await setupPrisonerProfileStubs()
      await setupPrisonerMoniesSubAccountStubs('SAVINGS')

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)
      await prisonerProfilePage.getBalanceCardFor('Savings').getByRole('link').click()
      await PrisonerMoneyPage.verifyOnPage(page, prisonNumber, `Savings transactions`, 'savings')
    })
  })

  test.describe('Showing balances for prisoner sub accounts that do not exist', async () => {
    test(`Spends account should have zero balance if not created`, async ({ page }) => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [])
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'SPENDS')
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', {
        subAccountId: '',
        balanceDateTime: '',
        amount: 4800,
      } as SubAccountBalanceResponse)
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', {
        subAccountId: '',
        balanceDateTime: '',
        amount: 5800,
      } as SubAccountBalanceResponse)

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)

      const spendsCard = prisonerProfilePage.getBalanceCardFor('Spends')
      await expect(spendsCard).toContainText('£0.00')
    })

    test(`Private cash account should have zero balance if not created`, async ({ page }) => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [])
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', {
        subAccountId: '',
        balanceDateTime: '',
        amount: 3800,
      } as SubAccountBalanceResponse)
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'CASH')
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', {
        subAccountId: '',
        balanceDateTime: '',
        amount: 5800,
      } as SubAccountBalanceResponse)

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)

      const spendsCard = prisonerProfilePage.getBalanceCardFor('Private cash')
      await expect(spendsCard).toContainText('£0.00')
    })

    test(`Savings account should have zero balance if not created`, async ({ page }) => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, [])
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', {
        subAccountId: '',
        balanceDateTime: '',
        amount: 3800,
      } as SubAccountBalanceResponse)
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', {
        subAccountId: '',
        balanceDateTime: '',
        amount: 4800,
      } as SubAccountBalanceResponse)
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'SAVINGS')

      const prisonerProfilePage = await PrisonerProfilePage.load(page, prisonNumber)

      const spendsCard = prisonerProfilePage.getBalanceCardFor('Savings')
      await expect(spendsCard).toContainText('£0.00')
    })
  })

  test.describe('Requesting a prisoner profile that does not exist', async () => {
    test('Should inform user that prisoner could not be found', async ({ page }) => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'SPENDS')
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'CASH')
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'SAVINGS')
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumberNotFound(prisonNumber)

      await page.goto(`/prisoner/${prisonNumber}`)

      await PrisonerNotFoundErrorPage.verifyOnPage(page, prisonNumber)
    })

    test('Should allow user to find another prisoner', async ({ page }) => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'SPENDS')
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'CASH')
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalanceNotFound(prisonNumber, 'SAVINGS')
      await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumberNotFound(prisonNumber)

      await page.goto(`/prisoner/${prisonNumber}`)

      const prisonerNotFoundErrorPage = await PrisonerNotFoundErrorPage.verifyOnPage(page, prisonNumber)
      await prisonerNotFoundErrorPage.findPrisonerLink.click()

      await FindPrisonerPage.verifyOnPage(page)
    })
  })

  test.describe('Requesting a prisoner profile that causes an error', async () => {
    test('Should handle server errors and inform the user', async ({ page }) => {
      await prisonerSearchApi.stubGetPrisoner(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerTransactionsInternalServerError(prisonNumber)
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', balancePayload[0])
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', balancePayload[1])
      await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', balancePayload[2])

      await page.goto(`/prisoner/${prisonNumber}`)

      const internalServerErrorPage = await InternalServerErrorPage.verifyOnPage(page, `/prisoner/${prisonNumber}`)
      await expect(internalServerErrorPage.heading).toBeVisible()
    })
  })

  test.describe('Requesting a prisoner profile that is outside of the users caseload', async () => {
    test('Should redirect to sign-out when prisoner is outside user caseload', async ({ page }) => {
      const mismatchedPrisonNumber = 'G1234HH'

      await setupPrisonerProfileStubs()
      await prisonerSearchApi.stubGetPrisonerOutsideCaseload(mismatchedPrisonNumber)

      await page.goto(`/prisoner/${mismatchedPrisonNumber}`)
      await expect(page.getByRole('heading')).toHaveText('Sign in')
    })
  })

  test('Should not have any automatically detectable WCAG A or AA violations', async ({ page }) => {
    await setupPrisonerProfileStubs()
    await PrisonerProfilePage.load(page, prisonNumber)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
