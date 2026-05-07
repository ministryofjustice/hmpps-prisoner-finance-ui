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
      existingCreditForm.amount = '100'
      existingCreditForm.description = 'TEST3'
      const session = { creditForm: existingCreditForm } as SessionData
      CreditAPrisonerService.createCreditForm(session)
      expect(session.creditForm).toMatchObject({
        creditSubAccountId: 'TEST',
        debitSubAccountId: 'TEST2',
        amount: '100',
        description: 'TEST3',
      })
    })
  })
  describe('.updateCreditForm', () => {
    it('should update fields without overwriting others', () => {
      const existingCreditForm = new CreditAPrisonerForm()
      existingCreditForm.creditSubAccountId = 'TEST'
      existingCreditForm.debitSubAccountId = 'TEST2'
      existingCreditForm.amount = '100'
      existingCreditForm.description = undefined
      const session = { creditForm: existingCreditForm } as SessionData
      CreditAPrisonerService.updateCreditForm(session, { description: 'new description', amount: '200' })
      expect(session.creditForm).toMatchObject({
        creditSubAccountId: 'TEST',
        debitSubAccountId: 'TEST2',
        amount: '200',
        description: 'new description',
      })
    })
  })
  describe('.clearCreditForm', () => {
    it('should reset a credit form to a blank copy', () => {
      const existingCreditForm = new CreditAPrisonerForm()
      existingCreditForm.creditSubAccountId = 'TEST'
      existingCreditForm.debitSubAccountId = 'TEST2'
      existingCreditForm.amount = '100'
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

  describe('createTransactionRequest', () => {
    test('should create a TransactionRequest when all data is present', () => {
      const creditAPrisonerForm = new CreditAPrisonerForm()
      creditAPrisonerForm.amount = '10'
      creditAPrisonerForm.creditSubAccountId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
      creditAPrisonerForm.debitSubAccountId = '3fa85f64-5717-4562-b3fc-2c963f66afXX'
      creditAPrisonerForm.description = 'test'

      const transactionReq = CreditAPrisonerService.createTransactionRequest(creditAPrisonerForm)

      expect(transactionReq.amount).toBe(creditAPrisonerForm.amount)
      expect(transactionReq.creditSubAccountId).toBe(creditAPrisonerForm.creditSubAccountId)
      expect(transactionReq.debitSubAccountId).toBe(creditAPrisonerForm.debitSubAccountId)
      expect(transactionReq.description).toBe(creditAPrisonerForm.description)
    })

    describe('CreditAPrisonerForm validation', () => {
      test.each([['amount'], ['creditSubAccountId'], ['debitSubAccountId'], ['description']])(
        'should throw an error when %s is missing',
        field => {
          const creditAPrisonerForm = new CreditAPrisonerForm()
          creditAPrisonerForm.amount = '10'
          creditAPrisonerForm.creditSubAccountId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
          creditAPrisonerForm.debitSubAccountId = '3fa85f64-5717-4562-b3fc-2c963f66afXX'
          creditAPrisonerForm.description = 'test'

          delete creditAPrisonerForm[field as keyof CreditAPrisonerForm]

          expect(() => {
            CreditAPrisonerService.createTransactionRequest(creditAPrisonerForm)
          }).toThrow()
        },
      )
    })
  })
})
