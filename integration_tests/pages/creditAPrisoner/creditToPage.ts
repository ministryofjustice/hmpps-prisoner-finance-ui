import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreditToPage extends AbstractPage {
  readonly heading: Locator

  readonly backLink: Locator

  readonly subAccountList: Locator

  readonly continueButton: Locator

  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Credit to', exact: true })
    this.backLink = page.getByRole('link', { name: 'Back', exact: true })

    this.subAccountList = page.locator('.hmpps-subaccount-select')
    this.continueButton = page.getByRole('button', { name: 'Continue', exact: true })

    this.errorMessage = page.locator('[id="creditTo-error"]')
  }

  static async load(page: Page, prisonNumber: string): Promise<CreditToPage> {
    await page.goto(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)
    return this.verifyOnPage(page, prisonNumber)
  }

  static async verifyOnPage(page: Page, prisonNumber: string): Promise<CreditToPage> {
    expect(new URL(page.url()).pathname).toEqual(`/prisoner/${prisonNumber}/money/credit-a-prisoner/credit-to`)

    const creditToPage = new CreditToPage(page)
    await expect(creditToPage.heading).toBeVisible()
    return creditToPage
  }

  async selectASubAccount(subAccountName: string): Promise<void> {
    const subAccountOption = await this.getSubAccountOption(subAccountName)
    await subAccountOption.click()
    await this.continueButton.click()
  }

  async getSubAccountOption(subAccountName: string): Promise<Locator> {
    return this.subAccountList.getByRole('radio', { name: subAccountName })
  }
}
