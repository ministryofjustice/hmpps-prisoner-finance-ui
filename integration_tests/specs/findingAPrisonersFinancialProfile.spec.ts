import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { login, resetStubs } from '../testUtils'
import FindPrisonerPage from '../pages/findPrisonerPage'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import prisonApi from '../mockApis/prisonApi'
import { PrisonerSearchContent } from '../../server/interfaces/PrisonerSearchResponse'

test.describe('Finding a prisoners financial profile', () => {
  const prisonerSearchResults: PrisonerSearchContent[] = [
    {
      prisonerNumber: 'AD9999',
      title: 'Mr',
      firstName: 'Fogell',
      middleNames: '',
      lastName: 'McLovin',
      dateOfBirth: '1981-03-06',
      currentFacialImageId: 1,
      status: '',
      inOutStatus: '',
      prisonId: 'LEI',
      prisonName: 'LEEDS',
      lastPrisonId: 'LEI',
      previousPrisonId: 'MDI',
      cellLocation: 'HAWAII',
      currentIncentive: {
        level: {
          code: 'STD',
          description: 'STANDARD',
        },
        dateTime: '01/01/1981 12:00:00',
        nextReviewDate: '12/01/2026',
      },
    },
    {
      prisonerNumber: 'AD9999',
      title: 'Mr',
      firstName: 'Seven',
      middleNames: '',
      lastName: 'Double',
      dateOfBirth: '1950-01-01',
      currentFacialImageId: 1,
      status: '',
      inOutStatus: '',
      prisonId: 'LEI',
      prisonName: 'LEEDS',
      lastPrisonId: 'LEI',
      previousPrisonId: 'MDI',
      cellLocation: 'London',
      currentIncentive: {
        level: {
          code: 'STD',
          description: 'STANDARD',
        },
        dateTime: '01/01/1981 12:00:00',
        nextReviewDate: '12/01/2026',
      },
    },
  ]

  test.beforeEach(async ({ page }) => {
    await resetStubs()
    await login(page)
    await prisonApi.stubGetUserCaseloads()
    await prisonApi.stubGetPrisonerImage()
  })

  test('shows an error when submitting with no prison number entered', async ({ page }) => {
    await page.goto('/prisoner')
    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)

    await findPrisonerPage.submitButton.click()

    await expect(findPrisonerPage.errorMessage).toBeVisible()
    await expect(findPrisonerPage.errorMessage).toContainText('Enter a prison number or prisoner name')
    await expect(page).toHaveURL('/prisoner?term=')
  })

  test('shows an error when submitting with only whitespace entered', async ({ page }) => {
    await page.goto('/prisoner')
    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)

    await findPrisonerPage.findPrisoner('   ')

    await expect(findPrisonerPage.errorMessage).toBeVisible()
    await expect(findPrisonerPage.errorMessage).toContainText('Enter a prison number')
    await expect(page).toHaveURL('/prisoner?term=+++')
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
    await expect(page.getByRole('heading', { name: 'Prisoner not found' })).toBeVisible()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should search for a prisoner if not found then show friendly message', async ({ page }) => {
    const searchTerm = 'John Smith'

    await prisonerSearchApi.stubPrisonerSearchReturnsNoResults(searchTerm, 'LEI')

    await page.goto(`/prisoner`)
    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)

    expect(page.getByText('No records found matching search criteria.')).not.toBeVisible()

    await findPrisonerPage.findPrisoner(searchTerm)
    expect(page.getByText('No records found matching search criteria.')).toBeVisible()
  })

  test('should search for a prisoner and display results', async ({ page }) => {
    const searchTerm = 'John Smith'
    await prisonerSearchApi.stubPrisonerSearchReturnsResults({
      searchTerm,
      prisonId: 'LEI',
      results: prisonerSearchResults,
      pageNumber: 0,
      pageSize: 25,
      totalPages: 1,
    })

    await page.goto(`/prisoner`)
    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)

    expect(page.getByText('No records found matching search criteria.')).not.toBeVisible()

    await findPrisonerPage.findPrisoner(searchTerm)
    expect(page.getByText('No records found matching search criteria.')).not.toBeVisible()

    const table = page.getByRole('table')

    // includes header
    expect(await table.getByRole('row').count()).toBe(3)

    const mcLovin = table.getByRole('row', { name: 'Fogell, Mclovin' })

    expect(mcLovin).toBeVisible()
  })

  test('should search a prisoner and go to prisoner profile', async ({ page }) => {
    const searchTerm = 'John Smith'
    await prisonerSearchApi.stubPrisonerSearchReturnsResults({
      searchTerm,
      prisonId: 'LEI',
      results: prisonerSearchResults,
      pageNumber: 0,
      pageSize: 25,
      totalPages: 1,
    })

    await page.goto(`/prisoner`)

    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)
    expect(page.getByText('No records found matching search criteria.')).not.toBeVisible()

    await findPrisonerPage.findPrisoner(searchTerm)
    expect(page.getByText('No records found matching search criteria.')).not.toBeVisible()

    const table = page.getByRole('table')
    const mcLovin = table.getByRole('row', { name: 'Fogell, Mclovin' })
    const mcLovinLink = mcLovin.getByRole('link')

    await mcLovinLink.click()
    expect(page.url()).toContain('prisoner/AD9999')
  })

  test(`Should render pagination component and allow progression`, async ({ page }) => {
    const searchTerm = 'John Smith'
    const currentPageNumber = 10
    await prisonerSearchApi.stubPrisonerSearchReturnsResults({
      searchTerm,
      prisonId: 'LEI',
      results: prisonerSearchResults,
      pageSize: 25,
      pageNumber: currentPageNumber - 1, // API pages start from 0
      totalPages: 20,
    })

    await page.goto(`/prisoner?term=${searchTerm}&page=${currentPageNumber}`)
    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)

    await expect(findPrisonerPage.topPagination).toBeVisible()
    await expect(findPrisonerPage.bottomPagination).toBeVisible()

    const topNavButton = findPrisonerPage.topPagination.locator("[aria-label='Page 9']")
    await expect(topNavButton).toBeVisible()
    expect(await topNavButton.getAttribute('href')).toContain('page=9')

    await prisonerSearchApi.stubPrisonerSearchReturnsResults({
      searchTerm,
      prisonId: 'LEI',
      results: prisonerSearchResults,
      pageSize: 25,
      pageNumber: 9 - 1, // API pages start from 0
      totalPages: 20,
    })

    await topNavButton.click()

    expect(page.url()).toContain('page=9')

    const resultText = findPrisonerPage.page.locator('.moj-pagination__results')
    await expect(resultText.first()).toBeVisible()

    expect(await resultText.first().innerText()).toBe('Showing 201 to 40 of 40 total results')

    const topCurrentPageLi = findPrisonerPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('9')

    const bottomCurrentPageLi = findPrisonerPage.bottomPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('9')
  })

  test(`Should allow progression with next button`, async ({ page }) => {
    const searchTerm = 'John Smith'
    const currentPageNumber = 10
    await prisonerSearchApi.stubPrisonerSearchReturnsResults({
      searchTerm,
      prisonId: 'LEI',
      results: prisonerSearchResults,
      pageSize: 25,
      pageNumber: currentPageNumber - 1, // API pages start from 0
      totalPages: 20,
    })

    await page.goto(`/prisoner?term=${searchTerm}&page=${currentPageNumber}`)
    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)

    await expect(findPrisonerPage.topPagination).toBeVisible()
    await expect(findPrisonerPage.bottomPagination).toBeVisible()

    const nextNavButton = findPrisonerPage.topPagination.locator("[rel='next']")
    await expect(nextNavButton).toBeVisible()
    expect(await nextNavButton.getAttribute('href')).toContain('page=11')

    await prisonerSearchApi.stubPrisonerSearchReturnsResults({
      searchTerm,
      prisonId: 'LEI',
      results: prisonerSearchResults,
      pageSize: 25,
      pageNumber: currentPageNumber - 1 + 1, // API pages start from 0
      totalPages: 20,
    })

    await nextNavButton.click()

    expect(page.url()).toContain('page=11')

    const topCurrentPageLi = findPrisonerPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('11')

    const bottomCurrentPageLi = findPrisonerPage.bottomPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('11')
  })

  test(`Should allow progression with previous button`, async ({ page }) => {
    const searchTerm = 'John Smith'
    const currentPageNumber = 10
    await prisonerSearchApi.stubPrisonerSearchReturnsResults({
      searchTerm,
      prisonId: 'LEI',
      results: prisonerSearchResults,
      pageSize: 25,
      pageNumber: currentPageNumber - 1, // API pages start from 0
      totalPages: 20,
    })

    await page.goto(`/prisoner?term=${searchTerm}&page=${currentPageNumber}`)
    const findPrisonerPage = await FindPrisonerPage.verifyOnPage(page)

    await expect(findPrisonerPage.topPagination).toBeVisible()
    await expect(findPrisonerPage.bottomPagination).toBeVisible()

    const prevNavButton = findPrisonerPage.topPagination.locator("[rel='prev']")
    await expect(prevNavButton).toBeVisible()
    expect(await prevNavButton.getAttribute('href')).toContain('page=9')

    await prisonerSearchApi.stubPrisonerSearchReturnsResults({
      searchTerm,
      prisonId: 'LEI',
      results: prisonerSearchResults,
      pageSize: 25,
      pageNumber: currentPageNumber - 2, // API pages start from 0
      totalPages: 20,
    })

    await prevNavButton.click()

    expect(page.url()).toContain('page=9')

    const topCurrentPageLi = findPrisonerPage.topPagination.locator('.govuk-pagination__item--current')
    const topCurrentPageA = topCurrentPageLi.locator('a')
    expect(await topCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await topCurrentPageA.innerText()).toBe('9')

    const bottomCurrentPageLi = findPrisonerPage.bottomPagination.locator('.govuk-pagination__item--current')
    const bottomCurrentPageA = bottomCurrentPageLi.locator('a')
    expect(await bottomCurrentPageA.getAttribute('aria-current')).toBe('page')
    expect(await bottomCurrentPageA.innerText()).toBe('9')
  })
})
