import PrisonerFinanceHoldsApiClient from '../clients/prisonerFinanceHoldsApi'
import { HoldTypeString } from '../interfaces/HoldTypeString'
import { Page } from '../interfaces/Pageable'
import { PrisonerHoldResponse } from '../interfaces/PrisonerHoldResponse'
import { PrisonerHoldsBalanceResponse } from '../interfaces/PrisonerHoldsBalanceResponse'

const emptyPage: Page<PrisonerHoldResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 1,
  pageNumber: 1,
  pageSize: 99,
  isLastPage: true,
}

export default class PrisonerFinanceHoldsService {
  constructor(private readonly prisonerFinanceHoldsApiClient: PrisonerFinanceHoldsApiClient) {}

  getHoldsBalance(prisonNumber: string): Promise<PrisonerHoldsBalanceResponse> {
    return this.prisonerFinanceHoldsApiClient.getHoldsBalance(prisonNumber)
  }

  getHoldsBalanceForSubAccount(prisonNumber: string, subAccount: string): Promise<PrisonerHoldsBalanceResponse> {
    return this.prisonerFinanceHoldsApiClient.getHoldsBalanceForSubAccount(prisonNumber, subAccount)
  }

  getHolds(
    prisonNumber: string,
    pageNumber: string,
    hasValidationErrors: boolean,
    holdType?: HoldTypeString,
  ): Promise<Page<PrisonerHoldResponse>> {
    return !hasValidationErrors
      ? this.prisonerFinanceHoldsApiClient.getHolds(prisonNumber, pageNumber, holdType)
      : Promise.resolve(emptyPage)
  }
}
