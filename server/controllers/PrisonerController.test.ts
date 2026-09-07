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
import PrisonerFinanceHoldsService from '../services/prisonerFinanceHoldsService'
import { PrisonerHoldsBalanceResponse } from '../interfaces/PrisonerHoldsBalanceResponse'
import { PrisonerHoldResponse } from '../interfaces/PrisonerHoldResponse'

jest.mock('../applicationInfo')
jest.mock('../services/auditService')
jest.mock('../services/prisonerFinanceService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/prisonRegisterService')
jest.mock('../services/prisonApiService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../services/prisonerFinanceHoldsService')

describe('PrisonerController', () => {
  const applicationInfo = {} as unknown as jest.Mocked<ApplicationInfo>
  const auditService = new AuditService(null) as jest.Mocked<AuditService>
  const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
  const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
  const prisonRegisterService = {} as unknown as jest.Mocked<PrisonRegisterService>
  const prisonPermissionsService = {} as unknown as jest.Mocked<PermissionsService>
  const prisonApiService = new PrisonApiService(null) as jest.Mocked<PrisonApiService>
  const featureFlagService = {} as unknown as jest.Mocked<FeatureFlagService>
  const prisonerFinanceHoldsService = new PrisonerFinanceHoldsService(null) as jest.Mocked<PrisonerFinanceHoldsService>

  const prisonerController: PrisonerController = new PrisonerController({
    applicationInfo,
    auditService,
    prisonerFinanceService,
    prisonerSearchService,
    prisonRegisterService,
    prisonPermissionsService,
    prisonApiService,
    featureFlagService,
    prisonerFinanceHoldsService,
  })

  const mockNext: e.NextFunction = jest.fn()

  const mockBalance: AccountBalanceResponse = { accountId: '', balanceDateTime: '', amount: 10 }
  const mockSubAccountBalance: SubAccountBalanceResponse = { subAccountId: '', balanceDateTime: '', amount: 10 }

  beforeEach(() => {
    jest.resetAllMocks()
    prisonApiService.getUserCaseloads.mockResolvedValue([
      {
        caseLoadId: 'ASI',
        description: 'Ashfield (HMP)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
      },
    ])
    prisonerSearchService.getPrisonersBySearchTerm.mockResolvedValue({
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
  })

  describe('getFindPrisoner', () => {
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        subAccount: 'CASH',
        auditPage: AuditPage.FIND_PRISONER,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    it('should call the audit service with the prisoner ID', async () => {
      const prisonNumber = 'ABC123XX'
      const mockReq = { query: { term: 'ABC123XX' } } as unknown as Request

      await prisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(auditService.logSearchRequest).toHaveBeenCalledWith(SearchRequest.FIND_PRISONER, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.SEARCH_TERM,
        subjectId: prisonNumber,
      })
    })

    it('Should get caseloads and match prisoners', async () => {
      const mockReq = { query: { term: 'ABC123XX' } } as unknown as Request

      await prisonerController.getFindPrisoner(mockReq, mockRes, mockNext)
      expect(prisonApiService.getUserCaseloads).toHaveBeenCalled()
      expect(prisonerSearchService.getPrisonersBySearchTerm).toHaveBeenLastCalledWith('ASI', 'ABC123XX', '0')

      expect(mockRes.render).toHaveBeenCalled()
    })

    it('Should trim the entered search request before search', async () => {
      const mockReq = { query: { term: ' ABC123XX ' } } as unknown as Request

      await prisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(prisonerSearchService.getPrisonersBySearchTerm).toHaveBeenLastCalledWith('ASI', 'ABC123XX', '0')
    })

    it('Should render the find page without calling the API when no search term is entered', async () => {
      const mockReq = { query: {} } as unknown as Request

      await prisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(prisonerSearchService.getPrisonersBySearchTerm).not.toHaveBeenCalled()

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/find/find', {
        currentCaseload: 'Ashfield (HMP)',
      })
    })

    it('Should render the find page with an error when the search term an empty string', async () => {
      const mockReq = { query: { term: '   ' } } as unknown as Request

      await prisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/find/find', {
        currentCaseload: 'Ashfield (HMP)',
        errorMap: { term: 'Enter a prison number or prisoner name' },
        errors: [
          {
            href: '#term',
            text: 'Enter a prison number or prisoner name',
          },
        ],
      })
      expect(mockRes.redirect).not.toHaveBeenCalled()
    })
  })

  describe('getTransactions', () => {
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        subAccount: 'CASH',
        auditPage: AuditPage.PRISONER_HOLDS,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response
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
          legacyTransactionId: 123,
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
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        subAccount: 'CASH',
        auditPage: AuditPage.PRISONER_FINANCIAL_PROFILE,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    it('Should  call getTransaction and getSubAccountBalances', async () => {
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber: 'ABC123KK' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
        featureFlags: { ACTION_PANEL_ENABLED: false },
      } as unknown as Request

      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '10-10-2010',
          legacyTransactionId: 123,
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

      const mockHoldResponse: PrisonerHoldsBalanceResponse = { amount: 0, balanceDateTime: '' }

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)
      prisonerFinanceService.getSubAccountBalances.mockResolvedValue(mockBalancesResponse)

      prisonerFinanceHoldsService.getHoldsBalance.mockResolvedValue(mockHoldResponse)

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
          holds: mockHoldResponse,
        },
        actionPanelEnabled: false,
      })
    })

    it('Should preview 5 at most', async () => {
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber: 'ABC123KK' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
        featureFlags: { ACTION_PANEL_ENABLED: false },
      } as unknown as Request

      const mockTransactions: PrisonerTransactionResponse[] = Array.from({ length: 100 }, () => {
        return {
          date: '10-10-2010',
          legacyTransactionId: 123,
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

      const mockHoldResponse: PrisonerHoldsBalanceResponse = { amount: 0, balanceDateTime: '' }

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)
      prisonerFinanceService.getSubAccountBalances.mockResolvedValue(mockBalancesResponse)

      prisonerFinanceHoldsService.getHoldsBalance.mockResolvedValue(mockHoldResponse)

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
          holds: mockHoldResponse,
        },
        actionPanelEnabled: false,
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

  describe('getHolds', () => {
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        auditPage: AuditPage.PRISONER_HOLDS,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    it('Should call getHolds and log Audit', async () => {
      const prisonNumber = 'ABC123KK'
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
        query: {
          page: '1',
        },
      } as unknown as Request

      const prisonerHolds: PrisonerHoldResponse[] = []

      const mockHoldsPage: Page<PrisonerHoldResponse> = {
        content: prisonerHolds,
        totalElements: prisonerHolds.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 99,
        isLastPage: true,
      }

      prisonerFinanceHoldsService.getHolds.mockResolvedValue(mockHoldsPage)

      await prisonerController.getHolds(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_HOLDS, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

      expect(prisonerFinanceHoldsService.getHolds).toHaveBeenCalledWith(mockReq.params.prisonNumber, '1', false)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/holds/holds', {
        prisonNumber: mockReq.params.prisonNumber,
        holds: prisonerHolds,
        paginationItems: {
          isLastPage: true,
          items: [
            {
              href: '?page=1',
              selected: true,
              text: '1',
            },
          ],
          next: null,
          pageNumber: 1,
          pageSize: 99,
          previous: null,
          results: {
            count: 0,
            from: 0,
            text: ' results',
            to: 0,
          },
          totalElements: 0,
          totalPages: 1,
        },
      })
    })
  })
})
