import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreditAmountPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly amountField: Locator

  readonly descriptionField: Locator

  readonly doneButton: Locator

  readonly amountErrorMessage: Locator

  readonly descriptionErrorMessage: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Credit amount', exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.amountField = page.getByLabel('Amount', { exact: true })
    this.descriptionField = page.getByLabel('Description', { exact: true })

    this.doneButton = page.getByRole('button', { name: 'Done', exact: true })

    this.amountErrorMessage = page.locator('[id="amount-error"]')
    this.descriptionErrorMessage = page.locator('[id="description-error"]')
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<CreditAmountPage> {
    expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-amount`)

    const creditAmountPage = new CreditAmountPage(page)
    await expect(creditAmountPage.heading).toBeVisible()
    return creditAmountPage
  }

  async enterTransactionDetails(amount: string = '100.10', description: string = 'test description'): Promise<void> {
    await this.amountField.fill(amount)
    await this.descriptionField.fill(description)
    await this.doneButton.click()
  }
}
