import { Router } from 'express'
import { PrisonerMoneyPermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Services } from '../services'
import CreditAPrisonerController from '../controllers/CreditAPrisonerController'
import getPrisonerData from '../middleware/getPrisonerData'

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
    .get(
      prisonerPermissionsGuard(services.prisonPermissionsService, {
        requestDependentOn: [PrisonerMoneyPermission.read], // todo wrong permission
        getPrisonerNumberFunction: req => req.params.prisonNumber as string,
      }),

      getPrisonerData(services),
      creditAPrisonerController.getCreditTo,
    )
    .post(
      prisonerPermissionsGuard(services.prisonPermissionsService, {
        requestDependentOn: [PrisonerMoneyPermission.read], // todo wrong permission
        getPrisonerNumberFunction: req => req.params.prisonNumber as string,
      }),
      getPrisonerData(services),
      creditAPrisonerController.postCreditTo,
    )

  creditAPrisonerRouter
    .route('/credit-from')
    .get(
      prisonerPermissionsGuard(services.prisonPermissionsService, {
        requestDependentOn: [PrisonerMoneyPermission.read], // todo wrong permission
        getPrisonerNumberFunction: req => req.params.prisonNumber as string,
      }),

      getPrisonerData(services),
      creditAPrisonerController.getCreditFrom,
    )
    .post(
      prisonerPermissionsGuard(services.prisonPermissionsService, {
        requestDependentOn: [PrisonerMoneyPermission.read], // todo wrong permission
        getPrisonerNumberFunction: req => req.params.prisonNumber as string,
      }),

      getPrisonerData(services),
      creditAPrisonerController.postCreditFrom,
    )

  creditAPrisonerRouter
    .route('/credit-amount')
    .get(
      prisonerPermissionsGuard(services.prisonPermissionsService, {
        requestDependentOn: [PrisonerMoneyPermission.read], // todo wrong permission
        getPrisonerNumberFunction: req => req.params.prisonNumber as string,
      }),

      getPrisonerData(services),
      creditAPrisonerController.getCreditAmount,
    )
    .post(
      prisonerPermissionsGuard(services.prisonPermissionsService, {
        requestDependentOn: [PrisonerMoneyPermission.read], // todo wrong permission
        getPrisonerNumberFunction: req => req.params.prisonNumber as string,
      }),

      getPrisonerData(services),
      creditAPrisonerController.postCreditAmount,
    )

  creditAPrisonerRouter.get(
    '/credit-confirmation',
    prisonerPermissionsGuard(services.prisonPermissionsService, {
      requestDependentOn: [PrisonerMoneyPermission.read], // todo wrong permission
      getPrisonerNumberFunction: req => req.params.prisonNumber as string,
    }),

    getPrisonerData(services),
    creditAPrisonerController.getCreditConfirmation,
  )

  return creditAPrisonerRouter
}
