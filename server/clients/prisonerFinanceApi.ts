import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'

export default class PrisonerFinanceApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prisoner Finance API', config.apis.prisonerFinanceApi, logger, authenticationClient)
  }

  async getPrisonerTransactionsByPrisonNumber(prisonNumber: string): Promise<PrisonerTransactionResponse> {
    return this.get(
      {
        path: `/prisoners/${prisonNumber}/money/transactions`,
      },
      asSystem(),
    )
  }
}
