import type { Express, Request, Response } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './routes/testutils/appSetup'
import createErrorHandler from './errorHandler'
import AuditService from './services/auditService'

jest.mock('./services/auditService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  it('should render the Page not found page', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
        expect(res.text).toContain('If you typed the web address, check it is correct.')
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

describe('Shows 500 page for unhandled error', () => {
  it('should render stacktrace when not production', () => {
    auditService.logPageView.mockRejectedValue(Error('boom'))

    return request(appWithAllRoutes({ production: false, services: { auditService } }))
      .get('/')
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('boom')
        expect(res.text).toContain('Status:')
        expect(res.text).toContain('Message:')
        expect(res.text).toContain('StackTrace:')
      })
  })

  it('should not render stacktrace when in production', () => {
    auditService.logPageView.mockRejectedValue(Error('boom'))

    return request(appWithAllRoutes({ production: true, services: { auditService } }))
      .get('/')
      .expect(500)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('boom')
        expect(res.text).not.toContain('Status:')
        expect(res.text).not.toContain('Message:')
        expect(res.text).not.toContain('StackTrace:')
      })
  })
})

describe('status resolution', () => {
  const buildRes = () =>
    ({ locals: {}, status: jest.fn(), render: jest.fn(), redirect: jest.fn() }) as unknown as Response

  it('renders the Page not found page for a hmpps-rest-client 404 exposed as responseStatus', () => {
    const res = buildRes()
    const next = jest.fn()

    createErrorHandler(false)({ responseStatus: 404 } as never, { originalUrl: '/x' } as Request, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.render).toHaveBeenCalledWith('pages/not-found')
    expect(next).not.toHaveBeenCalled()
  })
})
