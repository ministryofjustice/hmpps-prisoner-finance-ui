import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import e, { Request, Response } from 'express'
import { ApplicationInfo } from '../applicationInfo'
import AuditService, { AuditPage, SearchRequest, SubjectType } from '../services/auditService'
import PrisonerFinanceService from '../services/prisonerFinanceService'
import PrisonRegisterService from '../services/prisonRegisterService'
import PrisonerController from './PrisonerController'
import PrisonerSearchService from '../services/prisonerSearchService'
import { AccountBalanceResponse } from '../interfaces/AccountBalanceResponse'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { Page } from '../interfaces/Pageable'
import { SubAccountBalanceResponse } from '../interfaces/SubAccountBalanceResponse'
import PrisonApiService from '../services/prisonApiService'
import FeatureFlagService from '../services/featureFlagService'

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
  const prisonApiService = {} as unknown as jest.Mocked<PrisonApiService>
  const featureFlagService = {} as unknown as jest.Mocked<FeatureFlagService>

  const prisonerController: PrisonerController = new PrisonerController({
    applicationInfo,
    auditService,
    prisonerFinanceService,
    prisonerSearchService,
    prisonRegisterService,
    prisonPermissionsService,
    prisonApiService,
    featureFlagService,
  })

  const mockRes: Response = {
    locals: {
      user: { username: 'test-user' },
      subAccount: 'CASH',
      auditPage: AuditPage.PRISONER_CASH_TRANSACTIONS,
    },
    render: jest.fn(),
    redirect: jest.fn(),
    status: jest.fn().mockReturnThis(),
  } as unknown as Response

  const mockNext: e.NextFunction = jest.fn()

  const mockBalance: AccountBalanceResponse = { accountId: '', balanceDateTime: '', amount: 10 }
  const mockSubAccountBalance: SubAccountBalanceResponse = { subAccountId: '', balanceDateTime: '', amount: 10 }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('getFindPrisoner', () => {
    const mockReq = {
      id: 'req-id-123',
    } as unknown as Request

    it('Should log the page view and render the find page', async () => {
      await prisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.FIND_PRISONER, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
      })

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/find/find')
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('postFindPrisoner', () => {
    it('should call the audit service with the prisoner ID', async () => {
      const prisonNumber = 'ABC123XX'
      const mockReq = { body: { prisonNumber } } as unknown as Request

      await prisonerController.postFindPrisoner(mockReq, mockRes, mockNext)

      expect(auditService.logSearchRequest).toHaveBeenCalledWith(SearchRequest.FIND_PRISONER, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })
    })

    it('Should redirect to the prisoner profile for the entered prison number', async () => {
      const mockReq = { body: { prisonNumber: 'ABC123XX' } } as unknown as Request

      await prisonerController.postFindPrisoner(mockReq, mockRes, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/prisoner/ABC123XX')
      expect(mockRes.render).not.toHaveBeenCalled()
    })

    it('Should trim the entered prison number before redirecting', async () => {
      const mockReq = { body: { prisonNumber: '  ABC123XX  ' } } as unknown as Request

      await prisonerController.postFindPrisoner(mockReq, mockRes, mockNext)

      expect(mockRes.redirect).toHaveBeenCalledWith('/prisoner/ABC123XX')
    })

    it('Should render the find page with an error when no prison number is entered', async () => {
      const mockReq = { body: { prisonNumber: '' } } as unknown as Request

      await prisonerController.postFindPrisoner(mockReq, mockRes, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/find/find', {
        errorMap: { prisonNumber: 'Enter a prison number' },
      })
      expect(mockRes.redirect).not.toHaveBeenCalled()
    })

    it('Should render the find page with an error when only whitespace is entered', async () => {
      const mockReq = { body: { prisonNumber: '   ' } } as unknown as Request

      await prisonerController.postFindPrisoner(mockReq, mockRes, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/find/find', {
        errorMap: { prisonNumber: 'Enter a prison number' },
      })
      expect(mockRes.redirect).not.toHaveBeenCalled()
    })

    it('Should render the find page with an error when the prison number is not a string', async () => {
      const mockReq = { body: { prisonNumber: ['A1234BC', 'B2345CD'] } } as unknown as Request

      await prisonerController.postFindPrisoner(mockReq, mockRes, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/find/find', {
        errorMap: { prisonNumber: 'Enter a prison number' },
      })
      expect(mockRes.redirect).not.toHaveBeenCalled()
    })
  })

  describe('getTransactions', () => {
    it('Should call getTransactionPage', async () => {
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
          subAccountBalance: 100,
          accountBalance: 20,
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

      expect(auditService.logPageView).toHaveBeenCalledWith(mockRes.locals.auditPage, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: mockReq.params.prisonNumber,
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
        displayTotalBalance: false,
      })
    })

    it('Should catch exceptions', async () => {
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
          subAccountBalance: 200,
          accountBalance: 30,
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
          subAccountBalance: 300,
          accountBalance: 40,
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

    it('Should catch exceptions', async () => {
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
