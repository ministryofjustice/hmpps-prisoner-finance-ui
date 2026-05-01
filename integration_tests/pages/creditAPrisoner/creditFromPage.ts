import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreditFromPage extends AbstractPage {
  readonly heading: Locator

  readonly radioButtons: Locator

  readonly continueButton: Locator

  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Credit from' })
    this.radioButtons = page.locator('[data-testid="prison-account-radio"]')
    this.continueButton = page.locator('[data-testid="continue-button"]')
    this.errorMessage = page.locator('[id="creditFrom-error"]')
  }

  static async verifyOnPage(page: Page): Promise<CreditFromPage> {
    const creditFromPage = new CreditFromPage(page)
    await expect(creditFromPage.heading).toBeVisible()
    return creditFromPage
  }
}
