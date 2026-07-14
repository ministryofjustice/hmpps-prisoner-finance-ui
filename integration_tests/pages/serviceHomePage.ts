import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class ServiceHomePage extends AbstractPage {
  static url: string = '/'

  static headingText: string = 'Prisoner Finance'

  readonly heading: Locator

  readonly viewPrisonerFinanceCard: Locator

  readonly grantBonusToPrisonersCard: Locator

  private constructor(page: Page) {
    super(page)

    this.heading = page.getByRole('heading', { name: ServiceHomePage.headingText, exact: true })

    this.viewPrisonerFinanceCard = page
      .locator('.card')
      .filter({ has: page.getByRole('heading', { name: 'View prisoner finances', exact: true }) })

    this.grantBonusToPrisonersCard = page
      .locator('.card')
      .filter({ has: page.getByRole('heading', { name: 'Grant a bonus to prisoners', exact: true }) })
  }

  static async goto(page: Page): Promise<void> {
    await page.goto(this.url)
  }

  static async load(page: Page): Promise<ServiceHomePage> {
    await this.goto(page)

    return this.verifyOnPage(page)
  }

  static async verifyOnPage(page: Page): Promise<ServiceHomePage> {
    expect(new URL(page.url()).pathname).toEqual(this.url)

    const pageObject = new ServiceHomePage(page)
    await expect(pageObject.heading).toBeVisible()
    return pageObject
  }

  async viewPrisonerFinances(): Promise<void> {
    await this.viewPrisonerFinanceCard.click()
  }

  async grantBonusToPrisoners(): Promise<void> {
    await this.grantBonusToPrisonersCard.click()
  }
}
