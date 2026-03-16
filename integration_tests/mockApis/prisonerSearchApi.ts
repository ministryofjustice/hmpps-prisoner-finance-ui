import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisoner-search-api/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),

  stubGetPrisoner: (prisonNumber: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-search-api/prisoner/${prisonNumber}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          prisonerNumber: prisonNumber,
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonId: 'MDI',
          status: 'ACTIVE IN',
          cellLocation: 'RECP',
          category: 'C',
          csra: 'Standard',
          currentIncentive: {
            level: {
              code: 'STD',
              description: 'Enhanced',
            },
          },
        },
      },
    })
  },

  stubGetPrisonerOutsideCaseload: (prisonNumber: string): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/prisoner-search-api/prisoner/${prisonNumber}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          prisonerNumber: prisonNumber,
          firstName: 'BOB',
          lastName: 'TAYLOR',
          prisonId: 'LEI',
          status: 'ACTIVE IN',
          cellLocation: 'RECP',
        },
      },
    })
  },
}
