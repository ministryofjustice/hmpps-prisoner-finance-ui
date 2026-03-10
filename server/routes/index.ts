import { Router } from 'express'

import type { Services } from '../services'
import { Page } from '../services/auditService'
import { PrisonerFinanceWrapper } from '../client-wrappers/prisoner-finance-api'

export default function routes({ auditService, authClient }: Services): Router {
  const router = Router()

  var prisonerFinanceWrapper = new PrisonerFinanceWrapper(authClient);

  prisonerFinanceWrapper.getListOfTransactionsByAccountId("10f8546b-c3d3-4795-a1b6-2848f56b1ae6").then(x => {
    console.log(x)
  });

  var prisonerFinanceWrapper = new PrisonerFinanceWrapper(authClient);

  prisonerFinanceWrapper.getListOfTransactionsByAccountId("10f8546b-c3d3-4795-a1b6-2848f56b1ae6").then(x => {
    console.log(x)
  });

  router.get('/', async (req, res) => {
    await auditService.logPageView(Page.INDEX, { who: res.locals.user.username, correlationId: req.id })
    res.render('pages/index')
  })

  return router
}
