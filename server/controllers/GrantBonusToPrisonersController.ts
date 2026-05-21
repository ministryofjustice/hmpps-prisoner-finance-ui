import { NextFunction, Response, Request } from 'express'
import { SessionData } from 'express-session'
import { Services } from '../services'
import { AuditPage } from '../services/auditService'
import { mapItemsForRadioButtons } from '../utils/utils'
import GrantBonusToPrisonersService from '../services/GrantBonusToPrisonersService'

export default class GrantBonusToPrisonersController {
  constructor(private readonly services: Services) {}

  public grantBonusToPrisonersSelectCaseload = async (req: Request, res: Response, next: NextFunction) => {
    await this.services.auditService.logPageView(AuditPage.GRANT_BONUS_CASELOAD, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    try {
      const { user } = req
      if (!user) throw Error('Unexpected user data missing from Request')
      const { token } = user

      const caseloads = await this.services.prisonApiService.getUserCaseloads(token)

      GrantBonusToPrisonersService.createGrantBonusFormIfRequired(req.session as SessionData)

      res.render('pages/grantBonusToPrisoners/grantBonusToPrisoners/grantBonusToPrisoners.njk', {
        caseloadSelected: req.session.grantBonusForm.caseloadId,
        caseloads: mapItemsForRadioButtons({
          input: caseloads,
          valueKey: 'caseLoadId',
          textKey: 'description',
          dataTestId: 'caseload-radio',
        }),
      })
    } catch (e) {
      next(e)
    }
  }

  public grantBonusToPrisonersAmount = async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.grantBonusForm) {
      GrantBonusToPrisonersService.updateGrantBonusForm(req.session as SessionData, { caseloadId: req.body.caseLoadId })
      res.redirect('./grant-bonus-to-prisoners/amount')
    } else {
      throw Error('Not implemented')
    }
  }
}
