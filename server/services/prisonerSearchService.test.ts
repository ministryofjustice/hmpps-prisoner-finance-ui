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
})
