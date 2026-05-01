import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreditToPage extends AbstractPage {
  readonly heading: Locator

  readonly radioButtons: Locator

  readonly continueButton: Locator

  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Credit to' })
    this.radioButtons = page.locator('[data-testid="sub-account-radio"]')
    this.continueButton = page.locator('[data-testid="continue-button"]')
    this.errorMessage = page.locator('[id="creditTo-error"]')
  }

  static async verifyOnPage(page: Page): Promise<CreditToPage> {
    const creditToPage = new CreditToPage(page)
    await expect(creditToPage.heading).toBeVisible()
    return creditToPage
  }

  static async completeAndMoveOn(page: Page): Promise<void> {
    const creditToPage = await this.verifyOnPage(page)
    await creditToPage.radioButtons.first().click()
    await creditToPage.continueButton.click()
  }
}
