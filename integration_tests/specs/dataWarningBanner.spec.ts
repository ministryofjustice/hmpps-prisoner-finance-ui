import { expect, test, type Page } from '@playwright/test'
import { login, resetStubs } from '../testUtils'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonRegisterApi from '../mockApis/prisonRegisterApi'
import CreditToPage from '../pages/creditAPrisoner/creditToPage'
import { Page as PrisonerTransactionPage } from '../../server/interfaces/Pageable'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import AccountResponse from '../../server/interfaces/AccountResponse'

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

const prisonerAccount: AccountResponse = {
  id: 'TESTUUID',
  reference: prisonNumber,
  createdAt: '',
  createdBy: '',
  type: 'PRISONER',
  subAccounts: [
    { id: 'TESTSUBUUID1', reference: 'Spends', createdAt: '', createdBy: '', parentAccountId: 'TESTUUID' },
    { id: 'TESTSUBUUID2', reference: 'Savings', createdAt: '', createdBy: '', parentAccountId: 'TESTUUID' },
    { id: 'TESTSUBUUID3', reference: 'Cash', createdAt: '', createdBy: '', parentAccountId: 'TESTUUID' },
  ],
}

const prisonAccount: AccountResponse = { ...prisonerAccount, reference: 'LEI', type: 'PRISON' }

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

const stubCreditAPrisoner = async () => {
  await prisonerSearchApi.stubGetPrisoner(prisonNumber)
  await prisonerFinanceApi.stubGetAccountByReference(prisonNumber, prisonerAccount)
  await prisonerFinanceApi.stubGetAccountByReference('LEI', prisonAccount)
}

type BannerVariant = 'warning' | 'information'

type RouteCase = {
  name: string
  variant: BannerVariant
  navigate: (page: Page) => Promise<void>
}

const routeCases: RouteCase[] = [
  {
    name: 'Home',
    variant: 'warning',
    navigate: async page => {
      await page.goto('/')
    },
  },
  {
    name: 'Find prisoner',
    variant: 'information',
    navigate: async page => {
      await page.goto('/prisoner')
    },
  },
  {
    name: 'Prisoner profile',
    variant: 'information',
    navigate: async page => {
      await stubPrisonerProfile()
      await page.goto(`/prisoner/${prisonNumber}`)
    },
  },
  {
    name: 'Prisoner not found',
    variant: 'information',
    navigate: async page => {
      await prisonerSearchApi.stubGetPrisonerNotFound('Z9999ZZ')
      await page.goto('/prisoner/Z9999ZZ')
    },
  },
  {
    name: 'All transactions',
    variant: 'information',
    navigate: async page => {
      await stubTransactions('')
      await page.goto(`/prisoner/${prisonNumber}/money`)
    },
  },
  {
    name: 'Private cash transactions',
    variant: 'information',
    navigate: async page => {
      await stubTransactions('CASH')
      await page.goto(`/prisoner/${prisonNumber}/money/private-cash`)
    },
  },
  {
    name: 'Spends transactions',
    variant: 'information',
    navigate: async page => {
      await stubTransactions('SPENDS')
      await page.goto(`/prisoner/${prisonNumber}/money/spends`)
    },
  },
  {
    name: 'Savings transactions',
    variant: 'information',
    navigate: async page => {
      await stubTransactions('SAVINGS')
      await page.goto(`/prisoner/${prisonNumber}/money/savings`)
    },
  },
  {
    name: 'Credit a prisoner - credit to',
    variant: 'information',
    navigate: async page => {
      await stubCreditAPrisoner()
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
    },
  },
  {
    name: 'Credit a prisoner - credit from',
    variant: 'information',
    navigate: async page => {
      await stubCreditAPrisoner()
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
      await CreditToPage.completeAndMoveOn(page)
    },
  },
  {
    name: 'Credit a prisoner - credit amount',
    variant: 'information',
    navigate: async page => {
      await stubCreditAPrisoner()
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)
    },
  },
  {
    name: 'Credit a prisoner - confirmation',
    variant: 'information',
    navigate: async page => {
      await stubCreditAPrisoner()
      await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-confirmation?transactionNumber=123`)
    },
  },
  {
    name: 'Grant bonus to prisoners - select caseload',
    variant: 'information',
    navigate: async page => {
      await page.goto('/grant-bonus-to-prisoners')
    },
  },
  {
    name: 'Grant bonus to prisoners - amount',
    variant: 'information',
    navigate: async page => {
      await page.goto('/grant-bonus-to-prisoners/amount')
    },
  },
  {
    name: 'Grant bonus to prisoners - confirmation',
    variant: 'information',
    navigate: async page => {
      await page.goto('/grant-bonus-to-prisoners/confirmation?transactionNumber=123')
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

  for (const { name, variant, navigate } of routeCases) {
    test(`shows the ${variant} data warning banner on the ${name} page`, async ({ page }) => {
      await navigate(page)

      const dataWarningBanner = page.locator('[data-qa="data-warning-banner"]')
      await expect(dataWarningBanner).toBeVisible()
      await expect(dataWarningBanner).toHaveClass(new RegExp(`moj-alert--${variant}`))
      await expect(dataWarningBanner).toContainText('This is a test environment')
      await expect(dataWarningBanner).toContainText('Do not use real personal data')
    })
  }
})
