import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerProfilePage extends AbstractPage {
  readonly heading: Locator

  readonly backButton: Locator

  readonly recentTransactionsList: Locator

  readonly balanceCards: Locator

  readonly viewAllTransactionsLink: Locator

  readonly profileHeader: Locator

  readonly actionMenuBlock: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Finances', exact: true })
    this.backButton = page.getByRole('link', { name: 'Back', exact: true })

    this.profileHeader = page.locator('[data-testid="hmpps-profile-banner"]')

    this.balanceCards = page.locator('.hmpps-summary-container')

    this.recentTransactionsList = page.locator('table[data-testid="prisoner-transactions-table"]')
    this.viewAllTransactionsLink = page.getByRole('link', { name: 'View all transactions', exact: true })

    this.actionMenuBlock = page.locator('.hmpps-actions-block')
  }

  static async load(page: Page, prisonNumber: string): Promise<PrisonerProfilePage> {
    await page.goto(`/prisoner/${prisonNumber}`)
    return this.verifyOnPage(page, prisonNumber)
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<PrisonerProfilePage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}`)

    const prisonerProfilePage = new PrisonerProfilePage(page)
    await expect(prisonerProfilePage.heading).toBeVisible()
    return prisonerProfilePage
  }

  getBalanceCardFor(subAccountName: string): Locator {
    return this.balanceCards.filter({ has: this.page.getByRole('heading', { name: subAccountName }) }).first()
  }
}
