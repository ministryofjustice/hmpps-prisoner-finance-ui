import { expect, test } from '@playwright/test'
import { createRedisClient, RedisClient } from '../../server/data/redisClient'
import { login, resetStubs, unsignCookie } from '../testUtils'
import GrantBonusCaseloadPage from '../pages/grantBonusToPrisoners/grantBonusCaseloadPage'

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

      const grantBonusPage = await GrantBonusCaseloadPage.verifyOnPage(page)
      await expect(grantBonusPage.heading).toBeVisible()
      await expect(grantBonusPage.radiosTitle).toBeVisible()
      expect(await grantBonusPage.radios.count()).toBe(3)
      await expect(grantBonusPage.continueButton).toBeVisible()
    })

    test('Should navigate to next page and save form response', async ({ page, context }) => {
      await page.goto('/grant-bonus-to-prisoners')
      const cookies = await context.cookies()
      const unsignedCookie = unsignCookie(cookies[0].value)

      const grantBonusPage = await GrantBonusCaseloadPage.verifyOnPage(page)

      await grantBonusPage.radios.first().click()

      await grantBonusPage.continueButton.click()

      await page.waitForURL('/grant-bonus-to-prisoners/amount', { timeout: 3 })

      const response = await redisClient.get(unsignedCookie as string)
      const parsedData = JSON.parse(response as string)
      expect(parsedData.grantBonusForm).toMatchObject({ caseloadId: 'MDI' })
    })

    test('Should show an error if a caseload has not been selected', async ({ page }) => {
      await page.goto('/grant-bonus-to-prisoners')

      const grantBonusPage = await GrantBonusCaseloadPage.verifyOnPage(page)

      await grantBonusPage.continueButton.click()

      await page.waitForURL('/grant-bonus-to-prisoners', { timeout: 1 })

      const errorText = page.getByText('You must select a caseload before continuing.')
      expect(errorText).toBeVisible()
    })
  })
})
