import { stubFor } from './wiremock'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'

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

  stubGetPrisonerTransactionsByPrisonNumber: (prisonNumber: string, payload: Array<PrisonerTransactionResponse>) =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `${API_PREFIX}/prisoners/${prisonNumber}/money/transactions`,
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
        urlPattern: `${API_PREFIX}/prisoners/${prisonNumber}/money/transactions`,
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
