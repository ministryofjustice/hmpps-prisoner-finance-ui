import { PrisonerHoldsBalanceResponse } from '../../server/interfaces/PrisonerHoldsBalanceResponse'
import { PrisonerHoldResponse } from '../../server/interfaces/PrisonerHoldResponse'
import { HoldTypeString } from '../../server/interfaces/HoldTypeString'

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

const stubGetHoldsBalance = (
  prisonNumber: string,
  payload: PrisonerHoldsBalanceResponse = {
    amount: 10,
    hoa: 50,
    whf: 120,
    balanceDateTime: '',
  },
) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/holds/${prisonNumber}/balance`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: payload,
    },
  })

const stubGetHoldsBalanceForSubAccount = (prisonNumber: string, subAccountRef: string) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/holds/${prisonNumber}/balance/${subAccountRef}`,
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
  options: { pageNumber: number; pageSize: string; totalPages: number; holdType?: HoldTypeString } = {
    pageNumber: 1,
    pageSize: '25',
    totalPages: 2,
  },
) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/holds/${prisonNumber}`,
      queryParameters: {
        pageNumber:
          options && options.pageNumber.toString() ? { equalTo: options.pageNumber.toString() } : { equalTo: '1' },
        pageSize: options && options.pageSize ? { equalTo: options.pageSize } : { equalTo: '25' },
        ...(options.holdType && { holdType: { equalTo: options.holdType } }),
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
      } as Page<PrisonerHoldResponse>,
    },
  })

export { stubGetHoldsBalance, stubGetHolds, stubPing, stubGetHoldsBalanceForSubAccount }
