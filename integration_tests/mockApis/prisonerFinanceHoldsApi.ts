import { PrisonerHoldsBalanceResponse } from '../../server/interfaces/PrisonerHoldsBalanceResponse'
import { PrisonerHoldResponse } from '../../server/interfaces/PrisonerHoldResponse'

import { stubFor } from './wiremock'
import { Page } from '../../server/interfaces/Pageable'

const API_PREFIX = '/prisoner-finance-holds-api'

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

const stubGetHoldsBalance = (prisonNumber: string) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/holds/${prisonNumber}/balance`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        amount: 10,
        balanceDateTime: '',
      } as PrisonerHoldsBalanceResponse,
    },
  })

const stubGetHolds = (
  prisonNumber: string,
  payload: PrisonerHoldResponse[],
  options: { pageNumber: string; pageSize: string } = {
    pageNumber: '1',
    pageSize: '25',
  },
) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/holds/${prisonNumber}`,
      queryParameters: {
        pageNumber: options && options.pageNumber ? { equalTo: options.pageNumber } : { equalTo: '1' },
        pageSize: options && options.pageSize ? { equalTo: options.pageSize } : { equalTo: '25' },
      },
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        content: payload,
        totalElements: payload.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: payload.length,
        isLastPage: true,
      } as Page<PrisonerHoldResponse>,
    },
  })

export { stubGetHoldsBalance, stubGetHolds, stubPing }
