import { RequestHandler } from 'express'
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

export const getPrisonerData = ({ prisonerSearchService }: Services): RequestHandler => {
  return async (req, res, next) => {
    try {
      const prisonNumber = req.params.prisonNumber as string

      const prisonerDetails = await prisonerSearchService.getPrisoner(prisonNumber)
      console.log('prisonerDetails', prisonerDetails)

      res.locals.prisonerDetails = toPrisonerDetails(prisonerDetails)
      console.log('localPrisonerDetails', res.locals.prisonerDetails)
      next()
    } catch (error) {
      next(error)
    }
  }
}
