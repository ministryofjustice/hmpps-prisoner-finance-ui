import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import ExampleApiClient from './exampleApiClient'

describe('ExampleApiClient', () => {
  let exampleApiClient: ExampleApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationClient>

    exampleApiClient = new ExampleApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  describe('getCurrentTime', () => {
    it('should return the current time generated locally', async () => {
      const fixedTime = new Date('2025-01-01T12:00:00.00Z')
      jest.useFakeTimers()
      jest.setSystemTime(fixedTime)

      const response = await exampleApiClient.getCurrentTime()

      expect(response).toEqual(fixedTime.toISOString())
      expect(mockAuthenticationClient.getToken).not.toHaveBeenCalled()
    })
  })
})
