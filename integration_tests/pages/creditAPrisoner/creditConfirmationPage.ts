import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreditConfirmationPage extends AbstractPage {
  readonly confirmationPanel: Locator

  readonly financialProfileLink: Locator

  constructor(page: Page) {
    super(page)
    this.confirmationPanel = page.locator('[data-testid="confirmation-panel"]')

    this.financialProfileLink = page.getByRole('link', { name: 'financial profile page', exact: true })
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<CreditConfirmationPage> {
    expect(page.url()).toContain(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-confirmation`)

    const creditConfirmationPage = new CreditConfirmationPage(page)
    await expect(creditConfirmationPage.confirmationPanel).toBeVisible()
    return creditConfirmationPage
  }
}
