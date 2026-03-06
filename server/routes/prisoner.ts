import { Router } from 'express'
import { Services } from '../services'
import { Page } from '../services/auditService'

export default function routes({ auditService }: Services): Router {
  const prisonerRouter = Router()

  prisonerRouter.get('/:prisonNumber/money', )

  return prisonerRouter
}
