import { AuthenticationClient, dataAccess } from '../data'
import AuditService from './auditService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, hmppsAuthClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    authClient: hmppsAuthClient
  }
}

export type Services = ReturnType<typeof services>
