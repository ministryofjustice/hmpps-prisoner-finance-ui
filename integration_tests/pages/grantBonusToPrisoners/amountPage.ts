import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class AmountPage extends AbstractPage {
  readonly heading: Locator

  readonly amountInput: Locator

  readonly descriptionInput: Locator

  readonly doneButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Grant bonus to prisoners', exact: true })
    this.amountInput = page.locator('[data-testid="amount-input"]')
    this.descriptionInput = page.locator('[data-testid="description-input"]')
    this.doneButton = page.locator('[data-testid="done-button"]')
  }

  static async verifyOnPage(page: Page): Promise<AmountPage> {
    const amountPage = new AmountPage(page)
    await expect(amountPage.heading).toBeVisible()
    return amountPage
  }
}
