import CreditAPrisonerForm from '../../classes/creditAPrisonerForm'

// Express-session does not have type inference, so this extends the object for our form data
declare module 'express-session' {
  interface SessionData {
    creditForm?: CreditAPrisonerForm
  }
}
