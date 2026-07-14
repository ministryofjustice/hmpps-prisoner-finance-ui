import { expect, test } from '@playwright/test'
import { login } from '../testUtils'

import ServiceHomePage from '../pages/serviceHomePage'
import GrantBonusToPrisonersCaseloadPage from '../pages/grantBonusToPrisoners/caseloadPage'
import FindPrisonerFinancialProfile from '../pages/findPrisonerFinancialProfile'

test.describe('Visiting the service home page', () => {
  test('Must be signed in', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Can visit the homepage', async ({ page }) => {
    await login(page)

    await ServiceHomePage.verifyOnPage(page)
  })

  test('Can begin to grant a bonus to prisoners', async ({ page }) => {
    await login(page)

    const indexPage = await ServiceHomePage.verifyOnPage(page)
    await indexPage.grantBonusToPrisoners()

    await GrantBonusToPrisonersCaseloadPage.verifyOnPage(page)
  })

  test('Can begin to find a prisoners financial profile', async ({ page }) => {
    await login(page)

    const indexPage = await ServiceHomePage.verifyOnPage(page)
    await indexPage.viewPrisonerFinances()

    await FindPrisonerFinancialProfile.verifyOnPage(page)
  })

  test('Passes automatically detectable WCAG A or AA violations', async ({ page }) => {
    await login(page)

    const indexPage = await ServiceHomePage.load(page)
    await indexPage.passesAutomatedAccessibilityTests()
  })
})
