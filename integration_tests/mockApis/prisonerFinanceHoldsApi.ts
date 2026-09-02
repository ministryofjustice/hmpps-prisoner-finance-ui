import { PrisonerHoldsBalanceResponse } from '../../server/interfaces/PrisonerHoldsBalanceResponse'
import { stubFor } from './wiremock'

/* eslint-disable import/prefer-default-export */

const API_PREFIX = '/prisoner-finance-holds-api'

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

export { stubGetHoldsBalance }
