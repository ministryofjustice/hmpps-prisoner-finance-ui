import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'
import getErrorStatus from './utils/getErrorStatus'

export default function createErrorHandler(production: boolean) {
  return (
    error: HTTPError & { responseStatus?: number; cause?: unknown },
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    if (error.cause) {
      logger.error(`Caused by upstream error for '${req.originalUrl}'`, error.cause)
    }

    const status = getErrorStatus(error) ?? 500

    res.locals.message = production
      ? 'Something went wrong. The error has been logged. Please try again'
      : error.message
    res.locals.status = production ? null : status
    res.locals.stack = production ? null : error.stack

    if (status === 401 || status === 403) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    // hmpps-rest-client errors expose the upstream status as `responseStatus`; http-errors use `status`.
    if ((error.status ?? error.responseStatus) === 404) {
      res.status(404)
      return res.render('pages/not-found')
    }

    res.status(status)

    res.locals.prisonerDetails = null
    return res.render('pages/internal-server-error')
  }
}
