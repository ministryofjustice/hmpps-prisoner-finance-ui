import { NextFunction, Request, Response } from 'express'

// hmpps-rest-client errors expose the upstream status as `responseStatus`; http-errors use `status`.
export default function prisonerNotFoundHandler(
  error: Error & { status?: number; responseStatus?: number },
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const status = error.status ?? error.responseStatus
  if (status === 404 || status === 403) {
    res.status(404).render('pages/prisoner-not-found')
    return
  }
  next(error)
}
