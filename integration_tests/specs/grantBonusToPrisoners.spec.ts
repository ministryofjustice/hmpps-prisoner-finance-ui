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

    test('Should show an error if an amount has not been entered', async ({ page }) => {
      await page.goto('/grant-bonus-to-prisoners')

      await GrantBonusToPrisonersPage.verifyOnPage(page)

      await GrantBonusToPrisonersPage.completeAndMoveOn(page)

      await AmountPage.verifyOnPage(page)

      const doneButton = page.locator('[data-testid="done-button"]')
      await doneButton.click()

      await page.waitForURL('/grant-bonus-to-prisoners/amount', { timeout: 3 })

      const errorText = page.getByText('You must select an amount to grant before continuing.')
      expect(errorText).toBeVisible()
    })

    test('Should show an error if a description has not been entered', async ({ page }) => {
      await page.goto('/grant-bonus-to-prisoners')

      await GrantBonusToPrisonersPage.verifyOnPage(page)

      await GrantBonusToPrisonersPage.completeAndMoveOn(page)

      const amountPage = await AmountPage.verifyOnPage(page)

      amountPage.amountInput.fill('1.23')

      const doneButton = page.locator('[data-testid="done-button"]')
      await doneButton.click()

      await page.waitForURL('/grant-bonus-to-prisoners/amount', { timeout: 3 })

      const errorText = page.getByText('You must include a description before continuing.')
      expect(errorText).toBeVisible()
    })

    test('Should show an error if the amount format is invalid', async ({ page }) => {
      await page.goto('/grant-bonus-to-prisoners')

      await GrantBonusToPrisonersPage.verifyOnPage(page)
      await GrantBonusToPrisonersPage.completeAndMoveOn(page)

      const amountPage = await AmountPage.verifyOnPage(page)

      await amountPage.amountInput.fill('1.999')
      await amountPage.descriptionInput.fill('Test description')

      const doneButton = page.locator('[data-testid="done-button"]')
      await doneButton.click()

      await page.waitForURL('/grant-bonus-to-prisoners/amount', { timeout: 3 })

      const errorText = page.getByText('Amount must be a valid number with up to 2 decimal places')
      await expect(errorText).toBeVisible()
    })

    test('Should show an error if the description exceeds 255 characters', async ({ page }) => {
      await page.goto('/grant-bonus-to-prisoners')

      await GrantBonusToPrisonersPage.verifyOnPage(page)
      await GrantBonusToPrisonersPage.completeAndMoveOn(page)

      const amountPage = await AmountPage.verifyOnPage(page)

      await amountPage.amountInput.fill('1.23')

      const longDescription = 'a'.repeat(256)
      await amountPage.descriptionInput.fill(longDescription)

      const doneButton = page.locator('[data-testid="done-button"]')
      await doneButton.click()

      await page.waitForURL('/grant-bonus-to-prisoners/amount', { timeout: 3 })

      const errorText = page.getByText('Description must be under 255 characters')
      await expect(errorText).toBeVisible()
    })
  })
})
