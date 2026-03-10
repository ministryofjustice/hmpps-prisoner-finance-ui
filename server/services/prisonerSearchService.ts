import PrisonerSearchApiClient from '../clients/prisonerSearchApiClient'
import { Prisoner } from '../interfaces/prisoner'

export default class PrisonerSearchService {
  constructor(private readonly prisonerSearchApiClient: PrisonerSearchApiClient) {}

  getPrisoner(prisonNumber: string): Promise<Prisoner> {
    return this.prisonerSearchApiClient.getPrisoner(prisonNumber)
  }
}
