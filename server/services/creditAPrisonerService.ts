/* eslint-disable no-param-reassign */

import { SessionData } from 'express-session'
import CreditPrisonerForm from '../classes/creditPrisonerForm'

export default class CreditAPrisonerService {
  createCreditForm(session: SessionData) {
    if (!session.creditForm) {
      session.creditForm = new CreditPrisonerForm()
    }
  }

  updateCreditForm(session: SessionData, updates: CreditPrisonerForm) {
    session.creditForm = { ...session.creditForm, ...updates }
  }

  clearCreditForm(session: SessionData) {
    session.creditForm = new CreditPrisonerForm()
  }
}
