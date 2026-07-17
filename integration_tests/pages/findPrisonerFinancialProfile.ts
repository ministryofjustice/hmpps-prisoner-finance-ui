import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class FindPrisonerFinancialProfile extends AbstractPage {
  static url: string = '/prisoner'

  static headingText: string = 'View prisoner finances'

  readonly heading: Locator

  readonly backLink: Locator

  private constructor(page: Page) {
    super(page)

    this.heading = page.getByRole('heading', { name: FindPrisonerFinancialProfile.headingText, exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })
  }

  static async load(page: Page): Promise<FindPrisonerFinancialProfile> {
    await page.goto(FindPrisonerFinancialProfile.url)

    return this.verifyOnPage(page)
  }

  static async verifyOnPage(page: Page): Promise<FindPrisonerFinancialProfile> {
    expect(new URL(page.url()).pathname).toEqual(FindPrisonerFinancialProfile.url)

    const pageObject = new FindPrisonerFinancialProfile(page)
    await expect(pageObject.heading).toBeVisible()
    return pageObject
  }
}
