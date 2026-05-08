import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreditConfirmationPage extends AbstractPage {
  readonly confirmationPanel: Locator

  readonly recentTxnsLink: Locator

  constructor(page: Page) {
    super(page)
    this.confirmationPanel = page.locator('[data-testid="confirmation-panel"]')
    this.recentTxnsLink = page.locator('[data-testid="recent-txns-link"]')
  }

  static async verifyOnPage(page: Page): Promise<CreditConfirmationPage> {
    const creditConfirmationPage = new CreditConfirmationPage(page)
    await expect(creditConfirmationPage.confirmationPanel).toBeVisible()
    return creditConfirmationPage
  }
}
