import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

const urlTestPrefix = '/prison-register-api'

export default {
  stubPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `${urlTestPrefix}/health/ping`,
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),

  stubGetPrisonNames: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `${urlTestPrefix}/prisons/names`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            prisonId: 'LEI',
            prisonName: 'Leeds (HMP)',
          },
          {
            prisonId: 'MDI',
            prisonName: 'Moorland (HMP & YOI)',
          },
        ],
      },
    })
  },
}
