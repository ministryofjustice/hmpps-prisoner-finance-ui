import { stubFor } from './wiremock'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../../server/interfaces/AccountBalanceResponse'
import { SubAccountBalanceResponse } from '../../server/interfaces/SubAccountBalanceResponse'
import { Page } from '../../server/interfaces/Pageable'

// this is the path prefix set in feature.env PRISONER_FINANCE_API_URL
const API_PREFIX = '/prisoner-finance-api'

export default {
  stubPing: () =>
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
    }),

  stubGetPrisonerTransactionsByPrisonNumber: (
    prisonNumber: string,
    payload: Page<PrisonerTransactionResponse>,
    startDate?: string,
    endDate?: string,
    credit?: string,
    debit?: string,
  ) =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: `${API_PREFIX}/prisoners/${prisonNumber}/money/transactions`,
        queryParameters: {
          pageNumber: { equalTo: '1' },
          pageSize: { equalTo: '999' },
          startDate: startDate ? { equalTo: startDate } : { absent: true },
          endDate: endDate ? { equalTo: endDate } : { absent: true },
          credit: credit ? { equalTo: credit } : { absent: true },
          debit: debit ? { equalTo: debit } : { absent: true },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: payload,
      },
    }),

  stubGetPrisonerTransactionsByPrisonNumberNotFound: (prisonNumber: string) =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: `${API_PREFIX}/prisoners/${prisonNumber}/money/transactions`,
        queryParameters: {
          pageNumber: { equalTo: '1' },
          pageSize: { equalTo: '999' },
        },
      },
      response: {
        status: 404,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 404,
          errorCode: null,
          userMessage: 'Account not found',
          developerMessage: null,
          moreInfo: null,
        },
      },
    }),
  stubGetPrisonerTransactionsInternalServerError: (prisonNumber: string) =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: `${API_PREFIX}/prisoners/${prisonNumber}/money/transactions`,
        queryParameters: {
          pageNumber: { equalTo: '1' },
          pageSize: { equalTo: '999' },
        },
      },
      response: {
        status: 500,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 500,
          errorCode: null,
          userMessage: 'Internal Server Error',
          developerMessage: null,
          moreInfo: null,
        },
      },
    }),
  stubGetPrisonerAccountBalance: (prisonNumber: string, payload: AccountBalanceResponse) =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `${API_PREFIX}/prisoners/${prisonNumber}/money/balance`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: payload,
      },
    }),
  stubGetPrisonerSubAccountBalance: (prisonNumber: string, subAccountRef: string, payload: SubAccountBalanceResponse) =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `${API_PREFIX}/prisoners/${prisonNumber}/money/balance/${subAccountRef}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: payload,
      },
    }),

  stubGetPrisonerSubAccountBalanceNotFound: (prisonNumber: string, subAccountRef: string) =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `${API_PREFIX}/prisoners/${prisonNumber}/money/balance/${subAccountRef}`,
      },
      response: {
        status: 404,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 404,
          errorCode: null,
          userMessage: 'Account not found',
          developerMessage: null,
          moreInfo: null,
        },
      },
    }),
}
