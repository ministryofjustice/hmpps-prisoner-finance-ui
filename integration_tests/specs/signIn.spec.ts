import { expect, test } from '@playwright/test'
import hmppsAuth from '../mockApis/hmppsAuth'

import { login, resetStubs } from '../testUtils'
import AbstractPage from '../pages/abstractPage'
import IndexPage from '../pages/indexPage'

test.describe('SignIn', () => {
  test.beforeEach(async () => {})

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Unauthenticated user directed to auth', async ({ page }) => {
    await hmppsAuth.stubSignInPage()
    await page.goto('/')

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Unauthenticated user navigating to sign in page directed to auth', async ({ page }) => {
    await hmppsAuth.stubSignInPage()
    await page.goto('/sign-in')

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('User name visible in header', async ({ page }) => {
    await login(page, { name: 'A TestUser' })

    const indexPage = await IndexPage.verifyOnPage(page)

    await expect(indexPage.usersName).toHaveText('A. Testuser')
  })

  test('Phase banner visible in header', async ({ page }) => {
    await login(page)

    const banner = page.getByRole('banner')

    await expect(banner).toBeVisible()
  })

  test('User can sign out', async ({ page }) => {
    await login(page)

    const indexPage = await IndexPage.verifyOnPage(page)

    await indexPage.signOut()

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Token verification failure takes user to sign in page', async ({ page }) => {
    await login(page, { active: false })

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Token verification failure clears user session', async ({ page }) => {
    await login(page, { name: 'A TestUser', active: false })

    await expect(page.getByRole('heading')).toHaveText('Sign in')

    await login(page, { name: 'Some OtherTestUser', active: true })

    const indexPage = await IndexPage.verifyOnPage(page)
    await expect(indexPage.usersName).toHaveText('S. Othertestuser')
  })
})
