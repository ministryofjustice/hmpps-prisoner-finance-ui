// @ts-ignore
import { PrisonerFinanceTransactionResponse } from '../api-clients/prisoner-finance-api/model/prisonerFinanceTransactionResponse'
// @ts-ignore
import { PrisonerFinanceApi } from '../api-clients/prisoner-finance-api/api'

class PrisonerFinanceWrapper {
  api = new PrisonerFinanceApi()

  async getListOfTransactionsByAccountId(accountId: string): Promise<Array<PrisonerFinanceTransactionResponse>> {
    return (await this.api.getListOfTransactionsByAccountId(accountId)).body
  }
}
