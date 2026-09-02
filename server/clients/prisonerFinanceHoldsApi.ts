import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { PrisonerHoldsBalanceResponse } from '../interfaces/PrisonerHoldsBalanceResponse'
import config from '../config'
import logger from '../../logger'

export default class PrisonerFinanceHoldsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prisoner Finance Holds API', config.apis.prisonerFinanceHoldsApi, logger, authenticationClient)
  }

  async getHoldsBalance(prisonNumber: string): Promise<PrisonerHoldsBalanceResponse> {
    return this.get(
      {
        path: `/holds/${prisonNumber}/balance`,
      },
      asSystem(),
    )
  }
}
