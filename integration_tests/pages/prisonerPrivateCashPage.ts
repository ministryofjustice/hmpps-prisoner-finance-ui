import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerPrivateCashPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly transactionList: Locator

  readonly currentBalanceCard: Locator

  readonly totalBalanceCard: Locator

  readonly profileHeader: Locator

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

    this.profileHeader = page.locator('.mini-profile, .hmpps-profile-banner').first()

    this.currentBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Current balance', exact: true }) })

    this.totalBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Total balance', exact: true }) })

    this.transactionList = page.locator('.transactions-list')
    this.topPagination = page.locator('#top-pagination')
    this.bottomPagination = page.locator('#bottom-pagination')

    this.startDateFilter = page.getByLabel('From', { exact: true })
    this.endDateFilter = page.getByLabel('To', { exact: true })
    this.creditFilter = page.getByLabel('Credit', { exact: true })
    this.debitFilter = page.getByLabel('Debit', { exact: true })
    this.applyFilterButton = page.getByRole('button', { name: 'Apply filters', exact: true })
  }

  static async load(page: Page, prisonNumber: string): Promise<PrisonerPrivateCashPage> {
    await page.goto(`/prisoner/${prisonNumber}/money/private-cash`)
    return this.verifyOnPage(page, prisonNumber)
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<PrisonerPrivateCashPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/money/private-cash`)

    const prisonerPrivateCashPage = new PrisonerPrivateCashPage(page, 'Private cash transactions')
    await expect(prisonerPrivateCashPage.heading).toBeVisible()
    return prisonerPrivateCashPage
  }
}
