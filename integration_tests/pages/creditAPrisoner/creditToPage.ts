import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreditToPage extends AbstractPage {
  readonly heading: Locator

  readonly radioButtons: Locator

  readonly continueButton: Locator

  readonly errorMessage: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Credit to' })
    this.radioButtons = page.locator('[data-testid="sub-account-radio"]')
    this.continueButton = page.locator('[data-testid="continue-button"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')

  }

  static async verifyOnPage(page: Page): Promise<CreditToPage> {
    const prisonerMoneyPage = new CreditToPage(page)
    await expect(prisonerMoneyPage.heading).toBeVisible()
    return prisonerMoneyPage
  }
}
