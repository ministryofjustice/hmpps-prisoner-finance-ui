import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import AuditService, { Page } from '../services/auditService'
import PrisonerFinanceService from '../services/prisonerFinanceService'

jest.mock('../services/prisonerFinanceService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerFinanceService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/prisoner', () => {
  const prisonNumber = 'A9971EC'
  it('should return a 200, render the correct page and call the audit service', async () => {
    prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue([])

    const response = await request(app)
      .get(`/prisoner/${prisonNumber}/money`)
      .expect(200)
      .expect('Content-Type', /html/)

    expect(auditService.logPageView).toHaveBeenCalledWith(
      Page.PRISONER_MONEY,
      expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
    )
    expect(response.text).toContain("Prisoner's Transactions")
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
})
