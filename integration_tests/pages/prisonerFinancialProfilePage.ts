import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerFinancialProfilePage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly recentTransactionsList: Locator

  readonly balanceCards: Locator

  readonly viewAllTransactionsLink: Locator

  readonly profileHeader: Locator

  readonly actionMenuBlock: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Finances', exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.profileHeader = page.locator('[data-testid="hmpps-profile-banner"]')

    this.balanceCards = page.locator('.hmpps-balance-card')

    this.recentTransactionsList = page.locator('table[data-testid="prisoner-transactions-table"]')
    this.viewAllTransactionsLink = page.getByRole('link', { name: 'View all transactions', exact: true })

    this.actionMenuBlock = page.locator('.hmpps-actions-block')
  }

  static async load(page: Page, prisonNumber: string): Promise<PrisonerFinancialProfilePage> {
    await page.goto(`/prisoner/${prisonNumber}`)
    return this.verifyOnPage(page, prisonNumber)
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<PrisonerFinancialProfilePage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}`)

    const prisonerProfilePage = new PrisonerFinancialProfilePage(page)
    await expect(prisonerProfilePage.heading).toBeVisible()
    return prisonerProfilePage
  }

  getBalanceCardFor(subAccountName: string): Locator {
    return this.balanceCards
      .filter({ has: this.page.getByRole('heading', { name: subAccountName, exact: true }) })
      .first()
  }

  getAction(actionName: string): Locator {
    return this.actionMenuBlock.getByRole('link', { name: actionName, exact: true })
  }
}
