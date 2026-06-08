import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asUser } from '@ministryofjustice/hmpps-rest-client'
import PrisonApiClient from './prisonApiClient'
import ActiveCaseloadResponse from '../interfaces/ActiveCaseloadResponse'

describe('PrisonApi', () => {
  let client: PrisonApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationClient>

    client = new PrisonApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPrisonNames', () => {
    it('should call the API', async () => {
      const expectedResponse: ActiveCaseloadResponse[] = [
        {
          caseLoadId: 'MDI',
          description: 'Moorland Closed (HMP & YOI)',
          type: 'INST',
          caseloadFunction: 'GENERAL',
          currentlyActive: false,
        },
      ]

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(expectedResponse)

      const response = await client.getCaseloadsForCurrentUser('fake-token')

      expect(response).toEqual(expectedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/api/users/me/caseLoads`,
        },
        asUser('fake-token'),
      )
    })
  })
})
