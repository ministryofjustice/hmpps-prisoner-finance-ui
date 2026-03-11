import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { Prisoner } from '../interfaces/prisoner'

export default class PrisonerSearchApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prisoner Search API', config.apis.prisonerSearch, logger, authenticationClient)
  }

  async getPrisoner(prisonNumber: string): Promise<Prisoner> {
    return this.get(
      {
        path: `/prisoner/${prisonNumber}`,
      },
      asSystem(),
    )
  }
}
