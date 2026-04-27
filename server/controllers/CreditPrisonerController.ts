import { NextFunction, Request, Response } from 'express'
import { Services } from '../services'

export default class CreditPrisonerController {
  constructor(private readonly services: Services) {}

  public getCreditTo = async (req: Request, res: Response, next: NextFunction) => {
    res.render('pages/creditAPrisoner/creditTo/creditTo.njk')
  }
}
