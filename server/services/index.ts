import PrisonerFinanceApiClient from '../clients/prisonerFinanceApi'
import { AuthenticationClient, dataAccess } from '../data'
import AuditService from './auditService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, prisonerFinanceApiClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
  }
}

export type Services = ReturnType<typeof services>
