import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import e, { Request, Response } from 'express'
import { ApplicationInfo } from '../applicationInfo'
import AuditService from '../services/auditService'
import PrisonerFinanceService from '../services/prisonerFinanceService'
import PrisonRegisterService from '../services/prisonRegisterService'
import PrisonerController from './PrisonerController'
import PrisonerSearchService from '../services/prisonerSearchService'

jest.mock('../applicationInfo')
jest.mock('../services/auditService')
jest.mock('../services/prisonerFinanceService')
jest.mock('../services/PrisonerSearchService')
jest.mock('../services/prisonRegisterService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

describe('PrisonerController - Transactions', () => {
  let applicationInfo
  let auditService: jest.Mocked<AuditService>
  let prisonerFinanceService: jest.Mocked<PrisonerFinanceService>
  let prisonerSearchService
  let prisonRegisterService
  let prisonPermissionsService

  let prisonerController: PrisonerController
  let mockRes: Response
  let mockNext: e.NextFunction

  beforeEach(() => {
    applicationInfo = {} as unknown as jest.Mocked<ApplicationInfo>
    auditService = new AuditService(null) as jest.Mocked<AuditService>
    prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
    prisonerSearchService = {} as unknown as jest.Mocked<PrisonerSearchService>
    prisonRegisterService = {} as unknown as jest.Mocked<PrisonRegisterService>
    prisonPermissionsService = {} as unknown as jest.Mocked<PermissionsService>

    prisonerController = new PrisonerController({
      applicationInfo,
      auditService,
      prisonerFinanceService,
      prisonerSearchService,
      prisonRegisterService,
      prisonPermissionsService,
    })

    mockRes = {
      locals: { user: { username: 'test-user' } },
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    mockNext = jest.fn()
  })

  it('Should not call getTransaction if there are validation Errors', async () => {
    const mockReq = {
      id: 'req-id-123',
      query: { startDate: 'AAAAAA' },
      params: { prisonNumber: 'ABC123XX' },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000'),
      originalUrl: '/audit',
    } as unknown as Request

    prisonerFinanceService.getAccountBalance.mockResolvedValue({ accountId: '', balanceDateTime: '', amount: 10 })

    await prisonerController.transactions(mockReq, mockRes, mockNext)

    expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).not.toHaveBeenCalled()
    expect(prisonerFinanceService.getAccountBalance).toHaveBeenCalled()
  })
})
