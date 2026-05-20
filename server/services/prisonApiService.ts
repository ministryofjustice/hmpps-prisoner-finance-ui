import PrisonApiClient from '../clients/prisonApiClient'
import ActiveCaseloadResponse from '../interfaces/ActiveCaseloadResponse'

export default class PrisonApiService {
  constructor(private readonly prisonApiClient: PrisonApiClient) {}

  getUserCaseloads(token: string): Promise<ActiveCaseloadResponse[]> {
    return this.prisonApiClient.getCaseloadsForCurrentUser(token)
  }
}
