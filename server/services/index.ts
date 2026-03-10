import { dataAccess } from '../data'
import PrisonerFinanceService from './prisonerFinanceService'
import AuditService from './auditService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, prisonerFinanceApiClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    prisonerFinanceService: new PrisonerFinanceService(prisonerFinanceApiClient),
  }
}

export type Services = ReturnType<typeof services>
