/* eslint-disable no-param-reassign */

import { SessionData } from 'express-session'
import GrantBonusForm from '../interfaces/GrantBonusForm'

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
}
