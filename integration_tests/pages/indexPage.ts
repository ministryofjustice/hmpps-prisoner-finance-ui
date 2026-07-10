import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class IndexPage extends AbstractPage {
  readonly heading: Locator

  readonly viewPrisonerFinanceCard: Locator

  readonly grantBonusToPrisonersCard: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Prisoner Finance', exact: true })

    this.viewPrisonerFinanceCard = page
      .locator('.card')
      .filter({ has: page.getByRole('heading', { name: 'View prisoner finances', exact: true }) })

    this.grantBonusToPrisonersCard = page
      .locator('.card')
      .filter({ has: page.getByRole('heading', { name: 'Grant a bonus to prisoners', exact: true }) })
  }

  static async load(page: Page): Promise<IndexPage> {
    await page.goto('/')
    return this.verifyOnPage(page)
  }

  static async verifyOnPage(page: Page): Promise<IndexPage> {
    const indexPage = new IndexPage(page)
    await expect(indexPage.heading).toBeVisible()
    return indexPage
  }
}
