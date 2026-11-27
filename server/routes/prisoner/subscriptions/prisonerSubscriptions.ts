import { Router, NextFunction, Request, Response } from 'express'
import createError from 'http-errors'
import SubscriptionController from '../../../controllers/prisoner/subscriptions/subscriptionsController'
import { AuditPage } from '../../../services/auditService'
import { Services } from '../../../services'

export default function routes(services: Services): Router {
  const prisonerSubscriptionsRouter = Router({ mergeParams: true })
  const subscriptionController = new SubscriptionController(services)

  prisonerSubscriptionsRouter.use('/subscriptions', (req, res, next) => {
    if (req.featureFlags.SUBSCRIPTIONS_ENABLED === false) {
      return next(createError(404, 'Not found'))
    }
    return next()
  })

  prisonerSubscriptionsRouter.get('/subscriptions', (req: Request, res: Response, next: NextFunction) => {
    res.locals.headerTitle = 'Subscriptions'
    res.locals.auditPage = AuditPage.PRISONER_SUBSCRIPTIONS
    return subscriptionController.getSubscriptions(req, res, next)
  })

  return prisonerSubscriptionsRouter
}
