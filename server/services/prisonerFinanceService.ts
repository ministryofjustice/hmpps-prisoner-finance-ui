import PrisonerFinanceApiClient from '../clients/prisonerFinanceApi'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../interfaces/AccountBalanceResponse'
import { SubAccountBalanceResponse } from '../interfaces/SubAccountBalanceResponse'

export default class PrisonerFinanceService {
  constructor(private readonly prisonerFinanceApiClient: PrisonerFinanceApiClient) {}

  getPrisonerTransactionsByPrisonNumber(
    prisonNumber: string,
    startDate: string = null,
    endDate: string = null,
  ): Promise<Array<PrisonerTransactionResponse>> {
    return this.prisonerFinanceApiClient.getPrisonerTransactionsByPrisonNumber(prisonNumber, startDate, endDate)
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
