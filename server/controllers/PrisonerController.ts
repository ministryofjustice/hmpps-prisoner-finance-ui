import createError from 'http-errors'
import { NextFunction, Request, Response } from 'express'
import { format, parse } from 'date-fns'
import { Services } from '../services'
import { AuditPage, SearchRequest, SubjectType } from '../services/auditService'
import { buildMojSelectedFilter } from '../utils/mojFilterHelper'
import { formatValidationErrors, transactionsFilterSchema } from '../validators/transactionsFilterValidator'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import buildPaginationItems from '../utils/mojPaginationHelper'
import { PrisonerSearchContent, PrisonerSearchResult } from '../interfaces/PrisonerSearchResponse'
import prisonerSearchFilterSchema, { formatSearchFilterValidationErrors } from '../validators/searchFilterSchema'
import holdsFilterSchema from '../validators/holdsFilterValidator'
import { PrisonerHoldResponse } from '../interfaces/PrisonerHoldResponse'
import { PrisonerHoldsBalanceResponse } from '../interfaces/PrisonerHoldsBalanceResponse'
import { PrisonerAdvanceResponse } from '../interfaces/PrisonerAdvanceResponse'
import advancesFilterSchema from '../validators/advancesFilterValidator'
import advancePaymentsFilterSchema from '../validators/advancePaymentsFilterValidator'
import { PrisonerAdvancePaymentsResponse } from '../interfaces/PrisonerAdvancePaymentsResponse'
import { formatDate } from '../utils/formatUtils'

const transactionFilterConfig = {
  startDate: { label: 'Start date', category: 'Date' },
  endDate: { label: 'End date', category: 'Date' },
  credit: { label: 'Credit', category: 'Credit or debit' },
  debit: { label: 'Debit', category: 'Credit or debit' },
  description: { label: 'Description', category: 'Description' },
}

