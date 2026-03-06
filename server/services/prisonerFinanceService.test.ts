import PrisonerFinanceApiClient from '../clients/prisonerFinanceApi'
import PrisonerFinanceService from './prisonerFinanceService'

jest.mock('../clients/prisonerFinanceApi')
jest.mock('../../logger')

describe('AuditHistoryService', () => {
  const apiClient = new PrisonerFinanceApiClient(null) as jest.Mocked<PrisonerFinanceApiClient>
  let service: PrisonerFinanceService

  beforeEach(() => {
    service = new PrisonerFinanceService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPrisonerTransactionsByPrisonNumber', () => {
    it('should call the API client', async () => {
      apiClient.getPrisonerTransactionsByPrisonNumber.mockResolvedValue([])

      const prisonNumber = 'A1234BC'
      await service.getPrisonerTransactionsByPrisonNumber(prisonNumber)

      expect(apiClient.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith(prisonNumber)
    })
  })
})
