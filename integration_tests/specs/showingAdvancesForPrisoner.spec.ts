import { expect, test } from '@playwright/test'
import PrisonerAdvancesPage from '../pages/prisonerAdvancesPage'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'

import prisonRegisterApi from '../mockApis/prisonRegisterApi'

import prisonApi from '../mockApis/prisonApi'
import * as prisonerFinanceAdvancesApi from '../mockApis/prisonerFinanceAdvancesApi'
import { PrisonerAdvanceResponse } from '../../server/interfaces/PrisonerAdvanceResponse'
import { resetStubs } from '../mockApis/wiremock'
import { login } from '../testUtils'

test.describe('Show advances for prisoner', () => {
  const prisonNumber = 'A1234BC'

  const advancesPayload: PrisonerAdvanceResponse[] = [
    {
      id: '',
      prisonNumber: 'AB123XZ',
      legacyAdvanceNumber: 11,
      createdAt: '',
      createdBy: 'TEST',
      date: '2026-03-10T10:48:28.094Z',
      advanceAmount: 10,
      paymentAmount: 1,
      startPayments: '2026-10-10T10:48:28.094Z',
      reference: 'An advance',
      advanceLocation: 'LEI',
      status: 'Active',
    },
    {
      id: '',
      prisonNumber: 'AB123XZ',
      legacyAdvanceNumber: 13,
      createdAt: '',
      createdBy: 'Billy',
      date: '2026-03-11T11:48:28.094Z',
      advanceAmount: 120,
      paymentAmount: 10,
      startPayments: '2026-10-11T10:48:28.094Z',
      reference: 'Test advance',
      advanceLocation: 'MDI',
      status: 'Inactive',
    },
    {
      id: '',
      prisonNumber: 'AB123XZ',
      legacyAdvanceNumber: 14,
      createdAt: '',
      createdBy: 'TEST',
      date: '2026-03-12T10:43:28.094Z',
      advanceAmount: 20,
      paymentAmount: 3,
      startPayments: '2026-10-14T10:48:28.094Z',
      reference: 'Another advance',
      advanceLocation: 'LEI',
      status: 'Active',
    },
    {
      id: '',
      prisonNumber: 'AB123XZ',
      legacyAdvanceNumber: 18,
      createdAt: '',
      createdBy: 'TEST',
      date: '2026-03-23T07:48:28.094Z',
      advanceAmount: 15,
      paymentAmount: 1,
      startPayments: '2026-10-18T10:48:28.094Z',
      reference: 'first day in prison',
      advanceLocation: 'LEI',
      status: 'Active',
    },
    {
      id: '',
      prisonNumber: 'AB123XZ',
      legacyAdvanceNumber: 19,
      createdAt: '',
      createdBy: 'TEST',
      date: '2026-12-25T00:00:00.094Z',
      advanceAmount: 50,
      paymentAmount: 2,
      startPayments: '2026-10-22T10:48:28.094Z',
      reference: 'Christmas',
      advanceLocation: 'LEI',
      status: 'Active',
    },
  ]

  const setupGetAdvancesStubs = async (
    payload: PrisonerAdvanceResponse[] = [],
    options: { pageNumber: number; pageSize: string; totalPages: number } = {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
    },
  ) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
    await prisonRegisterApi.stubGetPrisonNames()
    await prisonerFinanceAdvancesApi.stubGetAdvances(prisonNumber, payload, options)
    await prisonerFinanceAdvancesApi.stubGetAdvancesBalance(prisonNumber)
  }

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test('Should display advances when page is loaded', async ({ page }) => {
    await setupGetAdvancesStubs(advancesPayload)

    const prisonerAdvancesPage = await PrisonerAdvancesPage.load(page, prisonNumber)

    expect(prisonerAdvancesPage.advancesList).toBeVisible()
    expect(prisonerAdvancesPage.advancesList).toContainText(
      [
        'Date Advance amount Payment amount Start payments Reference Created by Location Status',
        '10/03/202610:48 0.10 0.01 10/10/2026 An advance TEST Leeds (HMP) Active',
        '11/03/202611:48 1.20 0.10 11/10/2026 Test advance Billy Moorland (HMP & YOI) Inactive',
        '12/03/202610:43 0.20 0.03 14/10/2026 Another advance TEST Leeds (HMP) Active',
        '23/03/202607:48 0.15 0.01 18/10/2026 first day in prison TEST Leeds (HMP) Active',
        '25/12/202600:00 0.50 0.02 22/10/2026 Christmas TEST Leeds (HMP) Active',
      ].join('\n'),
    )
  })

  test('Should display no advances when the user does not have any advances', async ({ page }) => {
    await setupGetAdvancesStubs([])

    const prisonerAdvancesPage = await PrisonerAdvancesPage.load(page, prisonNumber)

    expect(prisonerAdvancesPage.advancesList).not.toBeVisible()

    const noAdvancesMessage = page.locator('[data-testid="no-advances-message"]')
    await expect(noAdvancesMessage).toBeVisible()
    await expect(noAdvancesMessage).toHaveText('No advances to show')
  })

  test(`Should render pagination component and allow progression`, async ({ page }) => {
    await setupGetAdvancesStubs(advancesPayload, {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
    })

    const prisonerAdvancesPage = await PrisonerAdvancesPage.load(page, prisonNumber)

    await expect(prisonerAdvancesPage.topPagination).toBeVisible()
    await expect(prisonerAdvancesPage.bottomPagination).toBeVisible()

    const bottomNavButton = prisonerAdvancesPage.topPagination.locator("[aria-label='Page 2']")
    await expect(bottomNavButton).toBeVisible()
    expect(await bottomNavButton.getAttribute('href')).toContain('page=2')

    await setupGetAdvancesStubs(advancesPayload, {
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
    await setupGetAdvancesStubs(advancesPayload, {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
    })

    const prisonerAdvancesPage = await PrisonerAdvancesPage.load(page, prisonNumber)

    await expect(prisonerAdvancesPage.topPagination).toBeVisible()
    await expect(prisonerAdvancesPage.bottomPagination).toBeVisible()

    const nextNavButton = prisonerAdvancesPage.topPagination.locator("[rel='next']")
    await expect(nextNavButton).toBeVisible()
    expect(await nextNavButton.getAttribute('href')).toContain('page=2')

    await setupGetAdvancesStubs(advancesPayload, {
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
    await setupGetAdvancesStubs(advancesPayload, {
      pageNumber: 2,
      pageSize: '25',
      totalPages: 2,
    })

    await page.goto(`/prisoner/${prisonNumber}/money/advances?page=2`)
    const prisonerAdvancesPage = await PrisonerAdvancesPage.verifyOnPage(page, prisonNumber)

    await expect(prisonerAdvancesPage.topPagination).toBeVisible()
    await expect(prisonerAdvancesPage.bottomPagination).toBeVisible()

    const prevNavButton = prisonerAdvancesPage.topPagination.locator("[rel='prev']")
    await expect(prevNavButton).toBeVisible()
    expect(await prevNavButton.getAttribute('href')).toContain('page=1')

    await setupGetAdvancesStubs(advancesPayload, {
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

  test(`Should click back button and go back to prisoner profile page`, async ({ page }) => {
    await setupGetAdvancesStubs(advancesPayload)

    const prisonerAdvancesPage = await PrisonerAdvancesPage.load(page, prisonNumber)

    await prisonerAdvancesPage.backLink.click()

    await expect(page).toHaveURL(new RegExp(`.*/prisoner/${prisonNumber}$`))
  })
})
