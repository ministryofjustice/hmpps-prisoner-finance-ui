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
import PrisonerFinanceSubscriptionsService from '../../../services/prisonerFinanceSubscriptionsService'
import FeatureFlagService from '../../../services/featureFlagService'
import { PrisonerSubscriptionResponse } from '../../../interfaces/PrisonerSubscriptionResponse'
import { PrisonerSubscriptionSummaryResponse } from '../../../interfaces/PrisonerSubscriptionSummaryResponse'

jest.mock('../../../services/prisonerFinanceService')
jest.mock('../../../services/prisonerSearchService')
jest.mock('../../../services/prisonRegisterService')
jest.mock('../../../services/prisonApiService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../services/prisonerFinanceSubscriptionsService')

const featureFlagService = new FeatureFlagService() as jest.Mocked<FeatureFlagService>

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonPermissionsService = {} as unknown as PermissionsService
const prisonRegisterService = new PrisonRegisterService(null) as jest.Mocked<PrisonRegisterService>
const prisonApiService = new PrisonApiService(null) as jest.Mocked<PrisonApiService>
const prisonerFinanceSubscriptionsService = new PrisonerFinanceSubscriptionsService(
  null,
) as jest.Mocked<PrisonerFinanceSubscriptionsService>

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
        prisonerFinanceSubscriptionsService,
      },
      userSupplier: () => user,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const prisonNumber = 'A9971EC'

  const emptyPageSubscriptionsResponse: Page<PrisonerSubscriptionResponse> = {
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

  afterEach(() => {
    jest.resetAllMocks()
  })

  const verifySubscriptionsPageResponse = async (url: string, headerTitle: string, auditPage: AuditPage) => {
    prisonerFinanceSubscriptionsService.getSubscriptions.mockResolvedValue(emptyPageSubscriptionsResponse)
    prisonerFinanceSubscriptionsService.getSubscriptionsSummary.mockResolvedValue(summaryResponse)

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

  const verifyHoldsPageHandles500 = async (url: string, auditPage: AuditPage) => {
    const error = Object.assign(new Error('GL error'), { data: { status: 500, userMessage: 'Server Error' } })
    prisonerFinanceSubscriptionsService.getSubscriptions.mockRejectedValue(error)
    prisonerFinanceSubscriptionsService.getSubscriptionsSummary.mockRejectedValue(error)

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
        prisonerFinanceSubscriptionsService,
      },
      userSupplier: () => user,
    })

    const response = await request(app).get(url)

    expect(response.status).toBe(404)
  }

  describe('/prisoner/:prisonNumber/holds', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      await verifySubscriptionsPageResponse(
        `/prisoner/${prisonNumber}/subscriptions`,
        'Subscriptions',
        AuditPage.PRISONER_SUBSCRIPTIONS,
      )
    })

    it('should handle API errors (e.g. 500)', async () => {
      await verifyHoldsPageHandles500(`/prisoner/${prisonNumber}/subscriptions`, AuditPage.PRISONER_SUBSCRIPTIONS)
    })

    test('should return not found when user does not have permission', async () => {
      await verifyPageHandlesNotFoundOnPrisonerMoneyPermissionFalse(`/prisoner/${prisonNumber}/subscriptions`)
    })
  })
})
