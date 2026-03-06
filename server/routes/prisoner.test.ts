import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import AuditService from '../services/auditService'

jest.mock('../services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
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
    const response = await request(app)
      .get(`/prisoner/${prisonNumber}/money`)
      .expect(200)
      .expect('Content-Type', /html/)

    expect(auditService.logPageView).toHaveBeenCalledWith(
      'PRISONER_PRISONNUMBER_MONEY',
      expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
    )
    expect(response.text).toContain("Prisoner's Transactions")
  })
})
