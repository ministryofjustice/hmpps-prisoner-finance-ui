import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem, asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { PrisonRegisterName } from '../interfaces/prisonRegisterName'

export default class PrisonRegisterApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prison Register API', config.apis.prisonRegister, logger, authenticationClient)
  }

  async getPrisonNames(): Promise<PrisonRegisterName[]> {
    return this.get(
      {
        path: `/prisons/names`,
      },
      asSystem(),
    )
  }
}
