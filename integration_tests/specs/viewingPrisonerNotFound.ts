import { expect, test } from '@playwright/test'

import { login, resetStubs } from '../testUtils'

import prisonerSearchApi from '../mockApis/prisonerSearchApi'

import FindPrisonerPage from '../pages/findPrisonerPage'
import PrisonerFinancialProfilePage from '../pages/prisonerFinancialProfilePage'
import PrisonerNotFoundErrorPage from '../pages/prisonerNotFoundErrorPage'

test.describe('Viewing a prisoner is not found', () => {
  const invalidPrisonNumber = 'Z9999ZZ'

  test.beforeEach(async () => {
    await resetStubs()
    await prisonerSearchApi.stubGetPrisonerNotFound(invalidPrisonNumber)
  })

  test.beforeEach(async ({ page }) => {
    await login(page, { name: 'A TestUser' })
  })

  test('Informs the user that the prisoner was not found', async ({ page }) => {
    await PrisonerFinancialProfilePage.goto(page, invalidPrisonNumber)
    await PrisonerNotFoundErrorPage.verifyOnPage(page, invalidPrisonNumber)
  })

  test('User name visible in header', async ({ page }) => {
    await PrisonerFinancialProfilePage.goto(page, invalidPrisonNumber)

    const prisonerNotFoundErrorPage = await PrisonerNotFoundErrorPage.verifyOnPage(page, invalidPrisonNumber)
    await expect(prisonerNotFoundErrorPage.usersName).toHaveText('A. Testuser')
  })

  test('Phase banner visible in header', async ({ page }) => {
    await PrisonerFinancialProfilePage.goto(page, invalidPrisonNumber)

    const prisonerNotFoundErrorPage = await PrisonerNotFoundErrorPage.verifyOnPage(page, invalidPrisonNumber)
    await expect(prisonerNotFoundErrorPage.phaseBanner).toBeVisible()
  })

  test('User can sign out', async ({ page }) => {
    await PrisonerFinancialProfilePage.goto(page, invalidPrisonNumber)

    const prisonerNotFoundErrorPage = await PrisonerNotFoundErrorPage.verifyOnPage(page, invalidPrisonNumber)
    await prisonerNotFoundErrorPage.signOut()

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('Page has no automatically detectable WCAG A or AA violations', async ({ page }) => {
    await PrisonerFinancialProfilePage.goto(page, invalidPrisonNumber)

    const prisonerNotFoundErrorPage = await PrisonerNotFoundErrorPage.verifyOnPage(page, invalidPrisonNumber)
    await prisonerNotFoundErrorPage.passesAutomatedAccessibilityTests()
  })

  test('User can try another prison number', async ({ page }) => {
    await PrisonerFinancialProfilePage.goto(page, invalidPrisonNumber)

    const prisonerNotFoundErrorPage = await PrisonerNotFoundErrorPage.verifyOnPage(page, invalidPrisonNumber)
    await prisonerNotFoundErrorPage.findPrisonerLink.click()

    await FindPrisonerPage.verifyOnPage(page)
  })
})
