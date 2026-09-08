import { expect, test } from '@playwright/test'
import PrisonerHoldsPage from '../pages/prisonerHoldsPage'
import PrisonerFinancialProfilePage from '../pages/prisonerFinancialProfilePage'

import * as prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'

import prisonRegisterApi from '../mockApis/prisonRegisterApi'

import prisonApi from '../mockApis/prisonApi'
import * as prisonerFinanceHoldsApi from '../mockApis/prisonerFinanceHoldsApi'
import { PrisonerHoldResponse } from '../../server/interfaces/PrisonerHoldResponse'
import { SubAccountBalanceResponse } from '../../server/interfaces/SubAccountBalanceResponse'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import { resetStubs } from '../mockApis/wiremock'
import { login } from '../testUtils'

test.describe('Show holds for prisoner', () => {
  const prisonNumber = 'A1234BC'

  const transactionPayload: Array<PrisonerTransactionResponse> = [
    {
      date: '2026-03-10T10:48:28.094Z',
      legacyTransactionId: 1,
      description: 'test',
      credit: 0,
      debit: 10,
      location: 'LEI',
      accountType: 'CASH',
      subAccountBalance: 0,
      accountBalance: 11,
    },
    {
      date: '2026-03-11T10:47:28.094Z',
      legacyTransactionId: 2,
      description: '',
      credit: 20,
      debit: 0,
      location: 'MDI',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 1000,
    },
    {
      date: '2026-03-10T10:46:28.094Z',
      legacyTransactionId: 3,
      description: 'Cash to Savings Transfer',
      credit: 0,
      debit: 10,
      location: '',
      accountType: 'CASH',
      subAccountBalance: 10,
      accountBalance: 40,
    },
    {
      date: '2026-03-10T10:45:28.194Z',
      legacyTransactionId: 4,
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 50,
    },
    {
      date: '2026-03-10T10:44:28.194Z',
      legacyTransactionId: 5,
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
      subAccountBalance: 30,
      accountBalance: 30,
    },
    {
      date: '2026-03-10T10:43:28.194Z',
      legacyTransactionId: 6,
      description: 'Cash to Savings Transfer',
      credit: 10,
      debit: 0,
      location: '',
      accountType: 'SAVINGS',
      subAccountBalance: 20,
      accountBalance: 20,
    },
  ]

  const balancePayload: SubAccountBalanceResponse[] = [
    { subAccountId: '', balanceDateTime: '', amount: 1234 },
    { subAccountId: '', balanceDateTime: '', amount: 3456 },
    { subAccountId: '', balanceDateTime: '', amount: 0 },
  ]

  const holdsPayload: PrisonerHoldResponse[] = [
    {
      id: '',
      prisonNumber: 'A9971EC',
      legacyHoldNumber: 1,
      subAccountRef: 'CASH',
      createdAt: '2026-03-10T10:43:28.194Z',
      createdBy: 'TEST',
      holdFromDate: '2026-03-10T10:43:28.194Z',
      holdUntilDate: '2027-03-10T10:43:28.194Z',
      isReleased: false,
      description: 'TEST',
      holdType: 'HOA',
      amount: 123,
      holdLocation: 'LEI',
    },
    {
      id: '',
      prisonNumber: 'A9971EC',
      legacyHoldNumber: 2,
      subAccountRef: 'SPENDS',
      createdAt: '2026-03-12T10:43:28.194Z',
      createdBy: 'TEST',
      holdFromDate: '2026-03-10T10:43:28.194Z',
      holdUntilDate: '2027-05-10T10:43:28.194Z',
      isReleased: false,
      description: 'TEST',
      holdType: 'HOA',
      amount: 121,
      holdLocation: 'LEI',
    },
    {
      id: '',
      prisonNumber: 'A9971EC',
      legacyHoldNumber: 4,
      subAccountRef: 'SPENDS',
      createdAt: '2026-03-19T10:43:28.194Z',
      createdBy: 'TEST',
      holdFromDate: '2026-03-10T10:43:28.194Z',
      holdUntilDate: '2027-02-10T10:43:28.194Z',
      isReleased: false,
      description: 'TEST',
      holdType: 'HOA',
      amount: 121,
      holdLocation: 'LEI',
    },
    {
      id: '',
      prisonNumber: 'A9971EC',
      legacyHoldNumber: 4,
      subAccountRef: 'SAVINGS',
      createdAt: '2026-03-19T10:43:28.194Z',
      createdBy: 'TEST',
      holdFromDate: '2026-03-10T10:43:28.194Z',
      holdUntilDate: '2027-02-10T10:43:28.194Z',
      isReleased: false,
      description: 'TEST',
      holdType: 'HOA',
      amount: 121,
      holdLocation: 'LEI',
    },
    {
      id: '',
      prisonNumber: 'A9971EC',
      legacyHoldNumber: 4,
      subAccountRef: 'SAVINGS',
      createdAt: '2026-03-19T10:43:28.194Z',
      createdBy: 'TEST',
      holdFromDate: '2026-03-10T10:43:28.194Z',
      holdUntilDate: '', // will show as "No data" in ui
      isReleased: false,
      description: 'TEST',
      holdType: 'HOA',
      amount: 121,
      holdLocation: 'LEI',
    },
  ]

  const setupPrisonerProfileStubs = async () => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
    await prisonRegisterApi.stubGetPrisonNames()
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, transactionPayload)
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', balancePayload[0])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', balancePayload[1])
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', balancePayload[2])
    await prisonerFinanceHoldsApi.stubGetHoldsBalance(prisonNumber)
  }

  const setupGetHoldsStubs = async (
    payload: PrisonerHoldResponse[] = [],
    options: { pageNumber: number; pageSize: string; totalPages: number } = {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
    },
  ) => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonApi.stubGetPrisonerImage()
    await prisonRegisterApi.stubGetPrisonNames()
    await prisonerFinanceHoldsApi.stubGetHolds(prisonNumber, payload, options)
  }

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test('Should click on hold card and go to prisoner holds page', async ({ page }) => {
    await setupPrisonerProfileStubs()
    await setupGetHoldsStubs()

    const profilePage = await PrisonerFinancialProfilePage.load(page, prisonNumber)

    const holdCard = profilePage.getBalanceCardFor('Holds')

    const holdCardLink = await holdCard.getByRole('link')

    await holdCardLink.click()

    PrisonerHoldsPage.verifyOnPage(page, prisonNumber)
  })

  test('Should display holds when page is loaded', async ({ page }) => {
    await setupGetHoldsStubs(holdsPayload)

    const prisonerHoldsPage = await PrisonerHoldsPage.load(page, prisonNumber)

    expect(prisonerHoldsPage.holdsList).toBeVisible()
    expect(prisonerHoldsPage.holdsList).toContainText(
      [
        'Account Hold type Hold number Hold until Description Amount Location',
        'Private cash HOA 1 10/03/27 TEST 1.23 Leeds (HMP)',
        'Spends HOA 2 10/05/27 TEST 1.21 Leeds (HMP)',
        'Spends HOA 4 10/02/27 TEST 1.21 Leeds (HMP)',
        'Savings HOA 4 10/02/27 TEST 1.21 Leeds (HMP)',
        'Savings HOA 4 No data TEST 1.21 Leeds (HMP)',
      ].join('\n'),
    )
  })

  test('Should display no holds when the user does not have any holds', async ({ page }) => {
    await setupGetHoldsStubs([])

    const prisonerHoldsPage = await PrisonerHoldsPage.load(page, prisonNumber)

    expect(prisonerHoldsPage.holdsList).not.toBeVisible()

    const noHoldsMessage = page.locator('[data-testid="no-holds-message"]')
    await expect(noHoldsMessage).toBeVisible()
    await expect(noHoldsMessage).toHaveText('No holds to show')
  })

  test(`Should render pagination component and allow progression`, async ({ page }) => {
    await setupGetHoldsStubs(holdsPayload, {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
    })

    const prisonerHoldsPage = await PrisonerHoldsPage.load(page, prisonNumber)

    await expect(prisonerHoldsPage.topPagination).toBeVisible()
    await expect(prisonerHoldsPage.bottomPagination).toBeVisible()

    const bottomNavButton = prisonerHoldsPage.topPagination.locator("[aria-label='Page 2']")
    await expect(bottomNavButton).toBeVisible()
    expect(await bottomNavButton.getAttribute('href')).toContain('page=2')

    await setupGetHoldsStubs(holdsPayload, {
      pageNumber: 2,
      pageSize: '25',
      totalPages: 2,
    })

    await bottomNavButton.click()

    expect(page.url()).toContain('page=2')

    const resultText = prisonerHoldsPage.page.locator('.moj-pagination__results')
    await expect(resultText.first()).toBeVisible()

    expect(await resultText.first().innerText()).toBe('Showing 6 to 5 of 5 total results')

    const topCurrentPageLi = prisonerHoldsPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('2')

    const bottomCurrentPageLi = prisonerHoldsPage.topPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('2')
  })

  test(`Should allow progression with next button`, async ({ page }) => {
    await setupGetHoldsStubs(holdsPayload, {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
    })

    const prisonerHoldsPage = await PrisonerHoldsPage.load(page, prisonNumber)

    await expect(prisonerHoldsPage.topPagination).toBeVisible()
    await expect(prisonerHoldsPage.bottomPagination).toBeVisible()

    const nextNavButton = prisonerHoldsPage.topPagination.locator("[rel='next']")
    await expect(nextNavButton).toBeVisible()
    expect(await nextNavButton.getAttribute('href')).toContain('page=2')

    await setupGetHoldsStubs(holdsPayload, {
      pageNumber: 2,
      pageSize: '25',
      totalPages: 2,
    })
    await nextNavButton.click()

    expect(page.url()).toContain('page=2')

    const topCurrentPageLi = prisonerHoldsPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('2')

    const bottomCurrentPageLi = prisonerHoldsPage.topPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('2')
  })

  test(`Should allow progression with previous button`, async ({ page }) => {
    await setupGetHoldsStubs(holdsPayload, {
      pageNumber: 2,
      pageSize: '25',
      totalPages: 2,
    })

    await page.goto(`/prisoner/${prisonNumber}/money/holds?page=2`)
    const prisonerHoldsPage = await PrisonerHoldsPage.verifyOnPage(page, prisonNumber)

    await expect(prisonerHoldsPage.topPagination).toBeVisible()
    await expect(prisonerHoldsPage.bottomPagination).toBeVisible()

    const prevNavButton = prisonerHoldsPage.topPagination.locator("[rel='prev']")
    await expect(prevNavButton).toBeVisible()
    expect(await prevNavButton.getAttribute('href')).toContain('page=1')

    await setupGetHoldsStubs(holdsPayload, {
      pageNumber: 1,
      pageSize: '25',
      totalPages: 2,
    })

    await prevNavButton.click()

    expect(page.url()).toContain('page=1')

    const topCurrentPageLi = prisonerHoldsPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('1')

    const bottomCurrentPageLi = prisonerHoldsPage.topPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('1')
  })
})
