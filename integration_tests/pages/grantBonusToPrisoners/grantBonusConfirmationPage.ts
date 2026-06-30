import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class GrantBonusConfirmationPage extends AbstractPage {
  readonly confirmationPanel: Locator

  readonly returnHomeLink: Locator

  constructor(page: Page) {
    super(page)
    this.confirmationPanel = page.locator('[data-testid="confirmation-panel"]')

    this.returnHomeLink = page.getByRole('link', { name: 'Return home', exact: true })
  }

  static async verifyOnPage(page: Page): Promise<GrantBonusConfirmationPage> {
    const creditConfirmationPage = new GrantBonusConfirmationPage(page)
    await expect(creditConfirmationPage.confirmationPanel).toBeVisible()
    return creditConfirmationPage
  }
}
