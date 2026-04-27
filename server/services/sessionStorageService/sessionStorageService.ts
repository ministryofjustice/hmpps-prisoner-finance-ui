import { CreditPrisonerForm } from '../../interfaces/creditPrisonerForm'

declare module 'express-session' {
  interface SessionData {
    creditForm?: CreditPrisonerForm
  }
}
