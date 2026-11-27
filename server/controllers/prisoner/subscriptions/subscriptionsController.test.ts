import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import e, { Request, Response } from 'express'
import { ApplicationInfo } from '../../../applicationInfo'
import AuditService, { AuditPage, SubjectType } from '../../../services/auditService'
import PrisonerFinanceService from '../../../services/prisonerFinanceService'
import PrisonRegisterService from '../../../services/prisonRegisterService'
import SubscriptionController from './subscriptionsController'
import PrisonerSearchService from '../../../services/prisonerSearchService'
import { Page } from '../../../interfaces/Pageable'
import PrisonApiService from '../../../services/prisonApiService'
import FeatureFlagService from '../../../services/featureFlagService'
import PrisonerFinanceHoldsService from '../../../services/prisonerFinanceHoldsService'
import PrisonerFinanceAdvancesService from '../../../services/prisonerFinanceAdvancesService'
import PrisonerFinanceSubscriptionsService from '../../../services/prisonerFinanceSubscriptionsService'
import { PrisonerSubscriptionResponse } from '../../../interfaces/PrisonerSubscriptionResponse'
import { PrisonerSubscriptionSummaryResponse } from '../../../interfaces/PrisonerSubscriptionSummaryResponse'

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

describe('SubscriptionsController', () => {
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

  const subscriptionController: SubscriptionController = new SubscriptionController({
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

  describe('getSubscriptions', () => {
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        auditPage: AuditPage.PRISONER_SUBSCRIPTIONS,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    it('Should call get subscriptions, subscriptions summary, and log Audit', async () => {
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

      const pagedSubscriptionsResponse: Page<PrisonerSubscriptionResponse> = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 99,
        isLastPage: true,
      }
      const summaryResponse: PrisonerSubscriptionSummaryResponse = {
        weeklyPaymentAmount: 100,
        subscriptionCount: 2,
      }

      prisonerFinanceSubscriptionsService.getSubscriptions.mockResolvedValue(pagedSubscriptionsResponse)
      prisonerFinanceSubscriptionsService.getSubscriptionsSummary.mockResolvedValue(summaryResponse)

      await subscriptionController.getSubscriptions(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_SUBSCRIPTIONS, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

      expect(prisonerFinanceSubscriptionsService.getSubscriptions).toHaveBeenCalledWith(
        mockReq.params.prisonNumber,
        '1',
        false,
      )
      expect(prisonerFinanceSubscriptionsService.getSubscriptionsSummary).toHaveBeenCalledWith(prisonNumber)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/subscriptions/subscriptions', {
        prisonNumber: mockReq.params.prisonNumber,
        subscriptions: pagedSubscriptionsResponse.content,
        subscriptionTotal: summaryResponse.weeklyPaymentAmount,
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
