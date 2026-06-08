import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../interfaces/AccountBalanceResponse'
import { SubAccountBalanceResponse } from '../interfaces/SubAccountBalanceResponse'
import { datePickerToISODate } from '../utils/utils'
import { Page } from '../interfaces/Pageable'
import AccountResponse from '../interfaces/AccountResponse'
import TransactionRequest from '../interfaces/TransactionRequest'
import CreatedTransactionResponse from '../interfaces/CreatedTransactionResponse'
import { CreateBatchTransactionFormRequest } from '../interfaces/BatchTransactionFormRequest'

export default class PrisonerFinanceApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prisoner Finance API', config.apis.prisonerFinanceApi, logger, authenticationClient)
  }

  async postTransaction(transactionRequest: TransactionRequest): Promise<CreatedTransactionResponse> {
    return this.post(
      {
        path: `/transactions`,
        data: transactionRequest as unknown as Record<string, unknown>,
      },
      asSystem(),
    )
  }

  async postBatchTransactions(
    transactionRequest: CreateBatchTransactionFormRequest,
  ): Promise<CreatedTransactionResponse> {
    return this.post(
      {
        path: `/transactions/batch`,
        data: transactionRequest as unknown as Record<string, unknown>,
      },
      asSystem(),
    )
  }

  async getPrisonerTransactionsByPrisonNumber({
    prisonNumber,
    subAccountReference,
    page = '1',
    startDate,
    endDate,
    debit,
    credit,
  }: {
    prisonNumber: string
    subAccountReference?: string
    page: string
    startDate?: string
    endDate?: string
    debit?: string
    credit?: string
  }): Promise<Page<PrisonerTransactionResponse>> {
    return this.get(
      {
        path: `/prisoners/${prisonNumber}/money/transactions`,
        query: {
          ...(startDate && { startDate: datePickerToISODate(startDate) }),
          ...(endDate && { endDate: datePickerToISODate(endDate) }),
          pageNumber: page,
          pageSize: '25',
          ...(debit && { debit }),
          ...(credit && { credit }),
          ...(subAccountReference && { subAccountReference }),
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

  async getAccountByReference(accountRef: string): Promise<AccountResponse> {
    return this.get(
      {
        path: `/accounts/${accountRef}`,
      },
      asSystem(),
    )
  }
}
