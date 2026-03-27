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

  public transactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
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

      const [transactions, accountBalance] = await Promise.all([
        parseResult.success
          ? this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber(
              req.params.prisonNumber as string,
              startDate,
              endDate,
            )
          : Promise.resolve([]),

        this.services.prisonerFinanceService.getAccountBalance(req.params.prisonNumber as string),
      ])

      res.render('pages/prisoner/transactions/prisonerTransactions', {
        prisonNumber: req.params.prisonNumber as string,
        applicationName: 'Transactions',
        transactions,
        balance: accountBalance.amount,
        filters: {
          startDate,
          endDate,
          selectedFilters,
        },
        ...zodErrors,
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
      const [transactions, subAccountBalances] = await Promise.all([
        this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber(req.params.prisonNumber as string),
        this.services.prisonerFinanceService.getSubAccountBalances(req.params.prisonNumber as string),
      ])

      res.render('pages/prisoner/profile/prisonerProfile', {
        prisonNumber: req.params.prisonNumber as string,
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
