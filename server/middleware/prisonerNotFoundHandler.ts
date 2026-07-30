import { NextFunction, Request, Response } from 'express'
import getErrorStatus, { StatusBearingError } from '../utils/getErrorStatus'

export default function prisonerNotFoundHandler(
  error: Error & StatusBearingError,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const status = getErrorStatus(error)
  if (status === 404 || status === 403) {
    res.status(404).render('pages/prisoner-not-found')
    return
  }
  next(error)
}
