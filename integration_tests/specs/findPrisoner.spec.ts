import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login, resetStubs } from '../testUtils'
import IndexPage from '../pages/indexPage'
import FindPrisonerPage from '../pages/findPrisonerPage'
import PrisonerProfilePage from '../pages/prisonerProfilePage'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import prisonerFinanceApi from '../mockApis/prisonerFinanceApi'
import { PrisonerTransactionResponse } from '../../server/interfaces/PrisonerTransactionResponse'
import { SubAccountBalanceResponse } from '../../server/interfaces/SubAccountBalanceResponse'
import { Page } from '../../server/interfaces/Pageable'

test.describe('Find Prisoner', () => {
  const prisonNumber = 'A1234BC'

  const emptyPageTransactionsResponse: Page<PrisonerTransactionResponse> = {
    content: [],
    totalElements: 0,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 99,
    isLastPage: true,
  }

  const zeroBalance: SubAccountBalanceResponse = { subAccountId: '', balanceDateTime: '', amount: 0 }

  const stubPrisonerProfile = async () => {
    await prisonerSearchApi.stubGetPrisoner(prisonNumber)
    await prisonerFinanceApi.stubGetPrisonerTransactionsByPrisonNumber(prisonNumber, emptyPageTransactionsResponse)
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SPENDS', zeroBalance)
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'CASH', zeroBalance)
    await prisonerFinanceApi.stubGetPrisonerSubAccountBalance(prisonNumber, 'SAVINGS', zeroBalance)
  }

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
  })

  test('user can reach a prisoner profile by entering a prison number from the home page', async ({ page }) => {
    await stubPrisonerProfile()

    const index = await IndexPage.verifyOnPage(page)
    await index.viewPrisonerFinanceCard.locator('a').click()

    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)
    await findPrisonerPage.findPrisoner(prisonNumber)

    await PrisonerProfilePage.verifyOnPage(page)
    await expect(page).toHaveURL(`/prisoner/${prisonNumber}`)
  })

  test('shows an error when submitting with no prison number entered', async ({ page }) => {
    await page.goto('/prisoner')
    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)

    await findPrisonerPage.submitButton.click()

    await expect(findPrisonerPage.errorMessage).toBeVisible()
    await expect(findPrisonerPage.errorMessage).toContainText('Enter a prisoner number')
    await expect(page).toHaveURL('/prisoner')
  })

  test('shows an error when submitting with only whitespace entered', async ({ page }) => {
    await page.goto('/prisoner')
    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)

    await findPrisonerPage.findPrisoner('   ')

    await expect(findPrisonerPage.errorMessage).toBeVisible()
    await expect(findPrisonerPage.errorMessage).toContainText('Enter a prisoner number')
    await expect(page).toHaveURL('/prisoner')
  })

  test('shows a 404 page when submitting an invalid prison number', async ({ page }) => {
    const invalidPrisonNumber = 'Z9999ZZ'
    await prisonerSearchApi.stubGetPrisonerNotFound(invalidPrisonNumber)

    await page.goto('/prisoner')
    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)

    const [response] = await Promise.all([
      page.waitForResponse(
        resp => resp.url().endsWith(`/prisoner/${invalidPrisonNumber}`) && resp.request().method() === 'GET',
      ),
      findPrisonerPage.findPrisoner(invalidPrisonNumber),
    ])
    expect(response.status()).toBe(404)

    await expect(page.locator('[data-testid="prisoner-not-found-heading"]')).toContainText('Prisoner not found')
    await expect(page.locator('[data-testid="find-prisoner-link"]')).toBeVisible()
    await expect(page).toHaveURL(`/prisoner/${invalidPrisonNumber}`)
  })

  test('find prisoner page should not have any automatically detectable WCAG A or AA violations', async ({ page }) => {
    await page.goto('/prisoner')
    await FindPrisonerPage.verifyOnPage(page)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('prisoner not found page should not have any automatically detectable WCAG A or AA violations', async ({
    page,
  }) => {
    const invalidPrisonNumber = 'Z9999ZZ'
    await prisonerSearchApi.stubGetPrisonerNotFound(invalidPrisonNumber)

    await page.goto(`/prisoner/${invalidPrisonNumber}`)
    await expect(page.locator('[data-testid="prisoner-not-found-heading"]')).toBeVisible()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
