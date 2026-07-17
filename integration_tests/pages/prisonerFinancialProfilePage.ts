import { expect, type Locator, type Page } from '@playwright/test'
import { buildUrl } from '../../server/utils/utils'
import AbstractPage from './abstractPage'

export default class PrisonerFinancialProfilePage extends AbstractPage {
  static url: string = '/prisoner/:prisonNumber'

  static headingText: string = 'Finances'

  readonly heading: Locator

  readonly backLink: Locator

  readonly recentTransactionsList: Locator

  readonly balanceCards: Locator

  readonly viewAllTransactionsLink: Locator

  readonly profileHeader: Locator

  readonly actionMenuBlock: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: PrisonerFinancialProfilePage.headingText, exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.profileHeader = page.locator('.mini-profile, .hmpps-profile-banner').first()

    this.balanceCards = page.locator('.hmpps-balance-card')

    this.recentTransactionsList = page.locator('.transactions-list')
    this.viewAllTransactionsLink = page.getByRole('link', { name: 'View all transactions', exact: true })

    this.actionMenuBlock = page.locator('.hmpps-actions-block')
  }

  static async goto(page: Page, prisonNumber: string): Promise<void> {
    await page.goto(buildUrl(this.url, { prisonNumber }))
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<PrisonerFinancialProfilePage> {
    expect(new URL(page.url()).pathname).toEqual(buildUrl(this.url, { prisonNumber }))

    const prisonerProfilePage = new PrisonerFinancialProfilePage(page)
    await expect(prisonerProfilePage.heading).toBeVisible()
    return prisonerProfilePage
  }

  static async visit(page: Page, prisonNumber: string): Promise<PrisonerFinancialProfilePage> {
    await this.goto(page, prisonNumber)
    return this.verifyOnPage(page, prisonNumber)
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
