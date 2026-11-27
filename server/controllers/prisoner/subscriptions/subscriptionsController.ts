import { NextFunction, Request, Response } from 'express'
import { Services } from '../../../services'
import { AuditPage, SubjectType } from '../../../services/auditService'
import buildPaginationItems from '../../../utils/mojPaginationHelper'
import pageNumberQuerySchema from '../../../validators/pageNumberQueryValidator'
import { PrisonerSubscriptionResponse } from '../../../interfaces/PrisonerSubscriptionResponse'

class SubscriptionController {
  constructor(private readonly services: Services) {}

  public getSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
    const prisonNumber = req.params.prisonNumber.toString()

    await this.services.auditService.logPageView(AuditPage.PRISONER_SUBSCRIPTIONS, {
      who: res.locals.user.username,
      correlationId: req.id,
      subjectType: SubjectType.PRISONER,
      subjectId: prisonNumber,
    })

    const parsedQueries = pageNumberQuerySchema.safeParse(req.query)

    const pageNumber = parsedQueries.data.page.toString()

    const [pagedSubscriptions, subscriptionSummary] = await Promise.all([
      this.services.prisonerFinanceSubscriptionsService.getSubscriptions(
        prisonNumber,
        pageNumber,
        !parsedQueries.success,
      ),
      this.services.prisonerFinanceSubscriptionsService.getSubscriptionsSummary(prisonNumber),
    ])

    const { content, ...paginationItems } = parsedQueries.success
      ? buildPaginationItems<PrisonerSubscriptionResponse, typeof pageNumberQuerySchema>({
          ...pagedSubscriptions,
          filters: parsedQueries.data,
        })
      : { content: [] as PrisonerSubscriptionResponse[] }

    res.render('pages/prisoner/subscriptions/subscriptions', {
      subscriptions: content,
      prisonNumber,
      paginationItems,
      subscriptionTotal: subscriptionSummary.weeklyPaymentAmount,
    })
  }
}

export default SubscriptionController
