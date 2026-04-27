import { Router, NextFunction, Request, Response } from 'express'
import { PrisonerMoneyPermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Services } from '../services'
import CreditPrisonerController from '../controllers/CreditPrisonerController'
import getPrisonerData from '../middleware/getPrisonerData'

export default function routes(services: Services): Router {
  const creditPrisonerRouter = Router({ mergeParams: true })

  const creditPrisonerController = new CreditPrisonerController(services)

  creditPrisonerRouter.get('/select-subaccount2', (req: Request, res: Response, next: NextFunction) => {
    res.send('Hello')
  })

  creditPrisonerRouter.get(
    '/select-subaccount',

    prisonerPermissionsGuard(services.prisonPermissionsService, {
      requestDependentOn: [PrisonerMoneyPermission.read],
      getPrisonerNumberFunction: req => req.params.prisonNumber as string,
    }),

    getPrisonerData(services),
    creditPrisonerController.getCreditTo,
  )

  return creditPrisonerRouter
}
