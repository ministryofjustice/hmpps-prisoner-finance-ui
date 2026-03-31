import createError from 'http-errors'
import { NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import { Page } from '../services/auditService'
import { buildMojSelectedFilter } from '../utils/mojFilterHelper'
import { formatValidationErrors, transactionsFilterSchema } from '../validators/transactionsFilterValidator'

const transactionFilterConfig = {
  startDate: { label: 'Start date', category: 'Date' },
  endDate: { label: 'End date', category: 'Date' },
}

class PrisonerController {
  constructor(private readonly services: Services) {}

  public getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prisonNumber = req.params.prisonNumber.toString()
      await this.services.auditService.logPageView(Page.PRISONER_MONEY, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const { startDate, endDate } = req.query as Record<string, string>

      const parseResult = transactionsFilterSchema.safeParse(req.query)

      let zodErrors = {}
      if (!parseResult.success) {
        zodErrors = formatValidationErrors(parseResult.error)
      }
      const selectedFilters = buildMojSelectedFilter(transactionFilterConfig, req.query)

      const transactionsPromise = parseResult.success
        ? this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber(prisonNumber, startDate, endDate)
        : Promise.resolve([])

      const [transactions, accountBalance] = await Promise.all([
        transactionsPromise,
        this.services.prisonerFinanceService.getAccountBalance(prisonNumber),
      ])

      res.render('pages/prisoner/transactions/prisonerTransactions', {
        prisonNumber,
        applicationName: 'Transactions',
        transactions,
        balance: accountBalance.amount,
        filters: {
          startDate,
          endDate,
          selectedFilters,
        },
        hasValidationErrors: !parseResult.success,
        ...zodErrors,
      })
    } catch (error) {
      next(createError(error?.data?.status || 500, error?.data?.userMessage || 'Internal Error'))
    }
  }

  public getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prisonNumber = req.params.prisonNumber.toString()
      await this.services.auditService.logPageView(Page.PRISONER_PROFILE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const [transactions, subAccountBalances] = await Promise.all([
        this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber(prisonNumber),
        this.services.prisonerFinanceService.getSubAccountBalances(prisonNumber),
      ])

      res.render('pages/prisoner/profile/prisonerProfile', {
        prisonNumber,
        transactions: transactions.slice(0, 5),
        subAccountBalances: {
          spends: subAccountBalances.SPENDS,
          privateCash: subAccountBalances.CASH,
          savings: subAccountBalances.SAVINGS,
        },
      })
    } catch (error) {
      next(createError(error?.data?.status || 500, error?.data?.userMessage || 'Internal Error'))
    }
  }
}

export default PrisonerController
