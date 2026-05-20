import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class IndexPage extends AbstractPage {
  readonly heading: Locator

  readonly viewPrisonerFinanceCard: Locator

  readonly grantBonusToPrisonersCard: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.locator('#prisonerFinanceHeading')
    this.viewPrisonerFinanceCard = page.locator('[data-qa="view-prisoner-finance-card"]')
    this.grantBonusToPrisonersCard = page.locator('[data-qa="grant-a-bonus-card"]')
  }

  static async verifyOnPage(page: Page): Promise<IndexPage> {
    const indexPage = new IndexPage(page)
    await expect(indexPage.heading).toBeVisible()
    return indexPage
  }
}
