import { stubFor } from './wiremock'

const API_PREFIX = '/prisoner-finance-subscriptions-api'

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

const stubGetSubscriptions = () => {
  // TODO: not implemented yet
}

export { stubPing, stubGetSubscriptions }
