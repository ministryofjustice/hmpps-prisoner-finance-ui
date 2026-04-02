import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum AuditPage {
  INDEX = 'INDEX_PAGE',
  PRISONER_MONEY = 'PRISONER_MONEY_PAGE',
  PRISONER_PROFILE = 'PRISONER_PROFILE_PAGE',
}

export interface PageViewEventDetails {
  who: string
  subjectId?: string
  subjectType?: string
  correlationId?: string
  details?: object
}

export default class AuditService {
  constructor(private readonly hmppsAuditClient: HmppsAuditClient) {}

  async logAuditEvent(event: AuditEvent) {
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logPageView(page: AuditPage, eventDetails: PageViewEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: `PAGE_VIEW_${page}`,
    }
    await this.hmppsAuditClient.sendMessage(event)
  }
}
