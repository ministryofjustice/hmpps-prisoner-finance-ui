import { Router } from 'express'
import type { Services } from '../services'
import { AuditPage } from '../services/auditService'
import prisonerRouter from './prisoner'
import grantBonusRouter from './grantBonusToPrisoners'

export default function routes(services: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    await services.auditService.logPageView(AuditPage.PRISONER_FINANCE_HOME, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    const grantBonusEnabled = req.featureFlags.GRANT_BONUS_TO_PRISONERS_ENABLED

    res.render('pages/index', { grantBonusToPrisonersEnabled: grantBonusEnabled })
  })

  router.use('/prisoner', prisonerRouter(services))
  router.use('/grant-bonus-to-prisoners', grantBonusRouter(services))

  return router
}
