import { Router, NextFunction, Request, Response } from 'express'
import PrisonerProfileController from '../../../controllers/prisoner/profile/prisonerProfileController'
import { AuditPage } from '../../../services/auditService'
import { Services } from '../../../services'

export default function routes(services: Services): Router {
  const prisonerProfileRouter = Router({ mergeParams: true })
  const prisonerProfileController = new PrisonerProfileController(services)

  prisonerProfileRouter.get('/:prisonNumber', (req: Request, res: Response, next: NextFunction) => {
    res.locals.headerTitle = 'Subscriptions'
    res.locals.auditPage = AuditPage.PRISONER_SUBSCRIPTIONS
    return prisonerProfileController.getProfile(req, res, next)
  })

  return prisonerProfileRouter
}
