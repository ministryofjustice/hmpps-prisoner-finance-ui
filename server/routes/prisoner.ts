import { Router, NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import PrisonerController from '../controllers/PrisonerController'
import { getPrisonerData, populatePrisonerDetails } from '../middleware/populatePrisonerDetails'
import getPrisonNames from '../middleware/getPrisonNames'
import prisonerNotFoundHandler from '../middleware/prisonerNotFoundHandler'
import creditAPrisonerRouter from './creditAPrisoner'
import { AuditPage } from '../services/auditService'

export default function routes(services: Services): Router {
  const prisonerRouter = Router()
  const prisonerController = new PrisonerController(services)

  prisonerRouter.get('/', prisonerController.getFindPrisoner)

  prisonerRouter.post('/', prisonerController.postFindPrisoner)

  prisonerRouter.get(
    '/:prisonNumber/money',
    populatePrisonerDetails(services),
    getPrisonerData,
    getPrisonNames(services),
    (req: Request, res: Response, next: NextFunction) => {
      res.locals.auditPage = AuditPage.PRISONER_TRANSACTIONS
      return prisonerController.getTransactions(req, res, next)
    },
  )

  prisonerRouter.get(
    '/:prisonNumber/money/private-cash',
    populatePrisonerDetails(services),
    getPrisonerData,
    getPrisonNames(services),
    (req: Request, res: Response, next: NextFunction) => {
      res.locals.subAccount = 'CASH'
      res.locals.headerTitle = 'Private cash transactions'
      res.locals.auditPage = AuditPage.PRISONER_CASH_TRANSACTIONS
      return prisonerController.getTransactions(req, res, next)
    },
  )

  prisonerRouter.get(
    '/:prisonNumber/money/spends',
    populatePrisonerDetails(services),
    getPrisonerData,
    getPrisonNames(services),
    (req: Request, res: Response, next: NextFunction) => {
      res.locals.subAccount = 'SPENDS'
      res.locals.headerTitle = 'Spends transactions'
      res.locals.auditPage = AuditPage.PRISONER_SPENDS_TRANSACTIONS
      return prisonerController.getTransactions(req, res, next)
    },
  )

  prisonerRouter.get(
    '/:prisonNumber/money/savings',
    populatePrisonerDetails(services),
    getPrisonerData,
    getPrisonNames(services),
    (req: Request, res: Response, next: NextFunction) => {
      res.locals.subAccount = 'SAVINGS'
      res.locals.headerTitle = 'Savings transactions'
      res.locals.auditPage = AuditPage.PRISONER_SAVINGS_TRANSACTIONS
      return prisonerController.getTransactions(req, res, next)
    },
  )

  prisonerRouter.get(
    '/:prisonNumber',
    populatePrisonerDetails(services),
    getPrisonerData,
    prisonerController.getProfile,
    prisonerNotFoundHandler,
  )

  prisonerRouter.use('/:prisonNumber/money/credit-a-prisoner', creditAPrisonerRouter(services))

  return prisonerRouter
}
