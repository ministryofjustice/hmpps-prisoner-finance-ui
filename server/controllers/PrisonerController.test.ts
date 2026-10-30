import { PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import e, { Request, Response } from 'express'
import { ApplicationInfo } from '../applicationInfo'
import AuditService, { AuditPage, SearchRequest, SubjectType } from '../services/auditService'
import PrisonerFinanceService from '../services/prisonerFinanceService'
import PrisonRegisterService from '../services/prisonRegisterService'
import PrisonerController from './PrisonerController'
import PrisonerSearchService from '../services/prisonerSearchService'
import { AccountBalanceResponse } from '../interfaces/AccountBalanceResponse'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { Page } from '../interfaces/Pageable'
import { SubAccountBalanceResponse } from '../interfaces/SubAccountBalanceResponse'
import PrisonApiService from '../services/prisonApiService'
import FeatureFlagService from '../services/featureFlagService'
import PrisonerFinanceHoldsService from '../services/prisonerFinanceHoldsService'
import { PrisonerHoldsBalanceResponse } from '../interfaces/PrisonerHoldsBalanceResponse'
import { PrisonerHoldResponse } from '../interfaces/PrisonerHoldResponse'
import PrisonerFinanceAdvancesService from '../services/prisonerFinanceAdvancesService'
import { PrisonerAdvanceResponse } from '../interfaces/PrisonerAdvanceResponse'
import {
  PrisonerAdvanceBalanceResponse,
  PrisonerAdvancesBalanceResponse,
} from '../interfaces/PrisonerAdvanceBalanceResponse'
import { PrisonerAdvancePaymentsResponse } from '../interfaces/PrisonerAdvancePaymentsResponse'

jest.mock('../applicationInfo')
jest.mock('../services/auditService')
jest.mock('../services/prisonerFinanceService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/prisonRegisterService')
jest.mock('../services/prisonApiService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../services/prisonerFinanceHoldsService')
jest.mock('../services/prisonerFinanceAdvancesService')

describe('PrisonerController', () => {
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

  const prisonerController: PrisonerController = new PrisonerController({
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
  })

  const mockNext: e.NextFunction = jest.fn()

  const mockBalance: AccountBalanceResponse = { accountId: '', balanceDateTime: '', amount: 10 }
  const mockSubAccountBalance: SubAccountBalanceResponse = { subAccountId: '', balanceDateTime: '', amount: 10 }

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

  describe('getFindPrisoner', () => {
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        subAccount: 'CASH',
        auditPage: AuditPage.FIND_PRISONER,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    it('should call the audit service with the prisoner ID', async () => {
      const prisonNumber = 'ABC123XX'
      const mockReq = { query: { term: 'ABC123XX' } } as unknown as Request

      await prisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(auditService.logSearchRequest).toHaveBeenCalledWith(SearchRequest.FIND_PRISONER, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.SEARCH_TERM,
        subjectId: prisonNumber,
      })
    })

    it('Should get caseloads and match prisoners', async () => {
      const mockReq = { query: { term: 'ABC123XX' } } as unknown as Request

      await prisonerController.getFindPrisoner(mockReq, mockRes, mockNext)
      expect(prisonApiService.getUserCaseloads).toHaveBeenCalled()
      expect(prisonerSearchService.getPrisonersBySearchTerm).toHaveBeenLastCalledWith('ASI', 'ABC123XX', '0')

      expect(mockRes.render).toHaveBeenCalled()
    })

    it('Should trim the entered search request before search', async () => {
      const mockReq = { query: { term: ' ABC123XX ' } } as unknown as Request

      await prisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(prisonerSearchService.getPrisonersBySearchTerm).toHaveBeenLastCalledWith('ASI', 'ABC123XX', '0')
    })

    it('Should render the find page without calling the API when no search term is entered', async () => {
      const mockReq = { query: {} } as unknown as Request

      await prisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(prisonerSearchService.getPrisonersBySearchTerm).not.toHaveBeenCalled()

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/find/find', {
        currentCaseload: 'Ashfield (HMP)',
      })
    })

    it('Should render the find page with an error when the search term an empty string', async () => {
      const mockReq = { query: { term: '   ' } } as unknown as Request

      await prisonerController.getFindPrisoner(mockReq, mockRes, mockNext)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/find/find', {
        currentCaseload: 'Ashfield (HMP)',
        errorMap: { term: 'Enter a prison number or prisoner name' },
        errors: [
          {
            href: '#term',
            text: 'Enter a prison number or prisoner name',
          },
        ],
      })
      expect(mockRes.redirect).not.toHaveBeenCalled()
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
      })

      await prisonerController.getTransactions(mockReq, mockRes, mockNext)

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
      })

      await prisonerController.getTransactions(mockReq, mockRes, mockNext)

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

      await prisonerController.getTransactions(mockReq, mockRes, mockNext)

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
      })

      await prisonerController.getTransactions(mockReq, mockRes, mockNext)

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
      prisonerFinanceHoldsService.getHoldsBalance.mockResolvedValue({ amount: 99, balanceDateTime: '' })

      await prisonerController.getTransactions(mockReq, mockRes, mockNext)

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

      await prisonerController.getTransactions(mockReq, mockRes, mockNext)

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

      await prisonerController.printTransactions(mockReq, mockRes, mockNext)

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber,
        page: '1',
        pageSize: '999999',
      })

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerPrintTransactions', {
        downloadCsvParams: expect.anything(),
        backLink,
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

      await prisonerController.printTransactions(mockReq, mockRes, mockNext)

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

      await prisonerController.printTransactions(mockReq, mockRes, mockNext)

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

      await prisonerController.printTransactions(mockReq, mockRes, mockNext)

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber,
        page: '1',
        pageSize: '999999',
      })

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/transactions/prisonerPrintTransactions', {
        downloadCsvParams: expect.anything(),
        backLink,
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

      await prisonerController.printTransactions(mockReq, mockRes, mockNext)

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
        backLink,
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

      await prisonerController.downloadTransactionsCSV(mockReq, mockRes, mockNext)

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

  describe('getProfile', () => {
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        subAccount: 'CASH',
        auditPage: AuditPage.PRISONER_FINANCIAL_PROFILE,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    it('Should  call getTransaction and getSubAccountBalances', async () => {
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber: 'ABC123KK' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
        featureFlags: { ACTION_PANEL_ENABLED: false },
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
          subAccountBalance: 200,
          accountBalance: 30,
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

      const mockBalancesResponse = {
        SPENDS: mockSubAccountBalance,
        SAVINGS: mockSubAccountBalance,
        CASH: mockSubAccountBalance,
      }

      const mockHoldResponse: PrisonerHoldsBalanceResponse = { amount: 0, balanceDateTime: '' }

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)
      prisonerFinanceService.getSubAccountBalances.mockResolvedValue(mockBalancesResponse)

      prisonerFinanceHoldsService.getHoldsBalance.mockResolvedValue(mockHoldResponse)

      await prisonerController.getProfile(mockReq, mockRes, mockNext)

      expect(prisonerFinanceService.getSubAccountBalances).toHaveBeenCalledWith(mockReq.params.prisonNumber)
      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        page: '1',
        pageSize: '25',
      })
      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/profile/prisonerProfile', {
        prisonNumber: mockReq.params.prisonNumber,
        transactions: mockTransactions,
        subAccountBalances: {
          spends: mockBalancesResponse.SPENDS,
          privateCash: mockBalancesResponse.CASH,
          savings: mockBalancesResponse.SAVINGS,
          holds: mockHoldResponse,
        },
        actionPanelEnabled: false,
      })
    })

    it('Should preview 5 at most', async () => {
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber: 'ABC123KK' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
        featureFlags: { ACTION_PANEL_ENABLED: false },
      } as unknown as Request

      const mockTransactions: PrisonerTransactionResponse[] = Array.from({ length: 100 }, () => {
        return {
          date: '10-10-2010',
          legacyTransactionId: 123,
          description: 'Canteen transaction',
          credit: 10,
          debit: 10,
          location: 'LEI',
          accountType: 'CASH',
          subAccountBalance: 300,
          accountBalance: 40,
        }
      })

      const mockTransactionsPage: Page<PrisonerTransactionResponse> = {
        content: mockTransactions,
        totalElements: mockTransactions.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 99,
        isLastPage: true,
      }

      const mockBalancesResponse = {
        SPENDS: mockSubAccountBalance,
        SAVINGS: mockSubAccountBalance,
        CASH: mockSubAccountBalance,
      }

      const mockHoldResponse: PrisonerHoldsBalanceResponse = { amount: 0, balanceDateTime: '' }

      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(mockTransactionsPage)
      prisonerFinanceService.getSubAccountBalances.mockResolvedValue(mockBalancesResponse)

      prisonerFinanceHoldsService.getHoldsBalance.mockResolvedValue(mockHoldResponse)

      await prisonerController.getProfile(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalled()
      expect(prisonerFinanceService.getSubAccountBalances).toHaveBeenCalledWith(mockReq.params.prisonNumber)
      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).toHaveBeenCalledWith({
        prisonNumber: mockReq.params.prisonNumber,
        page: '1',
        pageSize: '25',
      })
      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/profile/prisonerProfile', {
        prisonNumber: mockReq.params.prisonNumber,
        transactions: mockTransactions.slice(0, 5),
        subAccountBalances: {
          spends: mockBalancesResponse.SPENDS,
          privateCash: mockBalancesResponse.CASH,
          savings: mockBalancesResponse.SAVINGS,
          holds: mockHoldResponse,
        },
        actionPanelEnabled: false,
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

      auditService.logPageView.mockImplementation(() => {
        throw new Error('Expected error')
      })

      await prisonerController.getProfile(mockReq, mockRes, mockNext)

      expect(mockRes.render).not.toHaveBeenCalled()
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('getHolds', () => {
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        auditPage: AuditPage.PRISONER_HOLDS,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    it('Should call getHolds and log Audit', async () => {
      const prisonNumber = 'ABC123KK'
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
        query: {
          page: '1',
        },
      } as unknown as Request

      const prisonerHolds: PrisonerHoldResponse[] = []

      const mockHoldsPage: Page<PrisonerHoldResponse> = {
        content: prisonerHolds,
        totalElements: prisonerHolds.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 99,
        isLastPage: true,
      }

      prisonerFinanceHoldsService.getHolds.mockResolvedValue(mockHoldsPage)

      await prisonerController.getHolds(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_HOLDS, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

      expect(prisonerFinanceHoldsService.getHolds).toHaveBeenCalledWith(mockReq.params.prisonNumber, '1', false)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/holds/holds', {
        prisonNumber: mockReq.params.prisonNumber,
        holds: prisonerHolds,
        paginationItems: {
          isLastPage: true,
          items: [
            {
              href: '?page=1',
              selected: true,
              text: '1',
            },
          ],
          next: null,
          pageNumber: 1,
          pageSize: 99,
          previous: null,
          results: {
            count: 0,
            from: 0,
            text: ' results',
            to: 0,
          },
          totalElements: 0,
          totalPages: 1,
        },
      })
    })
  })

  describe('getAdvances', () => {
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        auditPage: AuditPage.PRISONER_ADVANCES,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    it('Should call get advances, balances, and log Audit', async () => {
      const prisonNumber = 'ABC123KK'
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
        query: {
          page: '1',
        },
      } as unknown as Request

      const advanceBalances: PrisonerAdvancesBalanceResponse = {
        balanceDateTime: '',
        advancesAmount: 100,
        balancesOutstanding: 10,
        weeklyPaymentAmount: 1,
      }
      const prisonerAdvances: PrisonerAdvanceResponse[] = []

      const mockAdvancesPage: Page<PrisonerAdvanceResponse> = {
        content: prisonerAdvances,
        totalElements: prisonerAdvances.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 99,
        isLastPage: true,
      }

      prisonerFinanceAdvancesService.getAdvances.mockResolvedValue(mockAdvancesPage)
      prisonerFinanceAdvancesService.getAdvancesBalances.mockResolvedValue(advanceBalances)

      await prisonerController.getAdvances(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_ADVANCES, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

      expect(prisonerFinanceAdvancesService.getAdvances).toHaveBeenCalledWith(mockReq.params.prisonNumber, '1', false)
      expect(prisonerFinanceAdvancesService.getAdvancesBalances).toHaveBeenCalledWith(prisonNumber)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/advances/advances', {
        prisonNumber: mockReq.params.prisonNumber,
        advances: prisonerAdvances,
        advanceBalances,
        paginationItems: {
          isLastPage: true,
          items: [
            {
              href: '?page=1',
              selected: true,
              text: '1',
            },
          ],
          next: null,
          pageNumber: 1,
          pageSize: 99,
          previous: null,
          results: {
            count: 0,
            from: 0,
            text: ' results',
            to: 0,
          },
          totalElements: 0,
          totalPages: 1,
        },
      })
    })
  })

  describe('getAdvanceDetail', () => {
    const mockRes: Response = {
      locals: {
        user: { username: 'test-user' },
        auditPage: AuditPage.PRISONER_ADVANCE_DETAIL,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    it('Should call get advance, payments, and log Audit', async () => {
      const prisonNumber = 'ABC123KK'
      const advanceId = '123'
      const mockReq = {
        id: 'req-id-123',
        params: { prisonNumber, advanceId },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:3000'),
        originalUrl: '/audit',
        query: {
          page: '1',
        },
      } as unknown as Request

      const mockAdvanceBalance: PrisonerAdvanceBalanceResponse = {
        balanceDateTime: '',
        advanceAmount: 100,
        balanceOutstanding: 10,
        weeklyPaymentAmount: 1,
        remainingPayments: 4,
        nextPaymentDate: '',
      }

      const prisonerAdvancePayments: PrisonerAdvancePaymentsResponse[] = []

      const mockAdvancePaymentsPage: Page<PrisonerAdvancePaymentsResponse> = {
        content: prisonerAdvancePayments,
        totalElements: prisonerAdvancePayments.length,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 99,
        isLastPage: true,
      }

      prisonerFinanceAdvancesService.getAdvanceBalance.mockResolvedValue(mockAdvanceBalance)
      prisonerFinanceAdvancesService.getAdvancePayments.mockResolvedValue(mockAdvancePaymentsPage)

      await prisonerController.getAdvanceDetail(mockReq, mockRes, mockNext)

      expect(auditService.logPageView).toHaveBeenCalledWith(AuditPage.PRISONER_ADVANCE_DETAIL, {
        who: mockRes.locals.user.username,
        correlationId: mockReq.id,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      })

      expect(prisonerFinanceAdvancesService.getAdvanceBalance).toHaveBeenCalledWith(advanceId)
      expect(prisonerFinanceAdvancesService.getAdvancePayments).toHaveBeenCalledWith(advanceId, '1', false)

      expect(mockRes.render).toHaveBeenCalledWith('pages/prisoner/advances/advanceDetail', {
        prisonNumber: mockReq.params.prisonNumber,
        advancePayments: mockAdvancePaymentsPage.content,
        advanceBalance: mockAdvanceBalance,
        paginationItems: {
          isLastPage: true,
          items: [
            {
              href: '?page=1',
              selected: true,
              text: '1',
            },
          ],
          next: null,
          pageNumber: 1,
          pageSize: 99,
          previous: null,
          results: {
            count: 0,
            from: 0,
            text: ' results',
            to: 0,
          },
          totalElements: 0,
          totalPages: 1,
        },
      })
    })
  })
})
