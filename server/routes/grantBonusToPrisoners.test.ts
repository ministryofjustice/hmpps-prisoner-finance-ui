import { PermissionsService, PrisonerMoneyPermission } from '@ministryofjustice/hmpps-prison-permissions-lib'
import type { Express } from 'express'
import request from 'supertest'
import AuditService, { AuditPage, SubjectType } from '../services/auditService'
import PrisonerSearchService from '../services/prisonerSearchService'
import mockPermissions from './testutils/mockPermissions'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonApiService from '../services/prisonApiService'
import FeatureFlagService from '../services/featureFlagService'

jest.mock('../services/auditService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/prisonApiService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonPermissionsService = {} as unknown as PermissionsService
const prisonApiService = new PrisonApiService(null) as jest.Mocked<PrisonApiService>
const featureFlagService = new FeatureFlagService() as jest.Mocked<FeatureFlagService>

let app: Express

describe('/grant-bonus-to-prisoners', () => {
  beforeEach(() => {
    featureFlagService.isFeatureEnabled.mockReturnValue(Promise.resolve(true))

    mockPermissions(undefined, { [PrisonerMoneyPermission.read]: true })

    prisonApiService.getUserCaseloads.mockResolvedValue([
      {
        caseLoadId: 'MDI',
        description: 'Moorland (HMP & YOI)',
        currentlyActive: true,
        caseloadFunction: 'test',
        type: 'test',
      },
      {
        caseLoadId: 'LPI',
        description: 'Liverpool',
        currentlyActive: false,
        caseloadFunction: 'test',
        type: 'test',
      },
      {
        caseLoadId: 'LEI',
        description: 'Leeds',
        currentlyActive: false,
        caseloadFunction: 'test',
        type: 'test',
      },
    ])

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonPermissionsService,
        prisonerSearchService,
        prisonApiService,
        featureFlagService,
      },
      session: {
        grantBonusForm: {
          caseloadId: 'MDI',
        },
      },
      userSupplier: () => user,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('/grant-bonus-to-prisoners', () => {
    describe('GET', () => {
      it('Should log page view for grant-bonus-to-prisoners page', async () => {
        return request(app)
          .get(`/grant-bonus-to-prisoners`)
          .expect('Content-Type', /html/)
          .expect(_ => {
            expect(auditService.logPageView).toHaveBeenCalledWith(
              AuditPage.GRANT_BONUS_WIZARD_SELECT_CASELOAD,
              expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
            )
          })
      })
    })
  })

  describe('/grant-bonus-to-prisoners/amount', () => {
    describe('GET', () => {
      it('Should log page view for grant-bonus-to-prisoners page', async () => {
        return request(app)
          .get(`/grant-bonus-to-prisoners/amount`)
          .expect('Content-Type', /html/)
          .expect(_ => {
            expect(auditService.logPageView).toHaveBeenCalledWith(
              AuditPage.GRANT_BONUS_WIZARD_SELECT_AMOUNT,
              expect.objectContaining({
                correlationId: expect.any(String),
                who: user.username,
                subjectId: 'MDI',
                subjectType: SubjectType.PRISON,
              }),
            )
          })
      })
    })
  })

  describe('/grant-bonus-to-prisoners/confirmation', () => {
    describe('GET', () => {
      it('Should log page view for grant-bonus-to-prisoners page', async () => {
        return request(app)
          .get(`/grant-bonus-to-prisoners/confirmation`)
          .expect('Content-Type', /html/)
          .expect(_ => {
            expect(auditService.logPageView).toHaveBeenCalledWith(
              AuditPage.GRANT_BONUS_WIZARD_CONFIRMATION,
              expect.objectContaining({
                correlationId: expect.any(String),
                who: user.username,
                subjectId: 'MDI',
                subjectType: SubjectType.PRISON,
              }),
            )
          })
      })
    })
  })
})
