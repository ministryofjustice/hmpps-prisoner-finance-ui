import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerMoneyPage extends AbstractPage {
  readonly heading: Locator

  readonly backButton: Locator

  readonly tableTransactions: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.locator('#prisonerTransactionsHeading')
    this.tableTransactions = page.locator('table[data-testid="prisoner-transactions-table"]')
    this.backButton = page.locator('[data-testid="backLink"]')
  }

  static async verifyOnPage(page: Page): Promise<PrisonerMoneyPage> {
    const prisonerTransactionsPage = new PrisonerMoneyPage(page)
    await expect(prisonerTransactionsPage.heading).toBeVisible()
    return prisonerTransactionsPage
  }
}
