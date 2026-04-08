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
import { Page } from '../interfaces/Pageable'

jest.mock('../applicationInfo')
jest.mock('../services/auditService')
jest.mock('../services/prisonerFinanceService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/prisonRegisterService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

describe('PrisonerController - Transactions', () => {
  const applicationInfo = {} as unknown as jest.Mocked<ApplicationInfo>
  const auditService = new AuditService(null) as jest.Mocked<AuditService>
  const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
  const prisonerSearchService = {} as unknown as jest.Mocked<PrisonerSearchService>
  const prisonRegisterService = {} as unknown as jest.Mocked<PrisonRegisterService>
  const prisonPermissionsService = {} as unknown as jest.Mocked<PermissionsService>

  const prisonerController: PrisonerController = new PrisonerController({
    applicationInfo,
    auditService,
    prisonerFinanceService,
    prisonerSearchService,
    prisonRegisterService,
    prisonPermissionsService,
  })

  const mockRes: Response = {
    locals: { user: { username: 'test-user' } },
    render: jest.fn(),
    status: jest.fn().mockReturnThis(),
  } as unknown as Response

  const mockNext: e.NextFunction = jest.fn()

  const mockBalance: AccountBalanceResponse = { accountId: '', balanceDateTime: '', amount: 10 }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    { case: 'Invalid startDate', startDate: 'AAAA', endDate: undefined, credit: undefined, debit: undefined },
    {
      case: 'Invalid startDate and endDate',
      startDate: '99/99/9999',
      endDate: '123231321',
      credit: undefined,
      debit: undefined,
    },
    { case: 'Invalid endDate', startDate: undefined, endDate: 'WOWOW', credit: undefined, debit: undefined },
    { case: 'Invalid credit', startDate: undefined, endDate: undefined, credit: 'xxxx', debit: undefined },
    { case: 'Invalid debit', startDate: undefined, endDate: undefined, credit: undefined, debit: 'xxxx' },
  ])(`Should not call getTransaction when $case`, async ({ startDate, endDate, credit, debit }) => {
    const mockReq = {
      id: 'req-id-123',
      query: { startDate, endDate, credit, debit },
      params: { prisonNumber: 'ABC123XX' },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000'),
      originalUrl: '/audit',
    } as unknown as Request

    prisonerFinanceService.getAccountBalance.mockResolvedValue(mockBalance)

    await prisonerController.getTransactions(mockReq, mockRes, mockNext)

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
        credit,
        debit,
        selectedFilters: expect.anything(),
      },
      hasValidationErrors: true,
      errorMap: expect.anything(),
      errors: expect.anything(),
    })
  })

  test.each([
    { case: 'Both startDate and endDate are undefined', startDate: undefined, endDate: undefined },
    { case: 'Just startDate is defined', startDate: '10/10/2010', endDate: undefined },
    { case: 'Both startDate and endDate are defined', startDate: '10/10/2010', endDate: '10/10/2020' },
    { case: 'Just endDate is defined', startDate: undefined, endDate: '10/10/2020' },
  ])('Should  call getTransaction if there are no validation Errors when $case', async ({ startDate, endDate }) => {
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

    const mockTransactionsPage: Page<PrisonerTransactionResponse> = {
      content: mockTransactions,
      totalElements: mockTransactions.length,
      totalPages: 1,
      pageNumber: 1,
      pageSize: 99,
      isLastPage: true,
    }

    prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)

    await prisonerController.getTransactions(mockReq, mockRes, mockNext)

    expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalled()
    expect(prisonerFinanceService.getAccountBalance).toHaveBeenCalledWith(mockReq.params.prisonNumber)
    expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerTransactions', {
      prisonNumber: mockReq.params.prisonNumber,
      applicationName: 'Transactions',
      transactions: mockTransactions,
      balance: mockBalance.amount,
      hasValidationErrors: false,
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

    await prisonerController.getTransactions(mockReq, mockRes, mockNext)

    expect(mockRes.render).not.toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalled()
  })
})
