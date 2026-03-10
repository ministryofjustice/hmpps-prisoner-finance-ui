import { PermissionsService as PrisonPermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { dataAccess } from '../data'
import PrisonerFinanceService from './prisonerFinanceService'
import AuditService from './auditService'

import config from '../config'
import logger from '../../logger'
import PrisonerSearchService from './prisonerSearchService'

export const services = () => {
  const {
    applicationInfo,
    hmppsAuditClient,
    hmppsAuthClient,
    prisonerFinanceApiClient,
    prisonerSearchApiClient,
    telemetryClient,
  } = dataAccess()

  const prisonPermissionsService = PrisonPermissionsService.create({
    prisonerSearchConfig: config.apis.prisonerSearch,
    authenticationClient: hmppsAuthClient,
    logger,
    telemetryClient,
  })

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    prisonerFinanceService: new PrisonerFinanceService(prisonerFinanceApiClient),
    prisonerSearchService: new PrisonerSearchService(prisonerSearchApiClient),
    prisonPermissionsService,
  }
}

export type Services = ReturnType<typeof services>
