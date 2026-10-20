import PrisonerFinanceAdvancesApiClient from '../clients/prisonerFinanceAdvancesApi'
import { Page } from '../interfaces/Pageable'
import {
  PrisonerAdvanceBalanceResponse,
  PrisonerAdvancesBalanceResponse,
} from '../interfaces/PrisonerAdvanceBalanceResponse'
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

  describe('getAdvancesBalance', () => {
    it('should call the API client', async () => {
      const prisonNumber = 'A123BCD'

      const expectedResponse: PrisonerAdvancesBalanceResponse = {
        advancesAmount: 100,
        weeklyPaymentAmount: 1,
        balancesOutstanding: 90,
        balanceDateTime: '',
      }

      apiClient.getAdvancesBalance.mockResolvedValue(expectedResponse)

      await service.getAdvancesBalances(prisonNumber)

      expect(apiClient.getAdvancesBalance).toHaveBeenCalledWith(prisonNumber)
    })
  })

  describe('getAdvanceBalance', () => {
    it('should call the API client', async () => {
      const prisonNumber = 'A123BCD'
      const advanceId = '1'

      const expectedResponse: PrisonerAdvanceBalanceResponse = {
        advanceAmount: 100,
        weeklyPaymentAmount: 1,
        balanceOutstanding: 90,
        balanceDateTime: '',
        remainingPayments: 4,
        nextPaymentDate: '',
      }

      apiClient.getAdvanceBalance.mockResolvedValue(expectedResponse)

      await service.getAdvanceBalance(prisonNumber, advanceId)

      expect(apiClient.getAdvanceBalance).toHaveBeenCalledWith(prisonNumber, advanceId)
    })
  })

  describe('getAdvances', () => {
    it('should call the API client', async () => {
      const prisonNumber = 'A123BCD'

      const advance: PrisonerAdvanceResponse = {
        id: '',
        legacyPaymentProfileId: 123,
        legacyInformationNumber: '123444',
        prisonNumber: 'A123XS',
        prisonID: 'LEI',
        amount: 10000,
        createdOn: '',
        repaymentStartDate: '',
        repaymentAmount: 10,
        reference: '',
        comment: '',
        createdBy: '',
        status: 'ACTIVE',
        updatedAt: '',
        generalLedgerUUID: '',
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
        legacyPaymentProfileId: 123,
        legacyInformationNumber: '123444',
        prisonNumber: 'A123XS',
        prisonID: 'LEI',
        amount: 10000,
        createdOn: '',
        repaymentStartDate: '',
        repaymentAmount: 10,
        reference: '',
        comment: '',
        createdBy: '',
        status: 'ACTIVE',
        updatedAt: '',
        generalLedgerUUID: '',
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

      const pageNumber = '1'
      const hasValidationErrors = true
      await service.getAdvances(prisonNumber, pageNumber, hasValidationErrors)

      expect(apiClient.getAdvances).not.toHaveBeenCalled()
    })
  })

  describe('getAdvancePayments', () => {
    const advancePayment: PrisonerAdvancePaymentsResponse = {
      id: '1',
      transactionId: '',
      createdAt: '',
      createdBy: 'TEST',
      amount: 10,
      location: 'LEI',
      advanceId: '',
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
