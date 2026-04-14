import PrisonerFinanceApiClient from '../clients/prisonerFinanceApi'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../interfaces/AccountBalanceResponse'
import { SubAccountBalanceResponse } from '../interfaces/SubAccountBalanceResponse'
import { Page } from '../interfaces/Pageable'

const emptyPage: Page<PrisonerTransactionResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 1,
  pageNumber: 1,
  pageSize: 99,
  isLastPage: true,
}

export default class PrisonerFinanceService {
  constructor(private readonly prisonerFinanceApiClient: PrisonerFinanceApiClient) {}

  getPrisonerTransactionsByPrisonNumber({
    prisonNumber,
    subAccountReference,
    page = '1',
    startDate,
    endDate,
    debit,
    credit,
  }: {
    prisonNumber: string
    subAccountReference?: string
    page: string
    startDate?: string
    endDate?: string
    debit?: string
    credit?: string
  }): Promise<Page<PrisonerTransactionResponse>> {
    return this.prisonerFinanceApiClient.getPrisonerTransactionsByPrisonNumber({
      prisonNumber,
      subAccountReference,
      startDate,
      endDate,
      page,
      debit,
      credit,
    })
  }

  getAccountBalance(prisonNumber: string): Promise<AccountBalanceResponse> {
    return this.prisonerFinanceApiClient.getAccountBalance(prisonNumber)
  }

  async getSubAccountBalance(prisonNumber: string, subAccountRef: string): Promise<SubAccountBalanceResponse> {
    try {
      return await this.prisonerFinanceApiClient.getSubAccountBalance(prisonNumber, subAccountRef)
    } catch (error) {
      if (error.responseStatus === 404) {
        return { subAccountId: '', balanceDateTime: '', amount: 0 }
      }
      throw error
    }
  }

  async getSubAccountBalances(prisonNumber: string): Promise<Record<string, SubAccountBalanceResponse>> {
    const [spends, cash, savings] = await Promise.all([
      this.getSubAccountBalance(prisonNumber, 'SPENDS'),
      this.getSubAccountBalance(prisonNumber, 'CASH'),
      this.getSubAccountBalance(prisonNumber, 'SAVINGS'),
    ])

    return {
      SPENDS: spends,
      CASH: cash,
      SAVINGS: savings,
    }
  }

  async getTransactionPage({
    prisonNumber,
    subAccountReference,
    page = '1',
    startDate,
    endDate,
    credit,
    debit,
    hasValidationErrors,
  }: {
    prisonNumber: string
    subAccountReference?: string
    page: string
    startDate?: string
    endDate?: string
    credit?: string
    debit?: string
    hasValidationErrors: boolean
  }): Promise<[Page<PrisonerTransactionResponse>, AccountBalanceResponse | SubAccountBalanceResponse]> {
    const transactionsPromise = !hasValidationErrors
      ? this.getPrisonerTransactionsByPrisonNumber({
          prisonNumber,
          subAccountReference,
          page,
          startDate,
          endDate,
          credit,
          debit,
        })
      : Promise.resolve(emptyPage)

    const balancePromise = subAccountReference
      ? this.getSubAccountBalance(prisonNumber, subAccountReference)
      : this.getAccountBalance(prisonNumber)

    return Promise.all([transactionsPromise, balancePromise])
  }
}
