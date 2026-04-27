import { Router, NextFunction, Request, Response } from 'express'
import { Services } from '../services'
import CreditPrisonerController from '../controllers/CreditPrisonerController'
import { CreditPrisonerForm } from '../interfaces/creditPrisonerForm'
import { PrisonerMoneyPermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import getPrisonerData from '../middleware/getPrisonerData'

export default function routes(services: Services): Router {
  const creditPrisonerRouter = Router({mergeParams : true})

  const creditPrisonerController = new CreditPrisonerController(services)

  creditPrisonerRouter.get('/select-subaccount2', (req: Request, res: Response, next: NextFunction) =>{

    console.log(req.session.creditForm.creditSubAccountRef)

    res.send('Hello');
  })

  creditPrisonerRouter.get('/select-subaccount',

    prisonerPermissionsGuard(services.prisonPermissionsService, {
      requestDependentOn: [PrisonerMoneyPermission.read],
      getPrisonerNumberFunction: req => req.params.prisonNumber as string,
    }),

    getPrisonerData(services),
    creditPrisonerController.getCreditTo
  )

  return creditPrisonerRouter
}