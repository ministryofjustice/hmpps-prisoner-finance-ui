import { Router, NextFunction, Request, Response } from 'express'
import createError from 'http-errors'
import AdvancesController from '../../../controllers/prisoner/advances/advancesController'
import { AuditPage } from '../../../services/auditService'
import { Services } from '../../../services'

export default function routes(services: Services): Router {
  const prisonerAdvancesRouter = Router({ mergeParams: true })
  const advancesController = new AdvancesController(services)

  prisonerAdvancesRouter.use('/advances', (req, res, next) => {
    if (req.featureFlags.ADVANCES_ENABLED === false) {
      return next(createError(404, 'Not found'))
    }
    return next()
  })

  prisonerAdvancesRouter.get('/advances/:advanceId', (req: Request, res: Response, next: NextFunction) => {
    res.locals.headerTitle = 'Advance detail'
    res.locals.auditPage = AuditPage.PRISONER_ADVANCE_DETAIL
    return advancesController.getAdvanceDetail(req, res, next)
  })

  prisonerAdvancesRouter.get('/advances', (req: Request, res: Response, next: NextFunction) => {
    res.locals.headerTitle = 'Advances'
    res.locals.auditPage = AuditPage.PRISONER_ADVANCES
    return advancesController.getAdvances(req, res, next)
  })

  return prisonerAdvancesRouter
}
