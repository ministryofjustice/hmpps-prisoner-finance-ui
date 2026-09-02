import { PrisonerHoldsBalanceResponse } from '../../server/interfaces/PrisonerHoldsBalanceResponse'
import { stubFor } from './wiremock'

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

const stubGetHoldsBalance = (prisonNumber: string) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `${API_PREFIX}/holds/${prisonNumber}/balance`,
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

export { stubGetHoldsBalance, stubPing }
