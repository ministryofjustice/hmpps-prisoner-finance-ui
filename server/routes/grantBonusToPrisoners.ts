// todo this file

import { Router } from 'express'
import GrantBonusToPrisonersController from '../controllers/GrantBonusToPrisonersController'
import { Services } from '../services'

export default function routes(services: Services): Router {
  const grantBonusRouter = Router({ mergeParams: true })

  const grantBonusToPrisonersController = new GrantBonusToPrisonersController(services)

  grantBonusRouter
    .route('/')
    .get(grantBonusToPrisonersController.getGrantBonusToPrisonersSelectCaseload)
    .post(grantBonusToPrisonersController.postGrantBonusToPrisonersSelectCaseload)

  grantBonusRouter
    .route('/amount')
    .get(grantBonusToPrisonersController.getGrantBonusToPrisonersSelectAmount)
    .post(grantBonusToPrisonersController.postGrantBonusToPrisonersSelectAmount)

  grantBonusRouter.route('/confirmation').get(grantBonusToPrisonersController.getGrantBonusToPrisonerConfirmation)

  return grantBonusRouter
}
