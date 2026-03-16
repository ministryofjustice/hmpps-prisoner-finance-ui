import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem } from '@ministryofjustice/hmpps-rest-client'
import PrisonerSearchApiClient from './prisonerSearchApiClient'
import { Prisoner } from '../interfaces/prisoner'

describe('PrisonerSearchApiClient', () => {
  let client: PrisonerSearchApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationClient>

    client = new PrisonerSearchApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPrisoner', () => {
    it('should call the API with the correct prisonNumber', async () => {
      const prisonNumber = 'A1234BC'

      const expectedResponse = {
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
      } as Prisoner

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getPrisoner(prisonNumber)

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/prisoner/${prisonNumber}`,
        },
        asSystem(),
      )
    })
  })
})
