import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import e, { Request, Response } from 'express'
import { ApplicationInfo } from '../../../applicationInfo'
import AuditService, { AuditPage } from '../../../services/auditService'
import PrisonerFinanceService from '../../../services/prisonerFinanceService'
import PrisonRegisterService from '../../../services/prisonRegisterService'
import PrisonerProfileController from './prisonerProfileController'
import PrisonerSearchService from '../../../services/prisonerSearchService'
import { PrisonerTransactionResponse } from '../../../interfaces/PrisonerTransactionResponse'
import { Page } from '../../../interfaces/Pageable'
import { SubAccountBalanceResponse } from '../../../interfaces/SubAccountBalanceResponse'
import PrisonApiService from '../../../services/prisonApiService'
import FeatureFlagService from '../../../services/featureFlagService'
import PrisonerFinanceHoldsService from '../../../services/prisonerFinanceHoldsService'
import { PrisonerHoldsBalanceResponse } from '../../../interfaces/PrisonerHoldsBalanceResponse'
import PrisonerFinanceAdvancesService from '../../../services/prisonerFinanceAdvancesService'
import PrisonerFinanceSubscriptionsService from '../../../services/prisonerFinanceSubscriptionsService'

jest.mock('../../../applicationInfo')
jest.mock('../../../services/auditService')
jest.mock('../../../services/prisonerFinanceService')
jest.mock('../../../services/prisonerSearchService')
jest.mock('../../../services/prisonRegisterService')
jest.mock('../../../services/prisonApiService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../services/prisonerFinanceHoldsService')
jest.mock('../../../services/prisonerFinanceAdvancesService')
jest.mock('../../../services/prisonerFinanceSubscriptionsService')

describe('PrisonerProfileController', () => {
  const applicationInfo = {} as unknown as jest.Mocked<ApplicationInfo>
  const auditService = new AuditService(null) as jest.Mocked<AuditService>
  const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
  const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
  const prisonRegisterService = {} as unknown as jest.Mocked<PrisonRegisterService>
  const prisonPermissionsService = {} as unknown as jest.Mocked<PermissionsService>
  const prisonApiService = new PrisonApiService(null) as jest.Mocked<PrisonApiService>
  const featureFlagService = {} as unknown as jest.Mocked<FeatureFlagService>
  const prisonerFinanceHoldsService = new PrisonerFinanceHoldsService(null) as jest.Mocked<PrisonerFinanceHoldsService>
  const prisonerFinanceAdvancesService = new PrisonerFinanceAdvancesService(
    null,
  ) as jest.Mocked<PrisonerFinanceAdvancesService>
  const prisonerFinanceSubscriptionsService = new PrisonerFinanceSubscriptionsService(
    null,
  ) as jest.Mocked<PrisonerFinanceSubscriptionsService>

  const prisonerProfileController: PrisonerProfileController = new PrisonerProfileController({
    applicationInfo,
    auditService,
    prisonerFinanceService,
    prisonerSearchService,
    prisonRegisterService,
    prisonPermissionsService,
    prisonApiService,
    featureFlagService,
    prisonerFinanceHoldsService,
    prisonerFinanceAdvancesService,
    prisonerFinanceSubscriptionsService,
  })

  const mockNext: e.NextFunction = jest.fn()

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

      const mockHoldResponse: PrisonerHoldsBalanceResponse = { amount: 0, balanceDateTime: '', hoa: 0, whf: 0 }

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)
      prisonerFinanceService.getSubAccountBalances.mockResolvedValue(mockBalancesResponse)

      prisonerFinanceHoldsService.getHoldsBalance.mockResolvedValue(mockHoldResponse)
      prisonerFinanceAdvancesService.getAdvancesBalances.mockResolvedValue({
        balanceDateTime: '',
        advancesAmount: 10,
        balancesOutstanding: 10,
        weeklyPaymentAmount: 11,
      })

      await prisonerProfileController.getProfile(mockReq, mockRes, mockNext)

      expect(prisonerFinanceService.getSubAccountBalances).toHaveBeenCalledWith(mockReq.params.prisonNumber)
      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        page: '1',
        pageSize: '25',
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
        advancesAmount: 10,
        balancesOutstanding: 10,
        weeklyPaymentAmount: 11,
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

      const mockHoldResponse: PrisonerHoldsBalanceResponse = { amount: 0, balanceDateTime: '', hoa: 0, whf: 0 }

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)
      prisonerFinanceService.getSubAccountBalances.mockResolvedValue(mockBalancesResponse)

      prisonerFinanceHoldsService.getHoldsBalance.mockResolvedValue(mockHoldResponse)
      prisonerFinanceAdvancesService.getAdvancesBalances.mockResolvedValue({
        balanceDateTime: '',
        advancesAmount: 10,
        balancesOutstanding: 10,
        weeklyPaymentAmount: 11,
      })

      await prisonerProfileController.getProfile(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalled()
      expect(prisonerFinanceService.getSubAccountBalances).toHaveBeenCalledWith(mockReq.params.prisonNumber)
      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        page: '1',
        pageSize: '25',
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
        advancesAmount: 10,
        balancesOutstanding: 10,
        weeklyPaymentAmount: 11,
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

      await prisonerProfileController.getProfile(mockReq, mockRes, mockNext)

      expect(mockRes.render).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })
  })
})
