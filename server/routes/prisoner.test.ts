import type { Express } from 'express'
import request from 'supertest'
import { PrisonerMoneyPermission, PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { appWithAllRoutes, user } from './testutils/appSetup'
import AuditService, { Page } from '../services/auditService'
import PrisonerFinanceService from '../services/prisonerFinanceService'
import PrisonerSearchService from '../services/prisonerSearchService'
import mockPermissions from './testutils/mockPermissions'

jest.mock('../services/prisonerFinanceService')
jest.mock('../services/prisonerSearchService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonPermissionsService = {} as unknown as PermissionsService

let app: Express

describe('Prisoners', () => {
  beforeEach(() => {
    mockPermissions(undefined, { [PrisonerMoneyPermission.read]: true })

    prisonerSearchService.getPrisoner.mockResolvedValue({
      firstName: 'BOB',
      lastName: 'TAYLOR',
    })

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerFinanceService,
        prisonPermissionsService,
        prisonerSearchService,
      },
      userSupplier: () => user,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('/prisoner/:prisonNumber/money', () => {
    const prisonNumber = 'A9971EC'
    it('should return a 200, render the correct page and call the audit service', async () => {
      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue([])
      prisonerFinanceService.getAccountBalance.mockResolvedValue({ accountId: '', balanceDateTime: '', amount: 1000 })

      const response = await request(app)
        .get(`/prisoner/${prisonNumber}/money`)
        .expect(200)
        .expect('Content-Type', /html/)

      expect(auditService.logPageView).toHaveBeenCalledWith(
        Page.PRISONER_MONEY,
        expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
      )
      expect(response.text).toContain("Bob Taylor's Transactions")
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      const error = Object.assign(new Error('Not Found'), { data: { status: 404, userMessage: 'Not Found' } })
      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockRejectedValue(error)
      const res = await request(app).get(`/prisoner/${prisonNumber}/money`).expect(404)
      expect(res.text).toContain(error.data.userMessage)
    })

    it('should handle API errors (e.g. 500)', async () => {
      const error = Object.assign(new Error('GL error'), { data: { status: 500, userMessage: 'GL Error' } })
      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockRejectedValue(error)
      const res = await request(app).get(`/prisoner/${prisonNumber}/money`).expect(500)
      expect(res.text).toContain(error.data.userMessage)
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      mockPermissions(undefined, { [PrisonerMoneyPermission.read]: false })

      app = appWithAllRoutes({
        services: { auditService, prisonerFinanceService, prisonPermissionsService, prisonerSearchService },
        userSupplier: () => user,
      })

      const response = await request(app).get('/prisoner/A1234BC/money')

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe('/sign-out')

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).not.toHaveBeenCalled()
    })
  })

  describe('/prisoner/:prisonNumber', () => {
    const prisonNumber = 'A9971EC'
    it('should return a 200, render the correct page and call the audit service', async () => {
      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue([])
      prisonerFinanceService.getSubAccountBalances.mockResolvedValue([
        { subAccountId: '', balanceDateTime: '', amount: 1 },
        { subAccountId: '', balanceDateTime: '', amount: 1 },
        { subAccountId: '', balanceDateTime: '', amount: 1 },
      ])

      await request(app).get(`/prisoner/${prisonNumber}`).expect(200).expect('Content-Type', /html/)

      expect(auditService.logPageView).toHaveBeenCalledWith(
        Page.PRISONER_PROFILE,
        expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
      )
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      const error = Object.assign(new Error('Not Found'), { data: { status: 404, userMessage: 'Not Found' } })
      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockRejectedValue(error)
      const res = await request(app).get(`/prisoner/${prisonNumber}`).expect(404)
      expect(res.text).toContain(error.data.userMessage)
    })

    it('should handle API errors (e.g. 500)', async () => {
      const error = Object.assign(new Error('GL error'), { data: { status: 500, userMessage: 'GL Error' } })
      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockRejectedValue(error)
      const res = await request(app).get(`/prisoner/${prisonNumber}`).expect(500)
      expect(res.text).toContain(error.data.userMessage)
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      mockPermissions(undefined, { [PrisonerMoneyPermission.read]: false })

      app = appWithAllRoutes({
        services: { auditService, prisonerFinanceService, prisonPermissionsService, prisonerSearchService },
        userSupplier: () => user,
      })

      const response = await request(app).get('/prisoner/A1234BC')

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe('/sign-out')

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).not.toHaveBeenCalled()
    })
  })
})
