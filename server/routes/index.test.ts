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
        expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.INDEX, {
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

describe('data-warning-banner-enabled feature flag', () => {
  beforeEach(() => {
    auditService.logPageView.mockResolvedValue(undefined)
  })

  it('shows the data warning banner and hides the beta phase banner when the flag is enabled', () => {
    featureFlagService.isFeatureEnabled.mockImplementation(flag =>
      Promise.resolve(flag === 'data-warning-banner-enabled'),
    )

    return request(app)
      .get('/')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('data-qa="data-warning-banner"')
        expect(res.text).toContain('This is a test environment')
        expect(res.text).not.toContain('data-qa="phase-banner"')
      })
  })

  it('shows the beta phase banner and hides the data warning banner when the flag is disabled', () => {
    featureFlagService.isFeatureEnabled.mockImplementation(flag =>
      Promise.resolve(flag !== 'data-warning-banner-enabled'),
    )

    return request(app)
      .get('/')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('data-qa="phase-banner"')
        expect(res.text).toContain('This is a new service')
        expect(res.text).not.toContain('data-qa="data-warning-banner"')
      })
  })
})
