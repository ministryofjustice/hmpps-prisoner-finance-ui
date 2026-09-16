import { expect, test } from '@playwright/test'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'

import prisonRegisterApi from '../mockApis/prisonRegisterApi'

import prisonApi from '../mockApis/prisonApi'
import * as prisonerFinanceAdvancesApi from '../mockApis/prisonerFinanceAdvancesApi'
import { resetStubs } from '../mockApis/wiremock'
import { login } from '../testUtils'
import PrisonerAdvanceDetailPage from '../pages/prisonerAdvanceDetails'
import { PrisonerAdvancePaymentsResponse } from '../../server/interfaces/PrisonerAdvancePaymentsResponse'
import { stubGetAdvancePaymentReturnNotFound } from '../mockApis/prisonerFinanceAdvancesApi'
import PageNotFoundErrorPage from '../pages/pageNotFoundErrorPage'

test.describe('Show advances for prisoner', () => {
  const prisonNumber = 'A1234BC'
  const advanceId = '1'

  const advancePaymentsPayload: PrisonerAdvancePaymentsResponse[] = [
    {
      id: '1',
      prisonNumber,
      legacyAdvanceNumber: 10,
      createdAt: '2026-10-10T10:48:28.094Z',
      createdBy: 'TEST',
      date: '2026-10-10T10:48:28.094Z',
      paymentAmount: 10,
      advanceLocation: 'LEI',
    },
    {
      id: '2',
      prisonNumber,
      legacyAdvanceNumber: 16,
      createdAt: '2026-10-11T10:48:28.094Z',
      createdBy: 'Billy',
      date: '2026-10-11T10:48:28.094Z',
      paymentAmount: 100,
      advanceLocation: 'LEI',
    },
    {
      id: '3',
      prisonNumber,
      legacyAdvanceNumber: 10,
      createdAt: '2026-10-16T10:48:28.094Z',
      createdBy: 'TEST',
      date: '2026-10-16T10:48:28.094Z',
      paymentAmount: 1,
      advanceLocation: 'LEI',
    },
    {
      id: '4',
      prisonNumber,
      legacyAdvanceNumber: 10,
      createdAt: '2026-10-17T10:48:28.094Z',
      createdBy: 'TEST',
      date: '2026-10-17T10:48:28.094Z',
      paymentAmount: 5,
      advanceLocation: 'LEI',
    },
    {
      id: '5',
      prisonNumber,
      legacyAdvanceNumber: 10,
      createdAt: '2026-10-19T10:48:28.094Z',
      createdBy: 'TEST',
      date: '2026-10-19T10:48:28.094Z',
      paymentAmount: 9,
      advanceLocation: 'LEI',
    },
  ]

  const baseStubs = async () => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
    await prisonRegisterApi.stubGetPrisonNames()
  }

  const setupGetAdvanceDetailsStubs = async (
    paymentsPayload: PrisonerAdvancePaymentsResponse[] = [],
    options: { pageNumber: number; pageSize: string; totalPages: number } = {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
    },
  ) => {
    await baseStubs()
    await prisonerFinanceAdvancesApi.stubGetAdvanceBalance(prisonNumber, advanceId)
    await prisonerFinanceAdvancesApi.stubGetAdvancePayments(prisonNumber, advanceId, paymentsPayload, options)
  }

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test('Should display advance details when page is loaded', async ({ page }) => {
    await setupGetAdvanceDetailsStubs(advancePaymentsPayload)

    const prisonerAdvancesPage = await PrisonerAdvanceDetailPage.load(page, prisonNumber, advanceId)

    expect(prisonerAdvancesPage.advancePaymentsList).toBeVisible()
    expect(prisonerAdvancesPage.advancePaymentsList).toContainText(
      [
        'Date Payment amount Created by Location',
        '10/10/202611:48 0.10 TEST Leeds (HMP)',
        '11/10/202611:48 1.00 Billy Leeds (HMP)',
        '16/10/202611:48 0.01 TEST Leeds (HMP)',
        '17/10/202611:48 0.05 TEST Leeds (HMP)',
        '19/10/202611:48 0.09 TEST Leeds (HMP)',
      ].join('\n'),
    )

    expect(prisonerAdvancesPage.ThisAdvanceBalanceCard).toBeVisible()
    expect(prisonerAdvancesPage.OutstandingBalanceCard).toBeVisible()
    expect(prisonerAdvancesPage.WeeklyPaymentsBalanceCard).toBeVisible()
    expect(prisonerAdvancesPage.PaymentsRemainingBalanceCard).toBeVisible()
  })

  test('Should display no payments when the user does not have any payment', async ({ page }) => {
    await setupGetAdvanceDetailsStubs([])

    const prisonerAdvancesPage = await PrisonerAdvanceDetailPage.load(page, prisonNumber, advanceId)

    expect(prisonerAdvancesPage.advancePaymentsList).not.toBeVisible()

    const noAdvancesMessage = page.locator('[data-testid="no-advance-payments-message"]')
    await expect(noAdvancesMessage).toBeVisible()
    await expect(noAdvancesMessage).toHaveText('No payments to show')

    expect(prisonerAdvancesPage.ThisAdvanceBalanceCard).toBeVisible()
    expect(prisonerAdvancesPage.OutstandingBalanceCard).toBeVisible()
    expect(prisonerAdvancesPage.WeeklyPaymentsBalanceCard).toBeVisible()
    expect(prisonerAdvancesPage.PaymentsRemainingBalanceCard).toBeVisible()
  })

  test(`Should render pagination component and allow progression`, async ({ page }) => {
    await setupGetAdvanceDetailsStubs(advancePaymentsPayload, {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
    })

    const prisonerAdvancesPage = await PrisonerAdvanceDetailPage.load(page, prisonNumber, advanceId)

    await expect(prisonerAdvancesPage.topPagination).toBeVisible()
    await expect(prisonerAdvancesPage.bottomPagination).toBeVisible()

    const bottomNavButton = prisonerAdvancesPage.topPagination.locator("[aria-label='Page 2']")
    await expect(bottomNavButton).toBeVisible()
    expect(await bottomNavButton.getAttribute('href')).toContain('page=2')

    await setupGetAdvanceDetailsStubs(advancePaymentsPayload, {
      pageNumber: 2,
      pageSize: '25',
      totalPages: 2,
    })

    await bottomNavButton.click()

    expect(page.url()).toContain('page=2')

    const resultText = prisonerAdvancesPage.page.locator('.moj-pagination__results')
    await expect(resultText.first()).toBeVisible()

    expect(await resultText.first().innerText()).toBe('Showing 6 to 5 of 5 total results')

    const topCurrentPageLi = prisonerAdvancesPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('2')

    const bottomCurrentPageLi = prisonerAdvancesPage.topPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('2')
  })

  test(`Should allow progression with next button`, async ({ page }) => {
    await setupGetAdvanceDetailsStubs(advancePaymentsPayload, {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
    })

    const prisonerAdvancesPage = await PrisonerAdvanceDetailPage.load(page, prisonNumber, advanceId)

    await expect(prisonerAdvancesPage.topPagination).toBeVisible()
    await expect(prisonerAdvancesPage.bottomPagination).toBeVisible()

    const nextNavButton = prisonerAdvancesPage.topPagination.locator("[rel='next']")
    await expect(nextNavButton).toBeVisible()
    expect(await nextNavButton.getAttribute('href')).toContain('page=2')

    await setupGetAdvanceDetailsStubs(advancePaymentsPayload, {
      pageNumber: 2,
      pageSize: '25',
      totalPages: 2,
    })
    await nextNavButton.click()

    expect(page.url()).toContain('page=2')

    const topCurrentPageLi = prisonerAdvancesPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('2')

    const bottomCurrentPageLi = prisonerAdvancesPage.topPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('2')
  })

  test(`Should allow progression with previous button`, async ({ page }) => {
    await setupGetAdvanceDetailsStubs(advancePaymentsPayload, {
      pageNumber: 2,
      pageSize: '25',
      totalPages: 2,
    })

    await page.goto(`/prisoner/${prisonNumber}/money/advances/detail/${advanceId}?page=2`)
    const prisonerAdvancesPage = await PrisonerAdvanceDetailPage.verifyOnPage(page, prisonNumber, advanceId)

    await expect(prisonerAdvancesPage.topPagination).toBeVisible()
    await expect(prisonerAdvancesPage.bottomPagination).toBeVisible()

    const prevNavButton = prisonerAdvancesPage.topPagination.locator("[rel='prev']")
    await expect(prevNavButton).toBeVisible()
    expect(await prevNavButton.getAttribute('href')).toContain('page=1')

    await setupGetAdvanceDetailsStubs(advancePaymentsPayload, {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
    })

    await prevNavButton.click()

    expect(page.url()).toContain('page=1')

    const topCurrentPageLi = prisonerAdvancesPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('1')

    const bottomCurrentPageLi = prisonerAdvancesPage.topPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('1')
  })

  test(`Should click back button and go back to prisoner advances page`, async ({ page }) => {
    await setupGetAdvanceDetailsStubs(advancePaymentsPayload)

    const prisonerAdvancesPage = await PrisonerAdvanceDetailPage.load(page, prisonNumber, advanceId)

    await prisonerAdvancesPage.backLink.click()

    await expect(page).toHaveURL(new RegExp(`.*/prisoner/${prisonNumber}/advances$`))
  })

  test('Should display not found page when advance does not exist', async ({ page }) => {
    await baseStubs()

    await stubGetAdvancePaymentReturnNotFound(prisonNumber, advanceId)

    await page.goto(`/prisoner/${prisonNumber}/money/advances/detail/${advanceId}`)

    await PageNotFoundErrorPage.verifyOnPage(page, `/prisoner/${prisonNumber}/money/advances/detail/${advanceId}`)
  })
})
