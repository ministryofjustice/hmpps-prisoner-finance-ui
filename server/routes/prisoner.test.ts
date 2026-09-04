import type { Express } from 'express'
import request from 'supertest'
import { PrisonerMoneyPermission, PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { appWithAllRoutes, user } from './testutils/appSetup'
import AuditService, { AuditPage, SearchRequest, SubjectType } from '../services/auditService'
import PrisonerFinanceService from '../services/prisonerFinanceService'
import PrisonerSearchService from '../services/prisonerSearchService'
import mockPermissions from './testutils/mockPermissions'
import PrisonRegisterService from '../services/prisonRegisterService'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { Page } from '../interfaces/Pageable'
import PrisonApiService from '../services/prisonApiService'
import PrisonerFinanceHoldsService from '../services/prisonerFinanceHoldsService'
import { PrisonerHoldResponse } from '../interfaces/PrisonerHoldResponse'

jest.mock('../services/prisonerFinanceService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/prisonRegisterService')
jest.mock('../services/prisonApiService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../services/prisonerFinanceHoldsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonPermissionsService = {} as unknown as PermissionsService
const prisonRegisterService = new PrisonRegisterService(null) as jest.Mocked<PrisonRegisterService>
const prisonApiService = new PrisonApiService(null) as jest.Mocked<PrisonApiService>
const prisonerFinanceHoldsService = new PrisonerFinanceHoldsService(null) as jest.Mocked<PrisonerFinanceHoldsService>

let app: Express

describe('Prisoners', () => {
  beforeEach(() => {
    mockPermissions(undefined, { [PrisonerMoneyPermission.read]: true })

    prisonerSearchService.getPrisoner.mockResolvedValue({
      firstName: 'BOB',
      lastName: 'TAYLOR',
      dateOfBirth: '1990-01-01',
      prisonerNumber: prisonNumber,
      prisonId: 'MDI',
      prisonName: 'Moorland (HMP & YOI)',
      status: 'ACTIVE IN',
      cellLocation: 'RECP',
      category: 'C',
      csra: 'Standard',
      currentIncentive: {
        level: {
          code: 'STD',
          description: 'Enhanced',
        },
      },
      bookingId: '123456',
    })

    prisonRegisterService.getPrisonNames.mockResolvedValue([{ prisonId: 'LEI', prisonName: 'Leeds (HMP)' }])

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerFinanceService,
        prisonPermissionsService,
        prisonerSearchService,
        prisonRegisterService,
        prisonApiService,
        prisonerFinanceHoldsService,
      },
      userSupplier: () => user,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const prisonNumber = 'A9971EC'
  const emptyPageTransactionsResponse: Page<PrisonerTransactionResponse> = {
    content: [],
    totalElements: 0,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 99,
    isLastPage: true,
  }

  const emptyPageHoldsResponse: Page<PrisonerHoldResponse> = {
    content: [],
    totalElements: 0,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 99,
    isLastPage: true,
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  const verifyTransactionPageResponse = async (url: string, headerTitle: string, auditPage: AuditPage) => {
    const balanceResponse = { accountId: '', balanceDateTime: '', amount: 1000 }
    prisonerFinanceService.getTransactionPage.mockResolvedValue([emptyPageTransactionsResponse, balanceResponse])

    const response = await request(app).get(url).expect(200).expect('Content-Type', /html/)

    expect(auditService.logPageView).toHaveBeenCalledWith(
      auditPage,
      expect.objectContaining({
        correlationId: expect.any(String),
        who: user.username,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      }),
    )
    expect(response.text).toContain(headerTitle)
  }

  const verifyHoldsPageResponse = async (url: string, headerTitle: string, auditPage: AuditPage) => {
    prisonerFinanceHoldsService.getHolds.mockResolvedValue(emptyPageHoldsResponse)

    const response = await request(app).get(url).expect(200).expect('Content-Type', /html/)

    expect(auditService.logPageView).toHaveBeenCalledWith(
      auditPage,
      expect.objectContaining({
        correlationId: expect.any(String),
        who: user.username,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      }),
    )
    expect(response.text).toContain(headerTitle)
  }

  const verifyTransactionPageHandlesAPIErrors = async (url: string) => {
    const error = Object.assign(new Error('Not Found'), { data: { status: 404, userMessage: 'Not Found' } })
    prisonerFinanceService.getTransactionPage.mockRejectedValue(error)
    const res = await request(app).get(url).expect(404)
    expect(res.text).toContain('Page not found')
  }

  const verifyTransactionPageHandles500 = async (url: string, auditPage: AuditPage) => {
    const error = Object.assign(new Error('GL error'), { data: { status: 500, userMessage: 'GL Error' } })
    prisonerFinanceService.getTransactionPage.mockRejectedValue(error)
    const res = await request(app).get(url).expect(500)
    expect(res.text).toContain('Sorry, there is a problem with the service')

    expect(auditService.logPageView).toHaveBeenCalledWith(
      auditPage,
      expect.objectContaining({
        correlationId: expect.any(String),
        who: user.username,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      }),
    )
    expect(res.text).not.toContain(prisonNumber)
  }

  const verifyHoldsPageHandles500 = async (url: string, auditPage: AuditPage) => {
    const error = Object.assign(new Error('GL error'), { data: { status: 500, userMessage: 'GL Error' } })
    prisonerFinanceHoldsService.getHolds.mockRejectedValue(error)
    const res = await request(app).get(url).expect(500)
    expect(res.text).toContain('Sorry, there is a problem with the service')

    expect(auditService.logPageView).toHaveBeenCalledWith(
      AuditPage.PRISONER_HOLDS,
      expect.objectContaining({
        correlationId: expect.any(String),
        who: user.username,
        subjectType: SubjectType.PRISONER,
        subjectId: prisonNumber,
      }),
    )
    expect(res.text).not.toContain(prisonNumber)
  }

  const verifyPageHandlesSignOutOnPrisonerMoneyPermissionFalse = async (url: string) => {
    mockPermissions(undefined, { [PrisonerMoneyPermission.read]: false })

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerFinanceService,
        prisonPermissionsService,
        prisonerSearchService,
        prisonApiService,
      },
      userSupplier: () => user,
    })

    const response = await request(app).get(url)

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/sign-out')
  }

  describe('/prisoner', () => {
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

    it('GET should return a 200, render the find prisoner page and call the audit service', async () => {
      const response = await request(app).get('/prisoner').expect(200).expect('Content-Type', /html/)

      expect(auditService.logPageView).toHaveBeenCalledWith(
        AuditPage.FIND_PRISONER,
        expect.objectContaining({
          correlationId: expect.any(String),
          who: user.username,
        }),
      )
      expect(response.text).toContain('Search for a prisoner')
    })

    it('GET should return a 200, render the find prisoner page and call the audit service when searching for a term', async () => {
      const response = await request(app)
        .get('/prisoner')
        .query({ term: 'hello' })
        .expect(200)
        .expect('Content-Type', /html/)

      expect(auditService.logSearchRequest).toHaveBeenCalledWith(
        SearchRequest.FIND_PRISONER,
        expect.objectContaining({
          correlationId: expect.any(String),
          who: user.username,
          subjectId: 'hello',
          subjectType: SubjectType.SEARCH_TERM,
        }),
      )
      expect(response.text).toContain('Search for a prisoner')
    })

    it('should re-render the find prisoner page with an error when only whitespace is entered', async () => {
      const response = await request(app).get('/prisoner?term=+++').expect(200)

      expect(response.text).toContain('Enter a prison number')
    })
  })

  describe('/prisoner/:prisonNumber/money', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      await verifyTransactionPageResponse(
        `/prisoner/${prisonNumber}/money`,
        'Transactions for all sub accounts',
        AuditPage.PRISONER_TRANSACTIONS,
      )
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      await verifyTransactionPageHandlesAPIErrors(`/prisoner/${prisonNumber}/money`)
    })

    it('should handle API errors (e.g. 500)', async () => {
      await verifyTransactionPageHandles500(`/prisoner/${prisonNumber}/money`, AuditPage.PRISONER_TRANSACTIONS)
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      await verifyPageHandlesSignOutOnPrisonerMoneyPermissionFalse('/prisoner/A1234BC/money')
    })
  })

  describe('/prisoner/:prisonNumber', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockResolvedValue(emptyPageTransactionsResponse)
      prisonerFinanceService.getSubAccountBalances.mockResolvedValue({
        SPENDS: { subAccountId: '', balanceDateTime: '', amount: 1 },
        CASH: { subAccountId: '', balanceDateTime: '', amount: 1 },
        SAVINGS: { subAccountId: '', balanceDateTime: '', amount: 1 },
      })
      prisonerFinanceHoldsService.getHoldsBalance.mockResolvedValue({
        amount: 10,
        balanceDateTime: '',
      })

      await request(app).get(`/prisoner/${prisonNumber}`).expect(200).expect('Content-Type', /html/)

      expect(auditService.logPageView).toHaveBeenCalledWith(
        AuditPage.PRISONER_FINANCIAL_PROFILE,
        expect.objectContaining({
          correlationId: expect.any(String),
          who: user.username,
          subjectType: SubjectType.PRISONER,
          subjectId: prisonNumber,
        }),
      )
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      const error = Object.assign(new Error('Not Found'), { data: { status: 404, userMessage: 'Not Found' } })
      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockRejectedValue(error)
      const res = await request(app).get(`/prisoner/${prisonNumber}`).expect(404)
      expect(res.text).toContain('Prisoner not found')
      expect(res.text).toContain('If you typed the web address or prison number, check it is correct.')
    })

    it('should handle API errors (e.g. 500)', async () => {
      const error = Object.assign(new Error('GL error'), { data: { status: 500, userMessage: 'GL Error' } })
      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockRejectedValue(error)
      const res = await request(app).get(`/prisoner/${prisonNumber}`).expect(500)
      expect(res.text).toContain('Sorry, there is a problem with the service')

      expect(auditService.logPageView).toHaveBeenCalledWith(
        AuditPage.PRISONER_FINANCIAL_PROFILE,
        expect.objectContaining({
          correlationId: expect.any(String),
          who: user.username,
          subjectType: SubjectType.PRISONER,
          subjectId: prisonNumber,
        }),
      )
      expect(res.text).not.toContain(prisonNumber)
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      mockPermissions(undefined, { [PrisonerMoneyPermission.read]: false })

      app = appWithAllRoutes({
        services: {
          auditService,
          prisonerFinanceService,
          prisonPermissionsService,
          prisonerSearchService,
          prisonApiService,
          prisonerFinanceHoldsService,
        },
        userSupplier: () => user,
      })

      const response = await request(app).get('/prisoner/A1234BC')

      expect(response.status).toBe(404)

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).not.toHaveBeenCalled()
    })
  })

  describe('/prisoner/:prisonNumber/money/holds', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      await verifyHoldsPageResponse(`/prisoner/${prisonNumber}/money/holds`, 'Holds', AuditPage.PRISONER_HOLDS)
    })

    it('should handle API errors (e.g. 500)', async () => {
      await verifyHoldsPageHandles500(`/prisoner/${prisonNumber}/money/holds`, AuditPage.PRISONER_HOLDS)
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      await verifyPageHandlesSignOutOnPrisonerMoneyPermissionFalse('/prisoner/A1234BC/money/holds')
    })
  })

  describe('/prisoner/:prisonNumber/money/private-cash', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      await verifyTransactionPageResponse(
        `/prisoner/${prisonNumber}/money/private-cash`,
        'Private cash transactions',
        AuditPage.PRISONER_CASH_TRANSACTIONS,
      )
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      await verifyTransactionPageHandlesAPIErrors(`/prisoner/${prisonNumber}/money/private-cash`)
    })

    it('should handle API errors (e.g. 500)', async () => {
      await verifyTransactionPageHandles500(
        `/prisoner/${prisonNumber}/money/private-cash`,
        AuditPage.PRISONER_CASH_TRANSACTIONS,
      )
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      await verifyPageHandlesSignOutOnPrisonerMoneyPermissionFalse('/prisoner/A1234BC/money/private-cash')
    })
  })

  describe('/prisoner/:prisonNumber/money/spends', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      await verifyTransactionPageResponse(
        `/prisoner/${prisonNumber}/money/spends`,
        'Spends transactions',
        AuditPage.PRISONER_SPENDS_TRANSACTIONS,
      )
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      await verifyTransactionPageHandlesAPIErrors(`/prisoner/${prisonNumber}/money/spends`)
    })

    it('should handle API errors (e.g. 500)', async () => {
      await verifyTransactionPageHandles500(
        `/prisoner/${prisonNumber}/money/spends`,
        AuditPage.PRISONER_SPENDS_TRANSACTIONS,
      )
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      await verifyPageHandlesSignOutOnPrisonerMoneyPermissionFalse('/prisoner/A1234BC/money/spends')
    })
  })

  describe('/prisoner/:prisonNumber/money/savings', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      await verifyTransactionPageResponse(
        `/prisoner/${prisonNumber}/money/savings`,
        'Savings transactions',
        AuditPage.PRISONER_SAVINGS_TRANSACTIONS,
      )
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      await verifyTransactionPageHandlesAPIErrors(`/prisoner/${prisonNumber}/money/savings`)
    })

    it('should handle API errors (e.g. 500)', async () => {
      await verifyTransactionPageHandles500(
        `/prisoner/${prisonNumber}/money/savings`,
        AuditPage.PRISONER_SAVINGS_TRANSACTIONS,
      )
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      await verifyPageHandlesSignOutOnPrisonerMoneyPermissionFalse('/prisoner/A1234BC/money/savings')
    })
  })
})
