import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerProfilePage extends AbstractPage {
  readonly heading: Locator

  readonly backButton: Locator

  readonly tableTransactions: Locator

  readonly balanceCards: Locator

  readonly transactionContainer: Locator

  readonly transactionsLink: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.locator('#prisonerProfileHeading')
    this.transactionContainer = page.locator('table[data-testid="prisoner-transactions-table-container"]')
    this.tableTransactions = page.locator('table[data-testid="prisoner-transactions-table"]')
    this.backButton = page.locator('[data-testid="backLink"]')
    this.balanceCards = page.locator('[data-testid="prisoner-balance-cards"]')
    this.transactionsLink = page.locator('[data-testid="transactions-page-link"]')
  }

  static async verifyOnPage(page: Page): Promise<PrisonerProfilePage> {
    const prisonerProfilePage = new PrisonerProfilePage(page)
    await expect(prisonerProfilePage.heading).toBeVisible()
    return prisonerProfilePage
  }
}
