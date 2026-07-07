import { Router } from 'express'
import { Services } from '../services'
import CreditAPrisonerController from '../controllers/CreditAPrisonerController'
import { getPrisonerData, populatePrisonerDetails } from '../middleware/populatePrisonerDetails'

export default function routes(services: Services): Router {
  const creditAPrisonerRouter = Router({ mergeParams: true })

  const creditAPrisonerController = new CreditAPrisonerController(services)

  creditAPrisonerRouter.use(async (req, res, next) => {
    if (req.featureFlags.CREDIT_ACCOUNT_ENABLED === false) {
      return res.render('pages/error.njk', {
        status: '404',
        message: 'Something went wrong. The error has been logged. Please try again',
      })
    }
    return next()
  })

  creditAPrisonerRouter
    .route('/credit-to')
    .get(populatePrisonerDetails(services), getPrisonerData(services), creditAPrisonerController.getCreditTo)
    .post(populatePrisonerDetails(services), getPrisonerData(services), creditAPrisonerController.postCreditTo)

  creditAPrisonerRouter
    .route('/credit-from')
    .get(populatePrisonerDetails(services), getPrisonerData(services), creditAPrisonerController.getCreditFrom)
    .post(populatePrisonerDetails(services), getPrisonerData(services), creditAPrisonerController.postCreditFrom)

  creditAPrisonerRouter
    .route('/credit-amount')
    .get(populatePrisonerDetails(services), getPrisonerData(services), creditAPrisonerController.getCreditAmount)
    .post(populatePrisonerDetails(services), getPrisonerData(services), creditAPrisonerController.postCreditAmount)

  creditAPrisonerRouter.get(
    '/credit-confirmation',
    populatePrisonerDetails(services),
    getPrisonerData(services),
    creditAPrisonerController.getCreditConfirmation,
  )

  return creditAPrisonerRouter
}
