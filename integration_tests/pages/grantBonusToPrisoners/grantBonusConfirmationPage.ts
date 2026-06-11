import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class GrantBonusConfirmationPage extends AbstractPage {
  readonly confirmationPanel: Locator

  readonly recentTxnsLink: Locator

  constructor(page: Page) {
    super(page)
    this.confirmationPanel = page.locator('[data-testid="confirmation-panel"]')
    this.recentTxnsLink = page.locator('[data-testid="confirmation-message-link"]')
  }

  static async verifyOnPage(page: Page): Promise<GrantBonusConfirmationPage> {
    const creditConfirmationPage = new GrantBonusConfirmationPage(page)
    await expect(creditConfirmationPage.confirmationPanel).toBeVisible()
    return creditConfirmationPage
  }
}
