import type { Express } from 'express'
import request from 'supertest'
import { PrisonerMoneyPermission, PermissionsService } from '@ministryofjustice/hmpps-prison-permissions-lib'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import AuditService, { AuditPage, SubjectType } from '../../../services/auditService'
import PrisonerFinanceService from '../../../services/prisonerFinanceService'
import PrisonerSearchService from '../../../services/prisonerSearchService'
import mockPermissions from '../../testutils/mockPermissions'
import PrisonRegisterService from '../../../services/prisonRegisterService'
import { PrisonerTransactionResponse } from '../../../interfaces/PrisonerTransactionResponse'
import { Page } from '../../../interfaces/Pageable'
import PrisonApiService from '../../../services/prisonApiService'
import PrisonerFinanceHoldsService from '../../../services/prisonerFinanceHoldsService'
import FeatureFlagService from '../../../services/featureFlagService'

jest.mock('../../../services/prisonerFinanceService')
jest.mock('../../../services/prisonerSearchService')
jest.mock('../../../services/prisonRegisterService')
jest.mock('../../../services/prisonApiService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../services/prisonerFinanceHoldsService')

const featureFlagService = new FeatureFlagService() as jest.Mocked<FeatureFlagService>

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
    featureFlagService.isFeatureEnabled.mockReturnValue(Promise.resolve(true))

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
        featureFlagService,
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

  const verifyPageHandlesNotFoundOnPrisonerMoneyPermissionFalse = async (url: string) => {
    mockPermissions(undefined, { [PrisonerMoneyPermission.read]: false })

    app = appWithAllRoutes({
      services: {
        auditService,
        prisonerFinanceService,
        prisonPermissionsService,
        prisonerSearchService,
        prisonApiService,
        featureFlagService,
      },
      userSupplier: () => user,
    })

    const response = await request(app).get(url)

    expect(response.status).toBe(404)
  }

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

    test('should return not found when user does not have permission', async () => {
      await verifyPageHandlesNotFoundOnPrisonerMoneyPermissionFalse('/prisoner/A1234BC/money')
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

    test('should return not found when user does not have permission', async () => {
      await verifyPageHandlesNotFoundOnPrisonerMoneyPermissionFalse('/prisoner/A1234BC/money/private-cash')
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

    test('should return not found when user does not have permission', async () => {
      await verifyPageHandlesNotFoundOnPrisonerMoneyPermissionFalse('/prisoner/A1234BC/money/spends')
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

    test('should return 404 when user does not have permission', async () => {
      await verifyPageHandlesNotFoundOnPrisonerMoneyPermissionFalse('/prisoner/A1234BC/money/savings')
    })
  })
})
