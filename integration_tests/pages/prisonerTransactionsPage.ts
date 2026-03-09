import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerTransactionsPage extends AbstractPage {
  readonly heading: Locator

  readonly tableTransactions: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.locator('#prisonerTransactionsHeading')
    this.tableTransactions = page.locator('table[data-testid="prisoner-transactions-table"]')
  }

  static async verifyOnPage(page: Page): Promise<PrisonerTransactionsPage> {
    const prisonerTransactionsPage = new PrisonerTransactionsPage(page)
    await expect(prisonerTransactionsPage.heading).toBeVisible()
    return prisonerTransactionsPage
  }
}
