import { Router, NextFunction, Request, Response } from 'express'
import { PrisonerMoneyPermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Services } from '../services'
import PrisonerController from '../controllers/PrisonerController'
import getPrisonerData from '../middleware/getPrisonerData'
import getPrisonNames from '../middleware/getPrisonNames'
import creditPrisonerRouter from './creditPrisoner'

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
    '/:prisonNumber/money/private-cash',

    prisonerPermissionsGuard(services.prisonPermissionsService, {
      requestDependentOn: [PrisonerMoneyPermission.read],
      getPrisonerNumberFunction: req => req.params.prisonNumber as string,
    }),

    getPrisonerData(services),
    getPrisonNames(services),
    (req: Request, res: Response, next: NextFunction) => {
      res.locals.subAccount = 'CASH'
      res.locals.headerTitle = 'Private cash transactions'
      return prisonerController.getTransactions(req, res, next)
    },
  )

  prisonerRouter.get(
    '/:prisonNumber/money/spends',

    prisonerPermissionsGuard(services.prisonPermissionsService, {
      requestDependentOn: [PrisonerMoneyPermission.read],
      getPrisonerNumberFunction: req => req.params.prisonNumber as string,
    }),

    getPrisonerData(services),
    getPrisonNames(services),
    (req: Request, res: Response, next: NextFunction) => {
      res.locals.subAccount = 'SPENDS'
      res.locals.headerTitle = 'Spends transactions'
      return prisonerController.getTransactions(req, res, next)
    },
  )

  prisonerRouter.get(
    '/:prisonNumber/money/savings',

    prisonerPermissionsGuard(services.prisonPermissionsService, {
      requestDependentOn: [PrisonerMoneyPermission.read],
      getPrisonerNumberFunction: req => req.params.prisonNumber as string,
    }),

    getPrisonerData(services),
    getPrisonNames(services),
    (req: Request, res: Response, next: NextFunction) => {
      res.locals.subAccount = 'SAVINGS'
      res.locals.headerTitle = 'Savings transactions'
      return prisonerController.getTransactions(req, res, next)
    },
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

  prisonerRouter.use('/:prisonNumber/money/credit-a-prisoner/', creditPrisonerRouter)

  return prisonerRouter
}
