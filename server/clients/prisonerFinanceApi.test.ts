import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import PrisonerFinanceApiClient from './prisonerFinanceApi'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'

describe('PrisonerFinanceSyncApiClient', () => {
  let client: PrisonerFinanceApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationClient>

    client = new PrisonerFinanceApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPayloadByRequestId', () => {
    it('should call the API with the correct prisonNumber', async () => {
      const prisonNumber = 'ABC123AC'
      const expectedResponse: Array<PrisonerTransactionResponse> = [
        {
          date: '2026-03-10T10:43:28.094Z',
          description: 'test',
          credit: 0,
          debit: 0,
          location: 'LEI',
          accountType: 'PRISONER',
        },
      ]

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getPrisonerTransactionsByPrisonNumber(prisonNumber)

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/prisoners/${prisonNumber}/money/transactions`,
        },
        {
          tokenType: 'SYSTEM_TOKEN',
          user: { username: undefined },
        },
      )
    })
  })
})
