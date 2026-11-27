import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import e, { Request, Response } from 'express'
import { ApplicationInfo } from '../../../applicationInfo'
import AuditService, { AuditPage, SubjectType } from '../../../services/auditService'
import PrisonerFinanceService from '../../../services/prisonerFinanceService'
import PrisonRegisterService from '../../../services/prisonRegisterService'
import AdvancesController from './advancesController'
import PrisonerSearchService from '../../../services/prisonerSearchService'
import { Page } from '../../../interfaces/Pageable'
import PrisonApiService from '../../../services/prisonApiService'
import FeatureFlagService from '../../../services/featureFlagService'
import PrisonerFinanceHoldsService from '../../../services/prisonerFinanceHoldsService'
import PrisonerFinanceAdvancesService from '../../../services/prisonerFinanceAdvancesService'
import { PrisonerAdvanceResponse } from '../../../interfaces/PrisonerAdvanceResponse'
import {
  PrisonerAdvanceBalanceResponse,
  PrisonerTotalAdvanceBalanceResponse,
} from '../../../interfaces/PrisonerAdvanceBalanceResponse'
import { PrisonerAdvancePaymentsResponse } from '../../../interfaces/PrisonerAdvancePaymentsResponse'
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

describe('AdvancesController', () => {
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

  const advancesController: AdvancesController = new AdvancesController({
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

  describe('getAdvances', () => {
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        auditPage: AuditPage.PRISONER_ADVANCES,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    it('Should call get advances, balances, and log Audit', async () => {
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

      const advanceBalances: PrisonerTotalAdvanceBalanceResponse = {
        balanceDateTime: '',
        advancesAmount: 100,
        balancesOutstanding: 10,
        weeklyPaymentAmount: 1,
      }
      const prisonerAdvances: PrisonerAdvanceResponse[] = []

      const mockAdvancesPage: Page<PrisonerAdvanceResponse> = {
        content: prisonerAdvances,
        totalElements: prisonerAdvances.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 99,
        isLastPage: true,
      }

      prisonerFinanceAdvancesService.getAdvances.mockResolvedValue(mockAdvancesPage)
      prisonerFinanceAdvancesService.getAdvancesBalances.mockResolvedValue(advanceBalances)

      await advancesController.getAdvances(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_ADVANCES, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

      expect(prisonerFinanceAdvancesService.getAdvances).toHaveBeenCalledWith(mockReq.params.prisonNumber, '1', false)
      expect(prisonerFinanceAdvancesService.getAdvancesBalances).toHaveBeenCalledWith(prisonNumber)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/advances/advances', {
        prisonNumber: mockReq.params.prisonNumber,
        advances: prisonerAdvances,
        advanceBalances,
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

  describe('getAdvanceDetail', () => {
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        auditPage: AuditPage.PRISONER_ADVANCE_DETAIL,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    it('Should call get advance, payments, and log Audit', async () => {
      const prisonNumber = 'ABC123KK'
      const advanceId = '123'
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber, advanceId },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
        query: {
          page: '1',
        },
      } as unknown as Request

      const mockAdvanceBalance: PrisonerAdvanceBalanceResponse = {
        balanceDateTime: '',
        advanceAmount: 100,
        balanceOutstanding: 10,
        weeklyPaymentAmount: 1,
        remainingPayments: 4,
        nextPaymentDate: '',
        status: 'ACTIVE',
      }

      const prisonerAdvancePayments: PrisonerAdvancePaymentsResponse[] = []

      const mockAdvancePaymentsPage: Page<PrisonerAdvancePaymentsResponse> = {
        content: prisonerAdvancePayments,
        totalElements: prisonerAdvancePayments.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 99,
        isLastPage: true,
      }

      prisonerFinanceAdvancesService.getAdvanceBalance.mockResolvedValue(mockAdvanceBalance)
      prisonerFinanceAdvancesService.getAdvancePayments.mockResolvedValue(mockAdvancePaymentsPage)

      await advancesController.getAdvanceDetail(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_ADVANCE_DETAIL, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

      expect(prisonerFinanceAdvancesService.getAdvanceBalance).toHaveBeenCalledWith(advanceId)
      expect(prisonerFinanceAdvancesService.getAdvancePayments).toHaveBeenCalledWith(advanceId, '1', false)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/advances/advanceDetail', {
        prisonNumber: mockReq.params.prisonNumber,
        advancePayments: mockAdvancePaymentsPage.content,
        advanceBalance: mockAdvanceBalance,
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
