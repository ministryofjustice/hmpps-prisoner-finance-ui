import PrisonerFinanceHoldsApiClient from '../clients/prisonerFinanceHoldsApi'

export default class PrisonerFinanceHoldsService {
  constructor(private readonly prisonerFinanceHoldsApiClient: PrisonerFinanceHoldsApiClient) {}

  getHoldsBalance(prisonNumber: string) {
    return this.prisonerFinanceHoldsApiClient.getHoldsBalance(prisonNumber)
  }
}
