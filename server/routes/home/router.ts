import { Request, Response, Router } from 'express'
import { Services } from '../../services'
import { AuditPage } from '../../services/auditService'

export default function routes({ auditService }: Services): Router {
  const serviceHomePageRouter = Router({ mergeParams: true })

  serviceHomePageRouter.get('/', async (req: Request, res: Response) => {
    await auditService.logPageView(AuditPage.PRISONER_FINANCE_HOME, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    const grantBonusEnabled = req.featureFlags.GRANT_BONUS_TO_PRISONERS_ENABLED

    res.render('pages/serviceHomePage', { grantBonusToPrisonersEnabled: grantBonusEnabled })
  })

  return serviceHomePageRouter
}
