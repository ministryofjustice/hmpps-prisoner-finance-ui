import { Router } from 'express'
import { Services } from '../../services'
import PrisonerController from '../../controllers/PrisonerController'
import { getPrisonerData, populatePrisonerDetails } from '../../middleware/populatePrisonerDetails'
import getPrisonNames from '../../middleware/getPrisonNames'
import prisonerNotFoundHandler from '../../middleware/prisonerNotFoundHandler'
import creditAPrisonerRouter from '../creditAPrisoner/creditAPrisoner'
import prisonerTransactionsRouter from './transactions/prisonerTransactions'
import prisonerHoldsRouter from './holds/prisonerHolds'

export default function routes(services: Services): Router {
  const prisonerRouter = Router()
  const prisonerController = new PrisonerController(services)

  prisonerRouter.get('/', prisonerController.getFindPrisoner)

  // default middlewares
  prisonerRouter.use(
    '/:prisonNumber',
    populatePrisonerDetails(services),
    getPrisonerData,
    getPrisonNames(services),
    prisonerNotFoundHandler,
  )

  prisonerRouter.use('/:prisonNumber/money', prisonerTransactionsRouter(services))
  prisonerRouter.use('/:prisonNumber/money', prisonerHoldsRouter(services))

  prisonerRouter.get('/:prisonNumber', prisonerController.getProfile)

  prisonerRouter.use('/:prisonNumber/money/credit-a-prisoner', creditAPrisonerRouter(services))

  return prisonerRouter
}
