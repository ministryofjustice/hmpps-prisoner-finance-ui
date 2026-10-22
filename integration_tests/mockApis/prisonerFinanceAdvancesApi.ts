import {
  PrisonerAdvanceBalanceResponse,
  PrisonerAdvancesBalanceResponse,
} from '../../server/interfaces/PrisonerAdvanceBalanceResponse'
import { PrisonerAdvanceResponse } from '../../server/interfaces/PrisonerAdvanceResponse'
import { PrisonerAdvancePaymentsResponse } from '../../server/interfaces/PrisonerAdvancePaymentsResponse'

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
      urlPathPattern: `${API_PREFIX}/advances/account/${prisonNumber}/balance`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        balanceDateTime: '',
        advancesAmount: 10,
        balancesOutstanding: 3,
        weeklyPaymentAmount: 1,
      } as PrisonerAdvancesBalanceResponse,
    },
  })

const stubGetAdvanceBalance = (advanceId: string) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/advances/${advanceId}/balance`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        advanceAmount: 10,
        weeklyPaymentAmount: 1,
        balanceOutstanding: 3,
        balanceDateTime: '',
        remainingPayments: 1,
        nextPaymentDate: '2026-03-10T10:48:28.094Z',
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

const stubGetAdvancePayments = (
  prisonNumber: string,
  advanceId: string,
  payload: PrisonerAdvancePaymentsResponse[],
  options: { pageNumber: number; pageSize: string; totalPages: number } = {
    pageNumber: 1,
    pageSize: '25',
    totalPages: 2,
  },
) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/advances/${advanceId}/repayments`,
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
      } as Page<PrisonerAdvancePaymentsResponse>,
    },
  })

const stubGetAdvancePaymentReturnNotFound = (advanceId: string) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/advances/${advanceId}/repayments`,
    },
    response: {
      status: 404,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        status: 404,
        errorCode: null,
        userMessage: 'Advance not found',
        developerMessage: null,
        moreInfo: null,
      },
    },
  })

export {
  stubGetAdvancesBalance,
  stubGetAdvances,
  stubGetAdvanceBalance,
  stubGetAdvancePayments,
  stubGetAdvancePaymentReturnNotFound,
  stubPing,
}
