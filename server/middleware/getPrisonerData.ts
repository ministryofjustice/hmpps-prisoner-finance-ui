import { RequestHandler } from 'express'
import { Services } from '../services'

export default function getPrisonerData(services: Services): RequestHandler {
  return async (req, res, next) => {
    try {
      const prisonNumber = req.params.prisonNumber as string
      res.locals.prisoner = await services.prisonerSearchService.getPrisoner(prisonNumber)
      next()
    } catch (error) {
      next(error)
    }
  }
}
