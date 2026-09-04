import { test } from '@playwright/test'
import PrisonerHoldsPage from '../pages/prisonerHoldsPage'
import PrisonerFinancialProfilePage from '../pages/prisonerFinancialProfilePage'

import * as prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'

import prisonRegisterApi from '../mockApis/prisonRegisterApi'

import prisonApi from '../mockApis/prisonApi'
import * as prisonerFinanceHoldsApi from '../mockApis/prisonerFinanceHoldsApi'
import { PrisonerHoldResponse } from '../../server/interfaces/PrisonerHoldResponse'
import { SubAccountBalanceResponse } from '../../server/interfaces/SubAccountBalanceResponse'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import { resetStubs } from '../mockApis/wiremock'
import { login } from '../testUtils'

test.describe('Show holds for prisoner', () => {
  const prisonNumber = 'A1234BC'

  const transactionPayload: Array<PrisonerTransactionResponse> = [
    {
      date: '2026-03-10T10:48:28.094Z',
      legacyTransactionId: 1,
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
      legacyTransactionId: 2,
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
      legacyTransactionId: 3,
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
      legacyTransactionId: 4,
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
      legacyTransactionId: 5,
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
      legacyTransactionId: 6,
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

  const setupPrisonerProfileStubs = async () => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
    await prisonRegisterApi.stubGetPrisonNames()
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', balancePayload[0])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', balancePayload[1])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', balancePayload[2])
    await prisonerFinanceHoldsApi.stubGetHoldsBalance(prisonNumber)
  }

  const setupGetHoldsStubs = async (payload: PrisonerHoldResponse[] = []) => {
    await prisonerFinanceHoldsApi.stubGetHolds(prisonNumber, [])
  }

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test('Should click on hold card and go to prisoner holds page', async ({ page }) => {
    await setupPrisonerProfileStubs()
    await setupGetHoldsStubs()

    const profilePage = await PrisonerFinancialProfilePage.load(page, prisonNumber)

    const holdCard = profilePage.getBalanceCardFor('Holds')

    const holdCardLink = await holdCard.getByRole('link')

    await holdCardLink.click()

    PrisonerHoldsPage.verifyOnPage(page, prisonNumber)
  })
})
