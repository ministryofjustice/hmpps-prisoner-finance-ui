import PrisonerSearchApiClient from '../clients/prisonerSearchApiClient'
import { Prisoner } from '../interfaces/prisoner'
import { PrisonerSearchResponse, RestPage } from '../interfaces/PrisonerNumberSearchResponse'

export default class PrisonerSearchService {
  constructor(private readonly prisonerSearchApiClient: PrisonerSearchApiClient) {}

  getPrisoner(prisonNumber: string): Promise<Prisoner> {
    return this.prisonerSearchApiClient.getPrisoner(prisonNumber)
  }

  getPrisonerNumbersByPrisonId(token: string, prisonNumber: string): Promise<RestPage<PrisonerSearchResponse>> {
    return this.prisonerSearchApiClient.getPrisonerNumbersByPrisonId(token, prisonNumber)
  }
}
