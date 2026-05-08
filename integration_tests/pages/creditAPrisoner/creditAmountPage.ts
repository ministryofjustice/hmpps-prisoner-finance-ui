import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreditAmountPage extends AbstractPage {
  readonly heading: Locator

  readonly amountField: Locator

  readonly descriptionField: Locator

  readonly doneButton: Locator

  readonly amountErrorMessage: Locator

  readonly descriptionErrorMessage: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Credit amount' })
    this.amountField = page.locator('[data-testid="amount-field"]')
    this.descriptionField = page.locator('[data-testid="description-field"]')
    this.doneButton = page.locator('[data-testid="done-button"]')
    this.amountErrorMessage = page.locator('[id="creditAmount-error"]')
    this.descriptionErrorMessage = page.locator('[id="description-error"]')
  }

  static async verifyOnPage(page: Page): Promise<CreditAmountPage> {
    const creditAmountPage = new CreditAmountPage(page)
    await expect(creditAmountPage.heading).toBeVisible()
    return creditAmountPage
  }
}
