import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../interfaces/AccountBalanceResponse'
import { SubAccountBalanceResponse } from '../interfaces/SubAccountBalanceResponse'
import { datePickerToISODate } from '../utils/utils'

export default class PrisonerFinanceApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prisoner Finance API', config.apis.prisonerFinanceApi, logger, authenticationClient)
  }

  async getPrisonerTransactionsByPrisonNumber(
    prisonNumber: string,
    startDate: string | null = null,
    endDate: string | null = null,
  ): Promise<Array<PrisonerTransactionResponse>> {
    return this.get(
      {
        path: `/prisoners/${prisonNumber}/money/transactions`,
        query: {
          startDate: startDate ? datePickerToISODate(startDate) : undefined,
          endDate: endDate ? datePickerToISODate(endDate) : undefined,
        },
      },
      asSystem(),
    )
  }

  async getAccountBalance(prisonNumber: string): Promise<AccountBalanceResponse> {
    return this.get(
      {
        path: `/prisoners/${prisonNumber}/money/balance`,
      },
      asSystem(),
    )
  }

  async getSubAccountBalance(prisonNumber: string, subAccountRef: string): Promise<SubAccountBalanceResponse> {
    return this.get(
      {
        path: `/prisoners/${prisonNumber}/money/balance/${subAccountRef}`,
      },
      asSystem(),
    )
  }
}
