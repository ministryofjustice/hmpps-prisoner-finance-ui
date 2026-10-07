import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { Request, Response } from 'express'
import { ApplicationInfo } from '../applicationInfo'
import AuditService from '../services/auditService'
import PrisonApiService from '../services/prisonApiService'
import PrisonerFinanceService from '../services/prisonerFinanceService'
import PrisonerSearchService from '../services/prisonerSearchService'
import PrisonRegisterService from '../services/prisonRegisterService'
import getPrisonNames from './getPrisonNames'
import FeatureFlagService from '../services/featureFlagService'
import PrisonerFinanceHoldsService from '../services/prisonerFinanceHoldsService'
import prisonNamesCache from './prisonNamesCache'

jest.mock('../services/prisonRegisterService')
jest.mock('./prisonNamesCache')

describe('getPrisonNames', () => {
  const applicationInfo = null as undefined as ApplicationInfo
  const auditService = null as undefined as AuditService
  const prisonerFinanceService = null as undefined as PrisonerFinanceService
  const prisonerSearchService = null as undefined as PrisonerSearchService
  const prisonRegisterService = new PrisonRegisterService(null) as jest.Mocked<PrisonRegisterService>
  const prisonApiService = null as undefined as PrisonApiService
  const prisonPermissionsService = null as undefined as PermissionsService
  const featureFlagService = null as undefined as FeatureFlagService
  const prisonerFinanceHoldsService = null as undefined as PrisonerFinanceHoldsService

  let mockReq: Request
  let mockRes: Response
  const mockNext = () => {}

  const services = {
    applicationInfo,
    auditService,
    prisonerFinanceService,
    prisonerSearchService,
    prisonRegisterService,
    prisonApiService,
    prisonPermissionsService,
    featureFlagService,
    prisonerFinanceHoldsService,
  }

  beforeEach(() => {
    jest.resetAllMocks()
    mockReq = {} as undefined as Request
    mockRes = { locals: {} } as undefined as Response
    prisonNamesCache.response = []
    prisonNamesCache.lastUpdated = new Date(1970, 0, 1, 0, 0, 0, 0)
  })

  const prisonNames = [
    {
      prisonId: 'LEI',
      prisonName: 'Leeds (HMP)',
    },
  ]

  test('Should call prisonRegister and get the prisonNames', async () => {
    prisonRegisterService.getPrisonNames.mockResolvedValue(prisonNames)

    const returnFunction = getPrisonNames(services)

    await returnFunction(mockReq, mockRes, mockNext)

    expect(prisonRegisterService.getPrisonNames).toHaveBeenCalledWith()
    expect(mockRes.locals.prisonNames).toBe(prisonNames)
  })

  test('Should return an empty list for prisonNames if prisonRegister errors', async () => {
    prisonRegisterService.getPrisonNames.mockRejectedValue(new Error('whoops'))

    const returnFunction = getPrisonNames(services)

    await returnFunction(mockReq, mockRes, mockNext)

    expect(prisonRegisterService.getPrisonNames).toHaveBeenCalled()
    expect(mockRes.locals.prisonNames).toHaveLength(0)
  })

  test('Should not call API if cache is newer than 5 minutes', async () => {
    prisonNamesCache.lastUpdated = new Date()

    const returnFunction = getPrisonNames(services)

    await returnFunction(mockReq, mockRes, mockNext)

    expect(prisonRegisterService.getPrisonNames).not.toHaveBeenCalled()
    expect(mockRes.locals.prisonNames).toHaveLength(0)
  })

  test('Should call API if cache is older than 5 minutes', async () => {
    prisonNamesCache.lastUpdated = new Date(1970, 0, 1, 0, 0, 0, 0)

    prisonRegisterService.getPrisonNames.mockResolvedValue(prisonNames)

    const returnFunction = getPrisonNames(services)

    await returnFunction(mockReq, mockRes, mockNext)

    expect(prisonRegisterService.getPrisonNames).toHaveBeenCalled()
    expect(mockRes.locals.prisonNames).toBe(prisonNames)
  })
})
