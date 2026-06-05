import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { Prisoner } from '../interfaces/prisoner'
import { AttributeSearch, AttributeSearchResponse, RestPage } from '../interfaces/PrisonerAttributeSearch'

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

  async getPrisonersByPrisonId(token: string, prisonId: string): Promise<RestPage<AttributeSearchResponse>> {
    const requestBody: AttributeSearch = {
      queries: [
        {
          matchers: [
            {
              attribute: 'prisonId',
              type: 'String',
              condition: 'IS',
              searchTerm: prisonId,
            },
            {
              attribute: 'status',
              type: 'String',
              condition: 'STARTSWITH',
              searchTerm: 'ACTIVE',
            },
          ],
        },
      ],
    }
    // TODO: Refactor to use findByPrison instead
    return this.post(
      {
        path: '/attribute-search',
        query: {
          size: 10000,
          responseFields: 'prisonerNumber',
        },
        data: requestBody,
      },
      asUser(token),
    )
  }
}
