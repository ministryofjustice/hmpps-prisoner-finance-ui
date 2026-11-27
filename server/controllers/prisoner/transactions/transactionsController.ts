import createError from 'http-errors'
import { NextFunction, Request, Response } from 'express'
import { format, parse } from 'date-fns'
import qs from 'qs'
import { Services } from '../../../services'
import { SubjectType } from '../../../services/auditService'
import { buildMojSelectedFilter } from '../../../utils/mojFilterHelper'
import { formatValidationErrors, transactionsFilterSchema } from '../../../validators/transactionsFilterValidator'
import { PrisonerTransactionResponse } from '../../../interfaces/PrisonerTransactionResponse'
import buildPaginationItems from '../../../utils/mojPaginationHelper'
import { PrisonerHoldsBalanceResponse } from '../../../interfaces/PrisonerHoldsBalanceResponse'
import { formatDate } from '../../../utils/formatUtils'
import arrayToCSV from '../../../utils/csv'
import { formatDateToISO, penceToPound } from '../../../utils/utils'
import config from '../../../config'

const transactionFilterConfig = {
  startDate: { label: 'Start date', category: 'Date' },
  endDate: { label: 'End date', category: 'Date' },
  credit: { label: 'Credit', category: 'Credit or debit' },
  debit: { label: 'Debit', category: 'Credit or debit' },
  description: { label: 'Description', category: 'Description' },
}

class TransactionsController {
  constructor(private readonly services: Services) {}

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
        pageSize: config.defaultPageSize,
        startDate,
        endDate,
        credit,
        debit,
        description,
        hasValidationErrors: !parsedQueries.success,
      })

      let holdBalance: PrisonerHoldsBalanceResponse = { amount: 0, balanceDateTime: '', hoa: 0, whf: 0 }

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
    const { subAccount, startDate, endDate, credit, debit, description } = req.query as Record<string, string>

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
      hideHeader: true,
      downloadCsvParams: qs.stringify(req.query),
    })
  }

  public downloadTransactionsCSV = async (req: Request, res: Response, next: NextFunction) => {
    const prisonNumber = req.params.prisonNumber.toString()
    const { subAccount, startDate, endDate, credit, debit, description } = req.query as Record<string, string>

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

    const csvData = transactions.content.map(t => ({
      Date: formatDateToISO(t.date),
      TransactionId: t.legacyTransactionId,
      Amount: penceToPound(t.debit ? -t.debit : t.credit),
      Account: t.accountType,
      Location: t.location,
      SubAccountBalance: penceToPound(t.subAccountBalance),
      AccountBalance: penceToPound(t.accountBalance),
    }))

    const transactionsCsv = arrayToCSV(csvData)

    const statementDate = formatDate(new Date(Date.now()), 'dd-MM-yyyy')

    res.attachment(`transactions_${prisonNumber}_${statementDate}.csv`)
    res.type('text/csv')
    res.send(transactionsCsv)
  }
}

export default TransactionsController
