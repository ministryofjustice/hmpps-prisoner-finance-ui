import { NextFunction, Response, Request } from 'express'
import { SessionData } from 'express-session'
import { Services } from '../services'
import { AuditPage } from '../services/auditService'
import { mapItemsForRadioButtons } from '../utils/utils'
import GrantBonusToPrisonersService from '../services/GrantBonusToPrisonersService'

export default class GrantBonusToPrisonersController {
  constructor(private readonly services: Services) {}

  private getUserCaseloadsOrThrow = async (req: Request) => {
    const { user } = req
    if (!user) throw Error('Unexpected user data missing from Request')
    const { token } = user

    const caseloads = await this.services.prisonApiService.getUserCaseloads(token)

    GrantBonusToPrisonersService.createGrantBonusFormIfRequired(req.session as SessionData)

    return caseloads
  }

  public getGrantBonusToPrisonersSelectCaseload = async (req: Request, res: Response, next: NextFunction) => {
    await this.services.auditService.logPageView(AuditPage.GRANT_BONUS_CASELOAD, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    try {
      const caseloads = await this.getUserCaseloadsOrThrow(req)

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

  public postGrantBonusToPrisonersSelectCaseload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.caseloadId) {
        GrantBonusToPrisonersService.updateGrantBonusForm(req.session as SessionData, {
          caseloadId: req.body.caseloadId,
        })
        res.redirect('./grant-bonus-to-prisoners/amount')
      } else {
        const caseloads = await this.getUserCaseloadsOrThrow(req)

        res.render('pages/grantBonusToPrisoners/grantBonusToPrisoners/grantBonusToPrisoners.njk', {
          caseloadSelected: req.session.grantBonusForm?.caseloadId,
          caseloads: mapItemsForRadioButtons({
            input: caseloads,
            valueKey: 'caseLoadId',
            textKey: 'description',
            dataTestId: 'caseload-radio',
          }),
          errorMap: {
            errorText: 'You must select a caseload before continuing.',
          },
        })
      }
    } catch (e) {
      next(e)
    }
  }

  public getGrantBonusToPrisonersSelectAmount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.render('pages/grantBonusToPrisoners/amount/amount.njk')
    } catch (e) {
      next(e)
    }
  }
}
