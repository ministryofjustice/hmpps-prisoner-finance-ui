import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerAdvancesPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly advancesList: Locator

  readonly profileHeader: Locator

  readonly topPagination: Locator

  readonly bottomPagination: Locator

  readonly currentAdvancesBalanceCard: Locator

  readonly OutstandingBalanceCard: Locator

  readonly WeeklyPaymentsBalanceCard: Locator

  private constructor(page: Page, headerText: string) {
    super(page)
    this.heading = page.getByRole('heading', { name: headerText, exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.profileHeader = page.locator('.mini-profile, .hmpps-profile-banner').first()

    this.advancesList = page.locator('.advances-list__advances')
    this.topPagination = page.getByRole('navigation', { name: 'Pagination' }).nth(0)
    this.bottomPagination = page.getByRole('navigation', { name: 'Pagination' }).nth(1)

    this.currentAdvancesBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Current advances', exact: true }) })

    this.OutstandingBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Balance outstanding', exact: true }) })

    this.WeeklyPaymentsBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Weekly payments', exact: true }) })
  }

  static async load(page: Page, prisonNumber: string): Promise<PrisonerAdvancesPage> {
    await page.goto(`/prisoner/${prisonNumber}/money/advances`)
    return this.verifyOnPage(page, prisonNumber)
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<PrisonerAdvancesPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/money/advances`)

    const prisonerAdvancesPage = new PrisonerAdvancesPage(page, 'Advances')
    await expect(prisonerAdvancesPage.heading).toBeVisible()
    return prisonerAdvancesPage
  }
}
