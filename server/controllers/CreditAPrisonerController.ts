import { SessionData } from 'express-session'
import { NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import CreditAPrisonerService from '../services/creditAPrisonerService'

export default class CreditAPrisonerController {
  constructor(private readonly services: Services) {}

  public getCreditTo = async (req: Request, res: Response, next: NextFunction) => {
    CreditAPrisonerService.createCreditForm(req.session as SessionData)

    res.render('pages/creditAPrisoner/creditTo/creditTo.njk')
  }

  public postCreditTo = async (req: Request, res: Response, next: NextFunction) => {
    req.session.creditForm.creditSubAccountRef = 'cash'

    res.redirect('./credit-from')
  }
}
