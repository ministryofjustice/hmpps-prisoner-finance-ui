import PrisonerFinanceAdvancesApiClient from '../clients/prisonerFinanceAdvancesApi'
import { Page } from '../interfaces/Pageable'
import { PrisonerAdvanceBalanceResponse } from '../interfaces/PrisonerAdvanceBalanceResponse'
import { PrisonerAdvanceResponse } from '../interfaces/PrisonerAdvanceResponse'

const emptyPage: Page<PrisonerAdvanceResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 1,
  pageNumber: 1,
  pageSize: 99,
  isLastPage: true,
}

export default class PrisonerFinanceAdvancesService {
  constructor(private readonly prisonerFinanceAdvancesApiClient: PrisonerFinanceAdvancesApiClient) {}

  getAdvanceBalances(prisonNumber: string): Promise<PrisonerAdvanceBalanceResponse> {
    return this.prisonerFinanceAdvancesApiClient.getAdvanceBalance(prisonNumber)
  }

  getAdvances(
    prisonNumber: string,
    pageNumber: string,
    hasValidationErrors: boolean,
  ): Promise<Page<PrisonerAdvanceResponse>> {
    return !hasValidationErrors
      ? this.prisonerFinanceAdvancesApiClient.getAdvances(prisonNumber, pageNumber)
      : Promise.resolve(emptyPage)
  }
}
