/* eslint-disable import/namespace */
/* eslint-disable import/no-unresolved */
import { PrisonerFinanceTransactionResponse } from '../api-clients/prisoner-finance-api/model/prisonerFinanceTransactionResponse'

class PrisonerFinanceWrapper {
  api = new PrisonerFinanceApi()

  async getListOfTransactionsByAccountId(accountId: string): Promise<Array<PrisonerFinanceTransactionResponse>> {
    return (await this.api.getListOfTransactionsByAccountId(accountId)).body
  }
}
