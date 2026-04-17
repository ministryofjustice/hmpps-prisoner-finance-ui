import createError from 'http-errors'
import { NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import { AuditPage } from '../services/auditService'
import { buildMojSelectedFilter } from '../utils/mojFilterHelper'
import { formatValidationErrors, transactionsFilterSchema } from '../validators/transactionsFilterValidator'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import buildPaginationItems from '../utils/mojPaginationHelper'

const transactionFilterConfig = {
  startDate: { label: 'Start date', category: 'Date' },
  endDate: { label: 'End date', category: 'Date' },
  credit: { label: 'Credit', category: 'Credit or debit' },
  debit: { label: 'Debit', category: 'Credit or debit' },
}

class PrisonerController {
  constructor(private readonly services: Services) {}

  public getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.services.auditService.logPageView(AuditPage.PRISONER_MONEY, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
      const prisonNumber = req.params.prisonNumber.toString()
      const { subAccount = null, headerTitle = null } = res.locals
      const { startDate, endDate, credit, debit, page } = req.query as Record<string, string>

      const parsedQueries = transactionsFilterSchema.safeParse(req.query)
      const selectedFilters = buildMojSelectedFilter(transactionFilterConfig, req.query)

      let zodErrors = {}
      if (!parsedQueries.success) {
        zodErrors = formatValidationErrors(parsedQueries.error)
      }

      const [transactionPage, accountBalance] = await this.services.prisonerFinanceService.getTransactionPage({
        prisonNumber,
        subAccountReference: subAccount,
        page,
        startDate,
        endDate,
        credit,
        debit,
        hasValidationErrors: !parsedQueries.success,
      })

      const { content, ...paginationItems } = parsedQueries.success
        ? buildPaginationItems<PrisonerTransactionResponse>({ ...transactionPage, filters: parsedQueries.data })
        : { content: [] as PrisonerTransactionResponse[] }

      res.render('pages/prisoner/transactions/prisonerTransactions', {
        prisonNumber,
        headerTitle: headerTitle ?? 'Transactions for all sub accounts',
        applicationName: 'Transactions',
        transactions: content,
        paginationItems,
        currentBalance: accountBalance.amount,
        holdBalance: 0,
        filters: {
          startDate,
          endDate,
          credit,
          debit,
          selectedFilters,
        },
        hasValidationErrors: !parsedQueries.success,
        ...zodErrors,
      })
    } catch (error) {
      if (error.responseStatus === 400 && error.data?.userMessage?.includes('Page requested is out of range')) {
        next(createError(404, error?.data?.userMessage))
      } else {
        next(createError(error?.data?.status || 500, error?.data?.userMessage || 'Internal Error'))
      }
    }
  }

  public getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prisonNumber = req.params.prisonNumber.toString()

      await this.services.auditService.logPageView(AuditPage.PRISONER_PROFILE, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const [transactions, subAccountBalances] = await Promise.all([
        this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber({ prisonNumber, page: '1' }),
        this.services.prisonerFinanceService.getSubAccountBalances(prisonNumber),
      ])

      res.render('pages/prisoner/profile/prisonerProfile', {
        prisonNumber,
        transactions: transactions.content.slice(0, 5),
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
