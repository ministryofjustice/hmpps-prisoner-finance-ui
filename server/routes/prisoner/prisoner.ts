import { Router, NextFunction, Request, Response } from 'express'
import { Services } from '../../services'
import PrisonerController from '../../controllers/PrisonerController'
import { getPrisonerData, populatePrisonerDetails } from '../../middleware/populatePrisonerDetails'
import getPrisonNames from '../../middleware/getPrisonNames'
import prisonerNotFoundHandler from '../../middleware/prisonerNotFoundHandler'
import creditAPrisonerRouter from '../creditAPrisoner/creditAPrisoner'
import { AuditPage } from '../../services/auditService'
import prisonerTransactionsRouter from './transactions/prisonerTransactions'

export default function routes(services: Services): Router {
  const prisonerRouter = Router()
  const prisonerController = new PrisonerController(services)

  prisonerRouter.get('/', prisonerController.getFindPrisoner)

  // default middlewares
  prisonerRouter.use(
    '/:prisonNumber',
    populatePrisonerDetails(services),
    getPrisonerData,
    getPrisonNames(services),
    prisonerNotFoundHandler,
  )

  prisonerRouter.use('/:prisonNumber/money', prisonerTransactionsRouter(services))

  prisonerRouter.use('/:prisonNumber/money/holds', (req, res, next) => {
    if (req.featureFlags.HOLDS_ENABLED === false) {
      return res.status(404).render('pages/not-found.njk')
    }
    return next()
  })

  prisonerRouter.get('/:prisonNumber/money/holds', (req: Request, res: Response, next: NextFunction) => {
    res.locals.headerTitle = 'Holds'
    res.locals.auditPage = AuditPage.PRISONER_HOLDS
    return prisonerController.getHolds(req, res, next)
  })

  prisonerRouter.get('/:prisonNumber', prisonerController.getProfile)

  prisonerRouter.use('/:prisonNumber/money/credit-a-prisoner', creditAPrisonerRouter(services))

  return prisonerRouter
}
