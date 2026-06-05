import PrisonerSearchApiClient from '../clients/prisonerSearchApiClient'
import { Prisoner } from '../interfaces/prisoner'
import { AttributeSearchResponse, RestPage } from '../interfaces/PrisonerAttributeSearch'

export default class PrisonerSearchService {
  constructor(private readonly prisonerSearchApiClient: PrisonerSearchApiClient) {}

  getPrisoner(prisonNumber: string): Promise<Prisoner> {
    return this.prisonerSearchApiClient.getPrisoner(prisonNumber)
  }

  getPrisonerNumbersByPrisonId(token: string, prisonNumber: string): Promise<RestPage<AttributeSearchResponse>> {
    return this.prisonerSearchApiClient.getPrisonersByPrisonId(token, prisonNumber)
  }
}
