import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'

import { appWithAllRoutes, user } from '../testutils/appSetup'
import AuditService, { AuditPage } from '../../services/auditService'
import FeatureFlagService from '../../services/featureFlagService'

import HmppsAuditClient from '../../data/hmppsAuditClient'

jest.mock('../../services/auditService')
jest.mock('../../services/featureFlagService')

const auditService = new AuditService({} as HmppsAuditClient) as jest.Mocked<AuditService>
const featureFlagService = new FeatureFlagService() as jest.Mocked<FeatureFlagService>

let app: Express

beforeEach(() => {
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
  it('Should respond successfully', () => {
    return request(app).get('/').expect('Content-Type', /html/).expect(200)
  })

  it('Should only have one page heading', () => {
    return request(app)
      .get('/')
      .expect(res => {
        const $ = cheerio.load(res.text)
        const pageHeading = $('h1')
        expect(pageHeading).toHaveLength(1)
        expect(pageHeading.text().trim()).toBe('Prisoner Finance')
      })
  })

  it('Should layout its content full width', () => {
    return request(app)
      .get('/')
      .expect(res => {
        const $ = cheerio.load(res.text)
        const fullWidthContent = $('.govuk-grid-column-full')
        const twoThirdsContent = $('.govuk-grid-column-two-thirds')
        expect(fullWidthContent).toHaveLength(3)
        expect(twoThirdsContent).toHaveLength(0)
      })
  })

  it('Should display the view prisoner finances card', () => {
    return request(app)
      .get('/')
      .expect(res => {
        expect(res.text).toContain('View prisoner finances')
        expect(res.text).toContain("View transactions and balances for a prisoner's accounts.")
      })
  })

  it('Should not display the grant bonus to prisoners card', () => {
    return request(app)
      .get('/')
      .expect(res => {
        expect(res.text).not.toContain('Grant a bonus to prisoners')
        expect(res.text).not.toContain('Batch process a bonus grant to all prisoners in your caseload.')
      })
  })

  it('Should display the data warning banner', () => {
    return request(app)
      .get('/')
      .expect(res => {
        expect(res.text).toContain('This web page is for testing only.')
        expect(res.text).toContain(
          'The data you will see is the financial data of real prisoners, but may be inaccurate or incomplete.',
        )
      })
  })

  describe('When data warning banner feature is enabled', () => {
    beforeEach(() => {
      featureFlagService.isFeatureEnabled.mockImplementation((featureName: string) => {
        if (featureName === 'data-warning-banner-enabled') {
          return Promise.resolve(true)
        }
        return Promise.resolve(false)
      })
    })

    it('Should display only one data warning banner', () => {
      return request(app)
        .get('/')
        .expect(res => {
          const $ = cheerio.load(res.text)
          const dataWarningBanner = $('.data-warning-banner')
          expect(dataWarningBanner).toHaveLength(1)

          expect(res.text).toContain('This web page is for testing only.')
          expect(res.text).toContain(
            'The data you will see is the financial data of real prisoners, but may be inaccurate or incomplete.',
          )
        })
    })
  })

  describe('When grant bonus to prisoners feature is enabled', () => {
    beforeEach(() => {
      featureFlagService.isFeatureEnabled.mockImplementation((featureName: string) => {
        if (featureName === 'grant-bonus-to-prisoners-enabled') {
          return Promise.resolve(true)
        }
        return Promise.resolve(false)
      })
    })

    it('Should display two feature cards', async () => {
      return request(app)
        .get('/')
        .expect(res => {
          const $ = cheerio.load(res.text)
          const featureCards = $('.card')
          expect(featureCards).toHaveLength(2)
        })
    })

    it('Should display the grant bonus to prisoners card', async () => {
      return request(app)
        .get('/')
        .expect(res => {
          expect(res.text).toContain('Grant a bonus to prisoners')
          expect(res.text).toContain('Batch process a bonus grant to all prisoners in your caseload.')
        })
    })
  })

  describe('When grant bonus to prisoners feature is disabled', () => {
    beforeEach(() => {
      featureFlagService.isFeatureEnabled.mockImplementation((featureName: string) => {
        if (featureName === 'grant-bonus-to-prisoners-enabled') {
          return Promise.resolve(false)
        }
        return Promise.resolve(true)
      })
    })

    it('Should display only one feature card', () => {
      return request(app)
        .get('/')
        .expect(res => {
          const $ = cheerio.load(res.text)
          const featureCards = $('.card')
          expect(featureCards).toHaveLength(1)
        })
    })

    it('Should not display the grant bonus to prisoners card', () => {
      return request(app)
        .get('/')
        .expect(res => {
          const $ = cheerio.load(res.text)
          const body = $('body')
          expect(body.text().trim()).not.toContain('Grant a bonus to prisoners')
          expect(body.text().trim()).not.toContain('Batch process a bonus grant to all prisoners in your caseload.')
        })
    })
  })

  it('Should log the page view', async () => {
    return request(app)
      .get('/')
      .expect(_ => {
        expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_FINANCE_HOME, {
          who: user.username,
          correlationId: expect.any(String),
        })
      })
  })

  it('Should handle service errors', () => {
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
