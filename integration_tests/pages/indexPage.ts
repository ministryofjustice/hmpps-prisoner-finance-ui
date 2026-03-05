import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class IndexPage extends AbstractPage {
  readonly heading: Locator

  readonly card: Locator

  private constructor(page: Page) {
    super(page)
    this.heading = page.locator('#prisonerFinanceHeading')
    this.card = page.locator('#prisonerFinanceCard')
  }

  static async verifyOnPage(page: Page): Promise<IndexPage> {
    const indexPage = new IndexPage(page)
    await expect(indexPage.heading).toBeVisible()
    return indexPage
  }
}
