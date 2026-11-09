import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerSubscriptionsPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly subscriptionsList: Locator

  readonly profileHeader: Locator

  readonly topPagination: Locator

  readonly bottomPagination: Locator

  readonly currentSubscriptionsTotalCard: Locator

  private constructor(page: Page, headerText: string) {
    super(page)
    this.heading = page.getByRole('heading', { name: headerText, exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.profileHeader = page.locator('.mini-profile, .hmpps-profile-banner').first()

    this.subscriptionsList = page.locator('.subscriptions-list__subscriptions')
    this.topPagination = page.getByRole('navigation', { name: 'Pagination' }).nth(0)
    this.bottomPagination = page.getByRole('navigation', { name: 'Pagination' }).nth(1)

    this.currentSubscriptionsTotalCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Current subscriptions', exact: true }) })
  }

  static async load(page: Page, prisonNumber: string): Promise<PrisonerSubscriptionsPage> {
    await page.goto(`/prisoner/${prisonNumber}/subscriptions`)
    return this.verifyOnPage(page, prisonNumber)
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<PrisonerSubscriptionsPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/subscriptions`)

    const prisonerSusbcriptionsPage = new PrisonerSubscriptionsPage(page, 'Subscriptions')
    await expect(prisonerSusbcriptionsPage.heading).toBeVisible()
    return prisonerSusbcriptionsPage
  }
}
