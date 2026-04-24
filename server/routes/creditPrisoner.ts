import { Router, NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import CreditPrisonerController from '../controllers/CreditPrisonerController'
import { CreditPrisonerForm } from '../interfaces/creditPrisonerForm'
import { reset } from 'supertest/lib/cookies'

export default function routes(services: Services): Router {
  const creditPrisonerRouter = Router()

  const creditPrisonerController = new CreditPrisonerController(services)

  creditPrisonerRouter.get('/select-subaccount2', (req: Request, res: Response, next: NextFunction) =>{

    console.log(req.session.creditForm.creditSubAccountRef)

    res.send('Hello');
  })

  creditPrisonerRouter.get('/select-subaccount', (req: Request, res: Response, next: NextFunction) =>{

    if (!req.session.creditForm) {
      req.session.creditForm = {} as CreditPrisonerForm
    }

    req.session.creditForm.creditSubAccountRef = 'hello-world'

    res.redirect('./select-subaccount2')
  })
    


  return creditPrisonerRouter
}