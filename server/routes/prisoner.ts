import { Router } from 'express'
import { PrisonerMoneyPermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Services } from '../services'
import PrisonerController from '../controllers/PrisonerController'
import getPrisonerData from '../middleware/getPrisonerData'
import getPrisonNames from '../middleware/getPrisonNames'

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
    getPrisonNames(services),
    prisonerController.getTransactions,
  )

  prisonerRouter.get(
    '/:prisonNumber',

    prisonerPermissionsGuard(services.prisonPermissionsService, {
      requestDependentOn: [PrisonerMoneyPermission.read],
      getPrisonerNumberFunction: req => req.params.prisonNumber as string,
    }),

    getPrisonerData(services),
    prisonerController.getProfile,
  )

  return prisonerRouter
}
