import express, { Express } from 'express'
import { NotFound } from 'http-errors'

import { randomUUID } from 'crypto'
import { Session } from 'express-session'
import routes from '../index'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import type { Services } from '../../services'
import AuditService from '../../services/auditService'
import { HmppsUser } from '../../interfaces/hmppsUser'
import setUpWebSession from '../../middleware/setUpWebSession'
import HmppsAuditClient from '../../data/hmppsAuditClient'
import FeatureFlagService from '../../services/featureFlagService'
import setUpFeatureFlags from '../../middleware/setUpFeatureFlags'

jest.mock('../../services/auditService')
jest.mock('../../services/featureFlagService')

export const user: HmppsUser = {
  name: 'FIRST LAST',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  authSource: 'nomis',
  staffId: 1234,
  userRoles: [],
}

export const flashProvider = jest.fn()

function appSetup(
  services: Services,
  production: boolean,
  userSupplier: () => HmppsUser,
  session?: Record<string, unknown>,
): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app)
  if (!session) {
    app.use(setUpWebSession())
  }
  app.use((req, res, next) => {
    req.user = userSupplier() as Express.User
    req.flash = flashProvider
    if (session) {
      // immutable test dependency injection for when session is required
      const sessionCopy = structuredClone(session)
      req.session = {
        ...sessionCopy,
        save: jest.fn(cb => cb && cb()),
        destroy: jest.fn(cb => cb && cb()),
        regenerate: jest.fn(cb => cb && cb()),
        reload: jest.fn(cb => cb && cb()),
      } as unknown as Session
    }
    res.locals = {
      user: { ...req.user } as HmppsUser,
      cspNonce: '',
      csrfToken: '',
      asset_path: '',
      applicationName: '',
      environmentName: '',
      environmentNameColour: '',
    }
    next()
  })
  // Runs after res.locals is initialised (mirrors app.ts) so locals it sets survive.
  app.use(setUpFeatureFlags(services.featureFlagService))
  app.use((req, _res, next) => {
    req.id = randomUUID()
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(routes(services))
  app.use((_req, _res, next) => next(new NotFound()))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {
    auditService: new AuditService({} as HmppsAuditClient) as jest.Mocked<AuditService>,
    featureFlagService: new FeatureFlagService() as jest.Mocked<FeatureFlagService>,
  },
  userSupplier = () => user,
  session = null,
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => HmppsUser
  session?: Record<string, unknown>
}): Express {
  return appSetup(services as Services, production, userSupplier, session)
}
