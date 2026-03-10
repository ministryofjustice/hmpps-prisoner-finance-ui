
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client';
import { paths } from '../../server/@types/general-ledger-api'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

type GetTransactionsResponse = paths["/accounts/{accountId}/transactions"]["get"]["responses"]["200"]["content"]["application/json"]

export class PrisonerFinanceWrapper extends RestClient {
  
  constructor(authenticationClient: AuthenticationClient) {
    super('Prisoner Finance General Ledger API', config.apis.generalLedgerApi, logger, authenticationClient)
  }

  async getListOfTransactionsByAccountId(accountId: string): Promise<GetTransactionsResponse> {

    var res = this.get({path: `/accounts/${accountId}/transactions`}, asSystem()) as Promise<GetTransactionsResponse>
    
    return res;
  }
}
