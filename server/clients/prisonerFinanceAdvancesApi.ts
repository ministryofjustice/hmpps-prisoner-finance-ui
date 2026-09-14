import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { Page } from '../interfaces/Pageable'
import { PrisonerAdvanceBalanceResponse } from '../interfaces/PrisonerAdvanceBalanceResponse'
import { PrisonerAdvanceResponse } from '../interfaces/PrisonerAdvanceResponse'

export default class PrisonerFinanceAdvancesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prisoner Finance Advances API', config.apis.prisonerFinanceAdvancesApi, logger, authenticationClient)
  }

  async getAdvanceBalance(prisonNumber: string): Promise<PrisonerAdvanceBalanceResponse> {
    return this.get(
      {
        path: `/advances/${prisonNumber}/balance`,
      },
      asSystem(),
    )
  }

  async getAdvances(prisonNumber: string, pageNumber: string): Promise<Page<PrisonerAdvanceResponse>> {
    return this.get(
      {
        path: `/advances/${prisonNumber}`,
        query: {
          pageNumber,
          pageSize: '25',
        },
      },
      asSystem(),
    )
  }
}
