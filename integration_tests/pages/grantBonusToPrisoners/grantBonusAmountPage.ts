import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class GrantBonusAmountPage extends AbstractPage {
  readonly heading: Locator

  readonly amountInput: Locator

  readonly descriptionInput: Locator

  readonly doneButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Grant bonus to prisoners', exact: true })

    this.amountInput = page.getByLabel('Amount', { exact: true })
    this.descriptionInput = page.getByLabel('Description', { exact: true })

    this.doneButton = page.getByRole('button', { name: 'Done', exact: true })
  }

  static async verifyOnPage(page: Page): Promise<GrantBonusAmountPage> {
    const amountPage = new GrantBonusAmountPage(page)
    await expect(amountPage.heading).toBeVisible()
    return amountPage
  }
}
