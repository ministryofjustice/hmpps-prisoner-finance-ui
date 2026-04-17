import type { Express } from 'express'
import request from 'supertest'
import { PrisonerMoneyPermission, PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { appWithAllRoutes, user } from './testutils/appSetup'
import AuditService, { AuditPage } from '../services/auditService'
import PrisonerFinanceService from '../services/prisonerFinanceService'
import PrisonerSearchService from '../services/prisonerSearchService'
import mockPermissions from './testutils/mockPermissions'
import PrisonRegisterService from '../services/prisonRegisterService'
import { PrisonerTransactionResponse } from '../interfaces/PrisonerTransactionResponse'
import { Page } from '../interfaces/Pageable'

jest.mock('../services/prisonerFinanceService')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/prisonRegisterService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonPermissionsService = {} as unknown as PermissionsService
const prisonRegisterService = new PrisonRegisterService(null) as jest.Mocked<PrisonRegisterService>

let app: Express

describe('Prisoners', () => {
  beforeEach(() => {
    mockPermissions(undefined, { [PrisonerMoneyPermission.read]: true })

    prisonerSearchService.getPrisoner.mockResolvedValue({
      firstName: 'BOB',
      lastName: 'TAYLOR',
      prisonerNumber: 'A9971EC',
      prisonId: 'MDI',
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
    })

    prisonRegisterService.getPrisonNames.mockResolvedValue([{ prisonId: 'LEI', prisonName: 'Leeds (HMP)' }])

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerFinanceService,
        prisonPermissionsService,
        prisonerSearchService,
        prisonRegisterService,
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

  afterEach(() => {
    jest.resetAllMocks()
  })

  const verifyTransactionPageResponse = async (url: string, headerTitle: string) => {
    const balanceResponse = { accountId: '', balanceDateTime: '', amount: 1000 }
    prisonerFinanceService.getTransactionPage.mockResolvedValue([emptyPageTransactionsResponse, balanceResponse])

    const response = await request(app).get(url).expect(200).expect('Content-Type', /html/)

    expect(auditService.logPageView).toHaveBeenCalledWith(
      AuditPage.PRISONER_MONEY,
      expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
    )
    expect(response.text).toContain(headerTitle)
  }

  const verifyTransactionPageHandlesAPIErrors = async (url: string) => {
    const error = Object.assign(new Error('Not Found'), { data: { status: 404, userMessage: 'Not Found' } })
    prisonerFinanceService.getTransactionPage.mockRejectedValue(error)
    const res = await request(app).get(url).expect(404)
    expect(res.text).toContain(error.data.userMessage)
  }

  const verifyTransactionPageHandles500 = async (url: string) => {
    const error = Object.assign(new Error('GL error'), { data: { status: 500, userMessage: 'GL Error' } })
    prisonerFinanceService.getTransactionPage.mockRejectedValue(error)
    const res = await request(app).get(url).expect(500)
    expect(res.text).toContain(error.data.userMessage)
  }

  const verifyTransactionPageHandlesSignOut = async (url: string) => {
    mockPermissions(undefined, { [PrisonerMoneyPermission.read]: false })

    app = appWithAllRoutes({
      services: { auditService, prisonerFinanceService, prisonPermissionsService, prisonerSearchService },
      userSupplier: () => user,
    })

    const response = await request(app).get(url)

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/sign-out')

    expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).not.toHaveBeenCalled()
  }

  describe('/prisoner/:prisonNumber/money', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      await verifyTransactionPageResponse(`/prisoner/${prisonNumber}/money`, 'Transactions for all sub accounts')
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      await verifyTransactionPageHandlesAPIErrors(`/prisoner/${prisonNumber}/money`)
    })

    it('should handle API errors (e.g. 500)', async () => {
      await verifyTransactionPageHandles500(`/prisoner/${prisonNumber}/money`)
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      await verifyTransactionPageHandlesSignOut('/prisoner/A1234BC/money')
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

      await request(app).get(`/prisoner/${prisonNumber}`).expect(200).expect('Content-Type', /html/)

      expect(auditService.logPageView).toHaveBeenCalledWith(
        AuditPage.PRISONER_PROFILE,
        expect.objectContaining({ correlationId: expect.any(String), who: user.username }),
      )
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      const error = Object.assign(new Error('Not Found'), { data: { status: 404, userMessage: 'Not Found' } })
      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockRejectedValue(error)
      const res = await request(app).get(`/prisoner/${prisonNumber}`).expect(404)
      expect(res.text).toContain(error.data.userMessage)
    })

    it('should handle API errors (e.g. 500)', async () => {
      const error = Object.assign(new Error('GL error'), { data: { status: 500, userMessage: 'GL Error' } })
      prisonerFinanceService.getPrisonerTransactionsByPrisonNumber.mockRejectedValue(error)
      const res = await request(app).get(`/prisoner/${prisonNumber}`).expect(500)
      expect(res.text).toContain(error.data.userMessage)
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      mockPermissions(undefined, { [PrisonerMoneyPermission.read]: false })

      app = appWithAllRoutes({
        services: { auditService, prisonerFinanceService, prisonPermissionsService, prisonerSearchService },
        userSupplier: () => user,
      })

      const response = await request(app).get('/prisoner/A1234BC')

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe('/sign-out')

      expect(prisonerFinanceService.getPrisonerTransactionsByPrisonNumber).not.toHaveBeenCalled()
    })
  })

  describe('/prisoner/:prisonNumber/money/private-cash', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      await verifyTransactionPageResponse(`/prisoner/${prisonNumber}/money/private-cash`, 'Private cash transactions')
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      await verifyTransactionPageHandlesAPIErrors(`/prisoner/${prisonNumber}/money/private-cash`)
    })

    it('should handle API errors (e.g. 500)', async () => {
      await verifyTransactionPageHandles500(`/prisoner/${prisonNumber}/money/private-cash`)
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      await verifyTransactionPageHandlesSignOut('/prisoner/A1234BC/money/private-cash')
    })
  })

  describe('/prisoner/:prisonNumber/money/spends', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      await verifyTransactionPageResponse(`/prisoner/${prisonNumber}/money/spends`, 'Spends transactions')
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      await verifyTransactionPageHandlesAPIErrors(`/prisoner/${prisonNumber}/money/spends`)
    })

    it('should handle API errors (e.g. 500)', async () => {
      await verifyTransactionPageHandles500(`/prisoner/${prisonNumber}/money/spends`)
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      await verifyTransactionPageHandlesSignOut('/prisoner/A1234BC/money/spends')
    })
  })

  describe('/prisoner/:prisonNumber/money/savings', () => {
    it('should return a 200, render the correct page and call the audit service', async () => {
      await verifyTransactionPageResponse(`/prisoner/${prisonNumber}/money/savings`, 'Savings transactions')
    })

    it('should handle API errors (e.g. 404 Not Found)', async () => {
      await verifyTransactionPageHandlesAPIErrors(`/prisoner/${prisonNumber}/money/savings`)
    })

    it('should handle API errors (e.g. 500)', async () => {
      await verifyTransactionPageHandles500(`/prisoner/${prisonNumber}/money/savings`)
    })

    test('should redirect to sign-out when user does not have permission', async () => {
      await verifyTransactionPageHandlesSignOut('/prisoner/A1234BC/money/savings')
    })
  })
})
