import { expect, test } from '@playwright/test'
import { createRedisClient, RedisClient } from '../../server/data/redisClient'
import { login, resetStubs, unsignCookie } from '../testUtils'
import GrantBonusToPrisonersPage from '../pages/grantBonusToPrisoners/grantBonusToPrisonersPage'
import AmountPage from '../pages/grantBonusToPrisoners/amountPage'

test.describe('Grant Bonus To prisoners', () => {
  let redisClient: RedisClient

  test.beforeAll(async () => {
    redisClient = await createRedisClient().connect()
  })

  test.describe('Select a caseload', () => {
    test.beforeEach(async ({ page }) => {
      await resetStubs()
      await login(page)
    })

    test('Should navigate to grant a bonus to prisoners page', async ({ page }) => {
      await page.goto('/')

      const card = page.locator('[data-qa="grant-a-bonus-card"]')
      await card.click()

      await page.waitForURL('/grant-bonus-to-prisoners', { timeout: 1 })
    })

    test('Should show the list of caseloads for the user', async ({ page }) => {
      await page.goto('/grant-bonus-to-prisoners')

      const header = page.getByText('Grant bonus to prisoners')
      const radiosTitle = page.locator('[data-testid="radio-group-heading"]')
      const radios = page.getByRole('radio')
      const continueButton = page.locator('[data-testid="continue-button"]')

      await expect(header).toBeVisible()
      await expect(radiosTitle).toBeVisible()
      expect(await radios.count()).toBe(3)
      await expect(continueButton).toBeVisible()
    })

    test('Should navigate to next page and save form response', async ({ page, context }) => {
      await page.goto('/grant-bonus-to-prisoners')
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      const radios = page.getByRole('radio')

      await radios.first().click()

      const continueButton = page.locator('[data-testid="continue-button"]')
      await continueButton.click()

      await page.waitForURL('/grant-bonus-to-prisoners/amount', { timeout: 3 })

      const response = await redisClient.get(unsignedCookie as string)
      const parsedData = JSON.parse(response as string)
      expect(parsedData.grantBonusForm).toMatchObject({ caseloadId: 'MDI' })
    })

    test('Should show an error if a caseload has not been selected', async ({ page }) => {
      await page.goto('/grant-bonus-to-prisoners')

      const continueButton = page.locator('[data-testid="continue-button"]')
      await continueButton.click()

      await page.waitForURL('/grant-bonus-to-prisoners', { timeout: 1 })

      const errorText = page.getByText('You must select a caseload before continuing.')
      expect(errorText).toBeVisible()
    })
  })

  test.describe('Select amount', () => {
    test.beforeEach(async ({ page }) => {
      await resetStubs()
      await login(page)
    })

    test('Should navigate to the amount page', async ({ page }) => {
      await page.goto('/grant-bonus-to-prisoners')

      await GrantBonusToPrisonersPage.verifyOnPage(page)

      await GrantBonusToPrisonersPage.completeAndMoveOn(page)

      const amountPage = await AmountPage.verifyOnPage(page)

      expect(amountPage.amountInput).toBeVisible()
      expect(amountPage.descriptionInput).toBeVisible()
      expect(amountPage.doneButton).toBeVisible()
    })
  })
})
