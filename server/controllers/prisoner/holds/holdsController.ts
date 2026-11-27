import { NextFunction, Request, Response } from 'express'
import { Services } from '../../../services'
import { SubjectType } from '../../../services/auditService'
import buildPaginationItems from '../../../utils/mojPaginationHelper'
import pageNumberQuerySchema from '../../../validators/pageNumberQueryValidator'
import { PrisonerHoldResponse } from '../../../interfaces/PrisonerHoldResponse'
import holdsPageQueryValidator from '../../../validators/holdsPageQueryValidator'

class HoldsController {
  constructor(private readonly services: Services) {}

  public getHolds = async (req: Request, res: Response, next: NextFunction) => {
    const prisonNumber = req.params.prisonNumber.toString()

    const parsedQueries = holdsPageQueryValidator.safeParse(req.query)

    await this.services.auditService.logPageView(res.locals.auditPage, {
      who: res.locals.user.username,
      correlationId: req.id,
      subjectType: SubjectType.PRISONER,
      subjectId: prisonNumber,
    })

    const pageNumber = parsedQueries.data.page.toString()
    const { holdType } = parsedQueries.data

    const [pagedHolds, holdsBalance] = await Promise.all([
      this.services.prisonerFinanceHoldsService.getHolds(prisonNumber, pageNumber, !parsedQueries.success, holdType),
      this.services.prisonerFinanceHoldsService.getHoldsBalance(prisonNumber),
    ])

    const { content, ...paginationItems } = parsedQueries.success
      ? buildPaginationItems<PrisonerHoldResponse, typeof pageNumberQuerySchema>({
          ...pagedHolds,
          filters: parsedQueries.data,
        })
      : { content: [] as PrisonerHoldResponse[] }

    res.render('pages/prisoner/holds/holds', {
      prisonNumber,
      paginationItems,
      holds: pagedHolds.content,
      holdsBalance,
      currentHoldType: parsedQueries.data.holdType,
    })
  }
}

export default HoldsController
