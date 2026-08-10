import PrisonerSearchApiClient from '../clients/prisonerSearchApiClient'
import { Prisoner } from '../interfaces/prisoner'
import { PrisonerSearchResponse, RestPage } from '../interfaces/PrisonerNumberSearchResponse'
import { PrisonerSearchResult } from '../interfaces/PrisonerSearchResponse'

export default class PrisonerSearchService {
  constructor(private readonly prisonerSearchApiClient: PrisonerSearchApiClient) {}

  getPrisoner(prisonNumber: string): Promise<Prisoner> {
    return this.prisonerSearchApiClient.getPrisoner(prisonNumber)
  }

  getPrisonerNumbersByPrisonId(token: string, prisonNumber: string): Promise<RestPage<PrisonerSearchResponse>> {
    return this.prisonerSearchApiClient.getPrisonerNumbersByPrisonId(token, prisonNumber)
  }

  getPrisonersBySearchTerm(prisonId: string, term: string, page: string = '0'): Promise<PrisonerSearchResult> {
    return this.prisonerSearchApiClient.getPrisonersBySearchTerm(prisonId, term, page)
  }
}
