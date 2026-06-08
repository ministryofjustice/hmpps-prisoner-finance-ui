import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { Prisoner } from '../interfaces/prisoner'
import { PrisonerSearchResponse, RestPage } from '../interfaces/PrisonerNumberSearchResponse'

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

  async getPrisonerNumbersByPrisonId(token: string, prisonId: string): Promise<RestPage<PrisonerSearchResponse>> {
    return this.get(
      {
        path: `/prisoner-search/prison/${prisonId}`,
        query: {
          size: 5000,
          responseFields: 'prisonerNumber',
        },
      },
      asUser(token),
    )
  }
}
