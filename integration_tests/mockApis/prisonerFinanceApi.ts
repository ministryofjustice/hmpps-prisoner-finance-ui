import { stubFor } from './wiremock'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../../server/interfaces/AccountBalanceResponse'
import AccountResponse from '../../server/interfaces/AccountResponse'
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
    options?: {
      startDate?: string
      endDate?: string
      credit?: string
      debit?: string
      pageNumber?: string
      pageSize?: string
      subAccountReference?: string
    },
  ) =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: `${API_PREFIX}/prisoners/${prisonNumber}/money/transactions`,
        queryParameters: {
          pageNumber: options && options.pageNumber ? { equalTo: options.pageNumber } : { equalTo: '1' },
          pageSize: options && options.pageSize ? { equalTo: options.pageSize } : { equalTo: '25' },
          subAccountReference:
            options && options.subAccountReference ? { equalTo: options.subAccountReference } : { absent: true },
          startDate: options && options.startDate ? { equalTo: options.startDate } : { absent: true },
          endDate: options && options.endDate ? { equalTo: options.endDate } : { absent: true },
          credit: options && options.credit ? { equalTo: options.credit } : { absent: true },
          debit: options && options.debit ? { equalTo: options.debit } : { absent: true },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: payload,
      },
    }),

  stubGetPrisonerTransactionsByPrisonNumberReturnsPageOutOfBound: (
    prisonNumber: string,
    options?: {
      pageNumber?: string
      pageSize?: string
    },
  ) =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: `${API_PREFIX}/prisoners/${prisonNumber}/money/transactions`,
        queryParameters: {
          pageNumber: options && options.pageNumber ? { equalTo: options.pageNumber } : { equalTo: '1' },
          pageSize: options && options.pageSize ? { equalTo: options.pageSize } : { equalTo: '25' },
        },
      },
      response: {
        status: 400,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 400,
          errorCode: 'Page requested is out of range',
          userMessage: 'Page requested is out of range',
          developerMessage: 'Page requested is out of range',
          moreInfo: 'Page requested is out of range',
        },
      },
    }),

  stubGetPrisonerTransactionsByPrisonNumberNotFound: (prisonNumber: string) =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: `${API_PREFIX}/prisoners/${prisonNumber}/money/transactions`,
        queryParameters: {
          pageNumber: { equalTo: '1' },
          pageSize: { equalTo: '25' },
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
          pageSize: { equalTo: '25' },
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
  stubGetAccountByReference: (accountRef: string, payload: AccountResponse) =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `${API_PREFIX}/accounts/${accountRef}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: payload,
      },
    }),
}
