import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import e, { Request, Response } from 'express'
import { ApplicationInfo } from '../../../applicationInfo'
import AuditService, { AuditPage, SubjectType } from '../../../services/auditService'
import PrisonerFinanceService from '../../../services/prisonerFinanceService'
import PrisonRegisterService from '../../../services/prisonRegisterService'
import PrisonerSearchService from '../../../services/prisonerSearchService'
import { AccountBalanceResponse } from '../../../interfaces/AccountBalanceResponse'
import { PrisonerTransactionResponse } from '../../../interfaces/PrisonerTransactionResponse'
import { Page } from '../../../interfaces/Pageable'
import PrisonApiService from '../../../services/prisonApiService'
import FeatureFlagService from '../../../services/featureFlagService'
import PrisonerFinanceHoldsService from '../../../services/prisonerFinanceHoldsService'
import PrisonerFinanceAdvancesService from '../../../services/prisonerFinanceAdvancesService'
import PrisonerFinanceSubscriptionsService from '../../../services/prisonerFinanceSubscriptionsService'
import TransactionsController from './transactionsController'

jest.mock('../../../applicationInfo')
jest.mock('../../../services/auditService')
jest.mock('../../../services/prisonerFinanceService')
jest.mock('../../../services/prisonerSearchService')
jest.mock('../../../services/prisonRegisterService')
jest.mock('../../../services/prisonApiService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../services/prisonerFinanceHoldsService')
jest.mock('../../../services/prisonerFinanceAdvancesService')
jest.mock('../../../services/prisonerFinanceSubscriptionsService')

