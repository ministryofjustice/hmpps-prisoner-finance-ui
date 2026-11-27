import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import e, { Request, Response } from 'express'
import { ApplicationInfo } from '../../../applicationInfo'
import AuditService, { AuditPage, SearchRequest, SubjectType } from '../../../services/auditService'
import PrisonerFinanceService from '../../../services/prisonerFinanceService'
import PrisonRegisterService from '../../../services/prisonRegisterService'
import FindPrisonerController from './findPrisonerController'
import PrisonerSearchService from '../../../services/prisonerSearchService'
import PrisonApiService from '../../../services/prisonApiService'
import FeatureFlagService from '../../../services/featureFlagService'
import PrisonerFinanceHoldsService from '../../../services/prisonerFinanceHoldsService'
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

describe('FindPrisonerController', () => {
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

  const findPrisonerController: FindPrisonerController = new FindPrisonerController({
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

      await findPrisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(auditService.logSearchRequest).toHaveBeenCalledWith(SearchRequest.FIND_PRISONER, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.SEARCH_TERM,
        subjectId: prisonNumber,
      })
    })

    it('Should get caseloads and match prisoners', async () => {
      const mockReq = { query: { term: 'ABC123XX' } } as unknown as Request

      await findPrisonerController.getFindPrisoner(mockReq, mockRes, mockNext)
      expect(prisonApiService.getUserCaseloads).toHaveBeenCalled()
      expect(prisonerSearchService.getPrisonersBySearchTerm).toHaveBeenLastCalledWith('ASI', 'ABC123XX', '0')

      expect(mockRes.render).toHaveBeenCalled()
    })

    it('Should trim the entered search request before search', async () => {
      const mockReq = { query: { term: ' ABC123XX ' } } as unknown as Request

      await findPrisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(prisonerSearchService.getPrisonersBySearchTerm).toHaveBeenLastCalledWith('ASI', 'ABC123XX', '0')
    })

    it('Should render the find page without calling the API when no search term is entered', async () => {
      const mockReq = { query: {} } as unknown as Request

      await findPrisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(prisonerSearchService.getPrisonersBySearchTerm).not.toHaveBeenCalled()

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/find/find', {
        currentCaseload: 'Ashfield (HMP)',
      })
    })

    it('Should render the find page with an error when the search term an empty string', async () => {
      const mockReq = { query: { term: '   ' } } as unknown as Request

      await findPrisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

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
})
