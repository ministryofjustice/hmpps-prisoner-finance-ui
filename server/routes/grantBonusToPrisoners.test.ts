import { PermissionsService, PrisonerMoneyPermission } from '@ministryofjustice/hmpps-prison-permissions-lib'
import type { Express } from 'express'
import request from 'supertest'
import AuditService, { AuditPage } from '../services/auditService'
import PrisonerSearchService from '../services/prisonerSearchService'
import mockPermissions from './testutils/mockPermissions'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonApiService from '../services/prisonApiService'

jest.mock('../services/auditService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/prisonApiService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonPermissionsService = {} as unknown as PermissionsService
const prisonApiService = new PrisonApiService(null) as jest.Mocked<PrisonApiService>

let app: Express

describe('/grant-bonus-to-prisoners', () => {
  beforeEach(() => {
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
              AuditPage.GRANT_BONUS_CASELOAD,
              expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
            )
          })
      })
    })
  })
})
