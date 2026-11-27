import { NextFunction, Request, Response } from 'express'
import { Services } from '../../../services'
import buildPaginationItems from '../../../utils/mojPaginationHelper'
import { PrisonerAdvanceResponse } from '../../../interfaces/PrisonerAdvanceResponse'
import advancesFilterSchema from '../../../validators/advancesFilterValidator'
import advancePaymentsFilterSchema from '../../../validators/advancePaymentsFilterValidator'
import { PrisonerAdvancePaymentsResponse } from '../../../interfaces/PrisonerAdvancePaymentsResponse'
import { SubjectType } from '../../../services/auditService'

class AdvancesController {
  constructor(private readonly services: Services) {}

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
}

export default AdvancesController
