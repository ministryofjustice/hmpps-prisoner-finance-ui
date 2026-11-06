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

  const setupSubscriptionStubs = async (
    subscriptions: PrisonerSubscriptionResponse[],
    summary: PrisonerSubscriptionSummaryResponse,
    options: { pageNumber: number; pageSize: string; totalPages: number; totalElements: number } = {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
      totalElements: 50,
    },
  ) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
    await prisonRegisterApi.stubGetPrisonNames()
    await prisonerFinanceSubscriptionsApi.stubGetSubscriptions(prisonNumber, subscriptions, options)
    await prisonerFinanceSubscriptionsApi.stubGetSubscriptionsSummary(prisonNumber, summary)
  }

  test.beforeEach(async ({ page }) => {
    await resetStubs()

    await login(page)
  })

  test('Should display subscriptions when page is loaded', async ({ page }) => {
    await setupSubscriptionStubs(subscriptionsPayload, summaryPayload)
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

  test('Should display no subscriptions when the user does not have any subscriptions', async ({ page }) => {
    await setupSubscriptionStubs([], summaryPayload)

    const prisonerSubscriptionsPage = await PrisonerSubscriptionsPage.load(page, prisonNumber)

    expect(prisonerSubscriptionsPage.subscriptionsList).not.toBeVisible()

    const noSubscriptionsMessage = page.locator('[data-testid="no-subscriptions-message"]')
    await expect(noSubscriptionsMessage).toBeVisible()
    await expect(noSubscriptionsMessage).toHaveText('No subscriptions to show')

    expect(prisonerSubscriptionsPage.currentSubscriptionsTotalCard).toBeVisible()
  })

  test(`Should render pagination component and allow progression`, async ({ page }) => {
    const page1Payload = Array(25).fill(() => {
      return structuredClone(subscriptionsPayload[0])
    })

    await setupSubscriptionStubs(page1Payload, summaryPayload, {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
      totalElements: 50,
    })

    const prisonerSubscriptionsPage = await PrisonerSubscriptionsPage.load(page, prisonNumber)

    await expect(prisonerSubscriptionsPage.topPagination).toBeVisible()
    await expect(prisonerSubscriptionsPage.bottomPagination).toBeVisible()

    const page1ResultText = prisonerSubscriptionsPage.page.locator('.moj-pagination__results')
    expect(await page1ResultText.first().innerText()).toBe('Showing 1 to 25 of 50 total results')

    const bottomNavButton = prisonerSubscriptionsPage.topPagination.locator("[aria-label='Page 2']")
    await expect(bottomNavButton).toBeVisible()
    expect(await bottomNavButton.getAttribute('href')).toContain('page=2')

    const page2Payload = Array(25).fill(() => {
      return structuredClone(subscriptionsPayload[1])
    })

    await setupSubscriptionStubs(page2Payload, summaryPayload, {
      pageNumber: 2,
      pageSize: '25',
      totalPages: 2,
      totalElements: 50,
    })

    await bottomNavButton.click()

    expect(page.url()).toContain('page=2')

    const page2ResultText = prisonerSubscriptionsPage.page.locator('.moj-pagination__results')
    await expect(page2ResultText.first()).toBeVisible()

    expect(await page2ResultText.first().innerText()).toBe('Showing 26 to 50 of 50 total results')

    const topCurrentPageLi = prisonerSubscriptionsPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('2')

    const bottomCurrentPageLi = prisonerSubscriptionsPage.topPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('2')
  })

  test(`Should allow progression with next button`, async ({ page }) => {
    await setupSubscriptionStubs(subscriptionsPayload, summaryPayload, {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
      totalElements: 50,
    })

    const prisonerSubscriptionsPage = await PrisonerSubscriptionsPage.load(page, prisonNumber)

    await expect(prisonerSubscriptionsPage.topPagination).toBeVisible()
    await expect(prisonerSubscriptionsPage.bottomPagination).toBeVisible()

    const nextNavButton = prisonerSubscriptionsPage.topPagination.locator("[rel='next']")
    await expect(nextNavButton).toBeVisible()
    expect(await nextNavButton.getAttribute('href')).toContain('page=2')

    await setupSubscriptionStubs(subscriptionsPayload, summaryPayload, {
      pageNumber: 2,
      pageSize: '25',
      totalPages: 2,
      totalElements: 50,
    })
    await nextNavButton.click()

    expect(page.url()).toContain('page=2')

    const topCurrentPageLi = prisonerSubscriptionsPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('2')

    const bottomCurrentPageLi = prisonerSubscriptionsPage.topPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('2')
  })

  test(`Should allow progression with previous button`, async ({ page }) => {
    await setupSubscriptionStubs(subscriptionsPayload, summaryPayload, {
      pageNumber: 2,
      pageSize: '25',
      totalPages: 2,
      totalElements: 50,
    })

    await page.goto(`/prisoner/${prisonNumber}/subscriptions?page=2`)
    const prisonerSubscriptionsPage = await PrisonerSubscriptionsPage.verifyOnPage(page, prisonNumber)

    await expect(prisonerSubscriptionsPage.topPagination).toBeVisible()
    await expect(prisonerSubscriptionsPage.bottomPagination).toBeVisible()

    const prevNavButton = prisonerSubscriptionsPage.topPagination.locator("[rel='prev']")
    await expect(prevNavButton).toBeVisible()
    expect(await prevNavButton.getAttribute('href')).toContain('page=1')

    await setupSubscriptionStubs(subscriptionsPayload, summaryPayload, {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
      totalElements: 50,
    })

    await prevNavButton.click()

    expect(page.url()).toContain('page=1')

    const topCurrentPageLi = prisonerSubscriptionsPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('1')

    const bottomCurrentPageLi = prisonerSubscriptionsPage.topPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('1')
  })

  test(`Should click back button and go back to prisoner profile page`, async ({ page }) => {
    await setupSubscriptionStubs(subscriptionsPayload, summaryPayload)

    const prisonerSubscriptionsPage = await PrisonerSubscriptionsPage.load(page, prisonNumber)

    await prisonerSubscriptionsPage.backLink.click()

    await expect(page).toHaveURL(new RegExp(`.*/prisoner/${prisonNumber}$`))
  })
})
