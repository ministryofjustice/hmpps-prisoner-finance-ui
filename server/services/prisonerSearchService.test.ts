import PrisonerSearchApiClient from '../clients/prisonerSearchApiClient'
import PrisonerSearchService from './prisonerSearchService'
import { Prisoner } from '../interfaces/prisoner'

jest.mock('../clients/prisonerSearchApiClient')
jest.mock('../../logger')

describe('PrisonerSearchService', () => {
  const apiClient = new PrisonerSearchApiClient(null) as jest.Mocked<PrisonerSearchApiClient>
  let service: PrisonerSearchService

  beforeEach(() => {
    service = new PrisonerSearchService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPrisoner', () => {
    it('should call the API client with the correct prisonNumber', async () => {
      apiClient.getPrisoner.mockResolvedValue({} as Prisoner)

      const prisonNumber = 'A1234BC'
      await service.getPrisoner(prisonNumber)

      expect(apiClient.getPrisoner).toHaveBeenCalledWith(prisonNumber)
    })
  })

  describe('getPrisonersByPrisonId', () => {
    it('should call the API client with the correct prisonId', async () => {
      apiClient.getPrisonerNumbersByPrisonId.mockResolvedValue({
        content: [{ alerts: [], prisonerNumber: 'A99123C' }],
        totalElements: 1,
        totalPages: 1,
        size: 1,
        number: 0,
      })

      const prisonId = 'MDI'
      await service.getPrisonerNumbersByPrisonId('FAKE_TOKEN', prisonId)

      expect(apiClient.getPrisonerNumbersByPrisonId).toHaveBeenCalledWith('FAKE_TOKEN', prisonId)
    })
  })
})
