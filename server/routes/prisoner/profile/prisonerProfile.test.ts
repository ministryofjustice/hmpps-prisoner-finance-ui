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
import PrisonerFinanceAdvancesService from '../../../services/prisonerFinanceAdvancesService'

jest.mock('../../../services/prisonerFinanceService')
jest.mock('../../../services/prisonerSearchService')
jest.mock('../../../services/prisonRegisterService')
jest.mock('../../../services/prisonApiService')
jest.mock('@ministryofjustice/hmpps-prison-permissions-lib')
jest.mock('../../../services/prisonerFinanceHoldsService')
jest.mock('../../../services/prisonerFinanceAdvancesService')

const featureFlagService = new FeatureFlagService() as jest.Mocked<FeatureFlagService>

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const prisonerFinanceService = new PrisonerFinanceService(null) as jest.Mocked<PrisonerFinanceService>
const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const prisonPermissionsService = {} as unknown as PermissionsService
const prisonRegisterService = new PrisonRegisterService(null) as jest.Mocked<PrisonRegisterService>
const prisonApiService = new PrisonApiService(null) as jest.Mocked<PrisonApiService>
const prisonerFinanceHoldsService = new PrisonerFinanceHoldsService(null) as jest.Mocked<PrisonerFinanceHoldsService>
const prisonerFinanceAdvancesService = new PrisonerFinanceAdvancesService(
  null,
) as jest.Mocked<PrisonerFinanceAdvancesService>

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
        prisonerFinanceAdvancesService,
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
        hoa: 0,
        whf: 0,
      })
      prisonerFinanceAdvancesService.getAdvancesBalances.mockResolvedValue({
        balanceDateTime: '',
        advancesAmount: 10,
        balancesOutstanding: 10,
        weeklyPaymentAmount: 11,
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
      expect(res.text).toContain('not found')
      expect(res.text).toContain('If you typed the web address, check it is correct.')
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

    test('should not found when user does not have permission', async () => {
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
})
