import { expect, test } from '@playwright/test'
import { resetStubs } from '../mockApis/wiremock'
import { login } from '../testUtils'
import prisonApi from '../mockApis/prisonApi'
import prisonRegisterApi from '../mockApis/prisonRegisterApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import PrisonerSubscriptionsPage from '../pages/prisonerSubscriptionsPage'
import { PrisonerSubscriptionResponse } from '../../server/interfaces/PrisonerSubscriptionResponse'
import { PrisonerSubscriptionSummaryResponse } from '../../server/interfaces/PrisonerSubscriptionSummaryResponse'
import * as prisonerFinanceSubscriptionsApi from '../mockApis/prisonerFinanceSubscriptionsApi'

test.describe('Show subscriptions for prisoner', () => {
  const prisonNumber = 'A1234BC'

  const subscriptionsPayload: PrisonerSubscriptionResponse[] = [
    {
      id: '1',
      legacyPaymentProfileId: 123,
      amount: 100,
      dayOfPayment: 'MONDAY',
      startDate: '2026-11-03',
      endDate: null,
      subscriptionType: 'TELE',
      reference: 'SKY TV',
      createdBy: 'USER',
      createdAt: '2026-03-19T10:43:28.194Z',
      prisonId: 'LEI',
      prisonNumber,
      subAccountRef: 'SPENDS',
    },
    {
      id: '2',
      legacyPaymentProfileId: 1234,
      amount: 50,
      dayOfPayment: 'TUESDAY',
      startDate: '2026-11-02',
      endDate: null,
      subscriptionType: 'NEWS',
      reference: 'The onion',
      createdBy: 'USER',
      createdAt: '2026-03-19T10:43:28.194Z',
      prisonId: 'LEI',
      prisonNumber,
      subAccountRef: 'SPENDS',
    },
    {
      id: '3',
      legacyPaymentProfileId: 12345,
      amount: 75,
      dayOfPayment: 'WEDNESDAY',
      startDate: '2026-11-01',
      endDate: '2026-12-01',
      subscriptionType: 'MAGS',
      reference: 'beano',
      createdBy: 'USER',
      createdAt: '2026-03-19T10:43:28.194Z',
      prisonId: 'LEI',
      prisonNumber,
      subAccountRef: 'SPENDS',
    },
  ]

  const summaryPayload: PrisonerSubscriptionSummaryResponse = {
    weeklyPaymentAmount: 225,
    subscriptionCount: 3,
  }

  const setupSubscriptionStubs = async () => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
    await prisonRegisterApi.stubGetPrisonNames()
    await prisonerFinanceSubscriptionsApi.stubGetSubscriptions(prisonNumber, subscriptionsPayload)
    await prisonerFinanceSubscriptionsApi.stubGetSubscriptionsSummary(prisonNumber, summaryPayload)
  }

  test.beforeEach(async ({ page }) => {
    await resetStubs()

    await login(page)
  })

  test('Should display subscriptions when page is loaded', async ({ page }) => {
    await setupSubscriptionStubs()
    const prisonerSubscriptionsPage = await PrisonerSubscriptionsPage.load(page, prisonNumber)

    expect(prisonerSubscriptionsPage.subscriptionsList).toBeVisible()
    expect(prisonerSubscriptionsPage.subscriptionsList).toContainText(
      [
        'Payment type Start date End date Reference Amount per week User',
        'TELE 03/11/26 No data SKY TV 1.00 USER ',
        'NEWS 02/11/26 No data The onion 0.50 USER ',
        'MAGS 01/11/26 01/12/26 beano 0.75 USER ',
      ].join('\n'),
    )

    expect(prisonerSubscriptionsPage.currentSubscriptionsTotalCard).toBeVisible()
  })
})
