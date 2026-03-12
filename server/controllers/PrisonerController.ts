import createError from 'http-errors'
import { NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import { Page } from '../services/auditService'

class PrisonerController {
  constructor(private readonly services: Services) {}

  public transactions = async (req: Request, res: Response, next: NextFunction) => {
    await this.services.auditService.logPageView(Page.PRISONER_MONEY, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    try {
      const [transactions, accountBalance] = await Promise.all([
        this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber(req.params.prisonNumber as string),
        this.services.prisonerFinanceService.getAccountBalance(req.params.prisonNumber as string),
      ])

      res.render('pages/prisoner/transactions/prisonerTransactions', {
        applicationName: 'Transactions',
        transactions,
        balance: accountBalance.amount,
      })
    } catch (error) {
      next(createError(error?.data?.status || 500, error?.data?.userMessage || 'Internal Error'))
    }
  }

  public profile = async (req: Request, res: Response, next: NextFunction) => {
    await this.services.auditService.logPageView(Page.PRISONER_PROFILE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    try {
      const [transactions] = await Promise.all([
        this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber(req.params.prisonNumber as string),
        // this.services.prisonerFinanceService.getAccountBalance(req.params.prisonNumber as string),
      ])

      res.render('pages/prisoner/profile/prisonerProfile', {
        transactions,
      })
    } catch (error) {
      next(createError(error?.data?.status || 500, error?.data?.userMessage || 'Internal Error'))
    }
  }
}

export default PrisonerController
