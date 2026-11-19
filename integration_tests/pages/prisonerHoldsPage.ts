import { expect, type Locator, type Page } from '@playwright/test'
import { HoldTypeString } from '../../server/interfaces/HoldTypeString'
import AbstractPage from './abstractPage'

export default class PrisonerHoldsPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly holdsTotalCard: Locator

  readonly holdsWHFCard: Locator

  readonly holdsHOACard: Locator

  readonly allHoldsTab: Locator

  readonly hoaTab: Locator

  readonly whfTab: Locator

  readonly holdsList: Locator

  readonly profileHeader: Locator

  readonly topPagination: Locator

  readonly bottomPagination: Locator

  private constructor(page: Page, headerText: string) {
    super(page)
    this.heading = page.getByRole('heading', { name: headerText, exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.profileHeader = page.locator('.mini-profile, .hmpps-profile-banner').first()

    this.holdsTotalCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Holds total', exact: true }) })

    this.holdsWHFCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Withheld funds (WHF)', exact: true }) })

    this.holdsHOACard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'On hold (HOA)', exact: true }) })

    this.holdsList = page.locator('.holds-list__holds')
    this.topPagination = page.getByRole('navigation', { name: 'Pagination' }).nth(0)
    this.bottomPagination = page.getByRole('navigation', { name: 'Pagination' }).nth(1)

    this.allHoldsTab = page.locator('#all-holds-tab')
    this.hoaTab = page.locator('#hoa-holds-tab')
    this.whfTab = page.locator('#whf-holds-tab')
  }

  static async load(page: Page, prisonNumber: string): Promise<PrisonerHoldsPage> {
    await page.goto(`/prisoner/${prisonNumber}/holds`)
    return this.verifyOnPage(page, prisonNumber)
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<PrisonerHoldsPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/holds`)

    const prisonerHoldsPage = new PrisonerHoldsPage(page, 'Holds')
    await expect(prisonerHoldsPage.heading).toBeVisible()
    return prisonerHoldsPage
  }
}
