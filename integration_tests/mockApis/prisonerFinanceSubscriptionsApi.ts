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

const stubGetSubscriptions = async (prisonNumber: string, subscriptionsPayload: PrisonerSubscriptionResponse[]) => {
  const pageResponse: Page<PrisonerSubscriptionResponse> = {
    content: subscriptionsPayload,
    totalElements: subscriptionsPayload.length,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 25,
    isLastPage: true,
  }
  return stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/subscriptions/account/${prisonNumber}`,
      queryParameters: {
        pageNumber: { equalTo: '1' },
        pageSize: { equalTo: '25' },
      },
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: pageResponse,
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
