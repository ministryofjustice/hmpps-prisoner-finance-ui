import { Page } from '../interfaces/Pageable'
import { PrisonerSubscriptionResponse } from '../interfaces/PrisonerSubscriptionResponse'
import PrisonerFinanceSubscriptionsApiClient from '../clients/prisonerFinanceSubscriptionsApi'

const emptyPage: Page<PrisonerSubscriptionResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 1,
  pageNumber: 1,
  pageSize: 99,
  isLastPage: true,
}

export default class PrisonerFinanceSubscriptionsService {
  constructor(private readonly prisonerFinanceSubscriptionsApiClient: PrisonerFinanceSubscriptionsApiClient) {}

  getSubscriptions(
    prisonNumber: string,
    pageNumber: string,
    hasValidationErrors: boolean,
  ): Promise<Page<PrisonerSubscriptionResponse>> {
    return !hasValidationErrors
      ? this.prisonerFinanceSubscriptionsApiClient.getSubscriptions(prisonNumber, pageNumber)
      : Promise.resolve(emptyPage)
  }

  getSubscriptionsSummary(prisonNumber: string) {
    return this.prisonerFinanceSubscriptionsApiClient.getSubscriptionsSummary(prisonNumber)
  }
}
