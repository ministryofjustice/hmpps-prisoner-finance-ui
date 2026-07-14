import { expect, test, type Page } from '@playwright/test'
import { login, resetStubs } from '../testUtils'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import * as prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonRegisterApi from '../mockApis/prisonRegisterApi'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import ServiceHomePage from '../pages/serviceHomePage'
import FindPrisonerPage from '../pages/findPrisonerPage'
import PrisonerFinancialProfilePage from '../pages/prisonerFinancialProfilePage'
import PrisonerTransactionsPage from '../pages/prisonerTransactionsPage'
import PrisonerPrivateCashPage from '../pages/prisonerPrivateCashPage'

const prisonNumber = 'ABC123XZ'

const emptyTransactions: PrisonerTransactionResponse[] = []

const zeroBalance = { accountId: '', balanceDateTime: '', amount: 0 }
const zeroSubAccountBalance = { subAccountId: '', balanceDateTime: '', amount: 0 }

const stubPrisonerProfile = async () => {
  await prisonerSearchApi.stubGetPrisoner(prisonNumber)
  await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, emptyTransactions)
  await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', zeroSubAccountBalance)
  await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', zeroSubAccountBalance)
  await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', zeroSubAccountBalance)
}

const stubTransactions = async (subAccountReference: string) => {
  await prisonerSearchApi.stubGetPrisoner(prisonNumber)
  await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, emptyTransactions, {
    subAccountReference,
  })
  await prisonRegisterApi.stubGetPrisonNames()
  if (subAccountReference) {
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, subAccountReference, zeroSubAccountBalance)
  } else {
    await prisonerFinanceApi.stubGetPrisonerAccountBalance(prisonNumber, zeroBalance)
  }
}

type RouteCase = {
  name: string
  navigate: (page: Page) => Promise<void>
}

const routeCases: RouteCase[] = [
  {
    name: 'Home',
    navigate: async page => {
      await ServiceHomePage.load(page)
    },
  },
  {
    name: 'Find prisoner',
    navigate: async page => {
      await FindPrisonerPage.load(page)
    },
  },
  {
    name: 'Prisoner profile',
    navigate: async page => {
      await stubPrisonerProfile()
      await PrisonerFinancialProfilePage.load(page, prisonNumber)
    },
  },
  {
    name: 'Prisoner not found',
    navigate: async page => {
      await prisonerSearchApi.stubGetPrisonerNotFound('Z9999ZZ')
      await page.goto('/prisoner/Z9999ZZ')
    },
  },
  {
    name: 'All transactions',
    navigate: async page => {
      await stubTransactions('')
      await PrisonerTransactionsPage.load(page, prisonNumber)
    },
  },
  {
    name: 'Sub account transactions',
    navigate: async page => {
      await stubTransactions('CASH')
      await PrisonerPrivateCashPage.load(page, prisonNumber)
    },
  },
]

test.describe('Viewing the data warning message', () => {
  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  for (const { name, navigate } of routeCases) {
    test(`shows data warning banner on the ${name} page`, async ({ page }) => {
      await navigate(page)

      const dataWarningBanner = page.locator('.data-warning-banner')
      await expect(dataWarningBanner).toBeVisible()
      await expect(dataWarningBanner).toContainText(
        'This web page is for testing only. The data you will see is the financial data of real prisoners, but may be inaccurate or incomplete',
      )
    })
  }
})
