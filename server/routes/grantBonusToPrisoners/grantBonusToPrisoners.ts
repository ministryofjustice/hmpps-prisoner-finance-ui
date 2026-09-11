import { Router } from 'express'
import createError from 'http-errors'
import GrantBonusToPrisonersController from '../../controllers/GrantBonusToPrisonersController'
import { Services } from '../../services'

export default function routes(services: Services): Router {
  const grantBonusRouter = Router({ mergeParams: true })

  const grantBonusToPrisonersController = new GrantBonusToPrisonersController(services)

  grantBonusRouter.use(async (req, res, next) => {
    if (req.featureFlags.GRANT_BONUS_TO_PRISONERS_ENABLED === false) {
      return next(createError(404, 'Not found'))
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
