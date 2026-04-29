import { SessionData } from 'express-session'
import { NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import CreditAPrisonerService from '../services/creditAPrisonerService'
import { AuditPage } from '../services/auditService'

export default class CreditAPrisonerController {
  constructor(private readonly services: Services) {}

  public getCreditTo = async (req: Request, res: Response, next: NextFunction) => {

    await this.services.auditService.logPageView(AuditPage.CREDIT_TO, {
      who: res.locals.user.username,
      correlationId: req.id,
    })
          
    if (!req.session.creditForm) {
      CreditAPrisonerService.createCreditForm(req.session as SessionData)
    }

    res.render('pages/creditAPrisoner/creditTo/creditTo.njk', {
      subAccountSelected: req.session.creditForm.creditSubAccountRef,
    })
  }

  public postCreditTo = async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.creditTo) {
      req.session.creditForm.creditSubAccountRef = req.body.creditTo
      res.redirect('./credit-from')
    } else {
      res.render('pages/creditAPrisoner/creditTo/creditTo.njk', {
        errorMap: {
          errorText: 'You must select a sub-account before continuing.',
        },
      })
    }
  }
}
