import { PrisonerAdvanceBalanceResponse } from '../../server/interfaces/PrisonerAdvanceBalanceResponse'
import { PrisonerAdvanceResponse } from '../../server/interfaces/PrisonerAdvanceResponse'

import { stubFor } from './wiremock'
import { Page } from '../../server/interfaces/Pageable'

const API_PREFIX = '/prisoner-finance-advances-api'

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

const stubGetAdvancesBalance = (prisonNumber: string) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/advances/${prisonNumber}/balance`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        amount: 10,
        weeklyAmount: 1,
        outstandingAmount: 3,
        balanceDateTime: '',
      } as PrisonerAdvanceBalanceResponse,
    },
  })

const stubGetAdvances = (
  prisonNumber: string,
  payload: PrisonerAdvanceResponse[],
  options: { pageNumber: number; pageSize: string; totalPages: number } = {
    pageNumber: 1,
    pageSize: '25',
    totalPages: 2,
  },
) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/advances/${prisonNumber}`,
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
        content: payload,
        totalElements: payload.length,
        totalPages: options.totalPages,
        pageNumber: options.pageNumber,
        pageSize: payload.length,
        isLastPage: options.pageNumber === options.totalPages,
      } as Page<PrisonerAdvanceResponse>,
    },
  })

export { stubGetAdvancesBalance, stubGetAdvances, stubPing }
