import type { Express, Request, Response } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './routes/testutils/appSetup'
import createErrorHandler from './errorHandler'
import logger from '../logger'
import AuditService from './services/auditService'
import FeatureFlagService from './services/featureFlagService'
import HmppsAuditClient from './data/hmppsAuditClient'

jest.mock('./services/auditService')
jest.mock('./services/featureFlagService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  it('should render the Page not found page in dev mode without leaking a stack trace', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
        expect(res.text).toContain('If you typed the web address, check it is correct.')
        expect(res.text).not.toContain('NotFoundError: Not Found')
        expect(res.text).not.toContain('Something went wrong. The error has been logged. Please try again')
      })
  })

  it('should render the Page not found page in production mode', () => {
    return request(appWithAllRoutes({ production: true }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
        expect(res.text).toContain('If you typed the web address, check it is correct.')
        expect(res.text).not.toContain('NotFoundError: Not Found')
        expect(res.text).not.toContain('Something went wrong. The error has been logged. Please try again')
      })
  })

  it('does not trigger an HMPPS audit event when rendering the 404 page', async () => {
    await request(appWithAllRoutes({ services: { auditService } }))
      .get('/unknown')
      .expect(404)

    expect(auditService.logPageView).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})

describe('server errors (>= 500)', () => {
  // `status` returns `res` in Express, so mirror that or chained calls silently break only in tests.
  const buildRes = () =>
    ({
      locals: {},
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      redirect: jest.fn(),
    }) as unknown as Response

  const handle = (error: unknown, production = true) => {
    const res = buildRes()
    const next = jest.fn()
    createErrorHandler(production)(error as never, { originalUrl: '/x' } as Request, res, next)
    return { res, next }
  }

  let loggerErrorSpy: jest.SpyInstance

  beforeEach(() => {
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined as never)
    jest.spyOn(logger, 'info').mockImplementation(() => undefined as never)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the friendly 500 page and logs full details for an unhandled exception', () => {
    const error = new Error('boom')
    const { res, next } = handle(error)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.render).toHaveBeenCalledWith('pages/internal-server-error')
    expect(res.redirect).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()

    expect(loggerErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error handling request for '/x'"), error)
  })

  it('logs the underlying cause so the upstream response detail is not lost', () => {
    const cause = Object.assign(new Error('Internal Server Error'), {
      responseStatus: 500,
      text: '{"status":500,"userMessage":"GL Error"}',
      data: { status: 500, userMessage: 'GL Error' },
    })
    const wrapped = Object.assign(new Error('GL Error'), { status: 500, cause })

    handle(wrapped)

    expect(loggerErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Caused by upstream error for '/x'"), cause)
  })

  it('renders the friendly 500 page for an upstream 5xx error, preserving the status code', () => {
    const { res } = handle({ status: 502, message: 'Bad Gateway' })

    expect(res.status).toHaveBeenCalledWith(502)
    expect(res.render).toHaveBeenCalledWith('pages/internal-server-error')
  })

  it('clears prisoner details so the generic 500 page cannot leak prisoner information', () => {
    const res = buildRes()
    res.locals.prisonerDetails = { firstName: 'BOB', lastName: 'TAYLOR', prisonerNumber: 'A9971EC' }

    createErrorHandler(true)(new Error('boom') as never, { originalUrl: '/x' } as Request, res, jest.fn())

    expect(res.locals.prisonerDetails).toBeNull()
    expect(res.render).toHaveBeenCalledWith('pages/internal-server-error')
  })

  it('does not render the 500 page for a hmpps-rest-client 4xx error exposed as responseStatus', () => {
    const { res } = handle({ responseStatus: 404 })

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.render).toHaveBeenCalledWith('pages/not-found')
    expect(res.render).not.toHaveBeenCalledWith('pages/internal-server-error')
  })

  it.each([0, NaN])('falls back to 500 for an unusable status code (%p)', invalidStatus => {
    const { res } = handle({ status: invalidStatus })

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.render).toHaveBeenCalledWith('pages/internal-server-error')
  })
})

describe('authentication errors', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined as never)
    jest.spyOn(logger, 'info').mockImplementation(() => undefined as never)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const buildRes = () =>
    ({
      locals: {},
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      redirect: jest.fn(),
    }) as unknown as Response

  it.each([
    ['http-errors status', { status: 401 }],
    ['http-errors status', { status: 403 }],
    ['hmpps-rest-client responseStatus', { responseStatus: 401 }],
    ['hmpps-rest-client responseStatus', { responseStatus: 403 }],
  ])('redirects to sign-out for a %s of %p', (_label, error) => {
    const res = buildRes()

    createErrorHandler(true)(error as never, { originalUrl: '/x' } as Request, res, jest.fn())

    expect(res.redirect).toHaveBeenCalledWith('/sign-out')
    expect(res.render).not.toHaveBeenCalled()
  })
})

describe('500 page rendering', () => {
  const appWithFailingHomePage = (production: boolean): Express => {
    const featureFlagService = new FeatureFlagService() as jest.Mocked<FeatureFlagService>

    featureFlagService.isFeatureEnabled.mockResolvedValue(true)
    auditService.logPageView.mockRejectedValue(new Error('Some problem calling external api!'))

    return appWithAllRoutes({ production, services: { auditService, featureFlagService }, userSupplier: () => user })
  }

  it.each([
    ['development', false],
    ['production', true],
  ])('renders the real template with no technical details in %s', async (_label, production) => {
    const res = await request(appWithFailingHomePage(production)).get('/').expect(500).expect('Content-Type', /html/)

    expect(res.text).toContain('Sorry, there is a problem with the service')
    expect(res.text).toContain('Try again later.')
    expect(res.text).toContain('Go to the Prisoner Finance home page')

    expect(res.text).not.toContain('Your work has not been saved')
    expect(res.text).not.toContain('Some problem calling external api!')
    expect(res.text).not.toContain('error-page-stack')
    expect(res.text).not.toContain('at Object')
  })

  it('offers a home page link rather than a back link', async () => {
    const res = await request(appWithFailingHomePage(true)).get('/').expect(500)

    expect(res.text).toContain('data-testid="internal-server-error-home-link"')
    expect(res.text).not.toContain('govuk-back-link')
  })
})
