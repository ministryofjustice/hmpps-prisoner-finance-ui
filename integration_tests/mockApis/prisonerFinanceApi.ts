import { SuperAgentRequest } from 'superagent'
import { getMatchingRequests, stubFor } from './wiremock'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import { AccountBalanceResponse } from '../../server/interfaces/AccountBalanceResponse'
import AccountResponse, { SubAccountResponse } from '../../server/interfaces/AccountResponse'
import { SubAccountBalanceResponse } from '../../server/interfaces/SubAccountBalanceResponse'
import { Page } from '../../server/interfaces/Pageable'
import CreatedTransactionResponse from '../../server/interfaces/CreatedTransactionResponse'
import TransactionRequest from '../../server/interfaces/TransactionRequest'
import { CreateBatchTransactionFormRequest } from '../../server/interfaces/BatchTransactionFormRequest'

// this is the path prefix set in feature.env PRISONER_FINANCE_API_URL
const API_PREFIX = '/prisoner-finance-api'

export const stubPing = () =>
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

export const stubGetPrisonerTransactionsByPrisonNumber = (
  prisonNumber: string,
  transactions: PrisonerTransactionResponse[],
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
      jsonBody: {
        content: transactions,
        totalElements: transactions.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: transactions.length,
        isLastPage: true,
      } as Page<PrisonerTransactionResponse>,
    },
  })

export const stubGetPagedPrisonerTransactionsByPrisonNumber = (
  prisonNumber: string,
  transactions: PrisonerTransactionResponse[],
  pageNumber: number,
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
      jsonBody: {
        content: transactions,
        totalElements: 500,
        totalPages: 20,
        pageNumber,
        pageSize: 25,
        isLastPage: pageNumber === 20,
      } as Page<PrisonerTransactionResponse>,
    },
  })

export const stubGetPrisonerTransactionsByPrisonNumberReturnsPageOutOfBound = (
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
  })

export const stubGetPrisonerTransactionsByPrisonNumberNotFound = (prisonNumber: string) =>
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
  })

export const stubGetPrisonerTransactionsInternalServerError = (prisonNumber: string) =>
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
  })

export const stubGetPrisonerAccountBalance = (prisonNumber: string, payload: AccountBalanceResponse) =>
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
  })

const deafultSubAccountBalanceResponse: SubAccountBalanceResponse = {
  subAccountId: '',
  balanceDateTime: '',
  amount: 0,
}
export const stubGetPrisonerSubAccountBalance = (
  prisonNumber: string,
  subAccountRef: string,
  payload: SubAccountBalanceResponse = deafultSubAccountBalanceResponse,
) =>
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
  })

export const stubGetPrisonerSubAccountBalanceNotFound = (prisonNumber: string, subAccountRef: string) =>
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
  })

const defaultAccountResponse: AccountResponse = {
  id: 'TESTUUID',
  reference: '',
  createdAt: '',
  createdBy: '',
  type: 'PRISONER',
  subAccounts: [
    {
      id: 'TESTSUBUUID1',
      reference: 'Spends',
      createdAt: '',
      createdBy: '',
      parentAccountId: 'TESTUUID',
    },
    {
      id: 'TESTSUBUUID2',
      reference: 'Savings',
      createdAt: '',
      createdBy: '',
      parentAccountId: 'TESTUUID',
    },
    {
      id: 'TESTSUBUUID3',
      reference: 'Cash',
      createdAt: '',
      createdBy: '',
      parentAccountId: 'TESTUUID',
    },
  ],
}

export const stubGetPrisonerAccountByReference = (
  prisonNumber: string = 'FAKE1234',
  subAccounts: SubAccountResponse[] = defaultAccountResponse.subAccounts,
  payload: AccountResponse = defaultAccountResponse,
): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `${API_PREFIX}/accounts/${prisonNumber}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { ...payload, reference: prisonNumber, subAccounts } as AccountResponse,
    },
  })

const deafultPrisonAccountResponseReference = 'LEI'
const defaultPrisonAccountResponse: AccountResponse = {
  id: 'TESTUUID',
  reference: deafultPrisonAccountResponseReference,
  createdAt: '',
  createdBy: '',
  type: 'PRISON',
  subAccounts: [
    {
      id: 'TESTSUBUUID1',
      reference: '2001:CANT',
      createdAt: '',
      createdBy: '',
      parentAccountId: 'TESTUUID',
    },
    {
      id: 'TESTSUBUUID2',
      reference: '2002:WONT',
      createdAt: '',
      createdBy: '',
      parentAccountId: 'TESTUUID',
    },
    {
      id: 'TESTSUBUUID3',
      reference: '2003:SHANT',
      createdAt: '',
      createdBy: '',
      parentAccountId: 'TESTUUID',
    },
  ],
}
export const stubGetPrisonAccountByReference = (
  prisonId: string = deafultPrisonAccountResponseReference,
  subAccounts: SubAccountResponse[] = defaultPrisonAccountResponse.subAccounts,
  payload: AccountResponse = defaultPrisonAccountResponse,
): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `${API_PREFIX}/accounts/${prisonId}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { ...payload, reference: prisonId, subAccounts } as AccountResponse,
    },
  })

const defaultTransactionId = 'end-to-end-test-transaction-id'
const defaultCreatedTransactionResponse: CreatedTransactionResponse = {
  id: defaultTransactionId,
  createdBy: 'test',
  createdAt: '2026-05-08T11:03:15.786Z',
  reference: 'TEXT',
  description: 'test description',
  timestamp: '2026-05-05T09:40:05.531Z',
  amount: 10010,
  entrySequence: 1,
  postings: [],
}
export const stubPostTransaction = async (
  requestPayload: TransactionRequest,
  responsePayload: CreatedTransactionResponse = defaultCreatedTransactionResponse,
): Promise<string> => {
  await stubFor({
    request: {
      method: 'POST',
      urlPattern: `${API_PREFIX}/transactions`,
      bodyPatterns: [
        {
          equalToJson: JSON.stringify(requestPayload),
          ignoreArrayOrder: true,
          ignoreExtraElements: false,
        },
      ],
    },
    response: {
      status: 201,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        ...responsePayload,
        description: requestPayload.description,
        amount: 100 * requestPayload.amount,
      } as CreatedTransactionResponse,
    },
  })

  return responsePayload.id
}

export const stubPostTransactionReturnError = (requestPayload: TransactionRequest): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: `${API_PREFIX}/transactions`,
      bodyPatterns: [
        {
          equalToJson: JSON.stringify(requestPayload),
          ignoreArrayOrder: true,
          ignoreExtraElements: false,
        },
      ],
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
  })

export const stubPostBatchTransaction = (
  requestPayload: CreateBatchTransactionFormRequest,
  responsePayload: CreatedTransactionResponse,
): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: `${API_PREFIX}/transactions/batch`,
      bodyPatterns: [
        {
          equalToJson: JSON.stringify(requestPayload),
          ignoreArrayOrder: true,
          ignoreExtraElements: false,
        },
      ],
    },
    response: {
      status: 201,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: responsePayload,
    },
  })

export const getPostTransactionRequests = async () =>
  getMatchingRequests({
    data: {
      method: 'POST',
      urlPattern: `${API_PREFIX}/transactions`,
    },
  })
