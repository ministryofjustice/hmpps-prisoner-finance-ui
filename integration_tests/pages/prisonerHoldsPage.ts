import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerHoldsPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly holdsList: Locator

  readonly profileHeader: Locator

  readonly bottomPagination: Locator

  private constructor(page: Page, headerText: string) {
    super(page)
    this.heading = page.getByRole('heading', { name: headerText, exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.profileHeader = page.locator('.mini-profile, .hmpps-profile-banner').first()

    this.holdsList = page.locator('.holds-list')
    this.bottomPagination = page.locator('#bottom-pagination')
  }

  static async load(page: Page, prisonNumber: string): Promise<PrisonerHoldsPage> {
    await page.goto(`/prisoner/${prisonNumber}/money/holds`)
    return this.verifyOnPage(page, prisonNumber)
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<PrisonerHoldsPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/money/holds`)

    const prisonerHoldsPage = new PrisonerHoldsPage(page, 'Holds')
    await expect(prisonerHoldsPage.heading).toBeVisible()
    return prisonerHoldsPage
  }
}
