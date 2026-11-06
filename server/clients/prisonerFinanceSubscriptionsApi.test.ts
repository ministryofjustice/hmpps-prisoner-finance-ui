import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { asSystem } from '@ministryofjustice/hmpps-rest-client'
import { Page } from '../interfaces/Pageable'
import PrisonerFinanceSubscriptionsApiClient from './prisonerFinanceSubscriptionsApi'
import { PrisonerSubscriptionResponse } from '../interfaces/PrisonerSubscriptionResponse'
import { PrisonerSubscriptionSummaryResponse } from '../interfaces/PrisonerSubscriptionSummaryResponse'

describe('Prison Finance Subscriptions Api', () => {
  let client: PrisonerFinanceSubscriptionsApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationClient>

    client = new PrisonerFinanceSubscriptionsApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const prisonNumber = 'A1234CD'
  describe('getSubscriptions', () => {
    it('should call the API', async () => {
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

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(pagedResponse)

      const response = await client.getSubscriptions(prisonNumber, '1')

      expect(response).toEqual(pagedResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/subscriptions/account/${prisonNumber}`,
          query: {
            pageNumber: '1',
            pageSize: '25',
          },
        },
        asSystem(),
      )
    })
  })

  describe('getSubscriptionsSummary', () => {
    it('should call the API', async () => {
      const prisonerSubscriptionSummaryResponse: PrisonerSubscriptionSummaryResponse = {
        weeklyPaymentAmount: 150,
        subscriptionCount: 3,
      }

      const getSpy = jest.spyOn(client, 'get').mockResolvedValue(prisonerSubscriptionSummaryResponse)

      const response = await client.getSubscriptionsSummary(prisonNumber)

      expect(response).toEqual(prisonerSubscriptionSummaryResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/subscriptions/account/${prisonNumber}/summary`,
        },
        asSystem(),
      )
    })
  })
})
