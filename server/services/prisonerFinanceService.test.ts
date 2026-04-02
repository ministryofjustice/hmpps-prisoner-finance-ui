import PrisonerFinanceApiClient from '../clients/prisonerFinanceApi'
import { Page } from '../interfaces/Pageable'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
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

  const emptyPageTransactionsResponse: Page<PrisonerTransactionResponse> = {
    content: [],
    totalElements: 0,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 99,
    isLastPage: true,
  }

  describe('getPrisonerTransactionsByPrisonNumber', () => {
    it('should call the API client', async () => {
      apiClient.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(emptyPageTransactionsResponse)

      const prisonNumber = 'A1234BC'
      const startDate = '10/10/2010'
      const endDate = '10/10/2020'
      await service.getPrisonerTransactionsByPrisonNumber(prisonNumber, startDate, endDate)

      expect(apiClient.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith(prisonNumber, startDate, endDate)
    })
  })

  describe('getAccountBalance', () => {
    it('should call the API client with the prison number', async () => {
      const mockResponse = { accountId: '0000-0000-0000-0001', amount: 100.5, balanceDateTime: '2023-01-01' }
      apiClient.getAccountBalance.mockResolvedValue(mockResponse)

      const result = await service.getAccountBalance('A1234BC')

      expect(apiClient.getAccountBalance).toHaveBeenCalledWith('A1234BC')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getSubAccountBalances', () => {
    const prisonNumber = 'A1234BC'
    const mockBalance = { subAccountId: '123', balanceDateTime: 'now', amount: 50 }

    it('should return balances for all three sub-accounts on success', async () => {
      apiClient.getSubAccountBalance.mockResolvedValue(mockBalance)

      const result = await service.getSubAccountBalances(prisonNumber)

      expect(apiClient.getSubAccountBalance).toHaveBeenCalledTimes(3)
      expect(apiClient.getSubAccountBalance).toHaveBeenCalledWith(prisonNumber, 'SPENDS')
      expect(apiClient.getSubAccountBalance).toHaveBeenCalledWith(prisonNumber, 'CASH')
      expect(apiClient.getSubAccountBalance).toHaveBeenCalledWith(prisonNumber, 'SAVINGS')

      expect(result).toEqual({
        SPENDS: mockBalance,
        CASH: mockBalance,
        SAVINGS: mockBalance,
      })
    })

    it('should return default zeroed values if the API returns a 404', async () => {
      apiClient.getSubAccountBalance
        .mockResolvedValueOnce(mockBalance)
        .mockRejectedValueOnce({ responseStatus: 404 })
        .mockResolvedValueOnce(mockBalance)

      const result = await service.getSubAccountBalances(prisonNumber)

      expect(result.CASH).toEqual({ subAccountId: '', balanceDateTime: '', amount: 0 })
      expect(result.SPENDS).toEqual(mockBalance)
    })

    it('should throw an error if the API returns a non-404 error', async () => {
      apiClient.getSubAccountBalance.mockRejectedValue(new Error('API Down'))

      await expect(service.getSubAccountBalances(prisonNumber)).rejects.toThrow('API Down')
    })
  })
})
