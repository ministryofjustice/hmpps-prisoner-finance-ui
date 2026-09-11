import { Router, NextFunction, Request, Response } from 'express'
import PrisonerController from '../../../controllers/PrisonerController'
import { AuditPage } from '../../../services/auditService'
import { Services } from '../../../services'

export default function routes(services: Services): Router {
  const prisonerTransactionsRouter = Router({ mergeParams: true })
  const prisonerController = new PrisonerController(services)

  prisonerTransactionsRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.locals.auditPage = AuditPage.PRISONER_TRANSACTIONS
    return prisonerController.getTransactions(req, res, next)
  })

  prisonerTransactionsRouter.get('/private-cash', (req: Request, res: Response, next: NextFunction) => {
    res.locals.subAccount = 'CASH'
    res.locals.headerTitle = 'Private cash transactions'
    res.locals.auditPage = AuditPage.PRISONER_CASH_TRANSACTIONS
    return prisonerController.getTransactions(req, res, next)
  })

  prisonerTransactionsRouter.get('/spends', (req: Request, res: Response, next: NextFunction) => {
    res.locals.subAccount = 'SPENDS'
    res.locals.headerTitle = 'Spends transactions'
    res.locals.auditPage = AuditPage.PRISONER_SPENDS_TRANSACTIONS
    return prisonerController.getTransactions(req, res, next)
  })

  prisonerTransactionsRouter.get('/savings', (req: Request, res: Response, next: NextFunction) => {
    res.locals.subAccount = 'SAVINGS'
    res.locals.headerTitle = 'Savings transactions'
    res.locals.auditPage = AuditPage.PRISONER_SAVINGS_TRANSACTIONS
    return prisonerController.getTransactions(req, res, next)
  })

  return prisonerTransactionsRouter
}
