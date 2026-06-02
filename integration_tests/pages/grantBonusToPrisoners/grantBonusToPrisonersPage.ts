import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class GrantBonusToPrisonersPage extends AbstractPage {
  readonly heading: Locator

  readonly radioButtons: Locator

  readonly continueButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Grant bonus to prisoners' })
    this.radioButtons = page.locator('[data-testid="sub-account-radio"]')
    this.continueButton = page.locator('[data-testid="continue-button"]')
  }

  static async verifyOnPage(page: Page): Promise<GrantBonusToPrisonersPage> {
    const grantBonusToPrisonersPage = new GrantBonusToPrisonersPage(page)
    await expect(grantBonusToPrisonersPage.heading).toBeVisible()
    return grantBonusToPrisonersPage
  }

  static async completeAndMoveOn(page: Page): Promise<void> {
    const grantBonusToPrisonersPage = await this.verifyOnPage(page)
    await grantBonusToPrisonersPage.radioButtons.first().click()
    await grantBonusToPrisonersPage.continueButton.click()
  }
}
