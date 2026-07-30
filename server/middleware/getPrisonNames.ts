import { RequestHandler } from 'express'
import { Services } from '../services'
import logger from '../../logger'

export default function getPrisonNames(services: Services): RequestHandler {
  return async (_, res, next) => {
    try {
      res.locals.prisonNames = await services.prisonRegisterService.getPrisonNames()
    } catch (error) {
      logger.warn('Failed to load prison names, falling back to prison IDs', error)
      res.locals.prisonNames = []
    }
    next()
  }
}
