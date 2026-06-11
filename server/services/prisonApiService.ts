import PrisonApiClient from '../clients/prisonApiClient'
import ActiveCaseloadResponse from '../interfaces/ActiveCaseloadResponse'

export default class PrisonApiService {
  constructor(private readonly prisonApiClient: PrisonApiClient) {}

  getUserCaseloads(accessToken: string): Promise<ActiveCaseloadResponse[]> {
    return this.prisonApiClient.getCaseloadsForCurrentUser(accessToken)
  }
}
