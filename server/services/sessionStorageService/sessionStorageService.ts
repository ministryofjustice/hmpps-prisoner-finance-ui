import CreditPrisonerForm from '../../classes/creditPrisonerForm'

declare module 'express-session' {
  interface SessionData {
    creditForm?: CreditPrisonerForm
  }
}
