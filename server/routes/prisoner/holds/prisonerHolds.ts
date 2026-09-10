import { Router, NextFunction, Request, Response } from 'express'
import PrisonerController from '../../../controllers/PrisonerController'
import { AuditPage } from '../../../services/auditService'
import { Services } from '../../../services'

export default function routes(services: Services): Router {
  const prisonerHoldsRouter = Router({ mergeParams: true })
  const prisonerController = new PrisonerController(services)

  prisonerHoldsRouter.use('/:prisonNumber/money/holds', (req, res, next) => {
    if (req.featureFlags.HOLDS_ENABLED === false) {
      return res.status(404).render('pages/not-found.njk')
    }
    return next()
  })

  prisonerHoldsRouter.get('/:prisonNumber/money/holds', (req: Request, res: Response, next: NextFunction) => {
    res.locals.headerTitle = 'Holds'
    res.locals.auditPage = AuditPage.PRISONER_HOLDS
    return prisonerController.getHolds(req, res, next)
  })

  return prisonerHoldsRouter
}
