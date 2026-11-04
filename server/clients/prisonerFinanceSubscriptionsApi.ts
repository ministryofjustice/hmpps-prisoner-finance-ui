import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { Page } from '../interfaces/Pageable'
import { PrisonerSubscriptionResponse } from '../interfaces/PrisonerSubscriptionResponse'

export default class PrisonerFinanceSubscriptionsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super(
      'Prisoner Finance Subscriptions API',
      config.apis.prisonerFinanceSubscriptionsApi,
      logger,
      authenticationClient,
    )
  }

  getSubscriptions(prisonNumber: string, pageNumber: string): Promise<Page<PrisonerSubscriptionResponse>> {
    return this.get(
      {
        path: `/subscriptions/account/${prisonNumber}`,
        query: {
          pageNumber,
          pageSize: '25',
        },
      },
      asSystem(),
    )
  }
}
