import { Router, NextFunction, Request, Response } from 'express'
import createError from 'http-errors'
import PrisonerController from '../../../controllers/PrisonerController'
import { AuditPage } from '../../../services/auditService'
import { Services } from '../../../services'

export default function routes(services: Services): Router {
  const prisonerHoldsRouter = Router({ mergeParams: true })
  const prisonerController = new PrisonerController(services)

  prisonerHoldsRouter.use('/holds', (req, res, next) => {
    if (req.featureFlags.HOLDS_ENABLED === false) {
      return next(createError(404, 'Not found'))
    }
    return next()
  })

  prisonerHoldsRouter.get('/holds', (req: Request, res: Response, next: NextFunction) => {
    res.locals.headerTitle = 'Holds'
    res.locals.auditPage = AuditPage.PRISONER_HOLDS
    return prisonerController.getHolds(req, res, next)
  })

  return prisonerHoldsRouter
}
