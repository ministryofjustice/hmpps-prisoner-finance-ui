// todo this file

import { Router } from 'express'
import GrantBonusToPrisonersController from '../controllers/GrantBonusToPrisonersController'
import { Services } from '../services'

export default function routes(services: Services): Router {
  const grantBonusRouter = Router({ mergeParams: true })

  const grantBonusToPrisonersController = new GrantBonusToPrisonersController(services)

  grantBonusRouter
    .route('/')
    .get(grantBonusToPrisonersController.grantBonusToPrisonersSelectCaseload)
    .post(grantBonusToPrisonersController.grantBonusToPrisonersAmount)

  return grantBonusRouter
}
