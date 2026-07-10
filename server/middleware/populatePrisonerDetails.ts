import { Request, Response, NextFunction } from 'express'
import { PrisonerMoneyPermission, prisonerPermissionsGuard } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Prisoner } from '../interfaces/prisoner'
import PrisonerDetails from '../@types/prisonerDetails'
import { Services } from '../services'

export const populatePrisonerDetails = ({ prisonPermissionsService }: Services) =>
  prisonerPermissionsGuard(prisonPermissionsService, {
    requestDependentOn: [PrisonerMoneyPermission.read],
    getPrisonerNumberFunction: req => req.params.prisonNumber as string,
  })

export const toPrisonerDetails = (prisoner: Prisoner): PrisonerDetails => ({
  prisonerNumber: prisoner.prisonerNumber,
  lastName: prisoner.lastName,
  firstName: prisoner.firstName,
  dateOfBirth: prisoner.dateOfBirth,
  prisonName: prisoner.prisonName,
  cellLocation: prisoner.cellLocation,
})

export const getPrisonerData = (req: Request, res: Response, next: NextFunction): void => {
  if (req.middleware?.prisonerData) {
    res.locals.prisonerDetails = toPrisonerDetails(req.middleware.prisonerData)
  }

  return next()
}