describe('TransactionsController', () => {
  const applicationInfo = {} as unknown as jest.Mocked<ApplicationInfo>
  const auditService = new AuditService(null) as jest.Mocked<AuditService>
  const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
  const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
  const prisonRegisterService = {} as unknown as jest.Mocked<PrisonRegisterService>
  const prisonPermissionsService = {} as unknown as jest.Mocked<PermissionsService>
  const prisonApiService = new PrisonApiService(null) as jest.Mocked<PrisonApiService>
  const featureFlagService = {} as unknown as jest.Mocked<FeatureFlagService>
  const prisonerFinanceHoldsService = new PrisonerFinanceHoldsService(null) as jest.Mocked<PrisonerFinanceHoldsService>
  const prisonerFinanceAdvancesService = new PrisonerFinanceAdvancesService(
    null,
  ) as jest.Mocked<PrisonerFinanceAdvancesService>
  const prisonerFinanceSubscriptionsService = new PrisonerFinanceSubscriptionsService(
    null,
  ) as jest.Mocked<PrisonerFinanceSubscriptionsService>

  const transactionsController: TransactionsController = new TransactionsController({
    applicationInfo,
    auditService,
    prisonerFinanceService,
    prisonerSearchService,
    prisonRegisterService,
    prisonPermissionsService,
    prisonApiService,
    featureFlagService,
    prisonerFinanceHoldsService,
    prisonerFinanceAdvancesService,
    prisonerFinanceSubscriptionsService,
  })

  const mockNext: e.NextFunction = jest.fn()

  const mockBalance: AccountBalanceResponse = { accountId: '', balanceDateTime: '', amount: 10 }

  beforeEach(() => {
    jest.resetAllMocks()
    prisonApiService.getUserCaseloads.mockResolvedValue([
      {
        caseLoadId: 'ASI',
        description: 'Ashfield (HMP)',
        type: 'INST',
        caseloadFunction: 'GENERAL',
        currentlyActive: true,
      },
    ])
    prisonerSearchService.getPrisonersBySearchTerm.mockResolvedValue({
      totalElements: 0,
      totalPages: 0,
      size: 0,
      content: [],
      number: 0,
      first: true,
      last: true,
      sort: {
        empty: true,
        sorted: true,
        unsorted: true,
      },
      numberOfElements: 0,
      pageable: {
        offset: 0,
        sort: {
          empty: true,
          sorted: true,
          unsorted: true,
        },
        pageSize: 0,
        paged: true,
        pageNumber: 0,
        unpaged: true,
      },
      empty: true,
    })
  })

  describe('getTransactions', () => {
    it('Should call get transaction page for cash', async () => {
      const mockRes: Response = {
        locals: {
          user: { username: 'test-user' },
          subAccount: 'CASH',
          auditPage: AuditPage.PRISONER_HOLDS,
          showHolds: true,
          headerTitle: 'Private cash transactions',
        },
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      const startDate = '10/10/2010'
      const endDate = '10/10/2020'
      const debit = 'false'
      const credit = 'true'

      const mockReq = {
        id: 'req-id-123',
        query: { startDate, endDate, debit, credit, page: '1' },
        params: { prisonNumber: 'ABC123XX' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
      } as unknown as Request

      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '10-10-2010',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
          subAccountBalance: 100,
          accountBalance: 20,
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

      prisonerFinanceService.getTransactionPage.mockResolvedValue([mockTransactionsPage, mockBalance])

      prisonerFinanceHoldsService.getHoldsBalanceForSubAccount.mockResolvedValue({
        amount: 10,
        balanceDateTime: '',
        hoa: 0,
        whf: 0,
      })

      await transactionsController.getTransactions(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(mockRes.locals.auditPage, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: mockReq.params.prisonNumber,
      })
      expect(prisonerFinanceService.getTransactionPage).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        startDate,
        endDate,
        page: '1',
        pageSize: '25',
        debit,
        credit,
        subAccountReference: mockRes.locals.subAccount,
        hasValidationErrors: false,
      })
      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerTransactions', {
        prisonNumber: mockReq.params.prisonNumber,
        headerTitle: 'Private cash transactions',
        applicationName: 'Transactions',
        transactions: mockTransactions,
        currentBalance: mockBalance.amount,
        holdBalance: 10,
        totalBalance: mockBalance.amount + 10,
        paginationItems: expect.anything(),
        hasValidationErrors: false,
        filters: {
          startDate,
          endDate,
          debit,
          credit,
          selectedFilters: expect.anything(),
        },
        displayTotalBalance: false,
        holdsEnabled: true,
        printTransactionQueryString: expect.anything(),
      })
    })

    it('Should call get transaction page for spends', async () => {
      const mockRes: Response = {
        locals: {
          user: { username: 'test-user' },
          subAccount: 'SPENDS',
          auditPage: AuditPage.PRISONER_HOLDS,
          showHolds: true,
          headerTitle: 'Spends transactions',
        },
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      const startDate = '10/10/2010'
      const endDate = '10/10/2020'
      const debit = 'false'
      const credit = 'true'

      const mockReq = {
        id: 'req-id-123',
        query: { startDate, endDate, debit, credit, page: '1' },
        params: { prisonNumber: 'ABC123XX' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
      } as unknown as Request

      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '10-10-2010',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'SPENDS',
          subAccountBalance: 100,
          accountBalance: 20,
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

      prisonerFinanceService.getTransactionPage.mockResolvedValue([mockTransactionsPage, mockBalance])

      prisonerFinanceHoldsService.getHoldsBalanceForSubAccount.mockResolvedValue({
        amount: 15,
        balanceDateTime: '',
        hoa: 0,
        whf: 0,
      })

      await transactionsController.getTransactions(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(mockRes.locals.auditPage, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: mockReq.params.prisonNumber,
      })
      expect(prisonerFinanceService.getTransactionPage).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        startDate,
        endDate,
        page: '1',
        pageSize: '25',
        debit,
        credit,
        subAccountReference: mockRes.locals.subAccount,
        hasValidationErrors: false,
      })
      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerTransactions', {
        prisonNumber: mockReq.params.prisonNumber,
        headerTitle: 'Spends transactions',
        applicationName: 'Transactions',
        transactions: mockTransactions,
        currentBalance: mockBalance.amount,
        holdBalance: 15,
        totalBalance: mockBalance.amount + 15,
        paginationItems: expect.anything(),
        hasValidationErrors: false,
        filters: {
          startDate,
          endDate,
          debit,
          credit,
          selectedFilters: expect.anything(),
        },
        displayTotalBalance: false,
        holdsEnabled: true,
        printTransactionQueryString: expect.anything(),
      })
    })

    it('Should call get transaction page for savings', async () => {
      const mockRes: Response = {
        locals: {
          user: { username: 'test-user' },
          subAccount: 'SAVINGS',
          auditPage: AuditPage.PRISONER_HOLDS,
          showHolds: false,
          headerTitle: 'Savings transactions',
        },
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      const startDate = '10/10/2010'
      const endDate = '10/10/2020'
      const debit = 'false'
      const credit = 'true'

      const mockReq = {
        id: 'req-id-123',
        query: { startDate, endDate, debit, credit, page: '1' },
        params: { prisonNumber: 'ABC123XX' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
      } as unknown as Request

      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '10-10-2010',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'SPENDS',
          subAccountBalance: 100,
          accountBalance: 20,
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

      prisonerFinanceService.getTransactionPage.mockResolvedValue([mockTransactionsPage, mockBalance])

      await transactionsController.getTransactions(mockReq, mockRes, mockNext)

      expect(prisonerFinanceHoldsService.getHoldsBalanceForSubAccount).toHaveBeenCalledTimes(0)
      expect(prisonerFinanceHoldsService.getHoldsBalance).toHaveBeenCalledTimes(0)

      expect(auditService.logPageView).toHaveBeenCalledWith(mockRes.locals.auditPage, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: mockReq.params.prisonNumber,
      })
      expect(prisonerFinanceService.getTransactionPage).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        startDate,
        endDate,
        page: '1',
        pageSize: '25',
        debit,
        credit,
        subAccountReference: mockRes.locals.subAccount,
        hasValidationErrors: false,
      })
      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerTransactions', {
        prisonNumber: mockReq.params.prisonNumber,
        headerTitle: 'Savings transactions',
        applicationName: 'Transactions',
        transactions: mockTransactions,
        currentBalance: mockBalance.amount,
        holdBalance: 0,
        totalBalance: mockBalance.amount,
        paginationItems: expect.anything(),
        hasValidationErrors: false,
        filters: {
          startDate,
          endDate,
          debit,
          credit,
          selectedFilters: expect.anything(),
        },
        displayTotalBalance: false,
        holdsEnabled: false,
        printTransactionQueryString: expect.anything(),
      })
    })

    it.each([
      { page: 'CASH', headerTitle: 'Private cash transactions' },
      { page: 'SPENDS', headerTitle: 'Spends transactions' },
      { page: 'SAVINGS', headerTitle: 'Savings transactions' },
    ])('Should call get transaction when description filter is set $page', async testValues => {
      const mockRes: Response = {
        locals: {
          user: { username: 'test-user' },
          subAccount: testValues.page,
          auditPage: AuditPage.PRISONER_HOLDS,
          showHolds: true,
          headerTitle: testValues.headerTitle,
        },
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      const description = 'MARS BAR'

      const mockReq = {
        id: 'req-id-123',
        query: { description, page: '1' },
        params: { prisonNumber: 'ABC123XX' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
      } as unknown as Request

      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '10-10-2010',
          legacyTransactionId: 123,
          description,
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
          subAccountBalance: 100,
          accountBalance: 20,
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

      prisonerFinanceService.getTransactionPage.mockResolvedValue([mockTransactionsPage, mockBalance])

      prisonerFinanceHoldsService.getHoldsBalanceForSubAccount.mockResolvedValue({
        amount: 10,
        balanceDateTime: '',
        hoa: 0,
        whf: 0,
      })

      await transactionsController.getTransactions(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(mockRes.locals.auditPage, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: mockReq.params.prisonNumber,
      })

      expect(prisonerFinanceService.getTransactionPage).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        description,
        page: '1',
        pageSize: '25',
        startDate: undefined,
        endDate: undefined,
        credit: undefined,
        debit: undefined,
        subAccountReference: mockRes.locals.subAccount,
        hasValidationErrors: false,
      })

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerTransactions', {
        prisonNumber: mockReq.params.prisonNumber,
        headerTitle: testValues.headerTitle,
        applicationName: 'Transactions',
        transactions: mockTransactions,
        currentBalance: mockBalance.amount,
        holdBalance: 10,
        totalBalance: mockBalance.amount + 10,
        paginationItems: expect.anything(),
        hasValidationErrors: false,
        filters: {
          description,
          selectedFilters: expect.arrayContaining([expect.objectContaining({ heading: { text: 'Description' } })]),
        },
        displayTotalBalance: false,
        holdsEnabled: true,
        printTransactionQueryString: expect.anything(),
      })
    })

    it('Should call get transaction page for all sub-accounts', async () => {
      const mockRes: Response = {
        locals: {
          user: { username: 'test-user' },
          subAccount: null,
          auditPage: AuditPage.PRISONER_HOLDS,
          showHolds: true,
        },
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      const startDate = '10/10/2010'
      const endDate = '10/10/2020'
      const debit = 'false'
      const credit = 'true'

      const mockReq = {
        id: 'req-id-123',
        query: { startDate, endDate, debit, credit, page: '1' },
        params: { prisonNumber: 'ABC123XX' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
      } as unknown as Request

      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '10-10-2010',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'SPENDS',
          subAccountBalance: 100,
          accountBalance: 20,
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

      prisonerFinanceService.getTransactionPage.mockResolvedValue([mockTransactionsPage, mockBalance])
      prisonerFinanceHoldsService.getHoldsBalance.mockResolvedValue({ amount: 99, balanceDateTime: '', hoa: 0, whf: 0 })

      await transactionsController.getTransactions(mockReq, mockRes, mockNext)

      expect(prisonerFinanceHoldsService.getHoldsBalanceForSubAccount).toHaveBeenCalledTimes(0)

      expect(auditService.logPageView).toHaveBeenCalledWith(mockRes.locals.auditPage, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: mockReq.params.prisonNumber,
      })
      expect(prisonerFinanceService.getTransactionPage).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        startDate,
        endDate,
        page: '1',
        pageSize: '25',
        debit,
        credit,
        subAccountReference: mockRes.locals.subAccount,
        hasValidationErrors: false,
      })
      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerTransactions', {
        prisonNumber: mockReq.params.prisonNumber,
        headerTitle: 'Transactions for all sub accounts',
        applicationName: 'Transactions',
        transactions: mockTransactions,
        currentBalance: mockBalance.amount,
        holdBalance: 99,
        totalBalance: mockBalance.amount + 99,
        paginationItems: expect.anything(),
        hasValidationErrors: false,
        filters: {
          startDate,
          endDate,
          debit,
          credit,
          selectedFilters: expect.anything(),
        },
        displayTotalBalance: true,
        holdsEnabled: true,
        printTransactionQueryString: expect.anything(),
      })
    })

    it('Should catch exceptions', async () => {
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber: 'ABC123XX' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
      } as unknown as Request

      const mockRes: Response = {
        locals: {
          user: { username: 'test-user' },
          subAccount: null,
          auditPage: AuditPage.PRISONER_HOLDS,
          showHolds: true,
        },
        render: jest.fn(),
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      auditService.logPageView.mockImplementation(() => {
        throw new Error('Expected error')
      })

      await transactionsController.getTransactions(mockReq, mockRes, mockNext)

      expect(mockRes.render).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('printTransactions', () => {
    const prisonNumber = 'ABC123XX'
    const backLink = 'google.com'

    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        subAccount: 'CASH',
        auditPage: AuditPage.PRISONER_TRANSACTIONS_PRINT_PREVIEW,
        prisonerDetails: {
          firstName: 'John',
          lastName: 'Smith',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    const mockedBalanceResponse = { accountId: '', balanceDateTime: '2026-03-10T10:48:28.094Z', amount: 4400 }
    const mockedBalanceResponseDateFormatted = '10 March 2026'

    beforeEach(() => {
      prisonerFinanceService.getAccountBalance.mockResolvedValue(mockedBalanceResponse)
    })

    test('Should render print transaction page', async () => {
      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '2026-03-10T10:48:28.094Z',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
          subAccountBalance: 100,
          accountBalance: 20,
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

      const mockReq: Request = {
        id: 'req-id-123',
        query: { backLink },
        params: { prisonNumber },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: `/account/${prisonNumber}/print-preview`,
      } as unknown as Request

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)

      await transactionsController.printTransactions(mockReq, mockRes, mockNext)

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber,
        page: '1',
        pageSize: '999999',
      })

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerPrintTransactions', {
        downloadCsvParams: expect.anything(),
        displayTotalBalance: true,
        endDate: '10 March 2026',
        firstName: 'John',
        headerTitle: 'Prisoner Transaction history',
        hideHeader: true,
        lastName: 'Smith',
        prisonNumber: 'ABC123XX',
        startDate: '10 March 2026',
        transactions: mockTransactionsPage.content,
        statementDate: expect.anything(),
        statementBalance: expect.anything(),
      })
    })

    test('Should return the statement balance and date of all accounts if subAccount is null', async () => {
      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '2026-03-10T10:48:28.094Z',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
          subAccountBalance: 100,
          accountBalance: 20,
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

      const mockReq: Request = {
        id: 'req-id-123',
        query: { backLink },
        params: { prisonNumber },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: `/account/${prisonNumber}/print-preview`,
      } as unknown as Request

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)

      await transactionsController.printTransactions(mockReq, mockRes, mockNext)

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber,
        page: '1',
        pageSize: '999999',
      })

      expect(prisonerFinanceService.getSubAccountBalance).toHaveBeenCalledTimes(0)

      expect(mockRes.render).toHaveBeenCalledWith(
        'pages/prisoner/transactions/prisonerPrintTransactions',
        expect.objectContaining({
          statementBalance: mockedBalanceResponse.amount,
          statementDate: mockedBalanceResponseDateFormatted,
        }),
      )
    })

    test('Should return the statement balance and date of the account if the sub account is provided', async () => {
      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '2026-03-10T10:48:28.094Z',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
          subAccountBalance: 100,
          accountBalance: 20,
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

      const mockReq: Request = {
        id: 'req-id-123',
        query: { backLink, subAccount: 'CASH' },
        params: { prisonNumber },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: `/account/${prisonNumber}/print-preview`,
      } as unknown as Request

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)

      const mockedSubAccountBalance = { subAccountId: '', balanceDateTime: '2020-03-10T10:45:28.194Z', amount: 20 }
      const mockedSubAccountBalanceDateFormatted = '10 March 2020'

      prisonerFinanceService.getSubAccountBalance.mockResolvedValue(mockedSubAccountBalance)

      await transactionsController.printTransactions(mockReq, mockRes, mockNext)

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber,
        page: '1',
        subAccountReference: 'CASH',
        pageSize: '999999',
      })

      expect(prisonerFinanceService.getAccountBalance).toHaveBeenCalledTimes(0)

      expect(mockRes.render).toHaveBeenCalledWith(
        'pages/prisoner/transactions/prisonerPrintTransactions',
        expect.objectContaining({
          statementBalance: mockedSubAccountBalance.amount,
          statementDate: mockedSubAccountBalanceDateFormatted,
        }),
      )
    })

    test('Should pass startDate and endDate as the date of the first and last transaction when they are not specified as query params', async () => {
      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '2026-03-10T10:48:28.094Z',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
          subAccountBalance: 100,
          accountBalance: 20,
        },
        {
          date: '2026-02-10T10:48:28.094Z',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
          subAccountBalance: 100,
          accountBalance: 20,
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

      const mockReq: Request = {
        id: 'req-id-123',
        query: { backLink },
        params: { prisonNumber },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: `/account/${prisonNumber}/print-preview`,
      } as unknown as Request

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)

      await transactionsController.printTransactions(mockReq, mockRes, mockNext)

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber,
        page: '1',
        pageSize: '999999',
      })

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerPrintTransactions', {
        downloadCsvParams: expect.anything(),
        displayTotalBalance: true,
        endDate: '10 March 2026',
        firstName: 'John',
        headerTitle: 'Prisoner Transaction history',
        hideHeader: true,
        lastName: 'Smith',
        prisonNumber: 'ABC123XX',
        startDate: '10 February 2026',
        transactions: mockTransactionsPage.content,
        statementDate: expect.anything(),
        statementBalance: expect.anything(),
      })
    })

    test('Should pass startDate and endDate as the filter parames when they are specified as query params', async () => {
      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '2026-03-10T10:48:28.094Z',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
          subAccountBalance: 100,
          accountBalance: 20,
        },
        {
          date: '2026-02-10T10:48:28.094Z',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
          subAccountBalance: 100,
          accountBalance: 20,
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

      const mockReq: Request = {
        id: 'req-id-123',
        query: { backLink, startDate: '26/10/2023', endDate: '26/12/2026' },
        params: { prisonNumber },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: `/account/${prisonNumber}/print-preview`,
      } as unknown as Request

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)

      await transactionsController.printTransactions(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_TRANSACTIONS_PRINT_PREVIEW, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber,
        page: '1',
        pageSize: '999999',
        startDate: mockReq.query.startDate,
        endDate: mockReq.query.endDate,
      })

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerPrintTransactions', {
        downloadCsvParams: expect.anything(),
        displayTotalBalance: true,
        endDate: '26 December 2026',
        firstName: 'John',
        headerTitle: 'Prisoner Transaction history',
        hideHeader: true,
        lastName: 'Smith',
        prisonNumber: 'ABC123XX',
        startDate: '26 October 2023',
        transactions: mockTransactionsPage.content,
        statementDate: expect.anything(),
        statementBalance: expect.anything(),
      })
    })
  })

  describe('downloadTransactionsCSV', () => {
    const prisonNumber = 'ABC123XX'

    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        subAccount: 'CASH',
        auditPage: AuditPage.PRISONER_TRANSACTIONS_CSV_DOWNLOAD,
        prisonerDetails: {
          firstName: 'John',
          lastName: 'Smith',
        },
      },
      render: jest.fn(),
      send: jest.fn(),
      attachment: jest.fn(),
      type: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    test('Should get transactions and create a buffer', async () => {
      const mockTransactions: PrisonerTransactionResponse[] = [
        {
          date: '2026-03-10T10:48:28.094Z',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
          subAccountBalance: 100,
          accountBalance: 20,
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

      const mockReq: Request = {
        id: 'req-id-123',
        query: {},
        params: { prisonNumber },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: `/account/${prisonNumber}/print-preview`,
      } as unknown as Request

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)

      await transactionsController.downloadTransactionsCSV(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_TRANSACTIONS_CSV_DOWNLOAD, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber,
        page: '1',
        pageSize: '999999',
      })

      expect(mockRes.attachment).toHaveBeenCalled()
      expect(mockRes.type).toHaveBeenCalledWith('text/csv')
      expect(mockRes.send).toHaveBeenCalled()
    })
  })
})
