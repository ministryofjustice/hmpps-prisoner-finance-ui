import PrisonRegisterApiClient from '../clients/prisonRegisterApiClient'
import PrisonRegisterService from './prisonRegisterService'

jest.mock('../clients/prisonRegisterApiClient')
jest.mock('../../logger')

describe('PrisonRegisterService', () => {
  const apiClient = new PrisonRegisterApiClient(null) as jest.Mocked<PrisonRegisterApiClient>
  let service: PrisonRegisterService

  beforeEach(() => {
    service = new PrisonRegisterService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPrisonNames', () => {
    it('should call the API client', async () => {
      apiClient.getPrisonNames.mockResolvedValue([])

      await service.getPrisonNames()

      expect(apiClient.getPrisonNames).toHaveBeenCalled()
    })
  })
})
