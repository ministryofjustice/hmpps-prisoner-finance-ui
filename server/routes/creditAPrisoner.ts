import { Router, NextFunction, Request, Response } from 'express'
import { PrisonerMoneyPermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Services } from '../services'
import CreditAPrisonerController from '../controllers/CreditAPrisonerController'
import getPrisonerData from '../middleware/getPrisonerData'

export default function routes(services: Services): Router {
  const creditAPrisonerRouter = Router({ mergeParams: true })

  const creditAPrisonerController = new CreditAPrisonerController(services)

  creditAPrisonerRouter
    .get(
      '/credit-to',

      prisonerPermissionsGuard(services.prisonPermissionsService, {
        requestDependentOn: [PrisonerMoneyPermission.read],
        getPrisonerNumberFunction: req => req.params.prisonNumber as string,
      }),

      getPrisonerData(services),
      creditAPrisonerController.getCreditTo,
    )
    .post(
      '/credit-to',
      prisonerPermissionsGuard(services.prisonPermissionsService, {
        requestDependentOn: [PrisonerMoneyPermission.read],
        getPrisonerNumberFunction: req => req.params.prisonNumber as string,
      }),
      getPrisonerData(services),
      creditAPrisonerController.postCreditTo,
    )

  creditAPrisonerRouter.get(
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

  return creditAPrisonerRouter
}
