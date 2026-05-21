// todo this file

import { Router } from 'express'
import GrantBonusToPrisonersController from '../controllers/GrantBonusToPrisonersController'
import { Services } from '../services'

export default function routes(services: Services): Router {
  const grantBonusRouter = Router({ mergeParams: true })

  const grantBonusToPrisonersController = new GrantBonusToPrisonersController(services)

  grantBonusRouter
    .route('/')
    .get(
      // todo sort out permissions
      grantBonusToPrisonersController.grantBonusToPrisonersSelectCaseload,
    )
    .post(
      // todo sort out permissions
      grantBonusToPrisonersController.grantBonusToPrisonersAmount,
    )

  return grantBonusRouter
}
