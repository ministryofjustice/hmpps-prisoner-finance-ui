import PrisonerFinanceHoldsApiClient from '../clients/prisonerFinanceHoldsApi'
import { Page } from '../interfaces/Pageable'
import { PrisonerHoldResponse } from '../interfaces/PrisonerHoldResponse'
import { PrisonerHoldsBalanceResponse } from '../interfaces/PrisonerHoldsBalanceResponse'
import PrisonerFinanceHoldsService from './prisonerFinanceHoldsService'

jest.mock('../clients/prisonerFinanceHoldsApi')

describe('PrisonerFinanceHoldsService', () => {
  const apiClient = new PrisonerFinanceHoldsApiClient(null) as jest.Mocked<PrisonerFinanceHoldsApiClient>
  let service: PrisonerFinanceHoldsService

  beforeEach(() => {
    service = new PrisonerFinanceHoldsService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getHoldsBalance', () => {
    it('should call the API client', async () => {
      const prisonNumber = 'A123BCD'

      const expectedResponse: PrisonerHoldsBalanceResponse = {
        amount: 100,
        balanceDateTime: '',
      }

      apiClient.getHoldsBalance.mockResolvedValue(expectedResponse)

      await service.getHoldsBalance(prisonNumber)

      expect(apiClient.getHoldsBalance).toHaveBeenCalledWith(prisonNumber)
    })
  })

  describe('getHolds', () => {
    it('should call the API client', async () => {
      const prisonNumber = 'A123BCD'

      const hold: PrisonerHoldResponse = {
        id: '',
        prisonNumber: 'A1234CD',
        legacyHoldNumber: 1,
        subAccountRef: 'CASH',
        createdAt: '',
        createdBy: 'TEST',
        holdFromDate: '',
        holdUntilDate: '',
        isReleased: false,
        description: 'TEST',
        holdType: 'HOA',
        amount: 1000,
        holdLocation: 'LEI',
      }

      const pagedResponse: Page<PrisonerHoldResponse> = {
        content: [hold],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 25,
        isLastPage: true,
      }

      apiClient.getHolds.mockResolvedValue(pagedResponse)

      await service.getHolds(prisonNumber, '1', false)

      expect(apiClient.getHolds).toHaveBeenCalledWith(prisonNumber, '1')
    })

    it('should not call the API client when there are validation errors', async () => {
      const prisonNumber = 'A123BCD'

      const hold: PrisonerHoldResponse = {
        id: '',
        prisonNumber: 'A1234CD',
        legacyHoldNumber: 1,
        subAccountRef: 'CASH',
        createdAt: '',
        createdBy: 'TEST',
        holdFromDate: '',
        holdUntilDate: '',
        isReleased: false,
        description: 'TEST',
        holdType: 'HOA',
        amount: 1000,
        holdLocation: 'LEI',
      }

      const pagedResponse: Page<PrisonerHoldResponse> = {
        content: [hold],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 25,
        isLastPage: true,
      }

      apiClient.getHolds.mockResolvedValue(pagedResponse)

      await service.getHolds(prisonNumber, '1', true)

      expect(apiClient.getHolds).not.toHaveBeenCalled()
    })
  })
})
