import type { Express } from 'express'
import request from 'supertest'
import { PrisonerMoneyPermission, PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import AuditService, { AuditPage, SubjectType } from '../../../services/auditService'
import PrisonerFinanceService from '../../../services/prisonerFinanceService'
import PrisonerSearchService from '../../../services/prisonerSearchService'
import mockPermissions from '../../testutils/mockPermissions'
import PrisonRegisterService from '../../../services/prisonRegisterService'
import { Page } from '../../../interfaces/Pageable'
import PrisonApiService from '../../../services/prisonApiService'
import PrisonerFinanceAdvancesService from '../../../services/prisonerFinanceAdvancesService'
import { PrisonerAdvanceResponse } from '../../../interfaces/PrisonerAdvanceResponse'
import FeatureFlagService from '../../../services/featureFlagService'
import { PrisonerAdvanceBalanceResponse } from '../../../interfaces/PrisonerAdvanceBalanceResponse'

jest.mock('../../../services/prisonerFinanceService')
jest.mock('../../../services/prisonerSearchService')
jest.mock('../../../services/prisonRegisterService')
jest.mock('../../../services/prisonApiService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../services/prisonerFinanceAdvancesService')

const featureFlagService = new FeatureFlagService() as jest.Mocked<FeatureFlagService>

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonPermissionsService = {} as unknown as PermissionsService
const prisonRegisterService = new PrisonRegisterService(null) as jest.Mocked<PrisonRegisterService>
const prisonApiService = new PrisonApiService(null) as jest.Mocked<PrisonApiService>
const prisonerFinanceAdvancesService = new PrisonerFinanceAdvancesService(
  null,
) as jest.Mocked<PrisonerFinanceAdvancesService>

let app: Express

describe('Prisoners', () => {
  beforeEach(() => {
    featureFlagService.isFeatureEnabled.mockReturnValue(Promise.resolve(true))

    mockPermissions(undefined, { [PrisonerMoneyPermission.read]: true })

    prisonerSearchService.getPrisoner.mockResolvedValue({
      firstName: 'BOB',
      lastName: 'TAYLOR',
      dateOfBirth: '1990-01-01',
      prisonerNumber: prisonNumber,
      prisonId: 'MDI',
      prisonName: 'Moorland (HMP & YOI)',
      status: 'ACTIVE IN',
      cellLocation: 'RECP',
      category: 'C',
      csra: 'Standard',
      currentIncentive: {
        level: {
          code: 'STD',
          description: 'Enhanced',
        },
      },
      bookingId: '123456',
    })

    const advanceBalances: PrisonerAdvanceBalanceResponse = {
      balanceDateTime: '',
      amount: 100,
      outstandingAmount: 10,
      weeklyAmount: 1,
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
    prisonerFinanceAdvancesService.getAdvanceBalances.mockResolvedValue(advanceBalances)

    prisonRegisterService.getPrisonNames.mockResolvedValue([{ prisonId: 'LEI', prisonName: 'Leeds (HMP)' }])

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerFinanceService,
        prisonPermissionsService,
        prisonerSearchService,
        prisonRegisterService,
        prisonApiService,
        featureFlagService,
        prisonerFinanceAdvancesService,
      },
      userSupplier: () => user,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const prisonNumber = 'A9971EC'

  const emptyPageAdvancesResponse: Page<PrisonerAdvanceResponse> = {
    content: [],
    totalElements: 0,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 99,
    isLastPage: true,
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  const verifyAdvancesPageResponse = async (url: string, headerTitle: string, auditPage: AuditPage) => {
    prisonerFinanceAdvancesService.getAdvances.mockResolvedValue(emptyPageAdvancesResponse)

    const response = await request(app).get(url).expect(200).expect('Content-Type', /html/)

    expect(auditService.logPageView).toHaveBeenCalledWith(
      auditPage,
      expect.objectContaining({
        correlationId: expect.any(String),
        who: user.username,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      }),
    )
    expect(response.text).toContain(headerTitle)
  }

  const verifyAdvancesPageHandles500 = async (url: string, auditPage: AuditPage) => {
    const error = Object.assign(new Error('GL error'), { data: { status: 500, userMessage: 'GL Error' } })
    prisonerFinanceAdvancesService.getAdvances.mockRejectedValue(error)
    const res = await request(app).get(url).expect(500)
    expect(res.text).toContain('Sorry, there is a problem with the service')

    expect(auditService.logPageView).toHaveBeenCalledWith(
      auditPage,
      expect.objectContaining({
        correlationId: expect.any(String),
        who: user.username,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      }),
    )
    expect(res.text).not.toContain(prisonNumber)
  }

  const verifyPageHandlesNotFoundOnPrisonerMoneyPermissionFalse = async (url: string) => {
    mockPermissions(undefined, { [PrisonerMoneyPermission.read]: false })

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerFinanceService,
        prisonPermissionsService,
        prisonerSearchService,
        prisonApiService,
        featureFlagService,
      },
      userSupplier: () => user,
    })

    const response = await request(app).get(url)

    expect(response.status).toBe(404)
  }

  describe('/prisoner/:prisonNumber/money/advances', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      await verifyAdvancesPageResponse(
        `/prisoner/${prisonNumber}/money/advances`,
        'Advances',
        AuditPage.PRISONER_ADVANCES,
      )
    })

    it('should handle API errors (e.g. 500)', async () => {
      await verifyAdvancesPageHandles500(`/prisoner/${prisonNumber}/money/advances`, AuditPage.PRISONER_ADVANCES)
    })

    test('should return not found when user does not have permission', async () => {
      await verifyPageHandlesNotFoundOnPrisonerMoneyPermissionFalse('/prisoner/A1234BC/money/advances')
    })
  })
})
