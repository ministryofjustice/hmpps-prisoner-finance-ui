import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerProfilePage extends AbstractPage {
  readonly heading: Locator

  readonly backButton: Locator

  readonly tableTransactions: Locator

  readonly balanceCards: Locator

  readonly transactionContainer: Locator

  readonly transactionsLink: Locator

  readonly profileHeader: Locator

  readonly actionMenuBlock: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Finances', exact: true })
    this.backButton = page.getByRole('link', { name: 'Back', exact: true })

    this.transactionContainer = page.locator('table[data-testid="prisoner-transactions-table-container"]')
    this.tableTransactions = page.locator('table[data-testid="prisoner-transactions-table"]')
    this.balanceCards = page.locator('[data-testid="prisoner-balance-cards"]')
    this.transactionsLink = page.locator('[data-testid="transactions-page-link"]')
    this.profileHeader = page.locator('[data-testid="hmpps-profile-banner"]')
    this.actionMenuBlock = page.locator('[data-testid="credit-menu"]')
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<PrisonerProfilePage> {
    expect(page.url()).toContain(`/prisoner/${prisonNumber}`)

    const prisonerProfilePage = new PrisonerProfilePage(page)
    await expect(prisonerProfilePage.heading).toBeVisible()
    return prisonerProfilePage
  }
}
