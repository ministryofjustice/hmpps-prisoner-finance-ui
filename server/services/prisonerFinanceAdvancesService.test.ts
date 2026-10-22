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

  const advancePayment: PrisonerAdvancePaymentsResponse = {
    id: '1',
    transactionId: '',
    createdAt: '',
    createdBy: 'TEST',
    amount: 10,
    location: 'LEI',
    advanceId: '',
  }

  const pagedAdvancesResponse: Page<PrisonerAdvancePaymentsResponse> = {
    content: [advancePayment],
    totalElements: 1,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 25,
    isLastPage: true,
  }

  beforeEach(() => {
    service = new PrisonerFinanceAdvancesService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getAdvancesBalance', () => {
    it('should call the API client', async () => {
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
      const expectedResponse: PrisonerAdvanceBalanceResponse = {
        advanceAmount: 100,
        weeklyPaymentAmount: 1,
        balanceOutstanding: 90,
        balanceDateTime: '',
        remainingPayments: 4,
        nextPaymentDate: '',
      }

      apiClient.getAdvanceBalance.mockResolvedValue(expectedResponse)

      await service.getAdvanceBalance(prisonNumber)

      expect(apiClient.getAdvanceBalance).toHaveBeenCalledWith(prisonNumber)
    })
  })

  describe('getAdvances', () => {
    it('should call the API client', async () => {
      apiClient.getAdvances.mockResolvedValue(pagedResponse)

      await service.getAdvances(prisonNumber, '1', false)

      expect(apiClient.getAdvances).toHaveBeenCalledWith(prisonNumber, '1')
    })

    it('should not call the API client when there are validation errors', async () => {
      apiClient.getAdvances.mockResolvedValue(pagedResponse)

      const pageNumber = '1'
      const hasValidationErrors = true
      await service.getAdvances(prisonNumber, pageNumber, hasValidationErrors)

      expect(apiClient.getAdvances).not.toHaveBeenCalled()
    })
  })

  describe('getAdvancePayments', () => {
    it('should call the API client', async () => {
      apiClient.getAdvancePayments.mockResolvedValue(pagedAdvancesResponse)

      const hasValidationErrors = false
      await service.getAdvancePayments('123', '1', hasValidationErrors)

      expect(apiClient.getAdvancePayments).toHaveBeenCalledWith('123', '1')
    })

    it('should not call the API client when there are validation errors', async () => {
      const hasValidationErrors = true
      await service.getAdvancePayments('123', '1', hasValidationErrors)

      expect(apiClient.getAdvancePayments).not.toHaveBeenCalled()
    })
  })
})
