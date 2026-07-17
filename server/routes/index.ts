import { Router } from 'express'
import type { Services } from '../services'
import homeRouter from './home/router'
import prisonerRouter from './prisoner'
import grantBonusRouter from './grantBonusToPrisoners'
import PrisonerImageRoutes from './prisonerImageRoutes'

export default function routes(services: Services): Router {
  const router = Router()

  router.get('/prisoner-image/:prisonNumber', new PrisonerImageRoutes(services.prisonApiService).GET)

  router.get('*any', (req, res, next) => {
    res.locals.originalUrl = req.originalUrl // for use by prisoner profile back link
    next()
  })

  router.get('/', homeRouter(services))
  router.use('/prisoner', prisonerRouter(services))
  router.use('/grant-bonus-to-prisoners', grantBonusRouter(services))

  return router
}
