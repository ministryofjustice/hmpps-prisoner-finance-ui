import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerTransactionsPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly transactionList: Locator

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
    this.heading = page.getByRole('heading', { name: headerText, exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.prisonerInformationHeader = page.locator('.mini-profile')

    this.currentBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Current balance', exact: true }) })

    this.totalBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Total balance', exact: true }) })

    this.transactionList = page.locator('table[data-testid="prisoner-transactions-table"]')
    this.topPagination = page.locator('#top-pagination')
    this.bottomPagination = page.locator('#bottom-pagination')

    this.startDateFilter = page.getByLabel('From', { exact: true })
    this.endDateFilter = page.getByLabel('To', { exact: true })
    this.creditFilter = page.getByLabel('Credit', { exact: true })
    this.debitFilter = page.getByLabel('Debit', { exact: true })
    this.applyFilterButton = page.getByRole('button', { name: 'Apply filters', exact: true })
  }

  static async load(page: Page, prisonNumber: string): Promise<PrisonerTransactionsPage> {
    await page.goto(`/prisoner/${prisonNumber}/money`)
    return this.verifyOnPage(page, prisonNumber)
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<PrisonerTransactionsPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/money`)

    const prisonerTransactionsPage = new PrisonerTransactionsPage(page, 'Transactions for all sub accounts')
    await expect(prisonerTransactionsPage.heading).toBeVisible()
    return prisonerTransactionsPage
  }
}
