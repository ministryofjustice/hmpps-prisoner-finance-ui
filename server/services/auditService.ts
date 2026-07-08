import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum AuditPage {
  PRISONER_FINANCE_HOME_PAGE = 'PRISONER_FINANCE_HOME_PAGE',
  PRISONER_FINANCIAL_PROFILE_PAGE = 'PRISONER_FINANCIAL_PROFILE_PAGE',
  // PRISONER_TRANSACTION_PAGES, CASH, SPENDS, SAVINGS, ALL
  PRISONER_TRANSACTION_PAGE_ALL = 'PRISONER_TRANSACTION_PAGE_ALL',
  PRISONER_TRANSACTION_PAGE_CASH = 'PRISONER_TRANSACTION_PAGE_CASH',
  PRISONER_TRANSACTION_PAGE_SPENDS = 'PRISONER_TRANSACTION_PAGE_SPENDS',
  PRISONER_TRANSACTION_PAGE_SAVINGS = 'PRISONER_TRANSACTION_PAGE_SAVINGS',
  CREDIT_A_PRISONER_WIZARD_TO = 'CREDIT_A_PRISONER_WIZARD_TO_PAGE',
  CREDIT_A_PRISONER_WIZARD_FROM = 'CREDIT_A_PRISONER_WIZARD_FROM_PAGE',
  CREDIT_A_PRISONER_WIZARD_AMOUNT = 'CREDIT_A_PRISONER_WIZARD_AMOUNT',
  CREDIT_A_PRISONER_WIZARD_CONFIRMATION = 'CREDIT_A_PRISONER_WIZARD_CONFIRMATION_PAGE',
  GRANT_BONUS_CASELOAD = 'GRANT_BONUS_CASELOAD_SELECTION_PAGE',
  FIND_PRISONER = 'FIND_PRISONER_PAGE',
}

export enum SubjectType {
  PRISONER = 'PRISONER_ID',
}

// {
// "what":"PAGE_VIEW_ACCESS_ATTEMPT", AuditPage
// "service":"hmpps-external-movements-ui", configured
// "correlationId":"e1002d835c1a89971794a997167124c8", auto added
// "when":"2026-07-08T10:47:28.2850000Z", - auto added
// "subjectType":"PRISONER_ID", - string
// "who":"PQK43S", - auto added
// "subjectId":"A7615AQ" -- prisonerNumber
// }
// "subjectType":"SEARCH_TERM", "subjectId":"A9613AZ"

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
