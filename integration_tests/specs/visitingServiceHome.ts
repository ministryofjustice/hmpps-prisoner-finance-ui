import { expect, test } from '@playwright/test'
import { login } from '../testUtils'

import hmppsAuth from '../mockApis/hmppsAuth'

import ServiceHomePage from '../pages/serviceHomePage'
import GrantBonusToPrisonersCaseloadPage from '../pages/grantBonusToPrisoners/caseloadPage'
import FindPrisonerFinancialProfile from '../pages/findPrisonerFinancialProfile'

test.describe('Visiting the service home page', () => {
  test.describe('When not authenticated', () => {
    test.beforeEach(async () => {
      await hmppsAuth.stubSignInPage()
    })

    test('Is directed to auth', async ({ page }) => {
      await ServiceHomePage.goto(page)

      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    })
  })

  test.describe('When authenticated', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, { name: 'A TestUser' })
    })

    test('User name visible in header', async ({ page }) => {
      const indexPage = await ServiceHomePage.load(page)
      await expect(indexPage.usersName).toHaveText('A. Testuser')
    })

    test('Phase banner visible in header', async ({ page }) => {
      const indexPage = await ServiceHomePage.load(page)
      await expect(indexPage.phaseBanner).toBeVisible()
    })

    test('User can sign out', async ({ page }) => {
      const indexPage = await ServiceHomePage.load(page)
      await indexPage.signOut()

      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    })

    test('Page passes automatically detectable WCAG A or AA violations', async ({ page }) => {
      const indexPage = await ServiceHomePage.load(page)
      await indexPage.passesAutomatedAccessibilityTests()
    })

    test('User can begin to grant a bonus to prisoners', async ({ page }) => {
      const indexPage = await ServiceHomePage.verifyOnPage(page)
      await indexPage.grantBonusToPrisoners()

      await GrantBonusToPrisonersCaseloadPage.verifyOnPage(page)
    })

    test('User can begin to find a prisoners financial profile', async ({ page }) => {
      const indexPage = await ServiceHomePage.verifyOnPage(page)
      await indexPage.viewPrisonerFinances()

      await FindPrisonerFinancialProfile.verifyOnPage(page)
    })
  })
})
