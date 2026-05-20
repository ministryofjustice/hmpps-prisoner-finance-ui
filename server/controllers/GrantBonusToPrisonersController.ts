import { NextFunction, Response, Request } from 'express'
import { SessionData } from 'express-session'
import { Services } from '../services'
import { AuditPage } from '../services/auditService'
import { mapItemsForRadioButtons } from '../utils/utils'
import GrantBonusToPrisonersService from '../services/GrantBonusToPrisonersService'

export default class GrantBonusToPrisonersController {
  constructor(private readonly services: Services) {}

  public getCreditTo = async (req: Request, res: Response, next: NextFunction) => {
    await this.services.auditService.logPageView(AuditPage.CREDIT_TO, {
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
        caseloadSelected: req.session.grantBonusForm.creditSubAccountId,
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
}
