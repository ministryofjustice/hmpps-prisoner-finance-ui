import { Router } from 'express'
import { Services } from '../services'
import PrisonerController from '../controllers/PrisonerController'

export default function routes(services: Services): Router {
  const prisonerRouter = Router()

  const prisonerController = new PrisonerController(services)

  prisonerRouter.get('/:prisonNumber/money', prisonerController.transactions)

  return prisonerRouter
}
