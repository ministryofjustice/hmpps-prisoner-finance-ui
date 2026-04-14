import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import e, { Request, Response } from 'express'
import { ApplicationInfo } from '../applicationInfo'
import AuditService, { AuditPage } from '../services/auditService'
import PrisonerFinanceService from '../services/prisonerFinanceService'
import PrisonRegisterService from '../services/prisonRegisterService'
import PrisonerController from './PrisonerController'
import PrisonerSearchService from '../services/prisonerSearchService'
import { AccountBalanceResponse } from '../interfaces/AccountBalanceResponse'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { Page } from '../interfaces/Pageable'
import { SubAccountBalanceResponse } from '../interfaces/SubAccountBalanceResponse'

jest.mock('../applicationInfo')
jest.mock('../services/auditService')
jest.mock('../services/prisonerFinanceService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/prisonRegisterService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

describe('PrisonerController', () => {
  const applicationInfo = {} as unknown as jest.Mocked<ApplicationInfo>
  const auditService = new AuditService(null) as jest.Mocked<AuditService>
  const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
  const prisonerSearchService = {} as unknown as jest.Mocked<PrisonerSearchService>
  const prisonRegisterService = {} as unknown as jest.Mocked<PrisonRegisterService>
  const prisonPermissionsService = {} as unknown as jest.Mocked<PermissionsService>

  const prisonerController: PrisonerController = new PrisonerController({
    applicationInfo,
    auditService,
    prisonerFinanceService,
    prisonerSearchService,
    prisonRegisterService,
    prisonPermissionsService,
  })

  const mockRes: Response = {
    locals: { user: { username: 'test-user' }, subAccount: 'CASH' },
    render: jest.fn(),
    status: jest.fn().mockReturnThis(),
  } as unknown as Response

  const mockNext: e.NextFunction = jest.fn()

  const mockBalance: AccountBalanceResponse = { accountId: '', balanceDateTime: '', amount: 10 }
  const mockSubAccountBalance: SubAccountBalanceResponse = { subAccountId: '', balanceDateTime: '', amount: 10 }

  beforeEach(() => {
    jest.resetAllMocks()
  })
  describe('getTransactions', () => {
    it('Should  call getTransactionPage', async () => {
      const startDate = '10/10/2010'
      const endDate = '10/10/2020'
      const debit = 'false'
      const credit = 'true'

      const mockReq = {
        id: 'req-id-123',
        query: { startDate, endDate, debit, credit, page: '1' },
        params: { prisonNumber: 'ABC123XX' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
      } as unknown as Request

      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '10-10-2010',
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
        },
      ]

      const mockTransactionsPage: Page<PrisonerTransactionResponse> = {
        content: mockTransactions,
        totalElements: mockTransactions.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 99,
        isLastPage: true,
      }

      prisonerFinanceService.getTransactionPage.mockResolvedValue([mockTransactionsPage, mockBalance])

      await prisonerController.getTransactions(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_MONEY, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
      })
      expect(prisonerFinanceService.getTransactionPage).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        startDate,
        endDate,
        page: '1',
        debit,
        credit,
        subAccountReference: mockRes.locals.subAccount,
        hasValidationErrors: false,
      })
      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerTransactions', {
        prisonNumber: mockReq.params.prisonNumber,
        headerTitle: 'Transactions for all sub accounts',
        applicationName: 'Transactions',
        transactions: mockTransactions,
        currentBalance: mockBalance.amount,
        holdBalance: 0,
        paginationItems: expect.anything(),
        hasValidationErrors: false,
        filters: {
          startDate,
          endDate,
          debit,
          credit,
          selectedFilters: expect.anything(),
        },
      })
    })

    it('should catch exceptions', async () => {
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber: 'ABC123XX' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
      } as unknown as Request

      auditService.logPageView.mockImplementation(() => {
        throw new Error('Expected error')
      })

      await prisonerController.getTransactions(mockReq, mockRes, mockNext)

      expect(mockRes.render).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('getProfile', () => {
    it('Should  call getTransaction and getSubAccountBalances', async () => {
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber: 'ABC123KK' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
      } as unknown as Request

      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '10-10-2010',
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
        },
      ]

      const mockTransactionsPage: Page<PrisonerTransactionResponse> = {
        content: mockTransactions,
        totalElements: mockTransactions.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 99,
        isLastPage: true,
      }

      const mockBalancesResponse = {
        SPENDS: mockSubAccountBalance,
        SAVINGS: mockSubAccountBalance,
        CASH: mockSubAccountBalance,
      }

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)
      prisonerFinanceService.getSubAccountBalances.mockResolvedValue(mockBalancesResponse)

      await prisonerController.getProfile(mockReq, mockRes, mockNext)

      expect(prisonerFinanceService.getSubAccountBalances).toHaveBeenCalledWith(mockReq.params.prisonNumber)
      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        page: '1',
      })
      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/profile/prisonerProfile', {
        prisonNumber: mockReq.params.prisonNumber,
        transactions: mockTransactions,
        subAccountBalances: {
          spends: mockBalancesResponse.SPENDS,
          privateCash: mockBalancesResponse.CASH,
          savings: mockBalancesResponse.SAVINGS,
        },
      })
    })

    it('Should preview 5 at most', async () => {
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber: 'ABC123KK' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
      } as unknown as Request

      const mockTransactions: PrisonerTransactionResponse[] = Array.from({ length: 100 }, () => {
        return {
          date: '10-10-2010',
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
        }
      })

      const mockTransactionsPage: Page<PrisonerTransactionResponse> = {
        content: mockTransactions,
        totalElements: mockTransactions.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 99,
        isLastPage: true,
      }

      const mockBalancesResponse = {
        SPENDS: mockSubAccountBalance,
        SAVINGS: mockSubAccountBalance,
        CASH: mockSubAccountBalance,
      }

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)
      prisonerFinanceService.getSubAccountBalances.mockResolvedValue(mockBalancesResponse)

      await prisonerController.getProfile(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalled()
      expect(prisonerFinanceService.getSubAccountBalances).toHaveBeenCalledWith(mockReq.params.prisonNumber)
      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        page: '1',
      })
      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/profile/prisonerProfile', {
        prisonNumber: mockReq.params.prisonNumber,
        transactions: mockTransactions.slice(0, 5),
        subAccountBalances: {
          spends: mockBalancesResponse.SPENDS,
          privateCash: mockBalancesResponse.CASH,
          savings: mockBalancesResponse.SAVINGS,
        },
      })
    })

    it('should catch exceptions', async () => {
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber: 'ABC123XX' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
      } as unknown as Request

      auditService.logPageView.mockImplementation(() => {
        throw new Error('Expected error')
      })

      await prisonerController.getProfile(mockReq, mockRes, mockNext)

      expect(mockRes.render).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })
  })
})
