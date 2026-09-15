import PrisonerFinanceAdvancesApiClient from '../clients/prisonerFinanceAdvancesApi'
import { Page } from '../interfaces/Pageable'
import { PrisonerAdvanceBalanceResponse } from '../interfaces/PrisonerAdvanceBalanceResponse'
import { PrisonerAdvancePaymentsResponse } from '../interfaces/PrisonerAdvancePaymentsResponse'
import { PrisonerAdvanceResponse } from '../interfaces/PrisonerAdvanceResponse'
import PrisonerFinanceAdvancesService from './prisonerFinanceAdvancesService'

jest.mock('../clients/prisonerFinanceAdvancesApi')

describe('PrisonerFinanceAdvancesService', () => {
  const apiClient = new PrisonerFinanceAdvancesApiClient(null) as jest.Mocked<PrisonerFinanceAdvancesApiClient>
  let service: PrisonerFinanceAdvancesService

  beforeEach(() => {
    service = new PrisonerFinanceAdvancesService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getAdvanceBalance', () => {
    it('should call the API client', async () => {
      const prisonNumber = 'A123BCD'

      const expectedResponse: PrisonerAdvanceBalanceResponse = {
        amount: 100,
        weeklyAmount: 1,
        outstandingAmount: 90,
        balanceDateTime: '',
      }

      apiClient.getAdvanceBalance.mockResolvedValue(expectedResponse)

      await service.getAdvanceBalances(prisonNumber)

      expect(apiClient.getAdvanceBalance).toHaveBeenCalledWith(prisonNumber)
    })
  })

  describe('getAdvances', () => {
    it('should call the API client', async () => {
      const prisonNumber = 'A123BCD'

      const advance: PrisonerAdvanceResponse = {
        id: '',
        prisonNumber,
        legacyAdvanceNumber: 123,
        createdAt: '',
        createdBy: '',
        date: '',
        advanceAmount: 110,
        paymentAmount: 11,
        startPayments: '',
        reference: '',
        advanceLocation: 'LEI',
        status: 'ACTIVE',
      }

      const pagedResponse: Page<PrisonerAdvanceResponse> = {
        content: [advance],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 25,
        isLastPage: true,
      }

      apiClient.getAdvances.mockResolvedValue(pagedResponse)

      await service.getAdvances(prisonNumber, '1', false)

      expect(apiClient.getAdvances).toHaveBeenCalledWith(prisonNumber, '1')
    })

    it('should not call the API client when there are validation errors', async () => {
      const prisonNumber = 'A123BCD'

      const advance: PrisonerAdvanceResponse = {
        id: '',
        prisonNumber,
        legacyAdvanceNumber: 123,
        createdAt: '',
        createdBy: '',
        date: '',
        advanceAmount: 110,
        paymentAmount: 11,
        startPayments: '',
        reference: '',
        advanceLocation: 'LEI',
        status: 'ACTIVE',
      }

      const pagedResponse: Page<PrisonerAdvanceResponse> = {
        content: [advance],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 25,
        isLastPage: true,
      }

      apiClient.getAdvances.mockResolvedValue(pagedResponse)

      await service.getAdvances(prisonNumber, '1', true)

      expect(apiClient.getAdvances).not.toHaveBeenCalled()
    })
  })

  describe('getAdvance', () => {
    it('should call the API client', async () => {
      const prisonNumber = 'A123BCD'

      const advance: PrisonerAdvanceResponse = {
        id: '',
        prisonNumber,
        legacyAdvanceNumber: 123,
        createdAt: '',
        createdBy: '',
        date: '',
        advanceAmount: 110,
        paymentAmount: 11,
        startPayments: '',
        reference: '',
        advanceLocation: 'LEI',
        status: 'ACTIVE',
      }

      apiClient.getAdvance.mockResolvedValue(advance)

      await service.getAdvance(prisonNumber, '1')

      expect(apiClient.getAdvance).toHaveBeenCalledWith(prisonNumber, '1')
    })
  })

  describe('getAdvancePayments', () => {
    const advancePayment: PrisonerAdvancePaymentsResponse = {
      id: '1',
      prisonNumber: 'AB123XS',
      legacyAdvanceNumber: 1,
      createdAt: '',
      createdBy: 'TEST',
      date: '',
      paymentAmount: 10,
      advanceLocation: 'LEI',
    }

    const pagedResponse: Page<PrisonerAdvancePaymentsResponse> = {
      content: [advancePayment],
      totalElements: 1,
      totalPages: 1,
      pageNumber: 1,
      pageSize: 25,
      isLastPage: true,
    }

    it('should call the API client', async () => {
      const prisonNumber = 'A123BCD'

      apiClient.getAdvancePayments.mockResolvedValue(pagedResponse)

      await service.getAdvancePayments(prisonNumber, '123', '1', false)

      expect(apiClient.getAdvancePayments).toHaveBeenCalledWith(prisonNumber, '123', '1')
    })

    it('should not call the API client when there are validation errors', async () => {
      const prisonNumber = 'A123BCD'

      await service.getAdvancePayments(prisonNumber, '123', '1', true)

      expect(apiClient.getAdvancePayments).not.toHaveBeenCalled()
    })
  })
})
