import createError from 'http-errors'
import { NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import { AuditPage } from '../services/auditService'
import { buildMojSelectedFilter } from '../utils/mojFilterHelper'
import { formatValidationErrors, transactionsFilterSchema } from '../validators/transactionsFilterValidator'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { Page } from '../interfaces/Pageable'
import buildPaginationItems from '../utils/mojPaginationHelper'

const transactionFilterConfig = {
  startDate: { label: 'Start date', category: 'Date' },
  endDate: { label: 'End date', category: 'Date' },
  credit: { label: 'Credit', category: 'Credit or debit' },
  debit: { label: 'Debit', category: 'Credit or debit' },
}

const emptyPage: Page<PrisonerTransactionResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 1,
  pageNumber: 1,
  pageSize: 99,
  isLastPage: true,
}

class PrisonerController {
  constructor(private readonly services: Services) {}

  public getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prisonNumber = req.params.prisonNumber.toString()
      await this.services.auditService.logPageView(AuditPage.PRISONER_MONEY, {
        who: res.locals.user.username,
        correlationId: req.id,
      })

      const { startDate, endDate, credit, debit, page } = req.query as Record<string, string>
      const parsedQueries = transactionsFilterSchema.safeParse(req.query)

      let zodErrors = {}
      if (!parsedQueries.success) {
        zodErrors = formatValidationErrors(parsedQueries.error)
      }

      const selectedFilters = buildMojSelectedFilter(transactionFilterConfig, req.query)

      const transactionsPromise = parsedQueries.success
        ? this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber(
            prisonNumber,
            startDate,
            endDate,
            page,
            debit,
            credit,
          )
        : Promise.resolve(emptyPage)

      const [transactionPage, accountBalance] = await Promise.all([
        transactionsPromise,
        this.services.prisonerFinanceService.getAccountBalance(prisonNumber),
      ])

      const { content, ...paginationItems } = parsedQueries.success
        ? buildPaginationItems({ ...transactionPage, filters: parsedQueries.data })
        : { content: emptyPage.content }

      res.render('pages/prisoner/transactions/prisonerTransactions', {
        prisonNumber,
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
      next(createError(error?.data?.status || 500, error?.data?.userMessage || 'Internal Error'))
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
        this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber(prisonNumber),
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
