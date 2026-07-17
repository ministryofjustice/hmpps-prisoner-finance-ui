import { expect, test } from '@playwright/test'
import hmppsAuth from '../mockApis/hmppsAuth'

import { login, resetStubs } from '../testUtils'
import ServiceHomePage from '../pages/serviceHomePage'

test.describe('Signing in to the service', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test.describe('When not authenticated', () => {
    test.beforeEach(async () => {
      await hmppsAuth.stubSignInPage()
    })

    test('Sign in page redirects to auth', async ({ page }) => {
      await hmppsAuth.stubSignInPage()
      await page.goto('/sign-in')

      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    })

    test('Service home page redirects to sign in', async ({ page }) => {
      await ServiceHomePage.goto(page)

      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    })
  })

  test.describe('When authenticated', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, { name: 'A TestUser' })
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

    test('Token verification failure takes user to sign in page', async ({ page }) => {
      await login(page, { active: false })

      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    })

    test('Token verification failure clears user session', async ({ page }) => {
      await login(page, { name: 'A TestUser', active: false })
      await login(page, { name: 'Some OtherTestUser', active: true })

      const indexPage = await ServiceHomePage.verifyOnPage(page)
      await expect(indexPage.usersName).toHaveText('S. Othertestuser')
    })
  })
})
