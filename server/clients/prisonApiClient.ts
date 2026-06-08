import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import ActiveCaseloadResponse from '../interfaces/ActiveCaseloadResponse'

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prison API', config.apis.prisonApi, logger, authenticationClient)
  }

  async getCaseloadsForCurrentUser(accessToken: string): Promise<ActiveCaseloadResponse[]> {
    return this.get(
      {
        path: `/api/users/me/caseLoads`,
      },
      asUser(accessToken),
    )
  }
}
