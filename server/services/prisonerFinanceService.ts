import PrisonerFinanceApiClient from '../clients/prisonerFinanceApi'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'

export default class PrisonerFinanceService {
  constructor(private readonly prisonerFinanceApiClient: PrisonerFinanceApiClient) {}

  getPrisonerTransactionsByPrisonNumber(prisonNumber: string): Promise<Array<PrisonerTransactionResponse>> {
    return this.prisonerFinanceApiClient.getPrisonerTransactionsByPrisonNumber(prisonNumber)
  }
}
