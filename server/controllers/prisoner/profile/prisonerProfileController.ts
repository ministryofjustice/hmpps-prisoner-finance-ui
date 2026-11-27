import createError from 'http-errors'
import { NextFunction, Request, Response } from 'express'
import config from '../../../config'
import { Services } from '../../../services'
import { AuditPage, SubjectType } from '../../../services/auditService'

class PrisonerController {
  constructor(private readonly services: Services) {}

  public getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prisonNumber = req.params.prisonNumber.toString()

      await this.services.auditService.logPageView(AuditPage.PRISONER_FINANCIAL_PROFILE, {
        who: res.locals.user.username,
        correlationId: req.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

      const [transactions, subAccountBalances, holdBalance, advancesBalances] = await Promise.all([
        this.services.prisonerFinanceService.getPrisonerTransactionsByPrisonNumber({
          prisonNumber,
          page: '1',
          pageSize: config.defaultPageSize,
        }),
        this.services.prisonerFinanceService.getSubAccountBalances(prisonNumber),
        this.services.prisonerFinanceHoldsService.getHoldsBalance(prisonNumber),
        this.services.prisonerFinanceAdvancesService.getAdvancesBalances(prisonNumber),
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
        advancesEnabled: req.featureFlags.ADVANCES_ENABLED,
        advancesAmount: advancesBalances.advancesAmount,
        balancesOutstanding: advancesBalances.balancesOutstanding,
        weeklyPaymentAmount: advancesBalances.weeklyPaymentAmount,
      })
    } catch (error) {
      next(createError(error?.data?.status || 500, error?.data?.userMessage || 'Internal Error', { cause: error }))
    }
  }
}

export default PrisonerController
