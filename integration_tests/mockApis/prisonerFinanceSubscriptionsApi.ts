import { stubFor } from './wiremock'

import { PrisonerSubscriptionResponse } from '../../server/interfaces/PrisonerSubscriptionResponse'
import { PrisonerSubscriptionSummaryResponse } from '../../server/interfaces/PrisonerSubscriptionSummaryResponse'
import { Page } from '../../server/interfaces/Pageable'

const API_PREFIX = '/prisoner-finance-subscriptions-api'

const stubPing = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `${API_PREFIX}/health/ping`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { status: 'UP' },
    },
  })

const stubGetSubscriptions = async (
  prisonNumber: string,
  subscriptionsPayload: PrisonerSubscriptionResponse[],
  options: { pageNumber: number; pageSize: string; totalPages: number; totalElements: number },
) => {
  return stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/subscriptions/account/${prisonNumber}`,
      queryParameters: {
        pageNumber:
          options && options.pageNumber.toString() ? { equalTo: options.pageNumber.toString() } : { equalTo: '1' },
        pageSize: options && options.pageSize ? { equalTo: options.pageSize } : { equalTo: '25' },
      },
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        content: subscriptionsPayload,
        totalElements: options.totalElements,
        totalPages: options.totalPages,
        pageNumber: options.pageNumber,
        pageSize: subscriptionsPayload.length,
        isLastPage: options.pageNumber === options.totalPages,
      } as Page<PrisonerSubscriptionResponse>,
    },
  })
}

const stubGetSubscriptionsSummary = (prisonNumber: string, summaryPayload: PrisonerSubscriptionSummaryResponse) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `${API_PREFIX}/subscriptions/account/${prisonNumber}/summary`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: summaryPayload,
    },
  })

export { stubPing, stubGetSubscriptions, stubGetSubscriptionsSummary }
