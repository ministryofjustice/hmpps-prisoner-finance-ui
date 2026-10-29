import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class TransactionPrintPreviewPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly transactionList: Locator

  readonly prisonerName: Locator

  readonly prisonNumber: Locator

  readonly startDate: Locator

  readonly endDate: Locator

  readonly statementBalance: Locator

  readonly statementDate: Locator

  readonly printButton: Locator

  readonly csvButton: Locator

  private constructor(page: Page, headerText: string) {
    super(page)
    this.heading = page.getByRole('heading', { name: headerText, exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })
    this.transactionList = page.locator('.transactions-list')

    this.prisonerName = page.locator('.govuk-summary-list__row').nth(0).locator('.govuk-summary-list__value')
    this.prisonNumber = page.locator('.govuk-summary-list__row').nth(1).locator('.govuk-summary-list__value')
    this.startDate = page.locator('.govuk-summary-list__row').nth(2).locator('.govuk-summary-list__value')
    this.endDate = page.locator('.govuk-summary-list__row').nth(3).locator('.govuk-summary-list__value')
    this.statementBalance = page.locator('.govuk-summary-list__row').nth(4).locator('.govuk-summary-list__value')
    this.statementDate = page.locator('.govuk-summary-list__row').nth(5).locator('.govuk-summary-list__value')

    this.printButton = page.getByRole('button', { name: 'Print screen or save as PDF' })
    this.csvButton = page.getByRole('button', { name: 'Download as CSV' })
  }

  static async load(page: Page, prisonNumber: string): Promise<TransactionPrintPreviewPage> {
    await page.goto(`/prisoner/${prisonNumber}/account/print-preview`)
    return this.verifyOnPage(page, prisonNumber)
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<TransactionPrintPreviewPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/account/print-preview`)

    const transactionPreviewPage = new TransactionPrintPreviewPage(page, 'Prisoner Transaction history')
    await expect(transactionPreviewPage.heading).toBeVisible()

    expect(transactionPreviewPage.prisonerName).toBeVisible()
    expect(transactionPreviewPage.prisonNumber).toBeVisible()
    expect(transactionPreviewPage.startDate).toBeVisible()
    expect(transactionPreviewPage.endDate).toBeVisible()
    expect(transactionPreviewPage.statementBalance).toBeVisible()
    expect(transactionPreviewPage.statementDate).toBeVisible()

    expect(transactionPreviewPage.printButton).toBeVisible()
    expect(transactionPreviewPage.csvButton).toBeVisible()

    return transactionPreviewPage
  }
}
