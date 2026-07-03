import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreditFromPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly subAccountList: Locator

  readonly continueButton: Locator

  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Credit from', exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.subAccountList = page.locator('.hmpps-subaccount-select')
    this.continueButton = page.getByRole('button', { name: 'Continue', exact: true })

    this.errorMessage = page.locator('[id="creditFrom-error"]')
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<CreditFromPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-from`)

    const creditFromPage = new CreditFromPage(page)
    await expect(creditFromPage.heading).toBeVisible()
    return creditFromPage
  }

  async selectASubAccount(subAccountName: string): Promise<void> {
    const subAccountOption = await this.getSubAccountOption(subAccountName)
    await subAccountOption.click()
    await this.continueButton.click()
  }

  getSubAccountOption(subAccountName: string): Locator {
    return this.subAccountList.getByRole('radio', { name: subAccountName })
  }
}
