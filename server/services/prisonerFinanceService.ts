import PrisonerFinanceApiClient from '../clients/prisonerFinanceApi'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../interfaces/AccountBalanceResponse'
import { SubAccountBalanceResponse } from '../interfaces/SubAccountBalanceResponse'
import { Page } from '../interfaces/Pageable'

export default class PrisonerFinanceService {
  constructor(private readonly prisonerFinanceApiClient: PrisonerFinanceApiClient) {}

  getPrisonerTransactionsByPrisonNumber(
    prisonNumber: string,
    startDate: string | null = null,
    endDate: string | null = null,
    page: string = '1',
    debit: string | null = null,
    credit: string | null = null,
  ): Promise<Page<PrisonerTransactionResponse>> {
    return this.prisonerFinanceApiClient.getPrisonerTransactionsByPrisonNumber(
      prisonNumber,
      startDate,
      endDate,
      page,
      debit,
      credit,
    )
  }

  getAccountBalance(prisonNumber: string): Promise<AccountBalanceResponse> {
    return this.prisonerFinanceApiClient.getAccountBalance(prisonNumber)
  }

  async getSubAccountBalances(prisonNumber: string): Promise<Record<string, SubAccountBalanceResponse>> {
    const fetchBalance = async (accountCode: string): Promise<SubAccountBalanceResponse> => {
      try {
        return await this.prisonerFinanceApiClient.getSubAccountBalance(prisonNumber, accountCode)
      } catch (error) {
        if (error.responseStatus === 404) {
          return { subAccountId: '', balanceDateTime: '', amount: 0 }
        }
        throw error
      }
    }

    const [spends, cash, savings] = await Promise.all([
      fetchBalance('SPENDS'),
      fetchBalance('CASH'),
      fetchBalance('SAVINGS'),
    ])

    return {
      SPENDS: spends,
      CASH: cash,
      SAVINGS: savings,
    }
  }
}
