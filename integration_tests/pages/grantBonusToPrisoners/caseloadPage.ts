import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class GrantBonusToPrisonersCaseloadPage extends AbstractPage {
  readonly heading: Locator

  readonly caseloadOptions: Locator

  readonly continueButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Grant bonus to prisoners', exact: true })

    this.caseloadOptions = page.getByRole('radio')
    this.continueButton = page.getByRole('button', { name: 'Continue', exact: true })
  }

  static async verifyOnPage(page: Page): Promise<GrantBonusToPrisonersCaseloadPage> {
    const grantBonusCaseloadPage = new GrantBonusToPrisonersCaseloadPage(page)
    await expect(grantBonusCaseloadPage.heading).toBeVisible()
    return grantBonusCaseloadPage
  }

  static async completeAndMoveOn(page: Page): Promise<void> {
    const grantBonusCaseloadPage = await this.verifyOnPage(page)
    await grantBonusCaseloadPage.caseloadOptions.first().click()
    await grantBonusCaseloadPage.continueButton.click()
  }
}
