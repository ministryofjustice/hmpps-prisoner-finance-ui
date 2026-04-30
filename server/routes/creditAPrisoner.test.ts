import type { Express } from 'express'
import { PrisonerMoneyPermission, PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'

import signature from 'cookie-signature'
import request from 'supertest'
import AuditService, { AuditPage } from '../services/auditService'
import mockPermissions from './testutils/mockPermissions'
import { appWithAllRoutes, user } from './testutils/appSetup'
import config from '../config'

import CreditAPrisonerService from '../services/creditAPrisonerService'
import PrisonerSearchService from '../services/prisonerSearchService'
import ExpressSessionAdapter from './store/expressSessionAdapter'
import InMemoryStore from './store/inMemoryStore'
import CreditAPrisonerForm from '../classes/creditAPrisonerForm'

jest.mock('../services/auditService')
jest.mock('../services/prisonerSearchService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonPermissionsService = {} as unknown as PermissionsService
const expressSessionAdapter = new ExpressSessionAdapter(new InMemoryStore()) as jest.Mocked<ExpressSessionAdapter>

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

  async function createCookieForSession(formData: CreditAPrisonerForm) {
    const fakeSessionId = 'test-session-999'
    const { secret } = config.session

    // 2. Seed your in-memory store directly!
    // We bypass Express entirely and write straight to the adapter
    await new Promise(resolve => {
      expressSessionAdapter.set(
        fakeSessionId,
        {
          cookie: { originalMaxAge: 86400000 },
          returnTo: '',
          creditForm: formData, // The specific state you want to test
        },
        resolve,
      )
    })

    // 3. Cryptographically sign the cookie exactly how express-session does it
    // express-session strictly requires the "s:" prefix to know it's a signed cookie
    const signedCookieValue = `s:${signature.sign(fakeSessionId, secret)}`
    return `connect.sid=${signedCookieValue}`
  }

  describe('/credit-to', () => {
    describe('GET', () => {
      it('Should log page view for credit-to page and render the page', async () => {
        return request(app)
          .get(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
          .expect('Content-Type', /html/)
          .expect(200)
          .expect(res => {
            expect(res.text).toContain('Credit to')
            expect(auditService.logPageView).toHaveBeenCalledWith(
              AuditPage.CREDIT_TO,
              expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
            )
          })
      })

      it('calls the credit a prisoner service and creates a credit a prisoner form if one does not exist', async () => {
        const createACreditFormSpy = jest.spyOn(CreditAPrisonerService, 'createCreditForm')

        const cookie = await createCookieForSession({})

        const response = await request(app)
          .get(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
          .set('Cookie', [cookie])
          .expect(200)

        expect(createACreditFormSpy).toHaveBeenCalledTimes(1)
        expect(response.text).toContain('Credit to')
      })
    })
  })
  describe('/credit-from', () => {
    describe('GET', () => {
      it('Should log page view for credit-from page', async () => {
        return request(app)
          .get(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)
          .expect(302) // this will be redirected back to credit-to as you don't have previous form data - however, audits should still be kept
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
