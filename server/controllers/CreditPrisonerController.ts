import { Services } from '../services'
import { NextFunction, Request, Response } from 'express'

export default class CreditPrisonerController {
    constructor(private readonly services: Services) {}

    public getCreditTo = async(req : Request, res: Response, next: NextFunction) => {
        res.render('pages/creditAPrisoner/creditTo')
    }
}