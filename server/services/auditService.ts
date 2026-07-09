import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum AuditPage {
  PRISONER_FINANCE_HOME_PAGE = 'PRISONER_FINANCE_HOME_PAGE',
  FIND_PRISONER = 'FIND_PRISONER_PAGE',
  PRISONER_FINANCIAL_PROFILE_PAGE = 'PRISONER_FINANCIAL_PROFILE_PAGE',

  // Transaction pages
  PRISONER_TRANSACTIONS = 'PRISONER_TRANSACTIONS_PAGE',
  PRISONER_CASH_TRANSACTIONS = 'PRISONER_CASH_TRANSACTIONS_PAGE',
  PRISONER_SPENDS_TRANSACTIONS = 'PRISONER_SPENDS_TRANSACTIONS_PAGE',
  PRISONER_SAVINGS_TRANSACTIONS = 'PRISONER_SAVINGS_TRANSACTIONS_PAGE',

  // Credit a prisoner wizard
  CREDIT_A_PRISONER_WIZARD_TO = 'CREDIT_A_PRISONER_WIZARD_TO_PAGE',
  CREDIT_A_PRISONER_WIZARD_FROM = 'CREDIT_A_PRISONER_WIZARD_FROM_PAGE',
  CREDIT_A_PRISONER_WIZARD_AMOUNT = 'CREDIT_A_PRISONER_WIZARD_AMOUNT_PAGE',
  CREDIT_A_PRISONER_WIZARD_CONFIRMATION = 'CREDIT_A_PRISONER_WIZARD_CONFIRMATION_PAGE',

  // Grant bonus wizard
  GRANT_BONUS_WIZARD_SELECT_CASELOAD = 'GRANT_BONUS_WIZARD_SELECT_CASELOAD_PAGE',
  GRANT_BONUS_WIZARD_SELECT_AMOUNT = 'GRANT_BONUS_WIZARD_SELECT_AMOUNT_PAGE',
  GRANT_BONUS_WIZARD_CONFIRMATION = 'GRANT_BONUS_WIZARD_CONFIRMATION_PAGE',
}

export enum SearchRequest {
  FIND_PRISONER = 'FIND_PRISONER_SEARCH',
}

export enum SubjectType {
  PRISONER = 'PRISONER_ID',
  PRISON = 'PRISON_ID',
}

// "subjectType":"SEARCH_TERM", "subjectId":"A9613AZ"

export interface AuditEventDetails {
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

  async logPageView(page: AuditPage, eventDetails: AuditEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: `PAGE_VIEW_${page}`,
    }
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logSearchRequest(searchRequest: SearchRequest, eventDetails: AuditEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: `SEARCH_REQUEST_${searchRequest}`,
    }
    await this.hmppsAuditClient.sendMessage(event)
  }
}
