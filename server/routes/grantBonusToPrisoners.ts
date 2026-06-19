// todo this file

import { Router } from 'express'
import GrantBonusToPrisonersController from '../controllers/GrantBonusToPrisonersController'
import { Services } from '../services'

export default function routes(services: Services): Router {
  const grantBonusRouter = Router({ mergeParams: true })

  const grantBonusToPrisonersController = new GrantBonusToPrisonersController(services)

  grantBonusRouter.use(async (req, res, next) => {
    if (req.featureFlags.GRANT_BONUS_TO_PRISONERS_ENABLED === false) {
      return res.render('pages/error.njk', {
        status: '404',
        message: 'Something went wrong. The error has been logged. Please try again',
      })
    }
    return next()
  })

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
