import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem } from '@ministryofjustice/hmpps-rest-client'
import PrisonRegisterApiClient from './prisonRegisterApiClient'
import { PrisonRegisterName } from '../interfaces/prisonRegisterName'

describe('PrisonRegisterApiClient', () => {
  let client: PrisonRegisterApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationClient>

    client = new PrisonRegisterApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPrisonNames', () => {
    it('should call the API', async () => {
      const expectedResponse: PrisonRegisterName[] = [{ prisonId: 'LEI', prisonName: 'Leeds (HMP)' }]

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getPrisonNames()

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/prisons/names`,
        },
        asSystem(),
      )
    })
  })
})
