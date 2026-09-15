import PrisonerFinanceAdvancesApiClient from '../clients/prisonerFinanceAdvancesApi'
import { Page } from '../interfaces/Pageable'
import { PrisonerAdvanceBalanceResponse } from '../interfaces/PrisonerAdvanceBalanceResponse'
import { PrisonerAdvancePaymentsResponse } from '../interfaces/PrisonerAdvancePaymentsResponse'
import { PrisonerAdvanceResponse } from '../interfaces/PrisonerAdvanceResponse'

const emptyPageAdvances: Page<PrisonerAdvanceResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 1,
  pageNumber: 1,
  pageSize: 99,
  isLastPage: true,
}

const emptyPagePayments: Page<PrisonerAdvancePaymentsResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 1,
  pageNumber: 1,
  pageSize: 99,
  isLastPage: true,
}

export default class PrisonerFinanceAdvancesService {
  constructor(private readonly prisonerFinanceAdvancesApiClient: PrisonerFinanceAdvancesApiClient) {}

  getAdvancesBalances(prisonNumber: string): Promise<PrisonerAdvanceBalanceResponse> {
    return this.prisonerFinanceAdvancesApiClient.getAdvancesBalance(prisonNumber)
  }

  getAdvanceBalance(prisonNumber: string, advanceId: string): Promise<PrisonerAdvanceBalanceResponse> {
    return this.prisonerFinanceAdvancesApiClient.getAdvanceBalance(prisonNumber, advanceId)
  }

  getAdvances(
    prisonNumber: string,
    pageNumber: string,
    hasValidationErrors: boolean,
  ): Promise<Page<PrisonerAdvanceResponse>> {
    return !hasValidationErrors
      ? this.prisonerFinanceAdvancesApiClient.getAdvances(prisonNumber, pageNumber)
      : Promise.resolve(emptyPageAdvances)
  }

  getAdvancePayments(
    prisonNumber: string,
    advanceId: string,
    pageNumber: string,
    hasValidationErrors: boolean,
  ): Promise<Page<PrisonerAdvancePaymentsResponse>> {
    return !hasValidationErrors
      ? this.prisonerFinanceAdvancesApiClient.getAdvancePayments(prisonNumber, advanceId, pageNumber)
      : Promise.resolve(emptyPagePayments)
  }
}
