import { Response } from 'express'
import { Readable } from 'stream'
import { asSystem } from '@ministryofjustice/hmpps-rest-client'

import PrisonApiClient from '../clients/prisonApiClient'
import ActiveCaseloadResponse from '../interfaces/ActiveCaseloadResponse'

export type ApiRequestContext = {
  res: Response
  readOnly?: boolean
}

export default class PrisonApiService {
  constructor(private readonly prisonApiClient: PrisonApiClient) {}

  getUserCaseloads(accessToken: string): Promise<ActiveCaseloadResponse[]> {
    return this.prisonApiClient.getCaseloadsForCurrentUser(accessToken)
  }

  getPrisonerImage({ res }: ApiRequestContext, prisonNumber: string): Promise<Readable> {
    return this.prisonApiClient.stream(
      { path: `/api/bookings/offenderNo/${prisonNumber}/image/data` },
      asSystem(res.locals.user.username),
    )
  }
}
