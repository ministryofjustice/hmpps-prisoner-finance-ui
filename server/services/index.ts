import { dataAccess } from '../data'
import AuditService from './auditService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, exampleApiClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
  }
}

export type Services = ReturnType<typeof services>
