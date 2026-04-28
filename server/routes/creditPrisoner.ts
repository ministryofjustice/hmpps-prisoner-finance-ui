import { Router, NextFunction, Request, Response } from 'express'
import { PrisonerMoneyPermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Services } from '../services'
import CreditPrisonerController from '../controllers/CreditPrisonerController'
import getPrisonerData from '../middleware/getPrisonerData'

export default function routes(services: Services): Router {
  const creditPrisonerRouter = Router({ mergeParams: true })

  const creditPrisonerController = new CreditPrisonerController(services)

  creditPrisonerRouter
    .get(
      '/credit-to',

      prisonerPermissionsGuard(services.prisonPermissionsService, {
        requestDependentOn: [PrisonerMoneyPermission.read],
        getPrisonerNumberFunction: req => req.params.prisonNumber as string,
      }),

      getPrisonerData(services),
      creditPrisonerController.getCreditTo,
    )
    .post(
      '/credit-to',
      prisonerPermissionsGuard(services.prisonPermissionsService, {
        requestDependentOn: [PrisonerMoneyPermission.read],
        getPrisonerNumberFunction: req => req.params.prisonNumber as string,
      }),
      getPrisonerData(services),
      creditPrisonerController.postCreditTo,
    )

  creditPrisonerRouter.get(
    '/credit-from',

    prisonerPermissionsGuard(services.prisonPermissionsService, {
      requestDependentOn: [PrisonerMoneyPermission.read],
      getPrisonerNumberFunction: req => req.params.prisonNumber as string,
    }),

    getPrisonerData(services),
    (req: Request, res: Response, next: NextFunction) => {
      res.render('pages/creditAPrisoner/creditFrom/creditFrom.njk')
    },
  )

  return creditPrisonerRouter
}
