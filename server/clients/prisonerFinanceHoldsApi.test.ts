import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem } from '@ministryofjustice/hmpps-rest-client'
import { PrisonerHoldsBalanceResponse } from '../interfaces/PrisonerHoldsBalanceResponse'
import PrisonerFinanceHoldsApiClient from './prisonerFinanceHoldsApi'

describe('Prison Finance Holds Api', () => {
  let client: PrisonerFinanceHoldsApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationClient>

    client = new PrisonerFinanceHoldsApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getHoldBalance', () => {
    it('should call the API', async () => {
      const expectedResponse: PrisonerHoldsBalanceResponse = {
        amount: 100,
        balanceDateTime: '',
      }

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getHoldsBalance('A123BCD')

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/holds/A123BCD/balance`,
        },
        asSystem(),
      )
    })
  })
})
