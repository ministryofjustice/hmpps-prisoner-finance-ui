import { expect, test } from '@playwright/test'
import { login } from '../testUtils'

import hmppsAuth from '../mockApis/hmppsAuth'

import ServiceHomePage from '../pages/serviceHomePage'
import GrantBonusToPrisonersCaseloadPage from '../pages/grantBonusToPrisoners/caseloadPage'
import FindPrisonerFinancialProfile from '../pages/findPrisonerFinancialProfile'

test.describe('Visiting the service home page', () => {
  test('Unauthenticated user directed to auth', async ({ page }) => {
    await hmppsAuth.stubSignInPage()
    await ServiceHomePage.goto(page)

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('User name visible in header', async ({ page }) => {
    await login(page, { name: 'A TestUser' })

    const indexPage = await ServiceHomePage.load(page)
    await expect(indexPage.usersName).toHaveText('A. Testuser')
  })

  test('Phase banner visible in header', async ({ page }) => {
    await login(page)

    const indexPage = await ServiceHomePage.load(page)
    await expect(indexPage.phaseBanner).toBeVisible()
  })

  test('User can sign out', async ({ page }) => {
    await login(page)

    const indexPage = await ServiceHomePage.load(page)
    await indexPage.signOut()

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('User can begin to grant a bonus to prisoners', async ({ page }) => {
    await login(page)

    const indexPage = await ServiceHomePage.verifyOnPage(page)
    await indexPage.grantBonusToPrisoners()

    await GrantBonusToPrisonersCaseloadPage.verifyOnPage(page)
  })

  test('User can begin to find a prisoners financial profile', async ({ page }) => {
    await login(page)

    const indexPage = await ServiceHomePage.verifyOnPage(page)
    await indexPage.viewPrisonerFinances()

    await FindPrisonerFinancialProfile.verifyOnPage(page)
  })

  test('Page passes automatically detectable WCAG A or AA violations', async ({ page }) => {
    await login(page)

    const indexPage = await ServiceHomePage.load(page)
    await indexPage.passesAutomatedAccessibilityTests()
  })
})
