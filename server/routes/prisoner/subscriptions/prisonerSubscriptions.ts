import { Router, NextFunction, Request, Response } from 'express'
import createError from 'http-errors'
import PrisonerController from '../../../controllers/PrisonerController'
import { AuditPage } from '../../../services/auditService'
import { Services } from '../../../services'

export default function routes(services: Services): Router {
  const prisonerSubscriptionsRouter = Router({ mergeParams: true })
  const prisonerController = new PrisonerController(services)

  prisonerSubscriptionsRouter.use('/subscriptions', (req, res, next) => {
    if (req.featureFlags.SUBSCRIPTIONS_ENABLED === false) {
      return next(createError(404, 'Not found'))
    }
    return next()
  })

  prisonerSubscriptionsRouter.get('/subscriptions', (req: Request, res: Response, next: NextFunction) => {
    res.locals.headerTitle = 'Subscriptions'
    res.locals.auditPage = AuditPage.PRISONER_SUBSCRIPTIONS
    return prisonerController.getSubscriptions(req, res, next)
  })

  return prisonerSubscriptionsRouter
}
