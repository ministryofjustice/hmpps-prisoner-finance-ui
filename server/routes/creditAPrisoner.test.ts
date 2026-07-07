import type { Express } from 'express'
import { PrisonerMoneyPermission, PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'

import request from 'supertest'
import AuditService, { AuditPage, SubjectType } from '../services/auditService'
import mockPermissions from './testutils/mockPermissions'
import { appWithAllRoutes, user } from './testutils/appSetup'

import PrisonerSearchService from '../services/prisonerSearchService'
import FeatureFlagService from '../services/featureFlagService'

jest.mock('../services/auditService')
jest.mock('../services/prisonerSearchService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonPermissionsService = {} as unknown as PermissionsService
const featureFlagService = new FeatureFlagService() as jest.Mocked<FeatureFlagService>

let app: Express

describe('/credit-a-prisoner', () => {
  const prisonNumber = 'A9971EC'
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
    })

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonPermissionsService,
        prisonerSearchService,
        featureFlagService,
      },
      userSupplier: () => user,
      session: { creditForm: { creditSubAccountId: 'ID', prisonerAccountReference: prisonNumber } },
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
              AuditPage.CREDIT_A_PRISONER_WIZARD_TO,
              expect.objectContaining({
                correlationId: expect.any(String),
                who: user.username,
                subjectType: SubjectType.PRISONER,
                subjectId: prisonNumber,
              }),
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
              AuditPage.CREDIT_A_PRISONER_WIZARD_FROM,
              expect.objectContaining({
                correlationId: expect.any(String),
                who: user.username,
                subjectType: SubjectType.PRISONER,
                subjectId: prisonNumber,
              }),
            )
          })
      })
    })
  })
  describe('/credit-amount', () => {
    describe('GET', () => {
      it('Should log page view for credit-amount page', async () => {
        return request(app)
          .get(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)
          .expect(() => {
            expect(auditService.logPageView).toHaveBeenCalledWith(
              AuditPage.CREDIT_A_PRISONER_WIZARD_AMOUNT,
              expect.objectContaining({
                correlationId: expect.any(String),
                who: user.username,
                subjectType: SubjectType.PRISONER,
                subjectId: prisonNumber,
              }),
            )
          })
      })
    })
  })
  describe('/credit-confirmation', () => {
    describe('GET', () => {
      it('Should log page view for credit-confirmation page', async () => {
        return request(app)
          .get(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-confirmation`)
          .expect(() => {
            expect(auditService.logPageView).toHaveBeenCalledWith(
              AuditPage.CREDIT_A_PRISONER_WIZARD_CONFIRMATION,
              expect.objectContaining({
                correlationId: expect.any(String),
                who: user.username,
                subjectType: SubjectType.PRISONER,
                subjectId: prisonNumber,
              }),
            )
          })
      })
    })
  })
})
