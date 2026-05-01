import { SessionData } from 'express-session'
import CreditAPrisonerService from './creditAPrisonerService'
import CreditAPrisonerForm from '../classes/creditAPrisonerForm'

describe('creditAPrisonerService', () => {
  describe('.createCreditForm', () => {
    it('creates credit form on session data if not present', () => {
      const session = {} as SessionData
      CreditAPrisonerService.createCreditForm(session)
      expect(session.creditForm).toBeInstanceOf(CreditAPrisonerForm)
      expect(session.creditForm).toMatchObject({
        creditSubAccountId: undefined,
        debitSubAccountId: undefined,
        amount: undefined,
        description: undefined,
      })
    })

    it('doesnt overwrite existing creditForm data', () => {
      const existingCreditForm = new CreditAPrisonerForm()
      existingCreditForm.creditSubAccountId = 'TEST'
      existingCreditForm.debitSubAccountId = 'TEST2'
      existingCreditForm.amount = 100
      existingCreditForm.description = 'TEST3'
      const session = { creditForm: existingCreditForm } as SessionData
      CreditAPrisonerService.createCreditForm(session)
      expect(session.creditForm).toMatchObject({
        creditSubAccountId: 'TEST',
        debitSubAccountId: 'TEST2',
        amount: 100,
        description: 'TEST3',
      })
    })
  })
  describe('.updateCreditForm', () => {
    it('should update fields without overwriting others', () => {
      const existingCreditForm = new CreditAPrisonerForm()
      existingCreditForm.creditSubAccountId = 'TEST'
      existingCreditForm.debitSubAccountId = 'TEST2'
      existingCreditForm.amount = 100
      existingCreditForm.description = undefined
      const session = { creditForm: existingCreditForm } as SessionData
      CreditAPrisonerService.updateCreditForm(session, { description: 'new description', amount: 200 })
      expect(session.creditForm).toMatchObject({
        creditSubAccountId: 'TEST',
        debitSubAccountId: 'TEST2',
        amount: 200,
        description: 'new description',
      })
    })
  })
  describe('.clearCreditForm', () => {
    it('should reset a credit form to a blank copy', () => {
      const existingCreditForm = new CreditAPrisonerForm()
      existingCreditForm.creditSubAccountId = 'TEST'
      existingCreditForm.debitSubAccountId = 'TEST2'
      existingCreditForm.amount = 100
      existingCreditForm.description = 'description'
      const session = { creditForm: existingCreditForm } as SessionData
      CreditAPrisonerService.clearCreditForm(session)
      expect(session.creditForm).toMatchObject({
        creditSubAccountId: undefined,
        debitSubAccountId: undefined,
        amount: undefined,
        description: undefined,
      })
    })
  })
})
