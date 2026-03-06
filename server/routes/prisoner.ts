import { Router } from 'express'
import { Services } from '../services'
import { Page } from '../services/auditService'

export default function routes({ auditService }: Services): Router {
  const prisonerRouter = Router()

  prisonerRouter.get('/:prisonNumber/money', (req, res, next) => {
    auditService.logPageView(Page.PRISONER_PRISONNUMBER_MONEY, { who: res.locals.user.username, correlationId: req.id })
    res.render('pages/prisonerTransactions')
  })

  return prisonerRouter
}
