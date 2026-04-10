import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerMoneyPage extends AbstractPage {
  readonly heading: Locator

  readonly backButton: Locator

  readonly tableTransactions: Locator

  readonly currentBalanceCard: Locator

  readonly holdBalanceCard: Locator

  readonly totalBalanceCard: Locator

  readonly prisonerInformationHeader: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.locator('#prisonerTransactionsHeading')
    this.tableTransactions = page.locator('table[data-testid="prisoner-transactions-table"]')
    this.backButton = page.locator('[data-testid="backLink"]')
    this.currentBalanceCard = page.locator('[data-testid="view-prisoner-current-balance-card"]')
    this.holdBalanceCard = page.locator('[data-testid="view-prisoner-hold-balance-card"]')
    this.totalBalanceCard = page.locator('[data-testid="view-prisoner-total-balance-card"]')
    this.prisonerInformationHeader = page.locator('[data-testid="hmpps-profile-banner"]')
  }

  static async verifyOnPage(page: Page): Promise<PrisonerMoneyPage> {
    const prisonerMoneyPage = new PrisonerMoneyPage(page)
    await expect(prisonerMoneyPage.heading).toBeVisible()
    return prisonerMoneyPage
  }
}
