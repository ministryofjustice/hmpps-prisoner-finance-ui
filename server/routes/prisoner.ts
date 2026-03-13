import { Router } from 'express'
import { PrisonerMoneyPermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Services } from '../services'
import PrisonerController from '../controllers/PrisonerController'
import getPrisonerData from '../middleware/getPrisonerData'

export default function routes(services: Services): Router {
  const prisonerRouter = Router()

  const prisonerController = new PrisonerController(services)

  prisonerRouter.get(
    '/:prisonNumber/money',

    prisonerPermissionsGuard(services.prisonPermissionsService, {
      requestDependentOn: [PrisonerMoneyPermission.read],
      getPrisonerNumberFunction: req => req.params.prisonNumber as string,
    }),

    getPrisonerData(services),
    prisonerController.transactions,
  )

  prisonerRouter.get(
    '/:prisonNumber',

    prisonerPermissionsGuard(services.prisonPermissionsService, {
      requestDependentOn: [PrisonerMoneyPermission.read],
      getPrisonerNumberFunction: req => req.params.prisonNumber as string,
    }),

    getPrisonerData(services),
    prisonerController.profile,
  )

  return prisonerRouter
}