const defaultPageSize = '25'

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

  public getAdvanceDetail = async (req: Request, res: Response, next: NextFunction) => {
    const prisonNumber = req.params.prisonNumber.toString()
    const advanceId = req.params.advanceId.toString()

    const parsedQueries = advancePaymentsFilterSchema.safeParse(req.query)

    await this.services.auditService.logPageView(res.locals.auditPage, {
      who: res.locals.user.username,
      correlationId: req.id,
      subjectType: SubjectType.PRISONER,
      subjectId: prisonNumber,
    })

    const pageNumber = parsedQueries.data.page.toString()

    const [advanceBalance, pagedAdvancePayments] = await Promise.all([
      this.services.prisonerFinanceAdvancesService.getAdvanceBalance(advanceId),
      this.services.prisonerFinanceAdvancesService.getAdvancePayments(advanceId, pageNumber, !parsedQueries.success),
    ])

    const { content, ...paginationItems } = parsedQueries.success
      ? buildPaginationItems<PrisonerAdvancePaymentsResponse, typeof advancePaymentsFilterSchema>({
          ...pagedAdvancePayments,
          filters: parsedQueries.data,
        })
      : { content: [] as PrisonerAdvancePaymentsResponse[] }

    res.render('pages/prisoner/advances/advanceDetail', {
      prisonNumber,
      paginationItems,
      advancePayments: pagedAdvancePayments.content,
      advanceBalance,
    })
  }

  public getAdvances = async (req: Request, res: Response, next: NextFunction) => {
    const prisonNumber = req.params.prisonNumber.toString()

    const parsedQueries = advancesFilterSchema.safeParse(req.query)

    await this.services.auditService.logPageView(res.locals.auditPage, {
      who: res.locals.user.username,
      correlationId: req.id,
      subjectType: SubjectType.PRISONER,
      subjectId: prisonNumber,
    })

    const pageNumber = parsedQueries.data.page.toString()

    const [pagedAdvances, advanceBalances] = await Promise.all([
      this.services.prisonerFinanceAdvancesService.getAdvances(prisonNumber, pageNumber, !parsedQueries.success),
      this.services.prisonerFinanceAdvancesService.getAdvancesBalances(prisonNumber),
    ])

    const { content, ...paginationItems } = parsedQueries.success
      ? buildPaginationItems<PrisonerAdvanceResponse, typeof advancesFilterSchema>({
          ...pagedAdvances,
          filters: parsedQueries.data,
        })
      : { content: [] as PrisonerAdvanceResponse[] }

    res.render('pages/prisoner/advances/advances', {
      prisonNumber,
      paginationItems,
      advances: pagedAdvances.content,
      advanceBalances,
    })
  }

  public getHolds = async (req: Request, res: Response, next: NextFunction) => {
    const prisonNumber = req.params.prisonNumber.toString()

    const parsedQueries = holdsFilterSchema.safeParse(req.query)

    await this.services.auditService.logPageView(res.locals.auditPage, {
      who: res.locals.user.username,
      correlationId: req.id,
      subjectType: SubjectType.PRISONER,
      subjectId: prisonNumber,
    })

    const pageNumber = parsedQueries.data.page.toString()

    const pagedHolds = await this.services.prisonerFinanceHoldsService.getHolds(
      prisonNumber,
      pageNumber,
      !parsedQueries.success,
    )

    const { content, ...paginationItems } = parsedQueries.success
      ? buildPaginationItems<PrisonerHoldResponse, typeof holdsFilterSchema>({
          ...pagedHolds,
          filters: parsedQueries.data,
        })
      : { content: [] as PrisonerHoldResponse[] }

    res.render('pages/prisoner/holds/holds', {
      prisonNumber,
      paginationItems,
      holds: pagedHolds.content,
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

      const { startDate, endDate, credit, debit, page, description } = req.query as Record<string, string>
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
        pageSize: defaultPageSize,
        startDate,
        endDate,
        credit,
        debit,
        description,
        hasValidationErrors: !parsedQueries.success,
      })

      let holdBalance: PrisonerHoldsBalanceResponse = { amount: 0, balanceDateTime: '' }

      if (res.locals.showHolds) {
        if (subAccount != null) {
          holdBalance = await this.services.prisonerFinanceHoldsService.getHoldsBalanceForSubAccount(
            prisonNumber,
            subAccount,
          )
        } else {
          holdBalance = await this.services.prisonerFinanceHoldsService.getHoldsBalance(prisonNumber)
        }
      }

      const { content, ...paginationItems } = parsedQueries.success
        ? buildPaginationItems<PrisonerTransactionResponse, typeof transactionsFilterSchema>({
            ...transactionPage,
            filters: parsedQueries.data,
          })
        : { content: [] as PrisonerTransactionResponse[] }

      // setting up params for print transactions page
      const { page: _, ...printTransactionsQuery } = {
        ...req.query,
        subAccount,
        backLink: req.originalUrl,
      } as Record<string, string>

      // filtering nulls out
      Object.keys(printTransactionsQuery).forEach(k => {
        if (printTransactionsQuery[k] === null) delete printTransactionsQuery[k]
      })

      const printTransactionsParams = new URLSearchParams(printTransactionsQuery).toString()
      const printTransactionQueryString = printTransactionsParams ? `?${printTransactionsParams}` : ''

      res.render('pages/prisoner/transactions/prisonerTransactions', {
        prisonNumber,
        headerTitle: headerTitle ?? 'Transactions for all sub accounts',
        applicationName: 'Transactions',
        transactions: content,
        paginationItems,
        currentBalance: accountBalance.amount,
        holdBalance: holdBalance.amount,
        totalBalance: holdBalance.amount + accountBalance.amount,
        filters: {
          startDate,
          endDate,
          credit,
          debit,
          description,
          selectedFilters,
        },
        hasValidationErrors: !parsedQueries.success,
        ...zodErrors,
        displayTotalBalance: !subAccount,
        holdsEnabled: res.locals.showHolds,
        printTransactionQueryString,
      })
    } catch (error) {
      if (error.responseStatus === 400 && error.data?.userMessage?.includes('Page requested is out of range')) {
        next(createError(404, error?.data?.userMessage, { cause: error }))
      } else {
        next(createError(error?.data?.status || 500, error?.data?.userMessage || 'Internal Error', { cause: error }))
      }
    }
  }

  public printTransactions = async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName } = res.locals.prisonerDetails
    const prisonNumber = req.params.prisonNumber.toString()
    const { subAccount, startDate, endDate, credit, debit, description, backLink } = req.query as Record<string, string>

    await this.services.auditService.logPageView(res.locals.auditPage, {
      who: res.locals.user.username,
      correlationId: req.id,
      subjectType: SubjectType.PRISONER,
      subjectId: prisonNumber,
    })

    const transactions = await this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber({
      prisonNumber,
      subAccountReference: subAccount,
      page: '1',
      pageSize: '999999',
      startDate,
      endDate,
      debit,
      credit,
      description,
    })

    const startDateFromContent =
      transactions.content.length > 0 ? formatDate(transactions.content[transactions.content.length - 1].date) : ''
    const startDateDisplay = startDate
      ? format(parse(startDate, 'dd/MM/yyyy', new Date()), 'd MMMM yyyy')
      : startDateFromContent

    const endDateFromContent = transactions.content.length > 0 ? formatDate(transactions.content[0].date) : ''
    const endDateDisplay = endDate
      ? format(parse(endDate, 'dd/MM/yyyy', new Date()), 'd MMMM yyyy')
      : endDateFromContent

    let accountBalance: number
    let statementDateString: string
    if (!subAccount) {
      const accountBalanceResponse = await this.services.prisonerFinanceService.getAccountBalance(prisonNumber)
      accountBalance = accountBalanceResponse.amount
      statementDateString = accountBalanceResponse.balanceDateTime
    } else {
      const subAccountBalanceResponse = await this.services.prisonerFinanceService.getSubAccountBalance(
        prisonNumber,
        subAccount,
      )
      accountBalance = subAccountBalanceResponse.amount
      statementDateString = subAccountBalanceResponse.balanceDateTime
    }

    const statementDate = formatDate(statementDateString)

    res.render('pages/prisoner/transactions/prisonerPrintTransactions', {
      transactions: transactions.content,
      displayTotalBalance: !subAccount,
      subAccount,
      headerTitle: 'Prisoner Transaction history',
      prisonNumber,
      firstName,
      lastName,
      startDate: startDateDisplay,
      endDate: endDateDisplay,
      statementDate,
      statementBalance: accountBalance,
      backLink,
      hideBanner: true,
    })
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
        this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber({
          prisonNumber,
          page: '1',
          pageSize: defaultPageSize,
        }),
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
        holdsEnabled: req.featureFlags.HOLDS_ENABLED,
      })
    } catch (error) {
      next(createError(error?.data?.status || 500, error?.data?.userMessage || 'Internal Error', { cause: error }))
    }
  }
}

export default PrisonerController
