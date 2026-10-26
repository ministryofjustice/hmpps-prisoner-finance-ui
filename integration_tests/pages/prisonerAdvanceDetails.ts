import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerAdvanceDetailPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly advancePaymentsList: Locator

  readonly profileHeader: Locator

  readonly topPagination: Locator

  readonly bottomPagination: Locator

  readonly thisAdvanceBalanceCard: Locator

  readonly outstandingBalanceCard: Locator

  readonly weeklyPaymentsBalanceCard: Locator

  readonly paymentsRemainingBalanceCard: Locator

  private constructor(page: Page, headerText: string) {
    super(page)
    this.heading = page.getByRole('heading', { name: headerText, exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.profileHeader = page.locator('.mini-profile, .hmpps-profile-banner').first()

    this.advancePaymentsList = page.locator('.advance-payments-list__advance-payments')
    this.topPagination = page.getByRole('navigation', { name: 'Pagination' }).nth(0)
    this.bottomPagination = page.getByRole('navigation', { name: 'Pagination' }).nth(1)

    this.thisAdvanceBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'This advance', exact: true }) })

    this.outstandingBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Balance outstanding', exact: true }) })

    this.weeklyPaymentsBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Weekly payments', exact: true }) })

    this.paymentsRemainingBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Payments remaining', exact: true }) })
  }

  static async load(page: Page, prisonNumber: string, advanceId: string): Promise<PrisonerAdvanceDetailPage> {
    await page.goto(`/prisoner/${prisonNumber}/advances/detail/${advanceId}`)
    return this.verifyOnPage(page, prisonNumber, advanceId)
  }

  static async verifyOnPage(page: Page, prisonNumber: string, advanceId: string): Promise<PrisonerAdvanceDetailPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/advances/detail/${advanceId}`)

    const prisonerAdvancesPage = new PrisonerAdvanceDetailPage(page, 'Advance detail')
    await expect(prisonerAdvancesPage.heading).toBeVisible()
    return prisonerAdvancesPage
  }
}
