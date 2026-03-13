import PrisonerFinanceApiClient from '../clients/prisonerFinanceApi'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../interfaces/AccountBalanceResponse'
import { SubAccountBalanceResponse } from '../interfaces/SubAccountBalanceResponse'

export default class PrisonerFinanceService {
  constructor(private readonly prisonerFinanceApiClient: PrisonerFinanceApiClient) {}

  getPrisonerTransactionsByPrisonNumber(prisonNumber: string): Promise<Array<PrisonerTransactionResponse>> {
    return this.prisonerFinanceApiClient.getPrisonerTransactionsByPrisonNumber(prisonNumber)
  }

  getAccountBalance(prisonNumber: string): Promise<AccountBalanceResponse> {
    return this.prisonerFinanceApiClient.getAccountBalance(prisonNumber)
  }

  getSubAccountBalances(prisonNumber: string): Promise<SubAccountBalanceResponse[]> {
    return Promise.all([
      this.prisonerFinanceApiClient.getSubAccountBalance(prisonNumber, 'SPENDS'),
      this.prisonerFinanceApiClient.getSubAccountBalance(prisonNumber, 'CASH'),
      this.prisonerFinanceApiClient.getSubAccountBalance(prisonNumber, 'SAVINGS'),
    ])
  }
}
