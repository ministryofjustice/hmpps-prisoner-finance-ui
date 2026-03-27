import PrisonRegisterApiClient from '../clients/prisonRegisterApiClient'
import { PrisonRegisterName } from '../interfaces/prisonRegisterName'

export default class PrisonRegisterService {
  constructor(private readonly prisonRegisterApiClient: PrisonRegisterApiClient) {}

  getPrisonNames(): Promise<PrisonRegisterName[]> {
    return this.prisonRegisterApiClient.getPrisonNames()
  }
}
