import { RequestHandler } from 'express'
import { Services } from '../services'
import prisonNamesCache from './prisonNamesCache'

const fiveMinutes = 5 * 60 * 1000

export default function getPrisonNames(services: Services): RequestHandler {
  return async (req, res, next) => {
    try {
      const now = Date.now()
      if (now - prisonNamesCache.lastUpdated.getTime() >= fiveMinutes) {
        prisonNamesCache.response = await services.prisonRegisterService.getPrisonNames()
        prisonNamesCache.lastUpdated = new Date(now)
      }

      res.locals.prisonNames = prisonNamesCache.response
      next()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      res.locals.prisonNames = prisonNamesCache.response
      next()
    }
  }
}
