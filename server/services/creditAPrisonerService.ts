/* eslint-disable no-param-reassign */

import { SessionData } from 'express-session'
import CreditAPrisonerForm from '../classes/creditAPrisonerForm'

export default class CreditAPrisonerService {
  static createCreditForm(session: SessionData) {
    if (!session.creditForm) {
      session.creditForm = new CreditAPrisonerForm()
    }
  }

  static updateCreditForm(session: SessionData, updates: CreditAPrisonerForm) {
    session.creditForm = { ...session.creditForm, ...updates }
  }

  static clearCreditForm(session: SessionData) {
    session.creditForm = new CreditAPrisonerForm()
  }
}
