import { RequestHandler } from 'express'
import { Services } from '../services'

export default function getPrisonNames(services: Services): RequestHandler {
  return async (req, res, next) => {
    try {
      res.locals.prisonNames = await services.prisonRegisterService.getPrisonNames()
      next()
    } catch (error) {
      next(error)
    }
  }
}
