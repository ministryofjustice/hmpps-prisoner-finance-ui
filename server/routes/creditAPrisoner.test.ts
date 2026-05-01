import type { Express } from 'express'
import { PrisonerMoneyPermission, PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'

import request from 'supertest'
import AuditService, { AuditPage } from '../services/auditService'
import mockPermissions from './testutils/mockPermissions'
import { appWithAllRoutes, user } from './testutils/appSetup'

import PrisonerSearchService from '../services/prisonerSearchService'

jest.mock('../services/auditService')
jest.mock('../services/prisonerSearchService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonPermissionsService = {} as unknown as PermissionsService

let app: Express

describe('/credit-a-prisoner', () => {
  const prisonNumber = 'A9971EC'
  beforeEach(() => {
    mockPermissions(undefined, { [PrisonerMoneyPermission.read]: true })

    prisonerSearchService.getPrisoner.mockResolvedValue({
      firstName: 'BOB',
      lastName: 'TAYLOR',
      prisonerNumber: prisonNumber,
      prisonId: 'MDI',
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
    })

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonPermissionsService,
        prisonerSearchService,
      },
      userSupplier: () => user,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('/credit-to', () => {
    describe('GET', () => {
      it('Should log page view for credit-to page', async () => {
        return request(app)
          .get(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
          .expect('Content-Type', /html/)
          .expect(_ => {
            expect(auditService.logPageView).toHaveBeenCalledWith(
              AuditPage.CREDIT_TO,
              expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
            )
          })
      })
    })
  })
  describe('/credit-from', () => {
    describe('GET', () => {
      it('Should log page view for credit-from page', async () => {
        return request(app)
          .get(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)
          .expect(() => {
            expect(auditService.logPageView).toHaveBeenCalledWith(
              AuditPage.CREDIT_FROM,
              expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
            )
          })
      })
    })
  })
  describe('/credit-from', () => {
    describe('GET', () => {
      it('Should log page view for credit-from page', async () => {
        return request(app)
          .get(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)
          .expect(() => {
            expect(auditService.logPageView).toHaveBeenCalledWith(
              AuditPage.CREDIT_FROM,
              expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
            )
          })
      })
    })
  })
})
