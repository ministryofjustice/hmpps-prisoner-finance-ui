import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import e, { Request, Response } from 'express'
import { ApplicationInfo } from '../applicationInfo'
import AuditService from '../services/auditService'
import PrisonerFinanceService from '../services/prisonerFinanceService'
import PrisonRegisterService from '../services/prisonRegisterService'
import PrisonerController from './PrisonerController'
import PrisonerSearchService from '../services/prisonerSearchService'
import { AccountBalanceResponse } from '../interfaces/AccountBalanceResponse'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'

jest.mock('../applicationInfo')
jest.mock('../services/auditService')
jest.mock('../services/prisonerFinanceService')
jest.mock('../services/prisonerSearchService')
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

  const mockBalance: AccountBalanceResponse = { accountId: '', balanceDateTime: '', amount: 10 }

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
  test.each([
    ['AAAA', undefined],
    ['99/99/9999', '123231321'],
    [undefined, 'WOWOW'],
  ])('Should not call getTransaction if there are validation Errors', async (startDate, endDate) => {
    const mockReq = {
      id: 'req-id-123',
      query: { startDate, endDate },
      params: { prisonNumber: 'ABC123XX' },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000'),
      originalUrl: '/audit',
    } as unknown as Request

    prisonerFinanceService.getAccountBalance.mockResolvedValue(mockBalance)

    await prisonerController.transactions(mockReq, mockRes, mockNext)

    expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).not.toHaveBeenCalled()
    expect(prisonerFinanceService.getAccountBalance).toHaveBeenCalledWith(mockReq.params.prisonNumber)
    expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerTransactions', {
      prisonNumber: mockReq.params.prisonNumber,
      applicationName: 'Transactions',
      transactions: [],
      balance: mockBalance.amount,
      filters: {
        startDate,
        endDate,
        selectedFilters: expect.anything(),
      },
      errorMap: expect.anything(),
      errors: expect.anything(),
    })
  })

  test.each([
    [undefined, undefined],
    ['10/10/2010', undefined],
    ['10/10/2010', '10/10/2020'],
    [undefined, '10/10/2020'],
  ])('Should  call getTransaction if there are no validation Errors', async (startDate, endDate) => {
    const mockReq = {
      id: 'req-id-123',
      query: { startDate, endDate },
      params: { prisonNumber: 'ABC123XX' },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000'),
      originalUrl: '/audit',
    } as unknown as Request

    prisonerFinanceService.getAccountBalance.mockResolvedValue(mockBalance)
    const mockTransactions: PrisonerTransactionResponse[] = [
      {
        date: '10-10-2010',
        description: 'Canteen transaction',
        credit: 10,
        debit: 10,
        location: 'LEI',
        accountType: 'CASH',
      },
    ]
    prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactions)

    await prisonerController.transactions(mockReq, mockRes, mockNext)

    expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalled()
    expect(prisonerFinanceService.getAccountBalance).toHaveBeenCalledWith(mockReq.params.prisonNumber)
    expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerTransactions', {
      prisonNumber: mockReq.params.prisonNumber,
      applicationName: 'Transactions',
      transactions: mockTransactions,
      balance: mockBalance.amount,
      filters: {
        startDate,
        endDate,
        selectedFilters: expect.anything(),
      },
    })
  })

  it('should catch exceptions', async () => {
    const mockReq = {
      id: 'req-id-123',
      params: { prisonNumber: 'ABC123XX' },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000'),
      originalUrl: '/audit',
    } as unknown as Request

    auditService.logPageView.mockImplementation(() => {
      throw new Error('Expected error')
    })

    await prisonerController.transactions(mockReq, mockRes, mockNext)

    expect(mockRes.render).not.toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalled()
  })
})
