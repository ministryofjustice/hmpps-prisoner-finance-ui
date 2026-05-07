/* eslint-disable no-param-reassign */

import { SessionData } from 'express-session'
import CreditAPrisonerForm from '../classes/creditAPrisonerForm'
import TransactionRequest from '../interfaces/TransactionRequest'

export default class CreditAPrisonerService {
  static createCreditForm(session: SessionData) {
    if (!session.creditForm) {
      session.creditForm = new CreditAPrisonerForm()
    }
  }

  static createTransactionRequest(creditAPrisonerForm: CreditAPrisonerForm): TransactionRequest {
    if (
      !creditAPrisonerForm.creditSubAccountId ||
      !creditAPrisonerForm.debitSubAccountId ||
      !creditAPrisonerForm.amount ||
      !creditAPrisonerForm.description
    )
      throw new Error(`
                        CreditAPrisonerForm is missing data:
                        creditSubAccountId: ${creditAPrisonerForm.creditSubAccountId},
                        debitSubAccountId: ${creditAPrisonerForm.debitSubAccountId},
                        amount: ${creditAPrisonerForm.amount},
                        description: ${creditAPrisonerForm.description},
                      `)

    return {
      creditSubAccountId: creditAPrisonerForm.creditSubAccountId,
      debitSubAccountId: creditAPrisonerForm.debitSubAccountId,
      amount: creditAPrisonerForm.amount,
      description: creditAPrisonerForm.description,
    }
  }

  static updateCreditForm(session: SessionData, updates: CreditAPrisonerForm) {
    session.creditForm = { ...session.creditForm, ...updates }
  }

  static clearCreditForm(session: SessionData) {
    session.creditForm = new CreditAPrisonerForm()
  }
}
