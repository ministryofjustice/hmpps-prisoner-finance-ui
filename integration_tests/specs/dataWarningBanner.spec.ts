import { expect, test, type Page } from '@playwright/test'
import { login, resetStubs } from '../testUtils'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonRegisterApi from '../mockApis/prisonRegisterApi'
import { Page as PrisonerTransactionPage } from '../../server/interfaces/Pageable'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'

const prisonNumber = 'ABC123XZ'

const emptyTransactions: PrisonerTransactionPage<PrisonerTransactionResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 1,
  pageNumber: 1,
  pageSize: 99,
  isLastPage: true,
}

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
      await page.goto('/')
    },
  },
  {
    name: 'Find prisoner',
    navigate: async page => {
      await page.goto('/prisoner')
    },
  },
  {
    name: 'Prisoner profile',
    navigate: async page => {
      await stubPrisonerProfile()
      await page.goto(`/prisoner/${prisonNumber}`)
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
      await page.goto(`/prisoner/${prisonNumber}/money`)
    },
  },
  {
    name: 'Private cash transactions',
    navigate: async page => {
      await stubTransactions('CASH')
      await page.goto(`/prisoner/${prisonNumber}/money/private-cash`)
    },
  },
  {
    name: 'Spends transactions',
    navigate: async page => {
      await stubTransactions('SPENDS')
      await page.goto(`/prisoner/${prisonNumber}/money/spends`)
    },
  },
  {
    name: 'Savings transactions',
    navigate: async page => {
      await stubTransactions('SAVINGS')
      await page.goto(`/prisoner/${prisonNumber}/money/savings`)
    },
  },
]

test.describe('Data warning banner', () => {
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

      const dataWarningBanner = page.locator('[data-testid="warning-banner"]')
      await expect(dataWarningBanner).toBeVisible()
      await expect(dataWarningBanner).toContainText('This web page is for testing only')
      await expect(dataWarningBanner).toContainText(
        'The data you will see if the financial data of real prisoners, but may be inaccurate or incomplete',
      )
    })
  }
})
