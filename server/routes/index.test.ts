import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import AuditService, { AuditPage } from '../services/auditService'
import FeatureFlagService from '../services/featureFlagService'

import HmppsAuditClient from '../data/hmppsAuditClient'

jest.mock('../services/auditService')
jest.mock('../services/featureFlagService')

const auditService = new AuditService({} as HmppsAuditClient) as jest.Mocked<AuditService>
const featureFlagService = new FeatureFlagService() as jest.Mocked<FeatureFlagService>

let app: Express

beforeEach(() => {
  featureFlagService.isFeatureEnabled.mockReturnValue(Promise.resolve(true))

  app = appWithAllRoutes({
    services: {
      auditService,
      featureFlagService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    auditService.logPageView.mockResolvedValue(undefined)

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(_ => {
        expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_FINANCE_HOME, {
          who: user.username,
          correlationId: expect.any(String),
        })
      })
  })

  it('service errors are handled', () => {
    auditService.logPageView.mockRejectedValue(new Error('Some problem calling external api!'))
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(500)
      .expect(res => {
        expect(res.text).toContain('Some problem calling external api!')
      })
  })
})
