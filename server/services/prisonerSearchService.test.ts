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

  describe('getPrisonersBySearchTerm', () => {
    it('should call the API client with the correct prisonId', async () => {
      apiClient.getPrisonersBySearchTerm.mockResolvedValue({
        totalElements: 0,
        totalPages: 0,
        size: 0,
        content: [],
        number: 0,
        first: true,
        last: true,
        sort: {
          empty: true,
          sorted: true,
          unsorted: true,
        },
        numberOfElements: 0,
        pageable: {
          offset: 0,
          sort: {
            empty: true,
            sorted: true,
            unsorted: true,
          },
          pageSize: 0,
          paged: true,
          pageNumber: 0,
          unpaged: true,
        },
        empty: true,
      })

      const prisonId = 'MDI'
      await service.getPrisonersBySearchTerm(prisonId, 'John Smith')

      expect(apiClient.getPrisonersBySearchTerm).toHaveBeenCalledWith(prisonId, 'John Smith', '0')
    })
  })
})
