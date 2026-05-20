import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prison API', config.apis.prisonApi, logger, authenticationClient)
  }

  async getCaseloadsForCurrentUser(accessToken: string) {
    return this.get(
      {
        path: `/api/users/me/caseLoads?allCaseloads=true`,
      },
      asUser(accessToken),
    )
  }
}
