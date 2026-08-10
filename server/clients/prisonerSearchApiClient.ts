import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { Prisoner } from '../interfaces/prisoner'
import { PrisonerSearchResponse, RestPage } from '../interfaces/PrisonerNumberSearchResponse'
import { PrisonerSearchResult } from '../interfaces/PrisonerSearchResponse'

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
        headers: {
          'Content-Type': 'application/json',
        },
      },
      asSystem(),
    )
  }

  async getPrisonersBySearchTerm(prisonId: string, term: string, page: string = '0'): Promise<PrisonerSearchResult> {
    return this.get(
      {
        path: `/prison/${prisonId}/prisoners`,
        query: {
          term,
          page,
          responseFields: [
            'prisonerNumber',
            'title',
            'firstName',
            'middleNames',
            'lastName',
            'dateOfBirth',
            'currentFacialImageId',
            'status',
            'inOutStatus',
            'prisonId',
            'prisonName',
            'lastPrisonId',
            'previousPrisonId',
            'cellLocation',
            'currentIncentive',
          ],
        },
        headers: {
          'Content-Type': 'application/json',
        },
      },
      asSystem(),
    )
  }
}
