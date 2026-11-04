import PrisonerFinanceSubscriptionsApiClient from '../clients/prisonerFinanceSubscriptionsApi'
import { Page } from '../interfaces/Pageable'
import { PrisonerSubscriptionResponse } from '../interfaces/PrisonerSubscriptionResponse'
import PrisonerFinanceSubscriptionsService from './prisonerFinanceSubscriptionsService'

jest.mock('../clients/prisonerFinanceSubscriptionsApi')

describe('PrisonerFinanceSubscriptionsService', () => {
  const apiClient = new PrisonerFinanceSubscriptionsApiClient(
    null,
  ) as jest.Mocked<PrisonerFinanceSubscriptionsApiClient>
  let service: PrisonerFinanceSubscriptionsService

  beforeEach(() => {
    service = new PrisonerFinanceSubscriptionsService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getSubscriptions', () => {
    it('should call the API client', async () => {
      const prisonNumber = 'A123BCD'

      const subscription: PrisonerSubscriptionResponse = {
        id: '',
        legacyPaymentProfileId: 12345,
        amount: 150,
        dayOfPayment: 'MONDAY',
        startDate: '11-11-2026',
        endDate: null,
        subscriptionType: 'TELE',
        reference: 'sky tv',
        createdBy: 'TEST_USER',
        createdAt: '',
        prisonId: 'LEI',
        prisonNumber,
        subAccountRef: 'SPENDS',
      }

      const pagedResponse: Page<PrisonerSubscriptionResponse> = {
        content: [subscription],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 25,
        isLastPage: true,
      }

      apiClient.getSubscriptions.mockResolvedValue(pagedResponse)

      await service.getSubscriptions(prisonNumber, '1', false)

      expect(apiClient.getSubscriptions).toHaveBeenCalledWith(prisonNumber, '1')
    })

    it('should not call the API client when there are validation errors', async () => {
      const prisonNumber = 'A123BCD'

      const subscription: PrisonerSubscriptionResponse = {
        id: '',
        legacyPaymentProfileId: 12345,
        amount: 150,
        dayOfPayment: 'MONDAY',
        startDate: '11-11-2026',
        endDate: null,
        subscriptionType: 'TELE',
        reference: 'sky tv',
        createdBy: 'TEST_USER',
        createdAt: '',
        prisonId: 'LEI',
        prisonNumber,
        subAccountRef: 'SPENDS',
      }

      const pagedResponse: Page<PrisonerSubscriptionResponse> = {
        content: [subscription],
        totalElements: 1,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 25,
        isLastPage: true,
      }

      apiClient.getSubscriptions.mockResolvedValue(pagedResponse)

      await service.getSubscriptions(prisonNumber, '1', true)

      expect(apiClient.getSubscriptions).not.toHaveBeenCalled()
    })
  })
})
