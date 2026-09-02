import createError from 'http-errors'
import { NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import { AuditPage, SearchRequest, SubjectType } from '../services/auditService'
import { buildMojSelectedFilter } from '../utils/mojFilterHelper'
import { formatValidationErrors, transactionsFilterSchema } from '../validators/transactionsFilterValidator'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import buildPaginationItems from '../utils/mojPaginationHelper'
import { PrisonerSearchContent, PrisonerSearchResult } from '../interfaces/PrisonerSearchResponse'
import prisonerSearchFilterSchema, { formatSearchFilterValidationErrors } from '../validators/searchFilterSchema'

const transactionFilterConfig = {
  startDate: { label: 'Start date', category: 'Date' },
  endDate: { label: 'End date', category: 'Date' },
  credit: { label: 'Credit', category: 'Credit or debit' },
  debit: { label: 'Debit', category: 'Credit or debit' },
}

class PrisonerController {
  constructor(private readonly services: Services) {}

  public getFindPrisoner = async (req: Request, res: Response, next: NextFunction) => {
    const parsedQueries = prisonerSearchFilterSchema.safeParse(req.query)

    if (parsedQueries.data?.term) {
      await this.services.auditService.logSearchRequest(SearchRequest.FIND_PRISONER, {
        who: res.locals.user.username,
        correlationId: req.id,
        subjectType: SubjectType.SEARCH_TERM,
        subjectId: parsedQueries.data?.term,
      })
    } else {
      await this.services.auditService.logPageView(AuditPage.FIND_PRISONER, {
        who: res.locals.user.username,
        correlationId: req.id,
      })
    }

    const token = req.user?.token as string
    const caseloads = await this.services.prisonApiService.getUserCaseloads(token)
    const currentCaseload = caseloads.find(caseload => caseload.currentlyActive)

    if (parsedQueries.error) {
      res.render('pages/prisoner/find/find', {
        currentCaseload: currentCaseload.description,
        ...formatSearchFilterValidationErrors(parsedQueries.error),
      })
      return
    }

    if (!parsedQueries.data.term) {
      res.render('pages/prisoner/find/find', {
        currentCaseload: currentCaseload.description,
      })
      return
    }

    const matchingPrisoners: PrisonerSearchResult = await this.services.prisonerSearchService.getPrisonersBySearchTerm(
      currentCaseload.caseLoadId,
      parsedQueries.data.term,
      (parsedQueries.data.page - 1).toString(), // page start from 0 in this API
    )

    const { content, ...paginationItems } = buildPaginationItems<
      PrisonerSearchContent,
      typeof prisonerSearchFilterSchema
    >({
      pageNumber: parsedQueries.data.page,
      totalPages: matchingPrisoners.totalPages,
      totalElements: matchingPrisoners.totalElements,
      content: matchingPrisoners.content,
      isLastPage: matchingPrisoners.pageable.pageNumber === matchingPrisoners.totalPages - 1,
      pageSize: matchingPrisoners.pageable.pageSize,
      filters: parsedQueries.data,
    })

    res.render('pages/prisoner/find/find', {
      currentCaseload: currentCaseload.description,
      matchingPrisoners: matchingPrisoners.content,
      term: parsedQueries.data.term,
      paginationItems,
    })
  }

  public getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subAccount = null, headerTitle = null } = res.locals
      const prisonNumber = req.params.prisonNumber.toString()

      await this.services.auditService.logPageView(res.locals.auditPage, {
        who: res.locals.user.username,
        correlationId: req.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

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
        ? buildPaginationItems<PrisonerTransactionResponse, typeof transactionsFilterSchema>({
            ...transactionPage,
            filters: parsedQueries.data,
          })
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
        displayTotalBalance: !subAccount,
      })
    } catch (error) {
      if (error.responseStatus === 400 && error.data?.userMessage?.includes('Page requested is out of range')) {
        next(createError(404, error?.data?.userMessage, { cause: error }))
      } else {
        next(createError(error?.data?.status || 500, error?.data?.userMessage || 'Internal Error', { cause: error }))
      }
    }
  }

  public getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prisonNumber = req.params.prisonNumber.toString()

      await this.services.auditService.logPageView(AuditPage.PRISONER_FINANCIAL_PROFILE, {
        who: res.locals.user.username,
        correlationId: req.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

      const [transactions, subAccountBalances, holdBalance] = await Promise.all([
        this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber({ prisonNumber, page: '1' }),
        this.services.prisonerFinanceService.getSubAccountBalances(prisonNumber),
        this.services.prisonerFinanceHoldsService.getHoldsBalance(prisonNumber),
      ])

      res.render('pages/prisoner/profile/prisonerProfile', {
        prisonNumber,
        transactions: transactions.content.slice(0, 5),
        actionPanelEnabled: req.featureFlags.ACTION_PANEL_ENABLED,
        subAccountBalances: {
          spends: subAccountBalances.SPENDS,
          privateCash: subAccountBalances.CASH,
          savings: subAccountBalances.SAVINGS,
          holds: holdBalance,
        },
      })
    } catch (error) {
      next(createError(error?.data?.status || 500, error?.data?.userMessage || 'Internal Error', { cause: error }))
    }
  }
}

export default PrisonerController
