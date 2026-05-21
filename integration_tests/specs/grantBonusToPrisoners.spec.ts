import { expect, test } from '@playwright/test'
import { createRedisClient, RedisClient } from '../../server/data/redisClient'
import { login, resetStubs, unsignCookie } from '../testUtils'

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

      const radios = page.locator('[data-testid="caseload-radio"]')

      const header = page.locator('[data-testid="form-heading"]')
      const radiosTitle = page.locator('[data-testid="radio-title"]')
      const continueButton = page.locator('[data-testid="continue-button"]')

      expect(await radios.count()).toBe(3)
      expect(header).toBeVisible()
      expect(radiosTitle).toBeVisible()
      expect(continueButton).toBeVisible()
    })

    test('Should navigate to next page and save form response', async ({ page, context }) => {
      await page.goto('/grant-bonus-to-prisoners')
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      const radios = page.locator('[data-qa="caseload-radio"]')

      await radios.first().click()

      const continueButton = page.locator('[data-testid="continue-button"]')
      await continueButton.click()

      await page.waitForURL('/grant-bonus-to-prisoners/amount', { timeout: 1 })

      const response = await redisClient.get(unsignedCookie as string)
      const parsedData = JSON.parse(response as string)
      expect(parsedData.grantBonusForm).toMatchObject({ caseloadId: 'MDI' })
    })
  })
})
