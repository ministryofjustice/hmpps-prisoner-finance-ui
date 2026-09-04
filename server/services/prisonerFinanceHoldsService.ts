import PrisonerFinanceHoldsApiClient from '../clients/prisonerFinanceHoldsApi'
import { Page } from '../interfaces/Pageable'
import { PrisonerHoldResponse } from '../interfaces/PrisonerHoldResponse'
import { PrisonerHoldsBalanceResponse } from '../interfaces/PrisonerHoldsBalanceResponse'

export default class PrisonerFinanceHoldsService {
  constructor(private readonly prisonerFinanceHoldsApiClient: PrisonerFinanceHoldsApiClient) {}

  getHoldsBalance(prisonNumber: string): Promise<PrisonerHoldsBalanceResponse> {
    return this.prisonerFinanceHoldsApiClient.getHoldsBalance(prisonNumber)
  }

  getHolds(prisonNumber: string, pageNumber: string): Promise<Page<PrisonerHoldResponse>> {
    return this.prisonerFinanceHoldsApiClient.getHolds(prisonNumber, pageNumber)
  }
}
