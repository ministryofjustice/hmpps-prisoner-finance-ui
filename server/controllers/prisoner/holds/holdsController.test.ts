import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import e, { Request, Response } from 'express'
import { ApplicationInfo } from '../../../applicationInfo'
import AuditService, { AuditPage, SubjectType } from '../../../services/auditService'
import PrisonerFinanceService from '../../../services/prisonerFinanceService'
import PrisonRegisterService from '../../../services/prisonRegisterService'
import HoldsController from './holdsController'
import PrisonerSearchService from '../../../services/prisonerSearchService'
import { Page } from '../../../interfaces/Pageable'
import PrisonApiService from '../../../services/prisonApiService'
import FeatureFlagService from '../../../services/featureFlagService'
import PrisonerFinanceHoldsService from '../../../services/prisonerFinanceHoldsService'
import { PrisonerHoldsBalanceResponse } from '../../../interfaces/PrisonerHoldsBalanceResponse'
import { PrisonerHoldResponse } from '../../../interfaces/PrisonerHoldResponse'
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

describe('HoldsController', () => {
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

  const holdsController: HoldsController = new HoldsController({
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

    const mockHoldBalance: PrisonerHoldsBalanceResponse = {
      amount: 100,
      hoa: 50,
      whf: 50,
      balanceDateTime: '',
    }

    beforeEach(async () => {
      prisonerFinanceHoldsService.getHolds.mockResolvedValue(mockHoldsPage)
      prisonerFinanceHoldsService.getHoldsBalance.mockResolvedValue(mockHoldBalance)
      await holdsController.getHolds(mockReq, mockRes, mockNext)
    })

    it('Should call get holds', async () => {
      expect(prisonerFinanceHoldsService.getHolds).toHaveBeenCalledWith(
        mockReq.params.prisonNumber,
        '1',
        false,
        undefined,
      )
    })

    it('Should pass all arguments to render', async () => {
      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/holds/holds', {
        prisonNumber: mockReq.params.prisonNumber,
        holds: prisonerHolds,
        holdsBalance: mockHoldBalance,
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

    it('should call get holds balance', async () => {
      expect(prisonerFinanceHoldsService.getHoldsBalance).toHaveBeenCalledWith(mockReq.params.prisonNumber)
    })

    it('Should log Audit', async () => {
      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_HOLDS, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })
    })

    describe('hold type queries', () => {
      it('should call the getHolds service with WHF if in the query params', async () => {
        const whfReq = {
          id: 'req-id-123',
          params: { prisonNumber },
          protocol: 'http',
          get: jest.fn().mockReturnValue('localhost:3000'),
          originalUrl: '/audit',
          query: {
            page: '1',
            holdType: 'WHF',
          },
        } as unknown as Request

        await holdsController.getHolds(whfReq, mockRes, mockNext)
        expect(prisonerFinanceHoldsService.getHolds).toHaveBeenCalledWith(prisonNumber, '1', false, 'WHF')
      })

      it('should call the getHolds service with HOA if in the query params', async () => {
        const hoaReq = {
          id: 'req-id-123',
          params: { prisonNumber },
          protocol: 'http',
          get: jest.fn().mockReturnValue('localhost:3000'),
          originalUrl: '/audit',
          query: {
            page: '1',
            holdType: 'HOA',
          },
        } as unknown as Request

        await holdsController.getHolds(hoaReq, mockRes, mockNext)

        expect(prisonerFinanceHoldsService.getHolds).toHaveBeenCalledWith(prisonNumber, '1', false, 'HOA')
      })
      it('should call the getHolds service with undefined if no hold type in the query params', async () => {
        const allHoldsReq = {
          id: 'req-id-123',
          params: { prisonNumber },
          protocol: 'http',
          get: jest.fn().mockReturnValue('localhost:3000'),
          originalUrl: '/audit',
          query: {
            page: '1',
          },
        } as unknown as Request

        await holdsController.getHolds(allHoldsReq, mockRes, mockNext)

        expect(prisonerFinanceHoldsService.getHolds).toHaveBeenCalledWith(prisonNumber, '1', false, undefined)
      })
    })
  })
})
