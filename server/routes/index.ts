import { Router } from 'express'

import type { Services } from '../services'
import { Page } from '../services/auditService'

import prisonerRouter from './prisoner'

export default function routes(services: Services): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    await services.auditService.logPageView(Page.INDEX, { who: res.locals.user.username, correlationId: req.id })
    res.render('pages/index')
  })

  router.use('/prisoner', prisonerRouter(services))

  return router
}
