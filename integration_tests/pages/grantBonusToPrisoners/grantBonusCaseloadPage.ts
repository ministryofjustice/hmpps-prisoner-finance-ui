import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class GrantBonusCaseloadPage extends AbstractPage {
  readonly heading: Locator

  readonly radiosTitle: Locator

  readonly radios: Locator

  readonly continueButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByText('Grant bonus to prisoners')
    this.radiosTitle = page.locator('[data-testid="radio-group-heading"]')
    this.radios = page.getByRole('radio')
    this.continueButton = page.locator('[data-testid="continue-button"]')
  }

  static async verifyOnPage(page: Page): Promise<GrantBonusCaseloadPage> {
    const grantBonusCaseloadPage = new GrantBonusCaseloadPage(page)
    await expect(grantBonusCaseloadPage.heading).toBeVisible()
    return grantBonusCaseloadPage
  }
}
