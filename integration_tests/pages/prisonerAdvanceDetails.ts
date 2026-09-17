import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class PrisonerAdvanceDetailPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly advancePaymentsList: Locator

  readonly profileHeader: Locator

  readonly topPagination: Locator

  readonly bottomPagination: Locator

  readonly ThisAdvanceBalanceCard: Locator

  readonly OutstandingBalanceCard: Locator

  readonly WeeklyPaymentsBalanceCard: Locator

  readonly PaymentsRemainingBalanceCard: Locator

  private constructor(page: Page, headerText: string) {
    super(page)
    this.heading = page.getByRole('heading', { name: headerText, exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.profileHeader = page.locator('.mini-profile, .hmpps-profile-banner').first()

    this.advancePaymentsList = page.locator('.advance-payments-list__advance-payments')
    this.topPagination = page.getByRole('navigation', { name: 'Pagination' }).nth(0)
    this.bottomPagination = page.getByRole('navigation', { name: 'Pagination' }).nth(1)

    this.ThisAdvanceBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'This advance', exact: true }) })

    this.OutstandingBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Balance outstanding', exact: true }) })

    this.WeeklyPaymentsBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Weekly payments', exact: true }) })

    this.PaymentsRemainingBalanceCard = page
      .locator('.hmpps-balance-card')
      .filter({ has: page.getByRole('heading', { name: 'Payments remaining', exact: true }) })
  }

  static async load(page: Page, prisonNumber: string, advanceId: string): Promise<PrisonerAdvanceDetailPage> {
    await page.goto(`/prisoner/${prisonNumber}/money/advances/detail/${advanceId}`)
    return this.verifyOnPage(page, prisonNumber, advanceId)
  }

  static async verifyOnPage(page: Page, prisonNumber: string, advanceId: string): Promise<PrisonerAdvanceDetailPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/money/advances/detail/${advanceId}`)

    const prisonerAdvancesPage = new PrisonerAdvanceDetailPage(page, 'Advance detail')
    await expect(prisonerAdvancesPage.heading).toBeVisible()
    return prisonerAdvancesPage
  }
}
