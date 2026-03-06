import { NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import { Page } from '../services/auditService'

class PrisonerController {
  constructor(private readonly services: Services) {}

  public transactions = async (req: Request, res: Response, next: NextFunction) => {
    this.services.auditService.logPageView(Page.PRISONER_PRISONNUMBER_MONEY, {
      who: res.locals.user.username,
      correlationId: req.id,
    })


    res.render('pages/prisonerTransactions')
  }
}
