import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { Page } from '../interfaces/Pageable'
import { PrisonerAdvanceBalanceResponse } from '../interfaces/PrisonerAdvanceBalanceResponse'
import { PrisonerAdvanceResponse } from '../interfaces/PrisonerAdvanceResponse'
import { PrisonerAdvancePaymentsResponse } from '../interfaces/PrisonerAdvancePaymentsResponse'

export default class PrisonerFinanceAdvancesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prisoner Finance Advances API', config.apis.prisonerFinanceAdvancesApi, logger, authenticationClient)
  }

  async getAdvancesBalance(prisonNumber: string): Promise<PrisonerAdvanceBalanceResponse> {
    return this.get(
      {
        path: `/advances/${prisonNumber}/balance`,
      },
      asSystem(),
    )
  }

  async getAdvanceBalance(prisonNumber: string, advanceId: string): Promise<PrisonerAdvanceBalanceResponse> {
    return this.get(
      {
        path: `/advances/${prisonNumber}/balance/${advanceId}`,
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

  async getAdvancePayments(
    prisonNumber: string,
    advanceId: string,
    pageNumber: string,
  ): Promise<Page<PrisonerAdvancePaymentsResponse>> {
    return this.get(
      {
        path: `/advances/${prisonNumber}/${advanceId}/payments`,
        query: {
          pageNumber,
          pageSize: '25',
        },
      },
      asSystem(),
    )
  }
}
