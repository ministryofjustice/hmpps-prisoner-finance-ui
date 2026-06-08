/* eslint-disable no-param-reassign */

import { SessionData } from 'express-session'
import GrantBonusForm from '../interfaces/GrantBonusForm'
import { CreateBatchTransactionFormRequest } from '../interfaces/BatchTransactionFormRequest'

export default class GrantBonusToPrisonersService {
  static createGrantBonusFormIfRequired(session: SessionData) {
    if (!session.grantBonusForm) {
      session.grantBonusForm = {}
    }
  }

  /*
  static createBonusRequest(grantBonusForm: GrantBonusForm): unknown {
    throw Error("Not implemented")
  } */

  static updateGrantBonusForm(session: SessionData, updates: Partial<GrantBonusForm>) {
    session.grantBonusForm = { ...session.grantBonusForm, ...updates }
  }

  static clearGrantBonusForm(session: SessionData) {
    session.grantBonusForm = {}
  }

  static buildGrantBonusRequest(grantBonusForm: SessionData['grantBonusForm']) {
    const createBatchTransactionRequest: CreateBatchTransactionFormRequest = {
      caseloadId: grantBonusForm.caseloadId,
      caseloadSubAccountRef: '1504:DEM',
      postingType: 'DR',
      controlAmount: grantBonusForm.amountPerPrisoner * grantBonusForm.prisonNumbers.length,
      description: grantBonusForm.description,
      prisonNumbersPostings: grantBonusForm.prisonNumbers.map(pn => ({
        prisonNumber: pn,
        prisonerSubAccountRef: 'CASH',
        amount: grantBonusForm.amountPerPrisoner,
        postingType: 'CR',
      })),
    }
    return createBatchTransactionRequest
  }
}
