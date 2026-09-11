import { Router } from 'express'
import createError from 'http-errors'
import { Services } from '../../services'
import CreditAPrisonerController from '../../controllers/CreditAPrisonerController'

export default function routes(services: Services): Router {
  const creditAPrisonerRouter = Router({ mergeParams: true })

  const creditAPrisonerController = new CreditAPrisonerController(services)

  creditAPrisonerRouter.use(async (req, res, next) => {
    if (req.featureFlags.CREDIT_ACCOUNT_ENABLED === false) {
      return next(createError(404, 'Not found'))
    }
    return next()
  })

  creditAPrisonerRouter
    .route('/credit-to')
    .get(creditAPrisonerController.getCreditTo)
    .post(creditAPrisonerController.postCreditTo)

  creditAPrisonerRouter
    .route('/credit-from')
    .get(creditAPrisonerController.getCreditFrom)
    .post(creditAPrisonerController.postCreditFrom)

  creditAPrisonerRouter
    .route('/credit-amount')
    .get(creditAPrisonerController.getCreditAmount)
    .post(creditAPrisonerController.postCreditAmount)

  creditAPrisonerRouter.get('/credit-confirmation', creditAPrisonerController.getCreditConfirmation)

  return creditAPrisonerRouter
}
