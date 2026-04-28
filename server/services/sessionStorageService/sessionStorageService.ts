import CreditAPrisonerForm from '../../classes/creditAPrisonerForm'

declare module 'express-session' {
  interface SessionData {
    creditForm?: CreditAPrisonerForm
  }
}
