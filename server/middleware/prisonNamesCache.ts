import { PrisonRegisterName } from '../interfaces/prisonRegisterName'

export type PrisonNamesCache = { response: PrisonRegisterName[]; lastUpdated: Date }

const prisonNamesCache: PrisonNamesCache = {
  response: [],
  lastUpdated: new Date(1970, 0, 1, 0, 0, 0, 0),
}

export default prisonNamesCache
