import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerMoneyPage extends AbstractPage {
  readonly heading: Locator

  readonly backButton: Locator

  readonly tableTransactions: Locator

  readonly currentBalanceCard: Locator

  readonly totalBalanceCard: Locator

  readonly prisonerInformationHeader: Locator

  readonly topPagination: Locator

  readonly bottomPagination: Locator

  readonly applyFilterButton: Locator

  readonly startDateFilter: Locator

  readonly endDateFilter: Locator

  readonly creditFilter: Locator

  readonly debitFilter: Locator

  private constructor(page: Page, headerText: string) {
    super(page)
    this.heading = page.getByRole('heading', { name: headerText })
    this.backButton = page.getByRole('link', { name: 'Back' })

    this.tableTransactions = page.locator('table[data-testid="prisoner-transactions-table"]')
    this.currentBalanceCard = page.locator('[data-testid="view-prisoner-current-balance-card"]')
    this.totalBalanceCard = page.locator('[data-testid="view-prisoner-total-balance-card"]')
    this.prisonerInformationHeader = page.locator('[data-testid="hmpps-profile-banner"]')
    this.topPagination = page.locator('#top-pagination')
    this.bottomPagination = page.locator('#bottom-pagination')
    this.applyFilterButton = page.locator('[data-test-id="submit-button"]')
    this.startDateFilter = page.locator('input[id="startDate"]')
    this.endDateFilter = page.locator('input[id="endDate"]')
    this.creditFilter = page.locator('input[id="creditFilter"]')
    this.debitFilter = page.locator('input[id="debitFilter"]')
  }

  static async verifyOnPage(page: Page, headerText: string): Promise<PrisonerMoneyPage> {
    const prisonerMoneyPage = new PrisonerMoneyPage(page, headerText)
    await expect(prisonerMoneyPage.heading).toBeVisible()
    return prisonerMoneyPage
  }
}
